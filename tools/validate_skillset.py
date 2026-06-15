#!/usr/bin/env python3
"""Compatibility entry point for validating this skill suite.

The closed-loop control suite uses tools/validate_skills.py as the canonical
validator. Keep this wrapper so older docs, scripts, and local habits that run
tools/validate_skillset.py continue to validate the current six-skill layout.
"""

from __future__ import annotations

import runpy
import sys
from pathlib import Path


def main() -> int:
    validator = Path(__file__).with_name("validate_skills.py")
    if not validator.exists():
        print(f"missing validator: {validator}", file=sys.stderr)
        return 1
    runpy.run_path(str(validator), run_name="__main__")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
