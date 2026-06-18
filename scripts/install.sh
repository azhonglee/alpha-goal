#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--codex-home PATH] [--force] [--no-sync-user-templates] [--no-sync-user-hooks] [--verbose]

Install this repository's public skill directories as direct symlinks
under ${CODEX_HOME:-$HOME/.codex}/skills.

By default, this script merges templates/AGENTS.md into user-level AGENTS.md,
fills missing config.toml settings from templates/config.toml, and syncs
templates/hooks.json into user-level hooks.json.
Use --no-sync-user-templates to skip user-level template updates.
Use --no-sync-user-hooks to skip hook updates.

Options:
  --codex-home PATH
            Install into PATH instead of ${CODEX_HOME:-$HOME/.codex}.
  --force   Replace existing symlinks that point elsewhere. Real files or
            directories are never removed.
  --no-sync-user-templates
            Skip updating Codex home AGENTS.md and config.toml from templates/.
  --sync-user-templates
            Compatibility no-op; user templates are synced by default.
  --no-sync-user-hooks
            Skip updating Codex home hooks.json.
  --sync-user-hooks
            Compatibility no-op; user hooks are synced by default.
  --verbose Print detailed install and validation output.
EOF
}

die() {
  echo "$*" >&2
  exit 1
}

force=false
verbose=false
sync_user_templates=true
sync_user_hooks=true
codex_home_arg=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --codex-home)
      shift
      if [[ $# -eq 0 ]]; then
        die "Missing value for --codex-home"
      fi
      codex_home_arg="$1"
      shift
      ;;
    --codex-home=*)
      codex_home_arg="${1#*=}"
      if [[ -z "$codex_home_arg" ]]; then
        die "Missing value for --codex-home"
      fi
      shift
      ;;
    --force)
      force=true
      shift
      ;;
    --sync-user-templates)
      sync_user_templates=true
      shift
      ;;
    --no-sync-user-templates)
      sync_user_templates=false
      shift
      ;;
    --sync-user-hooks)
      sync_user_hooks=true
      shift
      ;;
    --no-sync-user-hooks)
      sync_user_hooks=false
      shift
      ;;
    --verbose)
      verbose=true
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

