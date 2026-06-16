#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法: scripts/install.sh [--codex-home PATH] [--force] [--no-sync-user-templates] [--verbose]

安装本仓库的 skills/ 目录：在 ${CODEX_HOME:-$HOME/.codex}/skills 下
创建一个 alpha-goal 软链接。

默认会把 templates/AGENTS.md 合并到用户级 AGENTS.md，
并用 templates/config.toml 补齐 config.toml 中缺失的设置。
使用 --no-sync-user-templates 可跳过用户级模板同步。

选项:
  --codex-home PATH
            安装到 PATH，而不是 ${CODEX_HOME:-$HOME/.codex}。
  --force   替换指向其他位置的既有软链接。不会删除真实文件或目录。
  --no-sync-user-templates
            不用 templates/ 更新 Codex 主目录下的 AGENTS.md 和 config.toml。
  --sync-user-templates
            兼容选项；用户模板默认已经同步。
  --verbose 打印详细安装和校验输出。
EOF
}

die() {
  echo "$*" >&2
  exit 1
}

force=false
verbose=false
sync_user_templates=true
codex_home_arg=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --codex-home)
      shift
      if [[ $# -eq 0 ]]; then
        die "缺少 --codex-home 的取值"
      fi
      codex_home_arg="$1"
      shift
      ;;
    --codex-home=*)
      codex_home_arg="${1#*=}"
      if [[ -z "$codex_home_arg" ]]; then
        die "缺少 --codex-home 的取值"
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
    --verbose)
      verbose=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知选项: $1" >&2
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
install_link_name="alpha-goal"
install_source="$source_skill_root"
validation_tool="$repo_root/tools/validate_skills.ts"
validation_tool_label="tools/validate_skills.ts"

normalize_path() {
  python3 - "$1" <<'PY'
import sys
from pathlib import Path

raw_path = sys.argv[1]
if not raw_path:
    print("空路径无效", file=sys.stderr)
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
    print("空路径无效", file=sys.stderr)
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
    die "未设置 CODEX_HOME，且 HOME 不可用；请传入 --codex-home PATH"
  fi

  printf '%s\n' "$HOME/.codex"
}

codex_home="$(absolute_path "$(default_codex_home)")"
target_root="$codex_home/skills"
agents_template="$repo_root/templates/AGENTS.md"
config_template="$repo_root/templates/config.toml"
agents_target="$codex_home/AGENTS.md"
config_target="$codex_home/config.toml"
agents_template_marker="<!-- generate-with-template:agents-md -->"
linked_count=0
replaced_count=0
already_count=0
legacy_removed_count=0
agents_action="skipped"
config_action="skipped"

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
      log "已安装，无需变更: $label -> $source"
      return
    fi

    local legacy_top_level_source="$repo_root/$label"
    local legacy_skill_dir_source="$source_skill_root/$label"
    if [[ "$current_target" == "$legacy_top_level_source" || "$current_target" == "$legacy_skill_dir_source" ]]; then
      rm "$target"
      replaced=true
    elif [[ "$force" == true ]]; then
      rm "$target"
      replaced=true
    else
      echo "拒绝替换既有软链接: $target -> $raw_current_target" >&2
      echo "如需替换软链接，请重新运行并加上 --force。" >&2
      exit 1
    fi
  elif [[ -e "$target" ]]; then
    echo "拒绝替换既有非软链接路径: $target" >&2
    exit 1
  fi

  ln -s "$source" "$target"
  if [[ "$replaced" == true ]]; then
    replaced_count=$((replaced_count + 1))
    log "已替换: $label -> $source"
  else
    linked_count=$((linked_count + 1))
    log "已安装: $label -> $source"
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
    log "已清理旧支持链接: $target"
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
    log "已清理旧技能链接: $target"
  fi
}

