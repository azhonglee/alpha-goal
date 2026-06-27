#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--target global|codex|claude] [--codex-home PATH] [--force] [--no-sync-user-templates] [--no-sync-user-hooks] [--verbose]

Install this repository's public skill directories as direct symlinks
under $HOME/.agents/skills.

When no target is passed, interactive terminals are prompted to choose a
configuration target. Non-interactive runs default to the codex target.

The global target syncs Codex and Claude configuration. The codex target syncs
Codex AGENTS.md, config.toml, and hooks.json. The claude target syncs Claude
CLAUDE.md. All targets install skills into $HOME/.agents/skills.
Use --no-sync-user-templates to skip user-level template updates.
Use --no-sync-user-hooks to skip Codex hook updates.

Options:
  --target TARGET
            Select configuration target: global, codex, or claude.
  --codex-home PATH
            Sync Codex configuration into PATH instead of
            ${CODEX_HOME:-$HOME/.codex}. Skills still install into
            $HOME/.agents/skills.
  --force   Replace existing symlinks that point elsewhere. Real files or
            directories are never removed.
  --no-sync-user-templates
            Skip updating Codex AGENTS.md/config.toml and Claude CLAUDE.md
            from templates/.
  --sync-user-templates
            Compatibility no-op; user templates are synced by default.
  --no-sync-user-hooks
            Skip updating Codex home hooks.json.
  --sync-user-hooks
            Compatibility no-op; user hooks are synced by default.
  --verbose Print detailed install output.
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
install_target_arg=""

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
    --target)
      shift
      if [[ $# -eq 0 ]]; then
        die "Missing value for --target"
      fi
      install_target_arg="$1"
      shift
      ;;
    --target=*)
      install_target_arg="${1#*=}"
      if [[ -z "$install_target_arg" ]]; then
        die "Missing value for --target"
      fi
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

require_node_runtime() {
  if ! command -v node >/dev/null 2>&1; then
    die "Node.js 18+ is required to sync config.toml or hooks.json; rerun with --no-sync-user-templates --no-sync-user-hooks to skip those updates."
  fi

  local major
  major="$(node -p 'Number(process.versions.node.split(".")[0])')"
  if [[ "$major" -lt 18 ]]; then
    die "Node.js 18+ is required to sync config.toml or hooks.json; found $(node -v)."
  fi

  if [[ ! -f "$repo_root/vendor/smol-toml/dist/index.cjs" ]]; then
    die "Missing vendored TOML parser: $repo_root/vendor/smol-toml/dist/index.cjs"
  fi
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"
source_skill_root="$repo_root/skills"

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

default_skills_root() {
  if [[ -z "${HOME:-}" ]]; then
    die "HOME is unavailable; cannot resolve \$HOME/.agents/skills"
  fi

  printf '%s\n' "$HOME/.agents/skills"
}

default_claude_home() {
  if [[ -z "${HOME:-}" ]]; then
    die "HOME is unavailable; cannot resolve \$HOME/.claude"
  fi

  printf '%s\n' "$HOME/.claude"
}

validate_install_target() {
  case "$1" in
    global|codex|claude)
      ;;
    *)
      die "Invalid --target value: $1 (expected global, codex, or claude)"
      ;;
  esac
}

prompt_install_target() {
  local choice
  while true; do
    cat >&2 <<'EOF'
Select configuration target:
  1. global (Codex + Claude)
  2. codex
  3. claude
EOF
    printf 'Enter choice [1-3]: ' >&2
    IFS= read -r choice
    case "$choice" in
      1|global)
        printf '%s\n' "global"
        return
        ;;
      2|codex)
        printf '%s\n' "codex"
        return
        ;;
      3|claude)
        printf '%s\n' "claude"
        return
        ;;
      *)
        echo "Invalid choice: $choice" >&2
        ;;
    esac
  done
}

resolve_install_target() {
  if [[ -n "$install_target_arg" ]]; then
    validate_install_target "$install_target_arg"
    printf '%s\n' "$install_target_arg"
    return
  fi

  if [[ -t 0 ]]; then
    prompt_install_target
    return
  fi

  printf '%s\n' "codex"
}

install_target="$(resolve_install_target)"
sync_codex_config=false
sync_claude_config=false
case "$install_target" in
  global)
    sync_codex_config=true
    sync_claude_config=true
    ;;
  codex)
    sync_codex_config=true
    ;;
  claude)
    sync_claude_config=true
    ;;
esac

