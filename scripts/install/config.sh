# shellcheck shell=bash

sync_config_template() {
  local logical_config_target="$config_target"
  atomic_prepare_file_target "$logical_config_target" true
  local config_target="$atomic_work_path"

  if [[ -e "$config_target" && ! -f "$config_target" ]]; then
    echo "Refusing to write config template into non-file path: $config_target" >&2
    exit 1
  fi

  if [[ ! -f "$config_target" ]]; then
    cp "$config_template" "$config_target"
    config_action="created"
    atomic_commit_file_target "$logical_config_target" true
    log "Created config.toml from template: $config_target"
    return
  fi

  local result
  result="$(node - "$repo_root/vendor/smol-toml/dist/index.cjs" "$config_template" "$config_target" <<'JS'
const fs = require("node:fs");

const [tomlPath, templateArg, targetArg] = process.argv.slice(2);
const toml = require(tomlPath);
const OLD_USAGE_HINT_TEXT = [
  "Use `spawn_agent` autonomously when delegation materially improves the task.",
  "Repository or workspace instructions such as AGENTS.md may define when and how delegation is appropriate.",
  "Treat those instructions as the user's standing delegation policy for the workspace.",
  "Do not require a separate live user request before spawning subagents.",
  "",
].join("\n");

function parseToml(text, file) {
  if (!text.trim()) return {};
  try {
    return toml.parse(text);
  } catch (error) {
    console.error(`Invalid TOML in ${file}: ${error.message}`);
    process.exit(1);
  }
}

function loadToml(file) {
  return parseToml(fs.readFileSync(file, "utf8"), file);
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

function splitLines(text) {
  return text.match(/[^\n]*\n|[^\n]+$/g) || [];
}

function pathId(keys) {
  return JSON.stringify(keys);
}

function samePath(left, right) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function hasPathPrefix(keys, prefix) {
  return keys.length >= prefix.length && prefix.every((key, index) => key === keys[index]);
}

function skipHorizontalWhitespace(text, index) {
  while (text[index] === " " || text[index] === "\t") index += 1;
  return index;
}

function parseQuotedKey(text, index) {
  const quote = text[index];
  const start = index;
  index += 1;
  while (index < text.length) {
    if (quote === '"' && text[index] === "\\") {
      index += 2;
      continue;
    }
    if (text[index] === quote) {
      const raw = text.slice(start, index + 1);
      const parsed = toml.parse(`${raw} = 0`);
      return [Object.keys(parsed)[0], index + 1];
    }
    index += 1;
  }
  throw new Error("Unterminated quoted TOML key");
}

function parseKeyPath(text) {
  const keys = [];
  let index = 0;
  while (index < text.length) {
    index = skipHorizontalWhitespace(text, index);
    if (index >= text.length) break;
    if (text[index] === '"' || text[index] === "'") {
      const [key, next] = parseQuotedKey(text, index);
      keys.push(key);
      index = next;
    } else {
      const match = text.slice(index).match(/^[A-Za-z0-9_-]+/);
      if (!match) throw new Error(`Invalid TOML key path: ${text}`);
      keys.push(match[0]);
      index += match[0].length;
    }
    index = skipHorizontalWhitespace(text, index);
    if (index >= text.length) break;
    if (text[index] !== ".") throw new Error(`Invalid TOML key path: ${text}`);
    index += 1;
  }
  if (!keys.length) throw new Error(`Invalid TOML key path: ${text}`);
  return keys;
}

function findUnquoted(text, needle, start = 0) {
  let quote = null;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote === '"' && char === "\\") {
      index += 1;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === needle) return index;
  }
  return -1;
}