preflight_install_targets() {
  local target="$target_root/$install_link_name"

  if [[ -L "$target" ]]; then
    local current_target
    current_target="$(resolve_link_target "$target")"
    local legacy_top_level_source="$repo_root/$install_link_name"
    local legacy_skill_dir_source="$source_skill_root/$install_link_name"
    if [[ "$current_target" == "$install_source" || "$current_target" == "$legacy_top_level_source" || "$current_target" == "$legacy_skill_dir_source" || "$force" == true ]]; then
      return
    fi
    echo "拒绝替换既有软链接: $target -> $(readlink "$target")" >&2
    echo "如需替换软链接，请重新运行并加上 --force。" >&2
    exit 1
  elif [[ -e "$target" ]]; then
    echo "拒绝替换既有非软链接路径: $target" >&2
    exit 1
  fi
}

validate_installed_links() {
  local failed=false
  local target="$target_root/$install_link_name"

  if [[ ! -L "$target" ]]; then
    echo "已安装技能套件不是软链接: $target" >&2
    failed=true
  else
    local current_target
    current_target="$(resolve_link_target "$target")"
    if [[ "$current_target" != "$install_source" ]]; then
      echo "已安装技能套件指向了其他位置: $target -> $current_target" >&2
      failed=true
    fi
  fi

  for skill_file in "${skill_files[@]}"; do
    local skill_dir
    skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
    local skill_name
    skill_name="$(basename "$skill_dir")"

    if [[ ! -f "$target/$skill_name/SKILL.md" ]]; then
      echo "已安装技能套件通过软链接访问不到 $skill_name/SKILL.md: $target" >&2
      failed=true
      continue
    fi

    local direct_target="$target_root/$skill_name"
    if [[ "$skill_name" == "$install_link_name" || ! -L "$direct_target" ]]; then
      continue
    fi

    local direct_current_target
    direct_current_target="$(resolve_link_target "$direct_target")"
    if [[ "$direct_current_target" == "$skill_dir" || "$direct_current_target" == "$repo_root/$skill_name" ]]; then
      echo "必需技能应通过 $install_link_name 安装，不应作为同仓库直接链接安装: $direct_target" >&2
      failed=true
    fi
  done

  for support_name in adapters tools templates scripts; do
    local target="$target_root/$support_name"
    local legacy_source="$repo_root/$support_name"

    if [[ -L "$target" && "$(resolve_link_target "$target")" == "$legacy_source" ]]; then
      echo "支持目录不应作为技能安装: $target" >&2
      failed=true
    fi
  done

  if [[ "$failed" == true ]]; then
    exit 1
  fi

  log "已校验安装后的技能套件链接: $target_root"
}

inject_agents_template() {
  local template_content
  template_content="$(<"$agents_template")"

  if [[ -e "$agents_target" && ! -f "$agents_target" ]]; then
    echo "拒绝把 AGENTS 模板写入非文件路径: $agents_target" >&2
    exit 1
  fi

  if [[ "$template_content" != *"$agents_template_marker"* ]]; then
    echo "AGENTS 模板缺少必需标记: $agents_template_marker" >&2
    exit 1
  fi

  if [[ ! -f "$agents_target" ]]; then
    cp "$agents_template" "$agents_target"
    agents_action="created"
    log "已从模板创建 AGENTS.md: $agents_target"
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
    log "已注入 AGENTS 模板: $agents_target"
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
    print(f"AGENTS 模板无效: {template_path}", file=sys.stderr)
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
        f"拒绝更新 {target_path}: 找到标记，但未找到受管理模板块",
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
      log "AGENTS.md 受管理模板已是最新: $agents_target"
      ;;
    updated)
      agents_action="updated"
      log "已更新 AGENTS.md 受管理模板: $agents_target"
      ;;
    *)
      die "AGENTS 模板合并结果异常: $result"
      ;;
  esac
}

sync_config_template() {
  if [[ -e "$config_target" && ! -f "$config_target" ]]; then
    echo "拒绝把 config 模板写入非文件路径: $config_target" >&2
    exit 1
  fi

  if [[ ! -f "$config_target" ]]; then
    cp "$config_template" "$config_target"
    config_action="created"
    log "已从模板创建 config.toml: $config_target"
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
    print(f"模板中存在不支持的 TOML 值类型: {type(value).__name__}", file=sys.stderr)
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
            f"无法添加 {'.'.join(path)}: {'.'.join(conflict)} 已存在且不是表",
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
    print(f"拒绝写入合并后无效的 TOML {target_path}: {exc}", file=sys.stderr)
    raise SystemExit(1)

target_path.write_text(new_text)
print(f"updated:{len(missing)}")
PY
)"

  case "$result" in
    current)
      config_action="current"
      log "config.toml 已包含模板设置: $config_target"
      ;;
    updated:*)
      config_action="updated"
      log "已向 $config_target 补齐 ${result#updated:} 个配置项"
      ;;
    *)
      die "配置模板合并结果异常: $result"
      ;;
  esac
}

