#!/usr/bin/env bash
set -euo pipefail

section() {
  printf '\n== %s ==\n' "$1"
}

section "cwd"
pwd

if ! command -v git >/dev/null 2>&1; then
  section "git"
  echo "git: not found"
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  section "git"
  echo "inside_work_tree: no"
  exit 0
fi

section "git root"
git rev-parse --show-toplevel 2>/dev/null || true

section "branch"
git branch --show-current 2>/dev/null || true

section "status --short"
git status --short || true

section "changed files: unstaged"
git diff --name-only || true

section "changed files: staged"
git diff --cached --name-only || true

section "diff stat: unstaged"
git diff --stat || true

section "diff stat: staged"
git diff --cached --stat || true

section "diff check: unstaged"
if git diff --check; then
  echo "git diff --check: pass"
else
  echo "git diff --check: fail"
fi

section "diff check: staged"
if git diff --cached --check; then
  echo "git diff --cached --check: pass"
else
  echo "git diff --cached --check: fail"
fi


section "worktree and ignore hints"
git worktree list 2>/dev/null || true
if root="$(git rev-parse --show-toplevel 2>/dev/null)" && [ -n "$root" ]; then
  (
    cd "$root"
    for path in .worktrees/codex/preflight-check .alpha-goal/preflight-check; do
      if git check-ignore -q "$path"; then
        echo "$path: ignored"
      else
        echo "$path: NOT ignored or not applicable"
      fi
    done
  )
fi

section "recent commits"
git log --oneline -5 2>/dev/null || true

section "reminder"
echo "This script is read-only. It summarizes diff evidence but does not run project tests. Map acceptance to evidence manually."
