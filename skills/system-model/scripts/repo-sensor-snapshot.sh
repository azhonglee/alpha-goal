#!/usr/bin/env bash
set -euo pipefail

section() { printf '\n== %s ==\n' "$1"; }

section "cwd"
pwd

section "git"
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "inside_work_tree: yes"
  echo "root: $(git rev-parse --show-toplevel 2>/dev/null || true)"
  echo "branch: $(git branch --show-current 2>/dev/null || true)"
  echo "status_short:"
  git status --short || true
  echo "worktrees:"
  git worktree list 2>/dev/null || true
  echo "submodules:"
  git submodule status 2>/dev/null || echo "<none or unavailable>"
else
  echo "inside_work_tree: no or git unavailable"
fi

section "top-level structure"
find . -maxdepth 2 \
  \( -path './.git' -o -path './.worktrees' -o -path './node_modules' -o -path './dist' -o -path './build' -o -path './.venv' \) -prune -o \
  -print 2>/dev/null | sort | sed -n '1,200p'

section "rule and instruction files"
find . -maxdepth 4 \
  \( -path './.git' -o -path './.worktrees' -o -path './node_modules' -o -path './dist' -o -path './build' -o -path './.venv' \) -prune -o \
  \( -name AGENTS.md -o -name AGENTS.override.md -o -name CLAUDE.md -o -name code_review.md -o -name README.md -o -name README.* \) \
  -print 2>/dev/null | sort | sed -n '1,200p'

section "project manifest hints"
find . -maxdepth 3 \
  \( -path './.git' -o -path './.worktrees' -o -path './node_modules' -o -path './dist' -o -path './build' -o -path './.venv' \) -prune -o \
  \( -name package.json -o -name pyproject.toml -o -name requirements.txt -o -name go.mod -o -name Cargo.toml -o -name pom.xml -o -name build.gradle -o -name Makefile -o -name justfile \) \
  -print 2>/dev/null | sort | sed -n '1,200p'

section "reminder"
echo "This script is read-only. Interpret output manually before any mutation."