log() {
  if [[ "$verbose" == true ]]; then
    echo "$*"
  fi
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"
source_skill_root="$repo_root/skills"
validation_tool="$repo_root/tools/validate_skills.ts"
validation_tool_label="tools/validate_skills.ts"
tsx_runner=()

normalize_path() {
  python3 - "$1" <<'PY'
import sys
from pathlib import Path

raw_path = sys.argv[1]
if not raw_path:
    print("empty path is not valid", file=sys.stderr)
    raise SystemExit(1)

print(Path(raw_path).expanduser().resolve(strict=False))
PY
}

absolute_path() {
  python3 - "$1" <<'PY'
import os
import sys

raw_path = sys.argv[1]
if not raw_path:
    print("empty path is not valid", file=sys.stderr)
    raise SystemExit(1)

print(os.path.abspath(os.path.expanduser(raw_path)))
PY
}

default_codex_home() {
  if [[ -n "$codex_home_arg" ]]; then
    printf '%s\n' "$codex_home_arg"
    return
  fi

  if [[ -n "${CODEX_HOME:-}" ]]; then
    printf '%s\n' "$CODEX_HOME"
    return
  fi

  if [[ -z "${HOME:-}" ]]; then
    die "CODEX_HOME is not set and HOME is unavailable; pass --codex-home PATH"
  fi

  printf '%s\n' "$HOME/.codex"
}

resolve_tsx_runner() {
  if command -v tsx >/dev/null 2>&1; then
    tsx_runner=(tsx)
    return
  fi

  if command -v npx >/dev/null 2>&1 && npx --no-install tsx --version >/dev/null 2>&1; then
    tsx_runner=(npx --no-install tsx)
    return
  fi

  echo "Missing tsx runner; refusing to auto-download npm packages during install." >&2
  echo "Install tsx explicitly or make it available through npx --no-install, then retry." >&2
  exit 1
}

run_tsx() {
  if [[ "${#tsx_runner[@]}" -eq 0 ]]; then
    resolve_tsx_runner
  fi
  "${tsx_runner[@]}" "$@"
}

codex_home="$(absolute_path "$(default_codex_home)")"
target_root="$codex_home/skills"
agents_template="$repo_root/templates/AGENTS.md"
config_template="$repo_root/templates/config.toml"
hooks_template="$repo_root/templates/hooks.json"
agents_target="$codex_home/AGENTS.md"
config_target="$codex_home/config.toml"
hooks_target="$codex_home/hooks.json"
agents_template_marker="<!-- generate-with-template:agents-md -->"
linked_count=0
replaced_count=0
already_count=0
legacy_removed_count=0
agents_action="skipped"
config_action="skipped"
hooks_action="skipped"

resolve_link_target() {
  local link_path="$1"
  local raw_target
  raw_target="$(readlink "$link_path")"

  if [[ "$raw_target" == /* ]]; then
    normalize_path "$raw_target"
  else
    normalize_path "$(dirname "$link_path")/$raw_target"
  fi
}

link_path() {
  local source="$1"
  local target="$2"
  local label="$3"
  local replaced=false

  if [[ -L "$target" ]]; then
    local raw_current_target
    local current_target
    raw_current_target="$(readlink "$target")"
    current_target="$(resolve_link_target "$target")"
    if [[ "$current_target" == "$source" ]]; then
      already_count=$((already_count + 1))
      log "Already installed: $label -> $source"
      return
    fi

    local legacy_top_level_source="$repo_root/$label"
    local legacy_skill_dir_source="$source_skill_root/$label"
    local legacy_skillset_source=""
    if [[ "$label" == "alpha-goal" ]]; then
      legacy_skillset_source="$source_skill_root"
    fi
    if [[ "$current_target" == "$legacy_top_level_source" || "$current_target" == "$legacy_skill_dir_source" || ( -n "$legacy_skillset_source" && "$current_target" == "$legacy_skillset_source" ) ]]; then
      rm "$target"
      replaced=true
    elif [[ "$force" == true ]]; then
      rm "$target"
      replaced=true
    else
      echo "Refusing to replace existing symlink: $target -> $raw_current_target" >&2
      echo "Re-run with --force to replace symlinks." >&2
      exit 1
    fi
  elif [[ -e "$target" ]]; then
    echo "Refusing to replace existing non-symlink path: $target" >&2
    exit 1
  fi

  ln -s "$source" "$target"
  if [[ "$replaced" == true ]]; then
    replaced_count=$((replaced_count + 1))
    log "Replaced: $label -> $source"
  else
    linked_count=$((linked_count + 1))
    log "Installed: $label -> $source"
  fi
}

remove_legacy_support_link() {
  local support_name="$1"
  local legacy_source="$repo_root/$support_name"
  local target="$target_root/$support_name"

  if [[ ! -L "$target" ]]; then
    return
  fi

  local current_target
  current_target="$(resolve_link_target "$target")"
  if [[ "$current_target" == "$legacy_source" ]]; then
    rm "$target"
    legacy_removed_count=$((legacy_removed_count + 1))
    log "Removed legacy support link: $target"
  fi
}

remove_obsolete_skill_link() {
  local skill_name="$1"
  local target="$target_root/$skill_name"

  if [[ ! -L "$target" ]]; then
    return
  fi

  local current_target
  current_target="$(resolve_link_target "$target")"
  if [[ "$current_target" == "$source_skill_root/$skill_name" || "$current_target" == "$repo_root/$skill_name" ]]; then
    rm "$target"
    legacy_removed_count=$((legacy_removed_count + 1))
    log "Removed obsolete skill link: $target"
  fi
}

validate_installed_links() {
  local failed=false
  for skill_file in "${skill_files[@]}"; do
    local skill_dir skill_name target current_target
    skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
    skill_name="$(basename "$skill_dir")"
    target="$target_root/$skill_name"
    if [[ ! -L "$target" ]]; then
      echo "Installed skill is not a symlink: $target" >&2; failed=true; continue
    fi
    current_target="$(resolve_link_target "$target")"
    if [[ "$current_target" != "$skill_dir" ]]; then
      echo "Installed skill points elsewhere: $target -> $current_target" >&2; failed=true
    fi
    if [[ ! -f "$target/SKILL.md" ]]; then
      echo "Installed skill is missing top-level SKILL.md: $target" >&2; failed=true
    fi
  done
  for support_name in adapters tools templates scripts; do
    local target="$target_root/$support_name" legacy_source="$repo_root/$support_name"
    if [[ -L "$target" && "$(resolve_link_target "$target")" == "$legacy_source" ]]; then
      echo "Support directory should not be installed as a skill: $target" >&2; failed=true
    fi
  done
  if [[ "$failed" == true ]]; then exit 1; fi
  log "Validated installed direct skill links in $target_root"
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
    agents_action="created"
    log "Created AGENTS.md from template: $agents_target"
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
    agents_action="updated"
    log "Injected AGENTS template into $agents_target"
    return
  fi

  local result
  result="$(python3 - "$agents_template" "$agents_target" "$agents_template_marker" <<'PY'
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
    print("current")
else:
    target_path.write_text(updated)
    print("updated")
PY
)"

  case "$result" in
    current)
      agents_action="current"
      log "AGENTS.md already has current managed template content: $agents_target"
      ;;
    updated)
      agents_action="updated"
      log "Updated managed AGENTS template content in $agents_target"
      ;;
    *)
      die "Unexpected AGENTS template merge result: $result"
      ;;
  esac
}

sync_config_template() {
  if [[ -e "$config_target" && ! -f "$config_target" ]]; then
    echo "Refusing to write config template into non-file path: $config_target" >&2
    exit 1
  fi

  if [[ ! -f "$config_target" ]]; then
    cp "$config_template" "$config_target"
    config_action="created"
    log "Created config.toml from template: $config_target"
    return
  fi

  local result
  result="$(python3 - "$config_template" "$config_target" <<'PY'
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
    print("current")
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
print(f"updated:{len(missing)}")
PY
)"

  case "$result" in
    current)
      config_action="current"
      log "config.toml already contains template settings: $config_target"
      ;;
    updated:*)
      config_action="updated"
      log "Added ${result#updated:} config setting(s) into $config_target"
      ;;
    *)
      die "Unexpected config template merge result: $result"
      ;;
  esac
}

sync_hooks_template() {
  if [[ -e "$hooks_target" && ! -f "$hooks_target" ]]; then
    echo "Refusing to write hooks into non-file path: $hooks_target" >&2
    exit 1
  fi

  if [[ ! -f "$hooks_template" ]]; then
    echo "No hooks template found at $hooks_template" >&2
    exit 1
  fi

  local result
  result="$(python3 - "$hooks_target" "$hooks_template" "$config_target" <<'PY'
from __future__ import annotations

import json
import re
import shutil
import sys
import tomllib
from datetime import datetime
from pathlib import Path

hooks_path = Path(sys.argv[1])
template_path = Path(sys.argv[2])
config_path = Path(sys.argv[3])
MARKER_RE = re.compile(r"codex-[A-Za-z0-9_.:-]+:v\d+")


def load_json(path: Path, *, empty_default: dict | None = None) -> dict:
    if empty_default is not None and (not path.exists() or not path.read_text(encoding="utf-8").strip()):
        return empty_default
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON in {path}: {exc}", file=sys.stderr)
        raise SystemExit(1)
    if not isinstance(data, dict):
        print(f"{path} must contain a JSON object", file=sys.stderr)
        raise SystemExit(1)
    return data


def validate_hooks_object(data: dict, path: Path) -> dict:
    hooks = data.setdefault("hooks", {})
    if not isinstance(hooks, dict):
        print(f"{path}: top-level hooks field must be a JSON object", file=sys.stderr)
        raise SystemExit(1)
    for event, groups in hooks.items():
        if not isinstance(event, str) or not isinstance(groups, list):
            print(f"{path}: hooks.{event} must be a JSON array", file=sys.stderr)
            raise SystemExit(1)
    return hooks


def collect_template_markers(data: dict) -> set[str]:
    text = json.dumps(data, ensure_ascii=False)
    markers = set(MARKER_RE.findall(text))
    if not markers:
        print(f"{template_path}: hooks template must include at least one codex managed marker", file=sys.stderr)
        raise SystemExit(1)
    return markers


def warn_if_hooks_disabled(path: Path) -> None:
    if not path.exists() or not path.read_text(encoding="utf-8").strip():
        return
    try:
        data = tomllib.loads(path.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as exc:
        print(f"Warning: cannot inspect hooks feature in {path}: {exc}", file=sys.stderr)
        return
    features = data.get("features", {})
    if isinstance(features, dict) and features.get("hooks") is False:
        print(
            f"Warning: installed {hooks_path}, but [features].hooks is false in {path}; Codex will not run user hooks until hooks are enabled.",
            file=sys.stderr,
        )


def group_contains_marker(group: object, markers: set[str]) -> bool:
    return any(marker in json.dumps(group, ensure_ascii=False) for marker in markers)


def remove_template_managed_hooks(hooks: dict, markers: set[str]) -> int:
    removed = 0
    for event, groups in list(hooks.items()):
        cleaned_groups = []
        for group in groups:
            if not isinstance(group, dict) or not group_contains_marker(group, markers):
                cleaned_groups.append(group)
                continue

            group_hooks = group.get("hooks")
            if not isinstance(group_hooks, list):
                removed += 1
                continue

            next_group_hooks = []
            for hook in group_hooks:
                if group_contains_marker(hook, markers):
                    removed += 1
                else:
                    next_group_hooks.append(hook)

            if next_group_hooks:
                next_group = dict(group)
                next_group["hooks"] = next_group_hooks
                cleaned_groups.append(next_group)
        hooks[event] = cleaned_groups
    return removed


def merge_template_hooks(target_hooks: dict, template_hooks: dict) -> None:
    for event, groups in template_hooks.items():
        target_hooks.setdefault(event, [])
        if not isinstance(target_hooks[event], list):
            print(f"{hooks_path}: hooks.{event} must be a JSON array", file=sys.stderr)
            raise SystemExit(1)
        target_hooks[event].extend(groups)


def main() -> None:
    hooks_path.parent.mkdir(parents=True, exist_ok=True)
    data = load_json(hooks_path, empty_default={"hooks": {}})
    template_data = load_json(template_path)
    hooks = validate_hooks_object(data, hooks_path)
    template_hooks = validate_hooks_object(template_data, template_path)
    markers = collect_template_markers(template_data)

    remove_template_managed_hooks(hooks, markers)
    merge_template_hooks(hooks, template_hooks)

    new_text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    old_text = hooks_path.read_text(encoding="utf-8") if hooks_path.exists() else ""
    if old_text == new_text:
        warn_if_hooks_disabled(config_path)
        print("current")
        return

    existed = hooks_path.exists()
    backup_path = ""
    if existed:
        stamp = datetime.now().strftime("%Y%m%d%H%M%S")
        backup = hooks_path.with_name(f"{hooks_path.name}.bak-{stamp}")
        shutil.copy2(hooks_path, backup)
        backup_path = str(backup)

    tmp_path = hooks_path.with_name(f"{hooks_path.name}.tmp")
    tmp_path.write_text(new_text, encoding="utf-8")
    tmp_path.replace(hooks_path)
    warn_if_hooks_disabled(config_path)
    print(f"updated:{backup_path}" if existed else "created")


main()
PY
)"

  case "$result" in
    current)
      hooks_action="current"
      log "hooks.json already has current hooks template content: $hooks_target"
      ;;
    created)
      hooks_action="created"
      log "Created hooks.json from template: $hooks_target"
      ;;
    updated:*)
      hooks_action="updated"
      if [[ -n "${result#updated:}" ]]; then
        log "Backed up hooks.json: ${result#updated:}"
      fi
      log "Updated hooks.json from template: $hooks_target"
      ;;
    *)
      die "Unexpected hook template sync result: $result"
      ;;
  esac
}

run_skillset_validation() {
  if [[ ! -f "$validation_tool" ]]; then
    echo "Missing validation tool: $validation_tool" >&2
    exit 1
  fi

  if [[ "$verbose" == true ]]; then
    run_tsx "$validation_tool" "$repo_root"
    return
  fi

  local output
  if ! output="$(run_tsx "$validation_tool" "$repo_root" 2>&1)"; then
    echo "Validation failed ($validation_tool_label). Re-run with --verbose for full output." >&2
    printf '%s\n' "$output" | grep -E '^(ERRORS:|- |FAIL )' >&2 || true
    exit 1
  fi
}

print_summary() {
  local status="ready"
  if [[ "$linked_count" -gt 0 || "$replaced_count" -gt 0 || "$legacy_removed_count" -gt 0 ]]; then
    status="installed"
  fi
  if [[ "$sync_user_templates" == true && ( "$agents_action" != "current" || "$config_action" != "current" ) ]]; then
    status="installed"
  fi
  if [[ "$sync_user_hooks" == true && "$hooks_action" != "current" ]]; then
    status="installed"
  fi

  echo "Alpha Goal skills $status: $installed -> $target_root"
  echo "Codex home: $codex_home"
  echo "Validation: passed ($validation_tool_label)"
  if [[ "$sync_user_templates" == true ]]; then
    echo "User templates: AGENTS.md $agents_action, config.toml $config_action"
  else
    echo "User templates: skipped (--no-sync-user-templates)"
  fi
  if [[ "$sync_user_hooks" == true ]]; then
    echo "User hooks: hooks.json $hooks_action"
  else
    echo "User hooks: skipped (--no-sync-user-hooks)"
  fi
}

if [[ "$sync_user_templates" == true ]]; then
  if [[ ! -f "$agents_template" ]]; then
    echo "No AGENTS template found at $agents_template" >&2
    exit 1
  fi

  if [[ ! -f "$config_template" ]]; then
    echo "No config template found at $config_template" >&2
    exit 1
  fi
fi

run_skillset_validation

required_skills=(alpha-goal control-loop evidence-verify)
skill_files=()
for skill_name in "${required_skills[@]}"; do
  skill_file="$source_skill_root/$skill_name/SKILL.md"
  if [[ ! -f "$skill_file" ]]; then
    echo "Missing required skill: $skill_file" >&2
    exit 1
  fi
  skill_files+=("$skill_file")
done

shopt -s nullglob
discovered_skill_files=("$source_skill_root"/*/SKILL.md)
shopt -u nullglob
if [[ "${#discovered_skill_files[@]}" -ne "${#required_skills[@]}" ]]; then
  echo "Unexpected skill set under $source_skill_root; run $validation_tool_label for details." >&2
  exit 1
fi

mkdir -p "$codex_home" "$target_root"

if [[ "$sync_user_templates" == true ]]; then
  inject_agents_template
  sync_config_template
else
  log "Skipped user template sync due to --no-sync-user-templates"
fi

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

for obsolete_skill in goal-contract system-model decision-synthesis control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review goal-verify; do
  remove_obsolete_skill_link "$obsolete_skill"
done

validate_installed_links

if [[ "$sync_user_hooks" == true ]]; then
  sync_hooks_template
else
  log "Skipped user hook sync due to --no-sync-user-hooks"
fi

print_summary
