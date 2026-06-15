#!/usr/bin/env python3
"""Lightweight validation for a local Agent Skills suite."""
from __future__ import annotations

import os
import re
import stat
import sys
from pathlib import Path

FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)
FIELD_RE = re.compile(r"^(name|description):\s*(.+?)\s*$", re.M)


def parse_frontmatter(text: str) -> dict[str, str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}
    return {k: v.strip().strip('"\'') for k, v in FIELD_RE.findall(m.group(1))}


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
        fm = parse_frontmatter(text)
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
