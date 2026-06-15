#!/usr/bin/env python3
"""Lightweight validation for a local Agent Skills suite."""
from __future__ import annotations

import re
import stat
import sys
from pathlib import Path

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)
FIELD_RE = re.compile(r"^([A-Za-z0-9_-]+):\s*(.*?)\s*$")
ALLOWED_FRONTMATTER_KEYS = {"name", "description"}
REQUIRED_SKILL_NAMES = {
    "control-kernel",
    "alpha-goal",
    "system-model",
    "loop",
    "verify",
    "meta-synthesis",
}

SEMANTIC_SMOKE_TESTS = [
    (
        "ambiguous requirement can become a bounded Goal Contract",
        "skills/alpha-goal/SKILL.md",
        [
            "Goal Contract",
            "reference state",
            "acceptance evidence",
            "claim boundary",
            "decision boundaries",
            "Indicator Handoff",
        ],
    ),
    (
        "unclear system boundary routes through control modeling",
        "skills/system-model/SKILL.md",
        [
            "System boundary",
            "Observability",
            "Controllability",
            "Candidate control laws",
            "Controller Hierarchy",
            "none material",
            "Disturbance Register",
            "none material",
        ],
    ),
    (
        "execution feedback requires control law and ledger state",
        "skills/loop/SKILL.md",
        [
            "Control Law",
            "target error",
            "control variable",
            "sensor threshold",
            "fallback",
            "Adaptive Learning Record",
            "ledger update",
        ],
    ),
    (
        "insufficient evidence routes to next iteration instead of final",
        "skills/verify/SKILL.md",
        [
            "Evidence coverage",
            "NEXT_ITERATION",
            "NARROW_CLAIM_AND_FINAL",
            "Final claim allowed",
        ],
    ),
    (
        "complex multi-party conflict uses human-machine synthesis rounds",
        "skills/meta-synthesis/SKILL.md",
        [
            "Synthesis Round",
            "Indicator Handoff",
            "Qualitative judgments",
            "Quantitative signals",
            "User-owned decisions",
            "Route",
        ],
    ),
    (
        "router preserves closed-loop state and disturbance handling",
        "skills/control-kernel/SKILL.md",
        [
            "Closed-loop Ledger",
            "Control Law",
            "Indicator Handoff",
            "Adaptive Learning",
            "Controller Hierarchy",
            "Disturbance Register",
            "Error signal",
            "Selected skill",
        ],
    ),
    (
        "claim boundary prevents overbroad final claims",
        "skills/verify/SKILL.md",
        [
            "Claim boundary",
            "Highest practical evidence-supported boundary",
            "Gap",
            "Final claim allowed",
        ],
    ),
    (
        "closed-loop ledger records cross-stage control memory",
        "skills/control-kernel/references/closed-loop-ledger.md",
        [
            "Reference",
            "Current state",
            "Last error signal",
            "Control law",
            "Sensor feedback",
            "Route decision",
            "Next state",
            "Adaptive learning",
        ],
    ),
    (
        "disturbance register has robust monitoring and containment fields",
        "skills/system-model/references/disturbance-register.md",
        [
            "Likelihood",
            "Impact",
            "Sensor",
            "Containment",
            "Route trigger",
            "none material",
        ],
    ),
    (
        "synthesis round combines judgment, evidence, metrics, and decisions",
        "skills/meta-synthesis/references/synthesis-round.md",
        [
            "Human/expert judgments",
            "Machine evidence and models",
            "Quantitative indicators",
            "Conflict or contradiction",
            "User-owned decision",
            "Next hypothesis to verify",
            "Indicator handoff candidate",
        ],
    ),
    (
        "indicator handoff turns qualitative goals into evidence signals",
        "skills/alpha-goal/references/indicator-handoff.md",
        [
            "Operational definition",
            "Sensor / evidence source",
            "Measurement timing or frequency",
            "Threshold / tolerance",
            "Evidence boundary",
            "Route trigger",
        ],
    ),
    (
        "controller hierarchy maps local controllers to global objective",
        "skills/system-model/references/controller-hierarchy.md",
        [
            "Global controller",
            "Local controller",
            "Coupling variables",
            "Arbitration rule",
            "Escalation trigger",
            "Recommended coordination route",
            "none material",
        ],
    ),
    (
        "adaptive learning records reusable control corrections",
        "skills/loop/references/adaptive-learning.md",
        [
            "Learning trigger",
            "Observed mismatch",
            "Adjustment",
            "Reuse condition",
            "Invalidation condition",
            "Ledger update",
        ],
    ),
]

