#!/usr/bin/env bash
set -euo pipefail

print_list() {
  local label="$1"
  shift

  echo "$label:"
  if [[ "$#" -eq 0 ]]; then
    echo "  - none"
    return
  fi

  local item
  for item in "$@"; do
    echo "  - $item"
  done
}

cwd="$(pwd -P)"

if ! git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  cat <<EOF
Mutation Preflight:
- cwd: $cwd
- git_root: <none>
- mutation_allowed: false
- reason: current directory is not inside a git repository
EOF
  exit 0
fi

git_root="$(cd "$git_root" && pwd -P)"
branch="$(git branch --show-current 2>/dev/null || true)"
if [[ -z "$branch" ]]; then
  branch="<detached>"
fi

current_checkout="$(git rev-parse --show-toplevel)"
current_checkout="$(cd "$current_checkout" && pwd -P)"
primary_checkout="$(git worktree list --porcelain | awk '/^worktree / { print substr($0, 10); exit }')"
if [[ -n "$primary_checkout" ]]; then
  primary_checkout="$(cd "$primary_checkout" && pwd -P)"
else
  primary_checkout="$git_root"
fi

if [[ "$current_checkout" == "$primary_checkout" ]]; then
  linked_worktree="no"
else
  linked_worktree="yes"
fi

if [[ "$branch" == "main" || "$branch" == "master" ]]; then
  branch_is_main="yes"
else
  branch_is_main="no"
fi

status="$(git status --short)"
if [[ -z "$status" ]]; then
  dirty_state="clean"
else
  dirty_state="dirty"
fi

if git check-ignore -q "$git_root/.worktrees/" 2>/dev/null; then
  worktrees_ignored="yes"
else
  worktrees_ignored="no"
fi

agents_files=()
while IFS= read -r path; do
  agents_files+=("$path")
done < <(find "$git_root" -name AGENTS.md -type f -print | sort)

nested_git=()
while IFS= read -r path; do
  nested_git+=("$path")
done < <(find "$git_root" -path "$git_root/.git" -prune -o -name .git -print | sort)

mutation_allowed="true"
reason="isolated checkout appears available"

if [[ "$linked_worktree" == "no" && "$branch_is_main" == "yes" ]]; then
  mutation_allowed="false"
  reason="current checkout is primary main/master"
elif [[ "$dirty_state" == "dirty" ]]; then
  mutation_allowed="needs_decision"
  reason="worktree has pre-existing changes"
elif [[ "$worktrees_ignored" == "no" ]]; then
  mutation_allowed="needs_decision"
  reason=".worktrees/ is not ignored; use another isolated path or add ignore rule before repository-local worktrees"
fi

cat <<EOF
Mutation Preflight:
- cwd: $cwd
- git_root: $git_root
- current_checkout: $current_checkout
- primary_checkout: $primary_checkout
- linked_worktree: $linked_worktree
- branch: $branch
- branch_is_main_or_master: $branch_is_main
- dirty_state: $dirty_state
- worktrees_ignored: $worktrees_ignored
- mutation_allowed: $mutation_allowed
- reason: $reason
status:
EOF

if [[ -z "$status" ]]; then
  echo "  <clean>"
else
  printf '%s\n' "$status" | sed 's/^/  /'
fi

echo "worktrees:"
git worktree list | sed 's/^/  /'

print_list "applicable_agents_candidates" "${agents_files[@]}"
print_list "nested_git_entries" "${nested_git[@]}"