codex_home="$(absolute_path "$(default_codex_home)")"
target_root="$(absolute_path "$(default_skills_root)")"
claude_home="$(absolute_path "$(default_claude_home)")"
agents_template="$repo_root/templates/AGENTS.md"
claude_template="$repo_root/templates/CLAUDE.md"
config_template="$repo_root/templates/config.toml"
hooks_template="$repo_root/templates/hooks.json"
agents_target="$codex_home/AGENTS.md"
claude_target="$claude_home/CLAUDE.md"
config_target="$codex_home/config.toml"
hooks_target="$codex_home/hooks.json"
legacy_codex_skill_root="$codex_home/skills"
agents_template_marker="<!-- generate-with-template:agents-md -->"
claude_template_marker="<!-- generate-with-template:claude-md -->"
linked_count=0
replaced_count=0
already_count=0
legacy_removed_count=0
agents_action="skipped"
claude_action="skipped"
config_action="skipped"
hooks_action="skipped"

if [[ "$sync_codex_config" == true && ( "$sync_user_templates" == true || "$sync_user_hooks" == true ) ]]; then
  require_node_runtime
fi

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

remove_legacy_support_link_from_root() {
  local root="$1"
  local support_name="$2"
  local legacy_source="$repo_root/$support_name"
  local target="$root/$support_name"

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

remove_legacy_support_link() {
  remove_legacy_support_link_from_root "$target_root" "$1"
}

remove_same_repo_skill_link_from_root() {
  local root="$1"
  local skill_name="$2"
  local target="$root/$skill_name"

  if [[ ! -L "$target" ]]; then
    return
  fi

  local current_target
  current_target="$(resolve_link_target "$target")"
  local legacy_skillset_source=""
  if [[ "$skill_name" == "alpha-goal" ]]; then
    legacy_skillset_source="$source_skill_root"
  fi
  if [[ "$current_target" == "$source_skill_root/$skill_name" || "$current_target" == "$repo_root/$skill_name" || ( -n "$legacy_skillset_source" && "$current_target" == "$legacy_skillset_source" ) ]]; then
    rm "$target"
    legacy_removed_count=$((legacy_removed_count + 1))
    log "Removed obsolete skill link: $target"
  fi
}

remove_obsolete_skill_link() {
  remove_same_repo_skill_link_from_root "$target_root" "$1"
}

remove_legacy_codex_skill_links() {
  if [[ "$legacy_codex_skill_root" == "$target_root" || ! -d "$legacy_codex_skill_root" ]]; then
    return
  fi

  for skill_name in "${required_skills[@]}"; do
    remove_same_repo_skill_link_from_root "$legacy_codex_skill_root" "$skill_name"
  done

  for support_name in adapters tools templates scripts; do
    remove_legacy_support_link_from_root "$legacy_codex_skill_root" "$support_name"
  done

  for obsolete_skill in evidence-verify goal-contract system-model decision-synthesis control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review; do
    remove_same_repo_skill_link_from_root "$legacy_codex_skill_root" "$obsolete_skill"
  done
}

markdown_template_action=""

sync_markdown_template() {
  local template_path="$1"
  local target_path="$2"
  local marker="$3"
  local label="$4"
  local template_content
  template_content="$(<"$template_path")"
  markdown_template_action=""

  if [[ -e "$target_path" && ! -f "$target_path" ]]; then
    echo "Refusing to write $label template into non-file path: $target_path" >&2
    exit 1
  fi

  if [[ "$template_content" != *"$marker"* ]]; then
    echo "$label template is missing required marker: $marker" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$target_path")"

  if [[ ! -f "$target_path" ]]; then
    cp "$template_path" "$target_path"
    markdown_template_action="created"
    log "Created $label from template: $target_path"
    return
  fi

  local existing_content
  existing_content="$(<"$target_path")"

  if [[ "$existing_content" != *"$marker"* ]]; then
    {
      if [[ -s "$target_path" ]]; then
        printf '\n\n'
      fi
      cat "$template_path"
    } >>"$target_path"
    markdown_template_action="updated"
    log "Injected $label template into $target_path"
    return
  fi

  local result
  result="$(python3 - "$template_path" "$target_path" "$marker" <<'PY'
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
      markdown_template_action="current"
      log "$label already has current managed template content: $target_path"
      ;;
    updated)
      markdown_template_action="updated"
      log "Updated managed $label template content in $target_path"
      ;;
    *)
      die "Unexpected $label template merge result: $result"
      ;;
  esac
}

inject_agents_template() {
  sync_markdown_template "$agents_template" "$agents_target" "$agents_template_marker" "AGENTS.md"
  agents_action="$markdown_template_action"
}

