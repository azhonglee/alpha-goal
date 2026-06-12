#!/usr/bin/env python3
"""Validate a local Codex goal-loop skillset layout.

This intentionally stays lightweight and dependency-free. It checks skill
metadata, invocation policy, discoverability of bundled references/scripts,
basic shell syntax for helper scripts, and install-document coverage.
It does not validate Codex runtime behavior.
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path
import tomllib

REQUIRED_SKILLS = ["goal-loop", "goal-frame", "goal-iterate", "goal-review", "goal-verify"]
SKILLS_DIR = "skills"
IMPLICIT_POLICY = {
    "goal-loop": "true",
    "goal-frame": "false",
    "goal-iterate": "false",
    "goal-review": "false",
    "goal-verify": "false",
}
ALLOWED_FRONT_MATTER_KEYS = {"name", "description"}
MIN_SHORT_DESCRIPTION_LEN = 25
MAX_SHORT_DESCRIPTION_LEN = 64
MAX_SKILL_MD_LINES = 240
FORBIDDEN_CONFIG_KEYS = {"sandbox_mode", "suppress_unstable_features_warning"}
WORKTREE_CANONICAL = ".worktrees/codex/<task-slug>"
REQUIRED_OPENAI_INTERFACE_KEYS = {"display_name", "short_description", "default_prompt"}


def parse_front_matter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise ValueError("missing opening YAML front matter delimiter")
    end = text.find("\n---", 4)
    if end == -1:
        raise ValueError("missing closing YAML front matter delimiter")
    raw = text[4:end].strip().splitlines()
    data: dict[str, str] = {}
    for line in raw:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not match:
            raise ValueError(f"unsupported front matter line: {line!r}")
        data[match.group(1)] = match.group(2).strip().strip('"').strip("'")
    return data


def fail(message: str) -> bool:
    print(f"FAIL {message}")
    return False


def parse_openai_yaml_metadata(text: str) -> dict[str, dict[str, str]]:
    """Parse the constrained agents/openai.yaml shape without external dependencies."""
    data: dict[str, dict[str, str]] = {"interface": {}, "policy": {}}
    section: str | None = None
    seen_paths: set[tuple[str, str]] = set()

    for lineno, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        section_match = re.match(r"^([A-Za-z0-9_-]+):\s*$", line)
        if section_match:
            section = section_match.group(1)
            if section not in data:
                raise ValueError(f"line {lineno}: unsupported top-level section {section!r}")
            continue

        item_match = re.match(r"^\s{2}([A-Za-z0-9_-]+):\s*(.+?)\s*$", line)
        if not item_match or section is None:
            raise ValueError(f"line {lineno}: unsupported YAML shape")

        key, raw_value = item_match.groups()
        path = (section, key)
        if path in seen_paths:
            raise ValueError(f"line {lineno}: duplicate key {section}.{key}")
        seen_paths.add(path)
        data[section][key] = raw_value.strip().strip('"').strip("'")

    return data


def check_openai_yaml(skill: str, openai_yaml: Path) -> bool:
    ok = True
    metadata = openai_yaml.read_text(encoding="utf-8")
    try:
        data = parse_openai_yaml_metadata(metadata)
    except ValueError as exc:
        return fail(f"{skill}: invalid agents/openai.yaml: {exc}")

    interface = data["interface"]
    policy = data["policy"]
    missing_interface = REQUIRED_OPENAI_INTERFACE_KEYS - set(interface)
    if missing_interface:
        ok = fail(f"{skill}: missing interface field(s): {sorted(missing_interface)}")
    for key in REQUIRED_OPENAI_INTERFACE_KEYS & set(interface):
        if not interface[key]:
            ok = fail(f"{skill}: interface.{key} must not be empty")

    short = interface.get("short_description", "")
    if short and not (MIN_SHORT_DESCRIPTION_LEN <= len(short) <= MAX_SHORT_DESCRIPTION_LEN):
        ok = fail(
            f"{skill}: short_description length {len(short)} outside "
            f"{MIN_SHORT_DESCRIPTION_LEN}-{MAX_SHORT_DESCRIPTION_LEN}: {short!r}"
        )

    default_prompt = interface.get("default_prompt", "")
    if default_prompt and f"${skill}" not in default_prompt:
        ok = fail(f"{skill}: default_prompt should mention ${skill}")

    policy_keys = set(policy)
    if policy_keys != {"allow_implicit_invocation"}:
        ok = fail(f"{skill}: policy must contain only allow_implicit_invocation, got {sorted(policy_keys)}")
    implicit_value = policy.get("allow_implicit_invocation")
    if implicit_value not in {"true", "false"}:
        ok = fail(f"{skill}: allow_implicit_invocation must be true or false, got {implicit_value!r}")
    elif implicit_value != IMPLICIT_POLICY[skill]:
        ok = fail(
            f"{skill}: allow_implicit_invocation is {implicit_value!r}, "
            f"expected {IMPLICIT_POLICY[skill]!r}"
        )

    return ok


def check_goal_loop_description(description: str) -> bool:
    ok = True
    lower = description.lower()
    for phrase in ["non-trivial read-only", "target", "evidence-boundary"]:
        if phrase not in lower:
            ok = fail(f"goal-loop: description missing read-only discovery trigger phrase {phrase!r}")
    if "advisory audit" in lower and "when no" not in lower and "unless" not in lower:
        ok = fail("goal-loop: description appears to exclude advisory audit unconditionally")
    return ok


def check_skill_references(skill: str, skill_dir: Path, skill_text: str) -> bool:
    ok = True
    references_dir = skill_dir / "references"
    if references_dir.exists():
        for ref in sorted(references_dir.rglob("*")):
            rel = ref.relative_to(skill_dir).as_posix()
            if ref.is_dir():
                ok = fail(f"{skill}: nested reference directory is not allowed: {rel}")
                continue
            marker = rel
            if marker not in skill_text:
                ok = fail(f"{skill}: bundled reference is not discoverable from SKILL.md: {marker}")
    scripts_dir = skill_dir / "scripts"
    if scripts_dir.exists():
        for script in sorted(scripts_dir.iterdir()):
            if not script.is_file():
                continue
            marker = f"scripts/{script.name}"
            if marker not in skill_text:
                ok = fail(f"{skill}: bundled script is not discoverable from SKILL.md: {marker}")
            if script.suffix == ".sh":
                result = subprocess.run(["bash", "-n", str(script)], check=False, capture_output=True, text=True)
                if result.returncode != 0:
                    ok = fail(f"{skill}: bash -n failed for {script}: {result.stderr.strip()}")

    mentioned_paths = sorted(set(re.findall(r"`((?:references|scripts)/[A-Za-z0-9_.\-/]+)`", skill_text)))
    for rel in mentioned_paths:
        target = skill_dir / rel
        if not target.exists():
            ok = fail(f"{skill}: SKILL.md mentions missing bundled path: {rel}")
    return ok


def skill_root(root: Path) -> Path:
    return root / SKILLS_DIR


def check_skill_layout(root: Path) -> bool:
    ok = True
    source = skill_root(root)
    if not source.exists():
        return fail(f"missing skill source directory {source}")
    discovered = sorted(path.parent.name for path in source.glob("*/SKILL.md"))
    expected = sorted(REQUIRED_SKILLS)
    if discovered != expected:
        ok = fail(f"skills/ layout mismatch: discovered={discovered}, expected={expected}")
    return ok


def check_supporting_paths(root: Path) -> bool:
    ok = True
    for path in [root / "tools", root / "templates", root / "scripts"]:
        if not path.exists():
            ok = fail(f"missing supporting path {path}")

    agents_template = root / "templates" / "AGENTS.md"
    if not agents_template.exists():
        ok = fail(f"missing AGENTS template {agents_template}")
    else:
        template_text = agents_template.read_text(encoding="utf-8")
        if "<!-- generate-with-template:agents-md -->" not in template_text:
            ok = fail(f"AGENTS template missing managed marker: {agents_template}")

    config_template = root / "templates" / "config.toml"
    if not config_template.exists():
        ok = fail(f"missing config template {config_template}")
    else:
        try:
            config_data = tomllib.loads(config_template.read_text(encoding="utf-8"))
        except tomllib.TOMLDecodeError as exc:
            ok = fail(f"invalid TOML in {config_template}: {exc}")
        else:
            for key in FORBIDDEN_CONFIG_KEYS:
                if key in config_data:
                    ok = fail(f"config template must not set high-risk key {key!r} by default")

    install_script = root / "scripts" / "install.sh"
    if not install_script.exists():
        ok = fail(f"missing install script {install_script}")
    else:
        result = subprocess.run(["bash", "-n", str(install_script)], check=False, capture_output=True, text=True)
        if result.returncode != 0:
            ok = fail(f"bash -n failed for {install_script}: {result.stderr.strip()}")

    return ok


def check_docs(root: Path) -> bool:
    ok = True
    docs = [root / "README.md", root / "INSTALL.md", root / "MANIFEST.md"]
    docs_present = [doc for doc in docs if doc.exists()]
    if not docs_present:
        return True
    for doc in docs:
        if not doc.exists():
            ok = fail(f"missing documentation file {doc}")
            continue
        text = doc.read_text(encoding="utf-8")
        if doc.name in {"README.md", "INSTALL.md"}:
            # Documentation coverage checks only. Runtime routing behavior needs
            # forward tests; do not treat prompt examples as executable proof.
            if "scripts/install.sh" not in text:
                ok = fail(f"{doc.name}: missing scripts/install.sh install command")
            if "$HOME/.codex/skills" not in text and "${CODEX_HOME:-$HOME/.codex}/skills" not in text:
                ok = fail(f"{doc.name}: missing default $HOME/.codex/skills install target")
            if "--codex-home" not in text:
                ok = fail(f"{doc.name}: missing --codex-home override documentation")
            if "--no-sync-user-templates" not in text:
                ok = fail(f"{doc.name}: missing --no-sync-user-templates opt-out documentation")
            if "validate_skillset.py" not in text:
                ok = fail(f"{doc.name}: missing validate_skillset.py smoke test")
            if not ("不能证明" in text and "路由" in text and "验证边界" in text):
                ok = fail(f"{doc.name}: missing validator evidence-boundary warning")
            if doc.name == "README.md" and ".goal-loop/" not in text:
                ok = fail("README.md: missing .goal-loop/ artifact guidance")
        if doc.name == "MANIFEST.md":
            for skill in REQUIRED_SKILLS:
                if f"`skills/{skill}/`" not in text:
                    ok = fail(f"MANIFEST.md: missing skill entry for skills/{skill}")
            if "`templates/`" not in text:
                ok = fail("MANIFEST.md: missing templates entry")
            if "`scripts/`" not in text:
                ok = fail("MANIFEST.md: missing scripts entry")
    return ok


def check_consistency(root: Path) -> bool:
    ok = True
    source = skill_root(root)
    worktree_safety = source / "goal-iterate" / "references" / "worktree-safety.md"
    goal_loop = source / "goal-loop" / "SKILL.md"
    goal_frame = source / "goal-frame" / "SKILL.md"
    target_discovery = source / "goal-frame" / "references" / "target-discovery.md"
    loop_modes = source / "goal-iterate" / "references" / "loop-modes.md"
    goal_verify = source / "goal-verify" / "SKILL.md"
    install_script = root / "scripts" / "install.sh"

    for path in [worktree_safety, goal_loop]:
        if path.exists() and WORKTREE_CANONICAL not in path.read_text(encoding="utf-8"):
            ok = fail(f"{path}: missing canonical worktree path {WORKTREE_CANONICAL}")

    if goal_loop.exists():
        text = goal_loop.read_text(encoding="utf-8")
        if "Domain skill coexistence" not in text:
            ok = fail("skills/goal-loop/SKILL.md: missing domain skill coexistence guidance")
        if "ordinary standalone review" not in text:
            ok = fail("skills/goal-loop/SKILL.md: missing read-only trigger exclusion")
        if "findings, evidence, recommendations, and residual uncertainty" not in text:
            ok = fail("skills/goal-loop/SKILL.md: missing read-only audit completion guidance")
        if "`Artifacts` means loop-owned process artifacts" not in text:
            ok = fail("skills/goal-loop/SKILL.md: missing process-vs-domain artifact disambiguation")
        if "root-cause claim needs debug evidence" not in text:
            ok = fail("skills/goal-loop/SKILL.md: missing root-cause debug evidence invariant")
        if ".goal-loop/" not in text:
            ok = fail("skills/goal-loop/SKILL.md: missing .goal-loop/ ignore guidance")

    if goal_frame.exists():
        text = goal_frame.read_text(encoding="utf-8")
        if "low-risk single-function failures" not in text:
            ok = fail("skills/goal-frame/SKILL.md: missing compact low-risk debug framing guidance")
        if "不要发明组合值" not in text and "不要把阶段状态写进 loop type" not in text:
            ok = fail("skills/goal-frame/SKILL.md: missing atomic loop type guidance")
        contract_start = text.find("Goal Contract:\n")
        contract_end = text.find("```", contract_start + 1) if contract_start != -1 else -1
        contract_block = text[contract_start:contract_end] if contract_start != -1 and contract_end != -1 else ""
        for duplicated_field in ["- Acceptance:", "- Non-goals:", "- Constraints:", "- Decision boundaries:", "- Claim boundary:", "- Evidence plan:"]:
            if duplicated_field in contract_block:
                ok = fail(
                    "skills/goal-frame/SKILL.md: Goal Contract should keep requirements inside Spec, "
                    f"not top-level {duplicated_field}"
                )
        for required_spec_field in ["- Outcome:", "- Scope:", "- Acceptance:", "- Constraints:", "- Claim boundary:", "- Evidence:"]:
            if required_spec_field not in text:
                ok = fail(f"skills/goal-frame/SKILL.md: missing compact Spec field {required_spec_field}")

    if target_discovery.exists():
        text = target_discovery.read_text(encoding="utf-8")
        if "Domain boundary gate" not in text:
            ok = fail("skills/goal-frame/references/target-discovery.md: missing domain boundary gate")
        if "related but not equivalent" not in text or "UI labels" not in text:
            ok = fail("skills/goal-frame/references/target-discovery.md: missing general domain-term disambiguation guidance")

    if loop_modes.exists():
        text = loop_modes.read_text(encoding="utf-8")
        if "one-paragraph receipt is enough" not in text:
            ok = fail("skills/goal-iterate/references/loop-modes.md: missing compact low-risk Debug Receipt guidance")
        if "return `REFRAME_NEEDED` instead of forcing the evidence into the old target" not in text:
            ok = fail("skills/goal-iterate/references/loop-modes.md: missing wrong-target debug reframe guidance")

    if goal_verify.exists():
        text = goal_verify.read_text(encoding="utf-8")
        if "low-risk local bug fixes without a formal RCA claim" not in text:
            ok = fail("skills/goal-verify/SKILL.md: missing low-risk local bug verification boundary")

    if worktree_safety.exists():
        text = worktree_safety.read_text(encoding="utf-8")
        if ".goal-loop/" not in text:
            ok = fail("skills/goal-iterate/references/worktree-safety.md: missing .goal-loop/ ignore guidance")

    if install_script.exists():
        text = install_script.read_text(encoding="utf-8")
        if "--no-sync-user-templates" not in text:
            ok = fail("scripts/install.sh: missing explicit user-template opt-out flag")
        if "sync_user_templates" not in text:
            ok = fail("scripts/install.sh: user template sync must be gated by a variable")
        if "sync_user_templates=true" not in text:
            ok = fail("scripts/install.sh: user template sync should be enabled by default")
        if "preflight_install_targets" not in text:
            ok = fail("scripts/install.sh: missing install target preflight before user-template sync")
        preflight_pos = text.find("\npreflight_install_targets\n\nif [[ \"$sync_user_templates\" == true ]]")
        template_sync_pos = text.find("\n  inject_agents_template\n")
        if preflight_pos == -1 or template_sync_pos == -1 or preflight_pos > template_sync_pos:
            ok = fail("scripts/install.sh: install target preflight must run before user-template sync")
        validation_pos = text.find("\nrun_skillset_validation\n\nrequired_skills=")
        template_sync_pos = text.find("\n  inject_agents_template\n")
        if validation_pos == -1 or template_sync_pos == -1 or validation_pos > template_sync_pos:
            ok = fail("scripts/install.sh: skillset validation must run before user-template sync")

    return ok


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    ok = True

    print(f"Validating skillset root: {root}")
    ok = check_skill_layout(root) and ok
    ok = check_supporting_paths(root) and ok

    for skill in REQUIRED_SKILLS:
        skill_dir = skill_root(root) / skill
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            print(f"FAIL {skill}: missing {skill_md}")
            ok = False
            continue
        skill_text = skill_md.read_text(encoding="utf-8")
        skill_lines = len(skill_text.splitlines())
        if skill_lines > MAX_SKILL_MD_LINES:
            print(f"FAIL {skill}: SKILL.md has {skill_lines} lines; keep core workflow under {MAX_SKILL_MD_LINES} lines and move details to references")
            ok = False
        try:
            data = parse_front_matter(skill_text)
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL {skill}: {exc}")
            ok = False
            continue
        extra_keys = set(data) - ALLOWED_FRONT_MATTER_KEYS
        missing_keys = ALLOWED_FRONT_MATTER_KEYS - set(data)
        if extra_keys:
            print(f"FAIL {skill}: unsupported front matter keys: {sorted(extra_keys)}")
            ok = False
        if missing_keys:
            print(f"FAIL {skill}: missing front matter keys: {sorted(missing_keys)}")
            ok = False

        name = data.get("name")
        description = data.get("description")
        if name != skill:
            print(f"FAIL {skill}: front matter name is {name!r}")
            ok = False
        elif not description:
            print(f"FAIL {skill}: missing description")
            ok = False
        else:
            print(f"PASS {skill}: {description[:90]}")

        openai_yaml = skill_dir / "agents" / "openai.yaml"
        if not openai_yaml.exists():
            print(f"FAIL {skill}: missing {openai_yaml}")
            ok = False
            continue
        ok = check_openai_yaml(skill, openai_yaml) and ok

        if skill == "goal-loop" and description:
            ok = check_goal_loop_description(description) and ok

        ok = check_skill_references(skill, skill_dir, skill_text) and ok

    ok = check_docs(root) and ok
    ok = check_consistency(root) and ok

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