FIXTURE_CONTRACT_TESTS = [
    {
        "name": "complex migration conflict uses synthesis and indicator handoff",
        "prompt": "多团队迁移目标、风险、窗口、成功指标冲突，先综合研判。",
        "paths": [
            "skills/meta-synthesis/SKILL.md",
            "skills/meta-synthesis/references/synthesis-round.md",
        ],
        "schema_blocks": [
            "Meta-Synthesis Record:",
            "Synthesis Round:",
            "Indicator Handoff:",
        ],
        "route_terms": ["user", "alpha-goal", "system-model", "blocker"],
    },
    {
        "name": "qualitative objective becomes measurable contract evidence",
        "prompt": "把用户体验更稳定转成可验证 Goal Contract。",
        "paths": [
            "skills/alpha-goal/SKILL.md",
            "skills/alpha-goal/references/indicator-handoff.md",
        ],
        "schema_blocks": ["Goal Contract:", "Indicator Handoff:"],
        "route_terms": ["loop", "system-model", "verify", "block"],
    },
    {
        "name": "multi-controller system maps hierarchy before mutation",
        "prompt": "多个团队和模块都能改变同一上线目标，先建模。",
        "paths": [
            "skills/system-model/SKILL.md",
            "skills/system-model/references/controller-hierarchy.md",
        ],
        "schema_blocks": ["Control Model:", "Controller Hierarchy:"],
        "route_terms": ["alpha-goal", "loop", "meta-synthesis", "blocker"],
    },
    {
        "name": "feedback mismatch creates adaptive learning before next loop",
        "prompt": "上轮控制律阈值没命中，但方向有效，继续下一轮。",
        "paths": [
            "skills/loop/SKILL.md",
            "skills/loop/references/adaptive-learning.md",
        ],
        "schema_blocks": ["Control Law:", "Adaptive Learning Record:"],
        "route_terms": ["ITERATION_CONTINUES", "ITERATION_HARDEN", "RETURN_TO_SYSTEM_MODEL"],
    },
    {
        "name": "verification checks learned thresholds and indicator evidence",
        "prompt": "检查当前声明是否可以最终交付。",
        "paths": [
            "skills/verify/SKILL.md",
            "skills/verify/references/verification-verdict-schema.md",
        ],
        "schema_blocks": [
            "Verification Verdict:",
            "Indicator handoff review",
            "Adaptive learning review",
        ],
        "route_terms": ["PASS_TO_FINAL", "NEXT_ITERATION", "REFRAME", "BLOCKED"],
    },
]


