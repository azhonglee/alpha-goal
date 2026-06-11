#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--force]

Install this repository's top-level skills by symlinking them into
${CODEX_HOME:-<repo>/codex}/skills.

The script also syncs templates/AGENTS.md into ${CODEX_HOME}/AGENTS.md and
fills missing ${CODEX_HOME}/config.toml settings from templates/config.toml.

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
codex_home="${CODEX_HOME:-$repo_root/codex}"
target_root="$codex_home/skills"
agents_template="$repo_root/templates/AGENTS.md"
config_template="$repo_root/templates/config.toml"
agents_target="$codex_home/AGENTS.md"
config_target="$codex_home/config.toml"
agents_template_marker="<!-- generate-with-template:agents-md -->"

link_path() {
  local source="$1"
  local target="$2"
  local label="$3"

  if [[ -L "$target" ]]; then
    local current_target
    current_target="$(readlink "$target")"
    if [[ "$current_target" == "$source" ]]; then
      echo "Already installed: $label -> $source"
      return
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

  ln -s "$source" "$target"
  echo "Installed: $label -> $source"
}

remove_legacy_support_link() {
  local support_name="$1"
  local support_dir="$repo_root/$support_name"
  local target="$target_root/$support_name"

  if [[ ! -L "$target" || ! -d "$support_dir" ]]; then
    return
  fi

  local current_target
  current_target="$(readlink "$target")"
  if [[ "$current_target" == "$support_dir" ]]; then
    rm "$target"
    echo "Removed legacy support link: $target"
  fi
}

inject_agents_template() {
  local template_content
  template_content="$(<"$agents_template")"

  if [[ -e "$agents_target" && ! -f "$agents_target" ]]; then
    echo "Refusing to write AGENTS template into non-file path: $agents_target" >&2
    exit 1
  fi

  if [[ "$template_content" != *"$agents_template_marker"* ]]; then
    echo "AGENTS template is missing required marker: $agents_template_marker" >&2
    exit 1
  fi

  if [[ ! -f "$agents_target" ]]; then
    cp "$agents_template" "$agents_target"
    echo "Created AGENTS.md from template: $agents_target"
    return
  fi

  local existing_content
  existing_content="$(<"$agents_target")"

  if [[ "$existing_content" != *"$agents_template_marker"* ]]; then
    {
      if [[ -s "$agents_target" ]]; then
        printf '\n\n'
      fi
      cat "$agents_template"
    } >>"$agents_target"
    echo "Injected AGENTS template into $agents_target"
    return
  fi

  python3 - "$agents_template" "$agents_target" "$agents_template_marker" <<'PY'
import sys
from pathlib import Path

template_path = Path(sys.argv[1])
target_path = Path(sys.argv[2])
marker = sys.argv[3]

template = template_path.read_text()
target = target_path.read_text()
template_lines = template.splitlines()

if not template_lines or marker not in template_lines:
    print(f"Invalid AGENTS template: {template_path}", file=sys.stderr)
    raise SystemExit(1)

block_start = template_lines[0]
target_lines = target.splitlines(keepends=True)


def logical(line: str) -> str:
    return line.rstrip("\r\n")


blocks = []
index = 0
while index < len(target_lines):
    if logical(target_lines[index]) != block_start:
        index += 1
        continue

    end = index
    while end < len(target_lines):
        if logical(target_lines[end]) == marker:
            blocks.append((index, end + 1))
            index = end + 1
            break
        end += 1
    else:
        index += 1

if not blocks:
    print(
        f"Refusing to update {target_path}: marker exists but managed block was not found",
        file=sys.stderr,
    )
    raise SystemExit(1)

pieces = []
cursor = 0
inserted = False
for start, end in blocks:
    pieces.extend(target_lines[cursor:start])
    if not inserted:
        pieces.append(template if template.endswith("\n") else template + "\n")
        inserted = True
    cursor = end
pieces.extend(target_lines[cursor:])

updated = "".join(pieces)
if updated == target:
    print(f"AGENTS.md already has current managed template content: {target_path}")
else:
    target_path.write_text(updated)
    print(f"Updated managed AGENTS template content in {target_path}")
PY
}

