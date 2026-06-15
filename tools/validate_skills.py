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

    print_report(root, errors, warnings)
    return 1 if errors else 0


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
