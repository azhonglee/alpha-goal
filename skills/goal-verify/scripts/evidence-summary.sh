#!/usr/bin/env bash
set -euo pipefail

cwd="$(pwd -P)"

if ! git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  cat <<EOF
Evidence Summary:
- cwd: $cwd
- git_root: <none>
- status: not_in_git_repo
EOF
  exit 0
fi

git_root="$(cd "$git_root" && pwd -P)"
branch="$(git branch --show-current 2>/dev/null || true)"
if [[ -z "$branch" ]]; then
  branch="<detached>"
fi

cat <<EOF
Evidence Summary:
- cwd: $cwd
- git_root: $git_root
- branch: $branch
- head: $(git rev-parse --short HEAD)
- last_commit: $(git log -1 --pretty=%s)
status:
EOF

status="$(git status --short)"
if [[ -z "$status" ]]; then
  echo "  <clean>"
else
  printf '%s\n' "$status" | sed 's/^/  /'
fi

echo "changed_files:"
changed_files="$(git status --short | sed 's/^...//' | sort -u)"
if [[ -z "$changed_files" ]]; then
  echo "  <none>"
else
  printf '%s\n' "$changed_files" | sed 's/^/  /'
fi

echo "untracked_files:"
untracked_files="$(git ls-files --others --exclude-standard)"
if [[ -z "$untracked_files" ]]; then
  echo "  <none>"
else
  printf '%s\n' "$untracked_files" | sed 's/^/  /'
fi

echo "diff_stat:"
diff_stat="$(git diff --stat HEAD --)"
if [[ -z "$diff_stat" ]]; then
  echo "  <none>"
else
  printf '%s\n' "$diff_stat" | sed 's/^/  /'
fi
