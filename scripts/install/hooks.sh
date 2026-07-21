# shellcheck shell=bash

hooks_backup_path=""

create_persistent_hooks_backup() {
  local source="$1"
  local stamp
  local backup_base
  local suffix=0
  local stage_dir

  stamp="$(date -u '+%Y%m%d%H%M%S')"
  backup_base="$source.bak-$stamp"
  hooks_backup_path="$backup_base"
  while [[ -e "$hooks_backup_path" || -L "$hooks_backup_path" ]]; do
    suffix=$((suffix + 1))
    hooks_backup_path="$backup_base-$suffix"
  done
  stage_dir="$(mktemp -d "$(dirname "$source")/.alpha-goal-hooks-backup.XXXXXX")"
  transaction_register_transient "$stage_dir"
  if ! cp -p -- "$source" "$stage_dir/value"; then
    rm -rf -- "$stage_dir"
    die "Failed to stage hooks.json backup: $hooks_backup_path"
  fi
  if ! atomic_replace_path "$stage_dir/value" "$hooks_backup_path" file missing; then
    rm -rf -- "$stage_dir"
    die "Failed to persist hooks.json backup: $hooks_backup_path"
  fi
  transaction_register_transient "$hooks_backup_path"
  rm -rf -- "$stage_dir"
}

sync_hooks_template() {
  local logical_hooks_target="$hooks_target"
  local config_read_target="$config_target"
  local fixed_hooks_target="$logical_hooks_target"
  local hooks_target_existed=false
  if [[ "$install_transaction_state" == "active" ]]; then
    fixed_hooks_target="$(transaction_target_path "$logical_hooks_target" true)"
    if [[ -f "$fixed_hooks_target" && ! -L "$fixed_hooks_target" ]]; then
      hooks_target_existed=true
    fi
  fi
  atomic_prepare_file_target "$logical_hooks_target" true
  local hooks_target="$atomic_work_path"
  if [[ "$install_transaction_state" == "active" ]]; then
    config_read_target="$(transaction_target_path "$config_target" true)"
  fi

  if [[ -e "$hooks_target" && ! -f "$hooks_target" ]]; then
    echo "Refusing to write hooks into non-file path: $hooks_target" >&2
    exit 1
  fi

  if [[ ! -f "$hooks_template" ]]; then
    echo "No hooks template found at $hooks_template" >&2
    exit 1
  fi

  local result
  result="$(node - "$hooks_target" "$hooks_template" "$config_read_target" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const path = require("node:path");

const [hooksArg, templateArg, configArg, tomlPath] = process.argv.slice(2);
const toml = require(tomlPath);
const MANAGED_MARKER_RE = /^: 'codex-alpha-goal-compact-recovery:v[0-9]+';/;
const LEGACY_MANAGED_MARKER_RE = /(^|[\s;'\x22])codex-compact-skill-recovery(?::(?:v[0-9]+|experimental))?($|[\s;'\x22])/;

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
fs.writeFileSync(writePath, newText);
warnIfHooksDisabled(configArg);
console.log(existed ? "updated" : "created");
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
    updated)
      hooks_action="updated"
      log "Updated hooks.json from template: $hooks_target"
      ;;
    *)
      die "Unexpected hook template sync result: $result"
      ;;
  esac
  if [[ "$hooks_action" == "current" ]]; then
    atomic_discard_file_target
  else
    if [[ "$hooks_action" == "updated" && "$hooks_target_existed" == true ]]; then
      create_persistent_hooks_backup "$fixed_hooks_target"
      log "Backed up hooks.json: $hooks_backup_path"
    fi
    atomic_commit_file_target "$logical_hooks_target" true
  fi
}