inject_claude_template() {
  sync_markdown_template "$claude_template" "$claude_target" "$claude_template_marker" "CLAUDE.md"
  claude_action="$markdown_template_action"
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
  result="$(node - "$repo_root/vendor/smol-toml/dist/index.cjs" "$config_template" "$config_target" <<'JS'
const fs = require("node:fs");
const path = require("node:path");

const [tomlPath, templateArg, targetArg] = process.argv.slice(2);
const toml = require(tomlPath);
const HEADER_RE = /^\s*\[([A-Za-z0-9_.-]+)\]\s*(?:#.*)?$/;

function loadToml(file) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.trim()) return {};
  try {
    return toml.parse(text);
  } catch (error) {
    console.error(`Invalid TOML in ${file}: ${error.message}`);
    process.exit(1);
  }
}

function flatten(value, prefix = []) {
  if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
    return Object.entries(value).flatMap(([key, child]) => flatten(child, [...prefix, key]));
  }
  return [[prefix, value]];
}

function hasPath(data, keys) {
  let current = data;
  for (const key of keys) {
    if (!current || typeof current !== "object" || !(key in current)) return false;
    current = current[key];
  }
  return true;
}

function parentConflict(data, keys) {
  let current = data;
  const checked = [];
  for (const key of keys.slice(0, -1)) {
    if (!current || typeof current !== "object") return checked;
    if (!(key in current)) return null;
    current = current[key];
    checked.push(key);
    if (!current || typeof current !== "object" || Array.isArray(current)) return checked;
  }
  return null;
}

function tomlValue(value) {
  const rendered = toml.stringify({ value }).trim();
  return rendered.replace(/^value\s*=\s*/, "");
}

function collectTables(lines) {
  const headers = [];
  lines.forEach((line, index) => {
    const match = line.match(HEADER_RE);
    if (match) headers.push([index, match[1].split(".")]);
  });
  const blocks = new Map();
  headers.forEach(([index, tablePath], offset) => {
    const end = offset + 1 < headers.length ? headers[offset + 1][0] : lines.length;
    blocks.set(tablePath.join("."), [index, end]);
  });
  return { blocks, firstTable: headers.length ? headers[0][0] : lines.length };
}

const templateData = loadToml(templateArg);
const targetData = loadToml(targetArg);
const missing = [];
for (const [keys, value] of flatten(templateData)) {
  if (hasPath(targetData, keys)) continue;
  const conflict = parentConflict(targetData, keys);
  if (conflict) {
    console.error(`Cannot add ${keys.join(".")}: non-table value exists at ${conflict.join(".")}`);
    process.exit(1);
  }
  missing.push([keys, value]);
}

if (!missing.length) {
  console.log("current");
  process.exit(0);
}

const groups = new Map();
for (const [keys, value] of missing) {
  const parent = keys.slice(0, -1).join(".");
  const items = groups.get(parent) || [];
  items.push([keys[keys.length - 1], value]);
  groups.set(parent, items);
}

let lines = fs.readFileSync(targetArg, "utf8").split(/(?<=\n)/);
lines = lines.map(line => line && !line.endsWith("\n") ? `${line}\n` : line);
const { blocks, firstTable } = collectTables(lines);
const insertions = [];
const appends = [];

for (const [parent, items] of groups) {
  const additions = items.map(([key, value]) => `${key} = ${tomlValue(value)}\n`);
  if (!parent) {
    if (firstTable < lines.length) additions.push("\n");
    insertions.push([firstTable, additions]);
  } else if (blocks.has(parent)) {
    insertions.push([blocks.get(parent)[1], additions]);
  } else {
    appends.push([parent, additions]);
  }
}

for (const [index, additions] of insertions.sort((a, b) => b[0] - a[0])) {
  lines.splice(index, 0, ...additions);
}
for (const [parent, additions] of appends) {
  if (lines.length && lines[lines.length - 1].trim()) lines.push("\n");
  lines.push(`[${parent}]\n`, ...additions);
}

const newText = lines.join("");
try {
  if (newText.trim()) toml.parse(newText);
} catch (error) {
  console.error(`Refusing to write invalid merged TOML for ${targetArg}: ${error.message}`);
  process.exit(1);
}

fs.writeFileSync(targetArg, newText);
console.log(`updated:${missing.length}`);
JS
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
  result="$(node - "$hooks_target" "$hooks_template" "$config_target" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const path = require("node:path");

