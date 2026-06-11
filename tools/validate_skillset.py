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

REQUIRED_SKILLS = ["goal-loop", "goal-frame", "goal-iterate", "goal-review", "goal-verify"]
IMPLICIT_POLICY = {
    "goal-loop": "true",
    "goal-frame": "false",
    "goal-iterate": "false",
    "goal-review": "false",
    "goal-verify": "false",
}


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


def check_skill_references(skill: str, skill_dir: Path, skill_text: str) -> bool:
    ok = True
    references_dir = skill_dir / "references"
    if references_dir.exists():
        for ref in sorted(references_dir.iterdir()):
            if not ref.is_file():
                continue
            marker = f"references/{ref.name}"
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
    return ok


def check_supporting_paths(root: Path) -> bool:
    ok = True
    for path in [root / "adapters", root / "tools"]:
        if not path.exists():
            ok = fail(f"missing supporting path {path}")

    adapter = root / "adapters" / "bytedance-codebase.md"
    if not adapter.exists():
        ok = fail(f"missing adapter reference {adapter}")

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
            for skill in REQUIRED_SKILLS:
                expected = f"rsync -a --delete {skill}/"
                if expected not in text:
                    ok = fail(f"{doc.name}: missing install copy command for {skill}")
            if "validate_skillset.py" not in text:
                ok = fail(f"{doc.name}: missing validate_skillset.py smoke test")
        if doc.name == "MANIFEST.md":
            for skill in REQUIRED_SKILLS:
                if f"`{skill}/`" not in text:
                    ok = fail(f"MANIFEST.md: missing skill entry for {skill}")
    return ok


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    ok = True

    print(f"Validating skillset root: {root}")
    ok = check_supporting_paths(root) and ok

    for skill in REQUIRED_SKILLS:
        skill_dir = root / skill
        skill_md = skill_dir / "SKILL.md"
        if not skill_md.exists():
            print(f"FAIL {skill}: missing {skill_md}")
            ok = False
            continue
        skill_text = skill_md.read_text(encoding="utf-8")
        try:
            data = parse_front_matter(skill_text)
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL {skill}: {exc}")
            ok = False
            continue
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
        metadata = openai_yaml.read_text(encoding="utf-8")
        expected_policy = f"allow_implicit_invocation: {IMPLICIT_POLICY[skill]}"
        if expected_policy not in metadata:
            print(f"FAIL {skill}: missing expected policy {expected_policy!r}")
            ok = False
        if f"${skill}" not in metadata:
            print(f"FAIL {skill}: default_prompt should mention ${skill}")
            ok = False

        ok = check_skill_references(skill, skill_dir, skill_text) and ok

    ok = check_docs(root) and ok

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