remove_hooks_template() {
  if [[ -L "$hooks_target" ]]; then
    hooks_action="preserved"
    log "Preserved symlinked hooks.json during uninstall: $hooks_target"
    return
  fi

  if [[ ! -e "$hooks_target" ]]; then
    hooks_action="not-found"
    log "hooks.json is not installed: $hooks_target"
    return
  fi

  if [[ ! -f "$hooks_target" ]]; then
    hooks_action="preserved"
    log "Preserved non-file hooks.json during uninstall: $hooks_target"
    return
  fi

  local result
  result="$(node - "$hooks_target" <<'JS'
const fs = require("node:fs");
const path = require("node:path");

const [hooksArg] = process.argv.slice(2);
const MANAGED_MARKER_RE = /^: 'codex-alpha-goal-compact-recovery:v[0-9]+';/;
const LEGACY_MANAGED_MARKER_RE = /(^|[\s;'\x22])codex-compact-skill-recovery(?::(?:v[0-9]+|experimental))?($|[\s;'\x22])/;

function loadJson(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("top-level value must be an object");
    return data;
  } catch (error) {
    console.error(`Invalid JSON in ${file}: ${error.message}`);
    process.exit(1);
  }
}

function managedHook(hook) {
  if (!hook || typeof hook !== "object" || hook.type !== "command" || typeof hook.command !== "string") return false;
  const command = hook.command.trimStart();
  return MANAGED_MARKER_RE.test(command) || LEGACY_MANAGED_MARKER_RE.test(command);
}

function removeManagedHooks(data, hooksPath) {
  if (!("hooks" in data)) return 0;
  if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) {
    console.error(`${hooksPath}: top-level hooks field must be a JSON object`);
    process.exit(1);
  }

  let removed = 0;
  for (const [event, groups] of Object.entries(data.hooks)) {
    if (!Array.isArray(groups)) {
      console.error(`${hooksPath}: hooks.${event} must be a JSON array`);
      process.exit(1);
    }

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

    if (nextGroups.length) {
      data.hooks[event] = nextGroups;
    } else {
      delete data.hooks[event];
    }
  }
  return removed;
}

function hasNonManagedContent(data) {
  const keys = Object.keys(data);
  const nonHookKeys = keys.filter(key => key !== "hooks");
  if (nonHookKeys.length) return true;
  if (!("hooks" in data)) return false;
  if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) return true;
  return Object.values(data.hooks).some(groups => Array.isArray(groups) && groups.length > 0);
}

const hooksPath = path.resolve(hooksArg);
const original = fs.readFileSync(hooksPath, "utf8");
const data = loadJson(hooksPath);
const removed = removeManagedHooks(data, hooksPath);

if (!removed) {
  console.log("current");
  process.exit(0);
}

if (!hasNonManagedContent(data)) {
  fs.unlinkSync(hooksPath);
  console.log("removed");
  process.exit(0);
}

const nextText = `${JSON.stringify(data, null, 2)}\n`;
if (nextText === original) {
  console.log("current");
  process.exit(0);
}

const tmpPath = `${hooksPath}.tmp`;
fs.writeFileSync(tmpPath, nextText);
fs.renameSync(tmpPath, hooksPath);
console.log("updated");
JS
)"

  case "$result" in
    current|removed|updated)
      hooks_action="$result"
      log "Uninstall hooks.json action: $result"
      ;;
    *)
      die "Unexpected hook template uninstall result: $result"
      ;;
  esac
}
preflight_hooks_template() {
  if [[ -L "$hooks_target" || ! -e "$hooks_target" || ! -f "$hooks_target" ]]; then
    return
  fi

  node - "$hooks_target" <<'JS' >/dev/null
const fs = require("node:fs");
const path = require("node:path");

const [hooksArg] = process.argv.slice(2);

function loadJson(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("top-level value must be an object");
    return data;
  } catch (error) {
    console.error(`Invalid JSON in ${file}: ${error.message}`);
    process.exit(1);
  }
}

const hooksPath = path.resolve(hooksArg);
const data = loadJson(hooksPath);
if (!("hooks" in data)) process.exit(0);
if (!data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) {
  console.error(`${hooksPath}: top-level hooks field must be a JSON object`);
  process.exit(1);
}
for (const [event, groups] of Object.entries(data.hooks)) {
  if (!Array.isArray(groups)) {
    console.error(`${hooksPath}: hooks.${event} must be a JSON array`);
    process.exit(1);
  }
}
JS
}