const [hooksArg, templateArg, configArg, tomlPath] = process.argv.slice(2);
const toml = require(tomlPath);
const MANAGED_MARKER_RE = /^: 'codex-alpha-goal-compact-recovery:v[0-9]+';/;
const LEGACY_MANAGED_MARKER_RE = /(^|[\s;'"])codex-compact-skill-recovery(?::v[0-9]+)?($|[\s;'"])/;

function loadJson(file, emptyDefault) {
  if (emptyDefault && (!fs.existsSync(file) || !fs.readFileSync(file, "utf8").trim())) return emptyDefault;
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("top-level value must be an object");
    return data;
  } catch (error) {
    console.error(`Invalid JSON in ${file}: ${error.message}`);
    process.exit(1);
  }
}

function validateHooksObject(data, file) {
  if (!data.hooks) data.hooks = {};
  if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) {
    console.error(`${file}: top-level hooks field must be a JSON object`);
    process.exit(1);
  }
  for (const [event, groups] of Object.entries(data.hooks)) {
    if (typeof event !== "string" || !Array.isArray(groups)) {
      console.error(`${file}: hooks.${event} must be a JSON array`);
      process.exit(1);
    }
  }
  return data.hooks;
}

function managedHook(hook) {
  if (!hook || typeof hook !== "object" || hook.type !== "command" || typeof hook.command !== "string") return false;
  const command = hook.command.trimStart();
  return MANAGED_MARKER_RE.test(command) || LEGACY_MANAGED_MARKER_RE.test(command);
}

function requireTemplateMarker(templateHooks) {
  for (const groups of Object.values(templateHooks)) {
    for (const group of groups) {
      for (const hook of group?.hooks || []) {
        if (hook?.type === "command" && MANAGED_MARKER_RE.test(String(hook.command || "").trimStart())) return;
      }
    }
  }
  console.error(`${templateArg}: hooks template must include a managed command marker`);
  process.exit(1);
}

function removeManagedHooks(hooks) {
  let removed = 0;
  for (const [event, groups] of Object.entries(hooks)) {
    const nextGroups = [];
    for (const group of groups) {
      if (!group || typeof group !== "object" || !Array.isArray(group.hooks)) {
        nextGroups.push(group);
        continue;
      }
      const nextHooks = [];
      for (const hook of group.hooks) {
        if (managedHook(hook)) {
          removed += 1;
        } else {
          nextHooks.push(hook);
        }
      }
      if (nextHooks.length) nextGroups.push({ ...group, hooks: nextHooks });
    }
    hooks[event] = nextGroups;
  }
  return removed;
}

function mergeTemplateHooks(targetHooks, templateHooks) {
  for (const [event, groups] of Object.entries(templateHooks)) {
    if (!targetHooks[event]) targetHooks[event] = [];
    if (!Array.isArray(targetHooks[event])) {
      console.error(`${hooksArg}: hooks.${event} must be a JSON array`);
      process.exit(1);
    }
    targetHooks[event].push(...groups);
  }
}

function resolveWritePath(hooksPath) {
  fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
  let is_symlink = false;
  try {
    is_symlink = fs.lstatSync(hooksPath).isSymbolicLink();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!is_symlink) return hooksPath;
  try {
    return fs.realpathSync(hooksPath);
  } catch (error) {
    console.error(`Refusing to write hooks into broken symlink: ${hooksPath}`);
    process.exit(1);
  }
}

function warnIfHooksDisabled(configPath) {
  if (!fs.existsSync(configPath) || !fs.readFileSync(configPath, "utf8").trim()) return;
  try {
    const data = toml.parse(fs.readFileSync(configPath, "utf8"));
    if (data?.features?.hooks === false) {
      console.error(`Warning: installed ${hooksArg}, but [features].hooks is false in ${configPath}; Codex will not run user hooks until hooks are enabled.`);
    }
  } catch (error) {
    console.error(`Warning: cannot inspect hooks feature in ${configPath}: ${error.message}`);
  }
}

const hooksPath = path.resolve(hooksArg);
const writePath = resolveWritePath(hooksPath);
const data = loadJson(writePath, { hooks: {} });
const templateData = loadJson(templateArg);
const hooks = validateHooksObject(data, writePath);
const templateHooks = validateHooksObject(templateData, templateArg);
requireTemplateMarker(templateHooks);
removeManagedHooks(hooks);
mergeTemplateHooks(hooks, templateHooks);

const newText = `${JSON.stringify(data, null, 2)}\n`;
const oldText = fs.existsSync(writePath) ? fs.readFileSync(writePath, "utf8") : "";
if (oldText === newText) {
  warnIfHooksDisabled(configArg);
  console.log("current");
  process.exit(0);
}