function parseTableHeader(line, start) {
  const arrayTable = line.startsWith("[[", start);
  const width = arrayTable ? 2 : 1;
  const close = findUnquoted(line, "]", start + width);
  if (close < 0 || (arrayTable && line[close + 1] !== "]")) return null;
  const tail = line.slice(close + width).replace(/\r?\n$/, "");
  if (!/^\s*(?:#.*)?$/.test(tail)) return null;
  return {
    kind: arrayTable ? "array-table" : "table",
    path: parseKeyPath(line.slice(start + width, close)),
  };
}

function scanToml(lines) {
  const statements = [];
  let currentTable = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const start = skipHorizontalWhitespace(line, 0);
    if (start >= line.length || line[start] === "#" || line[start] === "\r" || line[start] === "\n") {
      index += 1;
      continue;
    }

    if (line[start] === "[") {
      const header = parseTableHeader(line, start);
      if (header) {
        currentTable = header.path;
        statements.push({ ...header, start: index, end: index + 1 });
        index += 1;
        continue;
      }
    }

    const equals = findUnquoted(line, "=", start);
    if (equals < 0) throw new Error(`Cannot locate TOML assignment at line ${index + 1}`);
    const keyPath = parseKeyPath(line.slice(start, equals));
    let end = index + 1;
    for (; end <= lines.length; end += 1) {
      try {
        toml.parse(lines.slice(index, end).join(""));
        break;
      } catch {
        // A multiline string/container is incomplete until a later line.
      }
    }
    if (end > lines.length) throw new Error(`Cannot locate end of TOML assignment at line ${index + 1}`);
    statements.push({ kind: "assignment", path: [...currentTable, ...keyPath], start: index, end });
    index = end;
  }
  return statements;
}

function collectTables(lines) {
  const headers = scanToml(lines).filter(statement => statement.kind !== "assignment");
  const blocks = new Map();
  headers.forEach((header, offset) => {
    const end = offset + 1 < headers.length ? headers[offset + 1].start : lines.length;
    if (header.kind === "table") blocks.set(pathId(header.path), [header.start, end]);
  });
  return { blocks, firstTable: headers.length ? headers[0].start : lines.length };
}

function removeStatements(lines, predicate) {
  const spans = scanToml(lines)
    .filter(predicate)
    .map(({ start, end }) => [start, end])
    .filter((span, index, all) => index === all.findIndex(other => samePath(span, other)));
  for (const [start, end] of spans.sort((left, right) => right[0] - left[0])) {
    lines.splice(start, end - start);
  }
  return spans.length ? 1 : 0;
}

function removeAssignment(lines, targetPath) {
  return removeStatements(lines, statement =>
    statement.kind === "assignment" && samePath(statement.path, targetPath));
}

function removeTableValue(lines, targetPath) {
  return removeStatements(lines, statement =>
    (statement.kind === "assignment" && hasPathPrefix(statement.path, targetPath)) ||
    (statement.kind !== "assignment" && hasPathPrefix(statement.path, targetPath)));
}

function exactOldManagedMultiAgentV2(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === 2 &&
    keys[0] === "usage_hint_enabled" &&
    keys[1] === "usage_hint_text" &&
    value.usage_hint_enabled === true &&
    value.usage_hint_text === OLD_USAGE_HINT_TEXT;
}

const templateData = loadToml(templateArg);
const originalText = fs.readFileSync(targetArg, "utf8");
const originalData = parseToml(originalText, targetArg);
const newline = originalText.includes("\r\n") ? "\r\n" : "\n";
let lines = splitLines(originalText);
let retiredRemoved = 0;

if (Object.hasOwn(originalData.features || {}, "child_agents_md")) {
  retiredRemoved += removeAssignment(lines, ["features", "child_agents_md"]);
}
if (originalData.features?.default_mode_request_user_input === true) {
  retiredRemoved += removeAssignment(lines, ["features", "default_mode_request_user_input"]);
}
if (exactOldManagedMultiAgentV2(originalData.features?.multi_agent_v2)) {
  retiredRemoved += removeTableValue(lines, ["features", "multi_agent_v2"]);
}

const migratedText = lines.join("");
const targetData = parseToml(migratedText, targetArg);
const remainingFeatures = targetData.features || {};
if (Object.hasOwn(remainingFeatures, "child_agents_md") ||
    (originalData.features?.default_mode_request_user_input === true &&
      remainingFeatures.default_mode_request_user_input === true) ||
    (exactOldManagedMultiAgentV2(originalData.features?.multi_agent_v2) &&
      exactOldManagedMultiAgentV2(remainingFeatures.multi_agent_v2))) {
  console.error(
    `Cannot safely migrate retired features in ${targetArg}: ` +
    "unsupported inline TOML representation; rewrite the features table using standard table or dotted-key syntax"
  );
  process.exit(1);
}
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

if (!missing.length && !retiredRemoved) {
  console.log("current");
  process.exit(0);
}

const groups = new Map();
for (const [keys, value] of missing) {
  const parent = keys.slice(0, -1);
  const id = pathId(parent);
  const group = groups.get(id) || { parent, items: [] };
  group.items.push([keys[keys.length - 1], value]);
  groups.set(id, group);
}

const { blocks, firstTable } = collectTables(lines);
const insertions = [];
const appends = [];
for (const [id, { parent, items }] of groups) {
  const additions = items.map(([key, value]) => `${key} = ${tomlValue(value)}${newline}`);
  if (!parent.length) {
    if (firstTable < lines.length) additions.push(newline);
    insertions.push([firstTable, additions]);
  } else if (blocks.has(id)) {
    insertions.push([blocks.get(id)[1], additions]);
  } else {
    appends.push([parent, additions]);
  }
}

for (const [index, additions] of insertions.sort((a, b) => b[0] - a[0])) {
  if (index > 0 && !lines[index - 1].endsWith("\n")) additions.unshift(newline);
  lines.splice(index, 0, ...additions);
}
for (const [parent, additions] of appends) {
  if (lines.length && lines[lines.length - 1].trim()) lines.push(newline);
  lines.push(`[${parent.join(".")}]${newline}`, ...additions);
}

const newText = lines.join("");
parseToml(newText, targetArg);
fs.writeFileSync(targetArg, newText);
console.log(`updated:${missing.length}:${retiredRemoved}`);
JS
)"

  case "$result" in
    current)
      config_action="current"
      log "config.toml already contains template settings: $config_target"
      ;;
    updated:*)
      config_action="updated"
      log "Updated config.toml from template and retired-field migration (${result#updated:}): $config_target"
      ;;
    *)
      die "Unexpected config template merge result: $result"
      ;;
  esac
  if [[ "$config_action" == "current" ]]; then
    atomic_discard_file_target
  else
    atomic_commit_file_target "$logical_config_target" true
  fi
}

remove_config_template() {
  if [[ -L "$config_target" ]]; then
    config_action="preserved"
    log "Preserved symlinked config.toml during uninstall: $config_target"
    return
  fi

  if [[ ! -e "$config_target" ]]; then
    config_action="not-found"
    log "config.toml is not installed: $config_target"
    return
  fi

  if [[ ! -f "$config_target" ]]; then
    config_action="preserved"
    log "Preserved non-file config.toml during uninstall: $config_target"
    return
  fi

  if cmp -s "$config_template" "$config_target"; then
    rm "$config_target"
    config_action="removed"
    log "Removed template-only config.toml: $config_target"
  else
    config_action="preserved"
    log "Preserved modified or mixed config.toml: $config_target"
  fi
}
