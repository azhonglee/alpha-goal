#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--force]

Install this repository's skills by symlinking each skills/*/SKILL.md directory
into ${CODEX_HOME:-$HOME/.codex}/skills, sync the managed
templates/AGENTS.md block into ${CODEX_HOME:-$HOME/.codex}/AGENTS.md, and fill
missing ${CODEX_HOME:-$HOME/.codex}/config.toml settings from templates/config.toml.

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
config_template="$repo_root/templates/config.toml"
codex_home="${CODEX_HOME:-$HOME/.codex}"
agents_target="$codex_home/AGENTS.md"
config_target="$codex_home/config.toml"
target_root="$codex_home/skills"
agents_template_marker="<!-- generate-with-template:agents-md -->"

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

  if [[ -f "$agents_target" ]]; then
    local existing_content
    existing_content="$(<"$agents_target")"

    if [[ "$existing_content" == *"$agents_template_marker"* ]]; then
      if ! command -v python3 >/dev/null 2>&1; then
        echo "python3 is required to update managed AGENTS template content in $agents_target" >&2
        exit 1
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

if marker not in template_lines:
    print(f"AGENTS template is missing required marker: {marker}", file=sys.stderr)
    raise SystemExit(1)

if not template_lines:
    print(f"AGENTS template is empty: {template_path}", file=sys.stderr)
    raise SystemExit(1)

block_start = template_lines[0]
target_lines = target.splitlines(keepends=True)


def logical_line(line):
    return line.rstrip("\r\n")


blocks = []
marker_lines = sum(1 for line in target_lines if logical_line(line) == marker)
index = 0

while index < len(target_lines):
    if logical_line(target_lines[index]) != block_start:
        index += 1
        continue

    end = index
    while end < len(target_lines):
        if logical_line(target_lines[end]) == marker:
            blocks.append((index, end + 1))
            index = end + 1
            break
        end += 1
    else:
        index += 1

if not blocks or marker_lines != len(blocks):
    print(
        f"Refusing to update {target_path}: found AGENTS template marker but could not identify a managed block",
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
    raise SystemExit(0)

target_path.write_text(updated)
print(f"Updated managed AGENTS template content in {target_path}")
PY
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

  if ! command -v python3 >/dev/null 2>&1; then
    echo "python3 is required to merge config template settings into $config_target" >&2
    exit 1
  fi

  python3 - "$config_template" "$config_target" <<'PY'
from __future__ import annotations

import json
import re
import sys
from collections import OrderedDict
from datetime import date, datetime, time
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:
    print("python3 with tomllib support is required to merge config.toml", file=sys.stderr)
    raise SystemExit(1)


HEADER_RE = re.compile(r"^\s*\[([^\[\]]+)\]\s*(?:#.*)?$")
BARE_KEY_RE = re.compile(r"^[A-Za-z0-9_-]+$")


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


def toml_key(key: str) -> str:
    if BARE_KEY_RE.match(key):
        return key
    return json.dumps(key)


def toml_table(path: tuple[str, ...]) -> str:
    return ".".join(toml_key(part) for part in path)


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
    if isinstance(value, dict):
        items = ", ".join(f"{toml_key(key)} = {toml_value(child)}" for key, child in value.items())
        return "{ " + items + " }"
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    print(f"Unsupported TOML value type in template: {type(value).__name__}", file=sys.stderr)
    raise SystemExit(1)


def parse_key_part(part: str) -> str:
    part = part.strip()
    if part.startswith(("\"", "'")):
        try:
            return tomllib.loads("key = " + part)["key"]
        except tomllib.TOMLDecodeError:
            pass
    return part


def split_table_name(raw: str) -> tuple[str, ...]:
    parts = []
    current = []
    quote = None
    escaped = False

    for char in raw.strip():
        if quote:
            current.append(char)
            if quote == '"' and escaped:
                escaped = False
            elif quote == '"' and char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue

        if char in ("\"", "'"):
            quote = char
            current.append(char)
        elif char == ".":
            parts.append(parse_key_part("".join(current)))
            current = []
        else:
            current.append(char)

    parts.append(parse_key_part("".join(current)))
    return tuple(parts)


def collect_table_blocks(lines: list[str]) -> tuple[dict[tuple[str, ...], tuple[int, int]], int]:
    headers = []
    for index, line in enumerate(lines):
        if line.lstrip().startswith("[["):
            continue
        match = HEADER_RE.match(line)
        if match:
            headers.append((index, split_table_name(match.group(1))))

    blocks = {}
    for offset, (index, path) in enumerate(headers):
        end = headers[offset + 1][0] if offset + 1 < len(headers) else len(lines)
        blocks.setdefault(path, (index, end))

    first_table = headers[0][0] if headers else len(lines)
    return blocks, first_table


def key_lines(items: list[tuple[str, object]]) -> list[str]:
    return [f"{toml_key(key)} = {toml_value(value)}\n" for key, value in items]


def insertion_before_trailing_blank(lines: list[str], start: int, end: int) -> int:
    index = end
    while index > start and lines[index - 1].strip() == "":
        index -= 1
    return index


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
        dotted = ".".join(conflict)
        missing_path = ".".join(path)
        print(
            f"Cannot add {missing_path}: {target_path} already defines non-table value at {dotted}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    missing.append((path, value))

if not missing:
    print(f"config.toml already contains template settings: {target_path}")
    raise SystemExit(0)

groups = OrderedDict()
for path, value in missing:
    groups.setdefault(path[:-1], []).append((path[-1], value))

text = target_path.read_text()
lines = text.splitlines(keepends=True)
for index, line in enumerate(lines):
    if line and not line.endswith("\n"):
        lines[index] = line + "\n"

blocks, first_table = collect_table_blocks(lines)
insertions = []
appends = []

for parent, items in groups.items():
    additions = key_lines(items)
    if not parent:
        insert_at = insertion_before_trailing_blank(lines, 0, first_table)
        if insert_at < len(lines):
            additions.append("\n")
        insertions.append((insert_at, additions))
    elif parent in blocks:
        start, end = blocks[parent]
        insert_at = insertion_before_trailing_blank(lines, start + 1, end)
        if insert_at < len(lines) and lines[insert_at].strip() != "":
            additions.append("\n")
        insertions.append((insert_at, additions))
    else:
        appends.append((parent, items))

for insert_at, additions in sorted(insertions, key=lambda item: item[0], reverse=True):
    lines[insert_at:insert_at] = additions

for parent, items in appends:
    if lines and lines[-1].strip() != "":
        lines.append("\n")
    if lines and (len(lines) < 2 or lines[-2].strip() != ""):
        lines.append("\n")
    lines.append(f"[{toml_table(parent)}]\n")
    lines.extend(key_lines(items))

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

if [[ ! -d "$source_root" ]]; then
  echo "No skills directory found at $source_root" >&2
  exit 1
fi

if [[ ! -f "$agents_template" ]]; then
  echo "No AGENTS template found at $agents_template" >&2
  exit 1
fi

if [[ ! -f "$config_template" ]]; then
  echo "No config template found at $config_template" >&2
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
sync_config_template

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
