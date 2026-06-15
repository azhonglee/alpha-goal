#!/usr/bin/env bash
set -euo pipefail

full_scan=false
worktree_check_path="${WORKTREE_CHECK_PATH:-.worktrees/codex/preflight-check}"
scratch_check_path="${SCRATCH_CHECK_PATH:-.alpha-goal/preflight-check}"

usage() {
  cat <<'USAGE'
Usage: mutation-preflight.sh [--full] [WORKTREE_CHECK_PATH] [SCRATCH_CHECK_PATH]

Read-only git/path snapshot for deciding whether mutation is safe.
Default check paths are candidates, not requirements:
  .worktrees/codex/preflight-check
  .alpha-goal/preflight-check
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --full)
      full_scan=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ "$worktree_check_path" == "${WORKTREE_CHECK_PATH:-.worktrees/codex/preflight-check}" ]]; then
        worktree_check_path="$1"
      elif [[ "$scratch_check_path" == "${SCRATCH_CHECK_PATH:-.alpha-goal/preflight-check}" ]]; then
        scratch_check_path="$1"
      else
        echo "Unknown extra argument: $1" >&2
        usage >&2
        exit 2
      fi
      shift
      ;;
  esac
done

section() { printf '\n== %s ==\n' "$1"; }

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
current_dir="$(pwd -P)"

section "git root"
echo "${root:-<unknown>}"

section "branch"
echo "${branch:-<detached-or-unknown>}"

section "default branch hints"
remote_head="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)"
echo "origin_head: ${remote_head:-<unknown>}"
case "$branch" in
  main|master|trunk)
    echo "primary_branch_name_risk: yes"
    ;;
  "")
    echo "primary_branch_name_risk: unknown-detached"
    ;;
  *)
    echo "primary_branch_name_risk: no"
    ;;
esac

section "status --short"
git status --short || true

section "worktree list"
git worktree list || true

section "checkout classification"
common_dir="$(git rev-parse --git-common-dir 2>/dev/null || true)"
if [[ -n "$root" && -f "$root/.git" ]]; then
  echo "linked_worktree: yes"
else
  echo "linked_worktree: no"
fi
if [[ -n "$root" && -n "$common_dir" ]]; then
  common_abs="$(cd "$root" && cd "$common_dir" 2>/dev/null && pwd -P || true)"
  echo "git_common_dir: ${common_abs:-$common_dir}"
fi
echo "declared_isolated_edit_path: record manually from approved context"
echo "primary_checkout_risk: infer from branch, linked_worktree, worktree list, and project rules"
case "$root" in
  */.worktrees/*|*/worktrees/*)
    echo "worktree_path_hint: current root path contains a worktrees segment"
    ;;
  *)
    echo "worktree_path_hint: no default worktrees segment detected"
    ;;
esac

section "ignore checks"
if [[ -n "$root" && -d "$root" ]]; then
  (
    cd "$root"
    for path in "$worktree_check_path" "$scratch_check_path"; do
      if git check-ignore -q "$path"; then
        echo "$path: ignored"
      else
        echo "$path: NOT ignored or outside ignore rules"
      fi
    done
  )
else
  echo "<unknown root>"
fi

print_ancestor_rules() {
  local dir="$current_dir"
  local stop="$root"
  while [[ -n "$dir" && "$dir" == "$stop"* ]]; do
    for name in AGENTS.override.md AGENTS.md CLAUDE.md code_review.md; do
      [[ -f "$dir/$name" ]] && printf '%s\n' "$dir/$name"
    done
    [[ "$dir" == "$stop" ]] && break
    dir="$(dirname "$dir")"
  done
}

section "ancestor rule files"
if [[ -n "$root" && -d "$root" ]]; then
  print_ancestor_rules | sort -u || true
else
  echo "<unknown root>"
fi

if [[ "$full_scan" == true ]]; then
  section "local rule files: full scan"
  if [[ -n "$root" && -d "$root" ]]; then
    find "$root" \
      \( -path '*/.git' -o -path '*/.worktrees' -o -path '*/node_modules' -o -path '*/dist' -o -path '*/build' -o -path '*/.venv' \) -prune -o \
      \( -name AGENTS.override.md -o -name AGENTS.md -o -name CLAUDE.md -o -name code_review.md \) \
      -print 2>/dev/null | sort || true
  else
    echo "<unknown root>"
  fi
else
  section "local rule files: full scan skipped"
  echo "Use --full if planned changes cross directories not covered by ancestor rules."
fi

section "nested git directories near root"
if [[ -n "$root" && -d "$root" ]]; then
  find "$root" \
    \( -path '*/.git' -o -path '*/.worktrees' -o -path '*/node_modules' -o -path '*/dist' -o -path '*/build' -o -path '*/.venv' \) -prune -o \
    -mindepth 2 -maxdepth 4 -name .git -print 2>/dev/null | sort || true
else
  echo "<unknown root>"
fi

section "submodules"
git submodule status 2>/dev/null || echo "<none or unavailable>"

section "preflight gaps to decide manually"
echo "primary_checkout: infer from worktree list, branch/default branch hints, and project rules"
echo "isolated_edit_path: valid when not primary checkout, inside approved owner boundary, ignored or external, and recorded before mutation"
echo "mutation_allowed: decide from Goal Contract, system model, project rules, dirty state, ownership, and evidence needs"

section "reminder"
echo "This script is read-only. It reports facts and candidate path checks; it does not decide whether mutation is safe."