run_skillset_validation() {
  if [[ ! -f "$validation_tool" ]]; then
    echo "缺少校验工具: $validation_tool" >&2
    exit 1
  fi

  if [[ "$verbose" == true ]]; then
    npx --yes tsx "$validation_tool" "$repo_root"
    return
  fi

  local output
  if ! output="$(npx --yes tsx "$validation_tool" "$repo_root" 2>&1)"; then
    echo "校验失败 ($validation_tool_label)。如需完整输出，请加 --verbose 重新运行。" >&2
    printf '%s\n' "$output" | grep -E '^(错误:|ERRORS:|- |失败 |FAIL )' >&2 || true
    exit 1
  fi
}

action_label() {
  case "$1" in
    created)
      printf '已创建'
      ;;
    updated)
      printf '已更新'
      ;;
    current)
      printf '已是最新'
      ;;
    skipped)
      printf '已跳过'
      ;;
    *)
      printf '%s' "$1"
      ;;
  esac
}

print_summary() {
  local status="已就绪"
  if [[ "$linked_count" -gt 0 || "$replaced_count" -gt 0 || "$legacy_removed_count" -gt 0 ]]; then
    status="已安装"
  fi
  if [[ "$sync_user_templates" == true && ( "$agents_action" != "current" || "$config_action" != "current" ) ]]; then
    status="已安装"
  fi

  echo "Alpha Goal 技能套件$status: $installed -> $target_root"
  echo "Codex 主目录: $codex_home"
  echo "校验: 通过 ($validation_tool_label)"
  if [[ "$sync_user_templates" == true ]]; then
    echo "用户模板: AGENTS.md $(action_label "$agents_action")，config.toml $(action_label "$config_action")"
  else
    echo "用户模板: 已跳过 (--no-sync-user-templates)"
  fi
}

if [[ "$sync_user_templates" == true ]]; then
  if [[ ! -f "$agents_template" ]]; then
    echo "未找到 AGENTS 模板: $agents_template" >&2
    exit 1
  fi

  if [[ ! -f "$config_template" ]]; then
    echo "未找到 config 模板: $config_template" >&2
    exit 1
  fi
fi

run_skillset_validation

required_skills=(alpha-goal system-model control-loop evidence-verify)
skill_files=()
for skill_name in "${required_skills[@]}"; do
  skill_file="$source_skill_root/$skill_name/SKILL.md"
  if [[ ! -f "$skill_file" ]]; then
    echo "缺少必需技能: $skill_file" >&2
    exit 1
  fi
  skill_files+=("$skill_file")
done

shopt -s nullglob
discovered_skill_files=("$source_skill_root"/*/SKILL.md)
shopt -u nullglob
if [[ "${#discovered_skill_files[@]}" -ne "${#required_skills[@]}" ]]; then
  echo "$source_skill_root 下的技能集合不符合预期；请运行 $validation_tool_label 查看详情。" >&2
  exit 1
fi

mkdir -p "$codex_home" "$target_root"
preflight_install_targets

if [[ "$sync_user_templates" == true ]]; then
  inject_agents_template
  sync_config_template
else
  log "已按 --no-sync-user-templates 跳过用户模板同步"
fi

installed=0
link_path "$install_source" "$target_root/$install_link_name" "$install_link_name"
installed=1

for support_name in adapters tools templates scripts; do
  remove_legacy_support_link "$support_name"
done

for skill_name in "${required_skills[@]}"; do
  if [[ "$skill_name" == "$install_link_name" ]]; then
    continue
  fi
  remove_obsolete_skill_link "$skill_name"
done

for obsolete_skill in control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review goal-verify; do
  remove_obsolete_skill_link "$obsolete_skill"
done

validate_installed_links

print_summary