def parse_frontmatter(text: str) -> dict[str, str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        raise ValueError("missing YAML frontmatter block")

    data: dict[str, str] = {}
    for lineno, line in enumerate(m.group(1).splitlines(), start=2):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        field = FIELD_RE.match(line)
        if not field:
            raise ValueError(f"line {lineno}: unsupported frontmatter syntax")

        key, raw_value = field.groups()
        value = raw_value.strip()
        if key not in ALLOWED_FRONTMATTER_KEYS:
            raise ValueError(f"line {lineno}: unsupported frontmatter key {key!r}")
        if key in data:
            raise ValueError(f"line {lineno}: duplicate frontmatter key {key!r}")
        if not value:
            raise ValueError(f"line {lineno}: empty frontmatter value for {key!r}")

        quoted = (
            len(value) >= 2
            and value[0] == value[-1]
            and value[0] in {"'", '"'}
        )
        if not quoted and re.search(r":\s", value):
            raise ValueError(
                f"line {lineno}: quote frontmatter value containing ': '"
            )

        data[key] = value[1:-1] if quoted else value

    return data


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
    skills = root / "skills"
    errors: list[str] = []
    warnings: list[str] = []

    if not skills.is_dir():
        errors.append(f"missing skills directory: {skills}")
        print_report(root, errors, warnings)
        return 1

    for bad in root.rglob("__MACOSX"):
        errors.append(f"macOS metadata directory found: {bad.relative_to(root)}")
    for bad in root.rglob("._*"):
        errors.append(f"macOS resource fork file found: {bad.relative_to(root)}")

    skill_dirs = sorted(p for p in skills.iterdir() if p.is_dir())
    if not skill_dirs:
        errors.append("no skill directories found")
    discovered_skill_names = {p.name for p in skill_dirs}
    missing_required = REQUIRED_SKILL_NAMES - discovered_skill_names
    unexpected = discovered_skill_names - REQUIRED_SKILL_NAMES
    for name in sorted(missing_required):
        errors.append(f"missing required skill directory: skills/{name}")
    for name in sorted(unexpected):
        errors.append(f"unexpected skill directory: skills/{name}")

    names: set[str] = set()
    for d in skill_dirs:
        md = d / "SKILL.md"
        if not md.exists():
            errors.append(f"{d.name}: missing SKILL.md")
            continue
        text = md.read_text(encoding="utf-8")
        try:
            fm = parse_frontmatter(text)
        except ValueError as exc:
            errors.append(f"{d.name}: invalid SKILL.md frontmatter: {exc}")
            continue
        name = fm.get("name")
        desc = fm.get("description")
        if not name:
            errors.append(f"{d.name}: SKILL.md frontmatter missing name")
        if not desc:
            errors.append(f"{d.name}: SKILL.md frontmatter missing description")
        if name and name != d.name:
            errors.append(f"{d.name}: frontmatter name {name!r} does not match directory")
        if name in names:
            errors.append(f"duplicate skill name: {name}")
        if name:
            names.add(name)
        if desc and len(desc) > 500:
            warnings.append(f"{d.name}: description is long ({len(desc)} chars); implicit routing may truncate it")
        for script in (d / "scripts").glob("*") if (d / "scripts").is_dir() else []:
            if script.is_file() and script.suffix in {".sh", ".py"}:
                mode = script.stat().st_mode
                if not (mode & stat.S_IXUSR):
                    warnings.append(f"{script.relative_to(root)} is not user-executable")

        references = sorted((d / "references").glob("*")) if (d / "references").is_dir() else []
        for ref in references:
            if not ref.is_file():
                continue
            rel_ref = f"references/{ref.name}"
            if rel_ref not in text:
                errors.append(
                    f"{d.name}: reference is not discoverable from SKILL.md: {rel_ref}"
                )

    validate_semantic_smoke_tests(root, errors)
    validate_fixture_contract_tests(root, errors)

    print_report(root, errors, warnings)
    return 1 if errors else 0


def validate_semantic_smoke_tests(root: Path, errors: list[str]) -> None:
    for scenario, rel_path, required_terms in SEMANTIC_SMOKE_TESTS:
        path = root / rel_path
        if not path.is_file():
            errors.append(f"semantic smoke test {scenario!r}: missing {rel_path}")
            continue

        text = path.read_text(encoding="utf-8").lower()
        missing = [term for term in required_terms if term.lower() not in text]
        if missing:
            errors.append(
                f"semantic smoke test {scenario!r} failed in {rel_path}: "
                f"missing {', '.join(missing)}"
            )


def validate_fixture_contract_tests(root: Path, errors: list[str]) -> None:
    for fixture in FIXTURE_CONTRACT_TESTS:
        name = str(fixture["name"])
        prompt = str(fixture["prompt"])
        paths = [str(path) for path in fixture["paths"]]
        schema_blocks = [str(block) for block in fixture["schema_blocks"]]
        route_terms = [str(term) for term in fixture["route_terms"]]

        if not prompt.strip():
            errors.append(f"fixture contract {name!r}: empty prompt")
            continue

        combined_parts = []
        missing_paths = []
        for rel_path in paths:
            path = root / rel_path
            if not path.is_file():
                missing_paths.append(rel_path)
                continue
            combined_parts.append(path.read_text(encoding="utf-8"))

        if missing_paths:
            errors.append(
                f"fixture contract {name!r}: missing paths {', '.join(missing_paths)}"
            )
            continue

        combined = "\n".join(combined_parts)
        missing_blocks = [
            block for block in schema_blocks if not has_schema_block(combined, block)
        ]
        if missing_blocks:
            errors.append(
                f"fixture contract {name!r}: missing schema blocks "
                f"{', '.join(missing_blocks)}"
            )

        lower = combined.lower()
        missing_routes = [term for term in route_terms if term.lower() not in lower]
        if missing_routes:
            errors.append(
                f"fixture contract {name!r}: missing route terms "
                f"{', '.join(missing_routes)}"
            )


def has_schema_block(text: str, label: str) -> bool:
    stripped_label = re.escape(label.strip())
    block_pattern = re.compile(r"```(?:text)?\n(?:(?!```).)*" + stripped_label, re.S)
    heading_pattern = re.compile(r"^#{1,6}\s+" + stripped_label.rstrip(":"), re.M)
    return bool(block_pattern.search(text) or heading_pattern.search(text))


def print_report(root: Path, errors: list[str], warnings: list[str]) -> None:
    print("Skill suite validation")
    print(f"root: {root}")
    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"- {e}")
    if warnings:
        print("\nWARNINGS:")
        for w in warnings:
            print(f"- {w}")
    if not errors and not warnings:
        print("PASS: all checks passed")
    elif not errors:
        print("PASS with warnings")


if __name__ == "__main__":
    raise SystemExit(main())