const existed = fs.existsSync(writePath);
let backupPath = "";
if (existed) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  backupPath = `${writePath}.bak-${stamp}`;
  fs.copyFileSync(writePath, backupPath);
}

const tmpPath = `${writePath}.tmp`;
fs.writeFileSync(tmpPath, newText);
fs.renameSync(tmpPath, writePath);
warnIfHooksDisabled(configArg);
console.log(existed ? `updated:${backupPath}` : "created");
JS
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

print_summary() {
  local status="ready"
  if [[ "$linked_count" -gt 0 || "$replaced_count" -gt 0 || "$legacy_removed_count" -gt 0 ]]; then
    status="installed"
  fi
  if [[ "$sync_codex_config" == true && "$sync_user_templates" == true && ( "$agents_action" != "current" || "$config_action" != "current" ) ]]; then
    status="installed"
  fi
  if [[ "$sync_claude_config" == true && "$sync_user_templates" == true && "$claude_action" != "current" ]]; then
    status="installed"
  fi
  if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true && "$hooks_action" != "current" ]]; then
    status="installed"
  fi

  echo "Alpha Goal skills $status: $installed -> $target_root"
  echo "Install target: $install_target"
  echo "Skills root: $target_root"
  if [[ "$sync_codex_config" == true ]]; then
    echo "Codex home: $codex_home"
  else
    echo "Codex config: skipped (--target $install_target)"
  fi
  if [[ "$sync_claude_config" == true ]]; then
    echo "Claude home: $claude_home"
  else
    echo "Claude config: skipped (--target $install_target)"
  fi
  if [[ "$sync_user_templates" == true ]]; then
    if [[ "$sync_codex_config" == true ]]; then
      echo "Codex templates: AGENTS.md $agents_action, config.toml $config_action"
    else
      echo "Codex templates: skipped (--target $install_target)"
    fi
    if [[ "$sync_claude_config" == true ]]; then
      echo "Claude templates: CLAUDE.md $claude_action"
    else
      echo "Claude templates: skipped (--target $install_target)"
    fi
  else
    echo "User templates: skipped (--no-sync-user-templates)"
  fi
  if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true ]]; then
    echo "User hooks: hooks.json $hooks_action"
  elif [[ "$sync_codex_config" == true ]]; then
    echo "User hooks: skipped (--no-sync-user-hooks)"
  else
    echo "User hooks: skipped (--target $install_target)"
  fi
}

if [[ "$sync_codex_config" == true && "$sync_user_templates" == true ]]; then
  if [[ ! -f "$agents_template" ]]; then
    echo "No AGENTS template found at $agents_template" >&2
    exit 1
  fi

  if [[ ! -f "$config_template" ]]; then
    echo "No config template found at $config_template" >&2
    exit 1
  fi
fi

if [[ "$sync_claude_config" == true && "$sync_user_templates" == true ]]; then
  if [[ ! -f "$claude_template" ]]; then
    echo "No CLAUDE template found at $claude_template" >&2
    exit 1
  fi
fi

required_skills=(alpha-goal control-loop goal-verify)
skill_files=()
for skill_name in "${required_skills[@]}"; do
  skill_file="$source_skill_root/$skill_name/SKILL.md"
  if [[ ! -f "$skill_file" ]]; then
    echo "Missing required skill: $skill_file" >&2
    exit 1
  fi
  skill_files+=("$skill_file")
done

mkdir -p "$target_root"

if [[ "$sync_codex_config" == true && "$sync_user_templates" == true ]]; then
  mkdir -p "$codex_home"
  inject_agents_template
  sync_config_template
elif [[ "$sync_codex_config" == true ]]; then
  log "Skipped Codex user template sync due to --no-sync-user-templates"
else
  log "Skipped Codex user template sync due to --target $install_target"
fi

if [[ "$sync_claude_config" == true && "$sync_user_templates" == true ]]; then
  mkdir -p "$claude_home"
  inject_claude_template
elif [[ "$sync_claude_config" == true ]]; then
  log "Skipped Claude user template sync due to --no-sync-user-templates"
else
  log "Skipped Claude user template sync due to --target $install_target"
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

for obsolete_skill in evidence-verify goal-contract system-model decision-synthesis control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review; do
  remove_obsolete_skill_link "$obsolete_skill"
done

remove_legacy_codex_skill_links

if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true ]]; then
  sync_hooks_template
elif [[ "$sync_codex_config" == true ]]; then
  log "Skipped user hook sync due to --no-sync-user-hooks"
else
  log "Skipped user hook sync due to --target $install_target"
fi

print_summary
