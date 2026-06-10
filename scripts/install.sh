#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--force]

Install this repository's skills by symlinking each skills/*/SKILL.md directory
into ${CODEX_HOME:-$HOME/.codex}/skills, and ensure
${CODEX_HOME:-$HOME/.codex}/AGENTS.md contains templates/AGENTS.md.

Options:
  --force   Replace existing symlinks that point elsewhere. Real files or
            directories are never removed.
EOF
}

force=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      force=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"
source_root="$repo_root/skills"
agents_template="$repo_root/templates/AGENTS.md"
codex_home="${CODEX_HOME:-$HOME/.codex}"
agents_target="$codex_home/AGENTS.md"
target_root="$codex_home/skills"

inject_agents_template() {
  local template_content

  template_content="$(<"$agents_template")"

  if [[ -e "$agents_target" && ! -f "$agents_target" ]]; then
    echo "Refusing to write AGENTS template into non-file path: $agents_target" >&2
    exit 1
  fi

  if [[ -f "$agents_target" ]]; then
    local existing_content
    existing_content="$(<"$agents_target")"

    if [[ "$existing_content" == *"$template_content"* ]]; then
      echo "AGENTS.md already contains template content: $agents_target"
      return
    fi

    {
      if [[ -s "$agents_target" ]]; then
        printf '\n\n'
      fi
      cat "$agents_template"
    } >>"$agents_target"

    echo "Injected AGENTS template into $agents_target"
    return
  fi

  cp "$agents_template" "$agents_target"
  echo "Created AGENTS.md from template: $agents_target"
}

if [[ ! -d "$source_root" ]]; then
  echo "No skills directory found at $source_root" >&2
  exit 1
fi

if [[ ! -f "$agents_template" ]]; then
  echo "No AGENTS template found at $agents_template" >&2
  exit 1
fi

shopt -s nullglob
skill_files=("$source_root"/*/SKILL.md)
shopt -u nullglob

if [[ "${#skill_files[@]}" -eq 0 ]]; then
  echo "No skills found under $source_root" >&2
  exit 1
fi

mkdir -p "$codex_home" "$target_root"

inject_agents_template

installed=0

for skill_file in "${skill_files[@]}"; do
  skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
  skill_name="$(basename "$skill_dir")"
  target="$target_root/$skill_name"

  if [[ -L "$target" ]]; then
    current_target="$(readlink "$target")"
    if [[ "$current_target" == "$skill_dir" ]]; then
      echo "Already installed: $skill_name -> $skill_dir"
      installed=$((installed + 1))
      continue
    fi

    if [[ "$force" == true ]]; then
      rm "$target"
    else
      echo "Refusing to replace existing symlink: $target -> $current_target" >&2
      echo "Re-run with --force to replace symlinks." >&2
      exit 1
    fi
  elif [[ -e "$target" ]]; then
    echo "Refusing to replace existing non-symlink path: $target" >&2
    exit 1
  fi

  ln -s "$skill_dir" "$target"
  echo "Installed: $skill_name -> $skill_dir"
  installed=$((installed + 1))
done

echo "Installed $installed skill(s) into $target_root"