sync_config_template() {
  if [[ -e "$config_target" && ! -f "$config_target" ]]; then
    echo "Refusing to write config template into non-file path: $config_target" >&2
    exit 1
  fi

  if [[ ! -f "$config_target" ]]; then
    cp "$config_template" "$config_target"
    echo "Created config.toml from template: $config_target"
    return
  fi

  python3 - "$config_template" "$config_target" <<'PY'
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:
    print("python3 with tomllib support is required to merge config.toml", file=sys.stderr)
    raise SystemExit(1)

HEADER_RE = re.compile(r"^\s*\[([A-Za-z0-9_.-]+)\]\s*(?:#.*)?$")


def load_toml(path: Path) -> dict:
    text = path.read_text()
    if not text.strip():
        return {}
    try:
        return tomllib.loads(text)
    except tomllib.TOMLDecodeError as exc:
        print(f"Invalid TOML in {path}: {exc}", file=sys.stderr)
        raise SystemExit(1)


def flatten(value, prefix=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from flatten(child, prefix + (key,))
        return
    yield prefix, value


def has_path(data: dict, path: tuple[str, ...]) -> bool:
    current = data
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return False
        current = current[key]
    return True


def parent_conflict(data: dict, path: tuple[str, ...]) -> tuple[str, ...] | None:
    current = data
    checked = []
    for key in path[:-1]:
        if not isinstance(current, dict):
            return tuple(checked)
        if key not in current:
            return None
        current = current[key]
        checked.append(key)
        if not isinstance(current, dict):
            return tuple(checked)
    return None


def toml_value(value) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return repr(value)
    if isinstance(value, list):
        return "[" + ", ".join(toml_value(item) for item in value) + "]"
    print(f"Unsupported TOML value type in template: {type(value).__name__}", file=sys.stderr)
    raise SystemExit(1)


def collect_tables(lines: list[str]) -> tuple[dict[tuple[str, ...], tuple[int, int]], int]:
    headers = []
    for index, line in enumerate(lines):
        match = HEADER_RE.match(line)
        if match:
            headers.append((index, tuple(match.group(1).split("."))))

    blocks = {}
    for offset, (index, path) in enumerate(headers):
        end = headers[offset + 1][0] if offset + 1 < len(headers) else len(lines)
        blocks[path] = (index, end)

    first_table = headers[0][0] if headers else len(lines)
    return blocks, first_table


template_path = Path(sys.argv[1])
target_path = Path(sys.argv[2])
template_data = load_toml(template_path)
target_data = load_toml(target_path)

missing = []
for path, value in flatten(template_data):
    if has_path(target_data, path):
        continue
    conflict = parent_conflict(target_data, path)
    if conflict:
        print(
            f"Cannot add {'.'.join(path)}: non-table value exists at {'.'.join(conflict)}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    missing.append((path, value))

if not missing:
    print(f"config.toml already contains template settings: {target_path}")
    raise SystemExit(0)

groups: dict[tuple[str, ...], list[tuple[str, object]]] = {}
for path, value in missing:
    groups.setdefault(path[:-1], []).append((path[-1], value))

text = target_path.read_text()
lines = text.splitlines(keepends=True)
for index, line in enumerate(lines):
    if line and not line.endswith("\n"):
        lines[index] = line + "\n"

blocks, first_table = collect_tables(lines)
insertions = []
appends = []

for parent, items in groups.items():
    additions = [f"{key} = {toml_value(value)}\n" for key, value in items]
    if not parent:
        if first_table < len(lines):
            additions.append("\n")
        insertions.append((first_table, additions))
    elif parent in blocks:
        _start, end = blocks[parent]
        insertions.append((end, additions))
    else:
        appends.append((parent, additions))

for index, additions in sorted(insertions, key=lambda item: item[0], reverse=True):
    lines[index:index] = additions

for parent, additions in appends:
    if lines and lines[-1].strip():
        lines.append("\n")
    lines.append(f"[{'.'.join(parent)}]\n")
    lines.extend(additions)

new_text = "".join(lines)
try:
    tomllib.loads(new_text) if new_text.strip() else {}
except tomllib.TOMLDecodeError as exc:
    print(f"Refusing to write invalid merged TOML for {target_path}: {exc}", file=sys.stderr)
    raise SystemExit(1)

target_path.write_text(new_text)
print(f"Added {len(missing)} config setting(s) into {target_path}")
PY
}

if [[ ! -f "$agents_template" ]]; then
  echo "No AGENTS template found at $agents_template" >&2
  exit 1
fi

if [[ ! -f "$config_template" ]]; then
  echo "No config template found at $config_template" >&2
  exit 1
fi

shopt -s nullglob
skill_files=("$repo_root"/*/SKILL.md)
shopt -u nullglob

if [[ "${#skill_files[@]}" -eq 0 ]]; then
  echo "No top-level skills found under $repo_root" >&2
  exit 1
fi

mkdir -p "$codex_home" "$target_root"

inject_agents_template
sync_config_template

installed=0
for skill_file in "${skill_files[@]}"; do
  skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
  skill_name="$(basename "$skill_dir")"
  link_path "$skill_dir" "$target_root/$skill_name" "$skill_name"
  installed=$((installed + 1))
done

for support_name in adapters tools templates scripts; do
  remove_legacy_support_link "$support_name"
done

python3 "$repo_root/tools/validate_skillset.py" "$repo_root"

echo "Installed $installed skill(s) into $target_root"
echo "Codex home: $codex_home"
