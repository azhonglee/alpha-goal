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

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
branch="$(git branch --show-current 2>/dev/null || true)"

section "git root"
echo "${root:-<unknown>}"

section "branch"
echo "${branch:-<detached-or-unknown>}"

section "default branch hints"
remote_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
echo "origin_head: ${remote_head:-<unknown>}"
case "$branch" in
  main|master|trunk)
    echo "warning: current branch looks like a primary branch"
    ;;
  "")
    echo "warning: detached or unknown branch"
    ;;
  *)
    echo "primary_branch_name_match: no"
    ;;
esac

section "status --short"
git status --short || true

section "worktree list"
git worktree list || true

section "worktree list --porcelain"
git worktree list --porcelain || true

section "checkout classification"
common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
git_dir="$(git rev-parse --git-dir 2>/dev/null || true)"
if [ -n "$root" ] && [ -f "$root/.git" ]; then
  echo "linked_worktree: yes"
else
  echo "linked_worktree: no"
fi
if [ -n "$root" ] && [ -n "$common_dir" ]; then
  common_abs="$(cd "$root" && cd "$common_dir" 2>/dev/null && pwd -P || true)"
  echo "git_common_dir: ${common_abs:-$common_dir}"
fi
case "$root" in
  */.worktrees/codex/*)
    echo "inside_repo_local_codex_worktree: yes"
    ;;
  *)
    echo "inside_repo_local_codex_worktree: no"
    ;;
esac

section "ignore checks"
if [ -n "$root" ] && [ -d "$root" ]; then
  (
    cd "$root"
    for path in .worktrees/codex/preflight-check .alpha-goal/preflight-check; do
      if git check-ignore -q "$path"; then
        echo "$path: ignored"
      else
        echo "$path: NOT ignored"
      fi
    done
  )
else
  echo "<unknown root>"
fi

section "local rule files"
if [ -n "$root" ] && [ -d "$root" ]; then
  find "$root" \
    -path '*/.git' -prune -o \
    \( -name AGENTS.override.md -o -name AGENTS.md -o -name CLAUDE.md -o -name code_review.md \) \
    -print 2>/dev/null | sort || true
else
  echo "<unknown root>"
fi

section "nested git directories near root"
if [ -n "$root" ] && [ -d "$root" ]; then
  find "$root" -mindepth 2 -maxdepth 4 -name .git -print 2>/dev/null | sort || true
else
  echo "<unknown root>"
fi

section "submodules"
git submodule status 2>/dev/null || echo "<none or unavailable>"

section "preflight gaps to decide manually"
echo "primary_checkout: infer from worktree list and branch/default branch hints"
echo "isolated_edit_path: record the current worktree path, or the setup target if this preflight precedes worktree creation"
echo "mutation_allowed: decide manually from Goal Contract, project rules, dirty state, and isolation checks"

section "reminder"
echo "This script is read-only. It does not decide whether mutation is safe. Record an isolated edit path or approved first-step setup target before editing."
