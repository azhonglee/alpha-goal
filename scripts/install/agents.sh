# shellcheck shell=bash

load_custom_agent_names() {
  local contract="$repo_root/tools/validation/alpha-goal.json"
  local output
  local name

  require_node_runtime
  if [[ ! -f "$contract" ]]; then
    die "Missing shared validation contract: $contract"
  fi
  output="$(node - "$contract" <<'JS'
const fs = require("node:fs");

const contractPath = process.argv[2];
let contract;
try {
  contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
} catch (error) {
  console.error(`Invalid shared validation contract ${contractPath}: ${error.message}`);
  process.exit(1);
}
const profiles = contract.customAgents;
if (!profiles || typeof profiles !== "object" || Array.isArray(profiles) || !Object.keys(profiles).length) {
  console.error(`${contractPath}: customAgents must be a non-empty object`);
  process.exit(1);
}
for (const name of Object.keys(profiles)) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(`${contractPath}: invalid custom agent role ${JSON.stringify(name)}`);
    process.exit(1);
  }
  console.log(name);
}
JS
)" || die "Failed to load Custom Agent roles from $contract"

  custom_agent_names=()
  while IFS= read -r name; do
    if [[ -n "$name" ]]; then
      custom_agent_names+=("$name")
    fi
  done <<<"$output"
  if [[ "${#custom_agent_names[@]}" -eq 0 ]]; then
    die "No Custom Agent roles declared in $contract"
  fi
}
is_managed_custom_agent_file() {
  local target="$1"
  local first_line=""

  [[ -f "$target" && ! -L "$target" ]] || return 1
  IFS= read -r first_line < "$target" || true
  [[ "$first_line" == "$custom_agent_copy_marker" ]]
}

preflight_custom_agent_targets() {
  local name
  local source
  local target

  if [[ -L "$source_agent_root" || ! -d "$source_agent_root" ]]; then
    die "Custom agent source must be a regular directory: $source_agent_root"
  fi
  if [[ -L "$custom_agents_root" ]]; then
    die "Refusing to install custom agents through symlinked directory: $custom_agents_root"
  fi
  if [[ -e "$custom_agents_root" && ! -d "$custom_agents_root" ]]; then
    die "Refusing to install custom agents into non-directory path: $custom_agents_root"
  fi

  for name in "${custom_agent_names[@]}"; do
    source="$source_agent_root/$name.toml"
    target="$custom_agents_root/$name.toml"
    if [[ -L "$source" || ! -f "$source" ]]; then
      die "Missing regular custom agent source: $source"
    fi
    if ! is_managed_custom_agent_file "$source"; then
      die "Custom agent source is missing managed marker: $source"
    fi
    if [[ -L "$target" ]]; then
      die "Refusing to replace custom agent symlink: $target"
    fi
    if [[ -e "$target" ]] && ! is_managed_custom_agent_file "$target"; then
      die "Refusing to replace unmanaged or non-regular custom agent: $target"
    fi
  done
}

sync_custom_agent_files() {
  local name
  local source
  local target
  local staged
  local stage_root
  local existed

  mkdir -p "$custom_agents_root"
  stage_root="$(mktemp -d "$custom_agents_root/.alpha-goal-custom-agent-stage.XXXXXX")"
  transaction_register_transient "$stage_root"
  for name in "${custom_agent_names[@]}"; do
    source="$source_agent_root/$name.toml"
    staged="$stage_root/$name.toml"
    if ! cp "$source" "$staged" || ! is_managed_custom_agent_file "$staged"; then
      rm -rf "$stage_root"
      die "Failed to stage custom agent: $name"
    fi
  done

  for name in "${custom_agent_names[@]}"; do
    target="$(transaction_target_path "$custom_agents_root/$name.toml" false)"
    staged="$stage_root/$name.toml"
    existed=false
    if [[ -e "$target" ]]; then
      existed=true
      if ! is_managed_custom_agent_file "$target"; then
        rm -rf "$stage_root"
        die "Custom agent target changed after preflight: $target"
      fi
    elif [[ -L "$target" ]]; then
      rm -rf "$stage_root"
      die "Custom agent target changed after preflight: $target"
    fi
    if ! atomic_replace_path "$staged" "$target" file file-or-missing; then
      rm -rf "$stage_root"
      die "Failed to install custom agent: $target"
    fi
    if [[ ! -f "$target" || -L "$target" ]] || ! is_managed_custom_agent_file "$target"; then
      rm -rf "$stage_root"
      die "Installed custom agent failed managed-target validation: $target"
    fi
    if [[ "$existed" == true ]]; then
      custom_agent_replaced_count=$((custom_agent_replaced_count + 1))
    else
      custom_agent_installed_count=$((custom_agent_installed_count + 1))
    fi
  done
  rm -rf "$stage_root"
}

remove_custom_agent_files() {
  local name
  local target

  if [[ -L "$custom_agents_root" || ( -e "$custom_agents_root" && ! -d "$custom_agents_root" ) ]]; then
    custom_agent_preserved_count=$((custom_agent_preserved_count + ${#custom_agent_names[@]}))
    log "Preserved non-directory custom agents root during uninstall: $custom_agents_root"
    return
  fi

  for name in "${custom_agent_names[@]}"; do
    target="$custom_agents_root/$name.toml"
    if [[ ! -e "$target" && ! -L "$target" ]]; then
      continue
    fi
    if is_managed_custom_agent_file "$target"; then
      rm "$target"
      custom_agent_removed_count=$((custom_agent_removed_count + 1))
      log "Removed managed custom agent: $target"
    else
      custom_agent_preserved_count=$((custom_agent_preserved_count + 1))
      log "Preserved unmanaged custom agent during uninstall: $target"
    fi
  done
}

remove_empty_custom_agents_root() {
  if [[ -d "$custom_agents_root" && ! -L "$custom_agents_root" ]]; then
    rmdir "$custom_agents_root" 2>/dev/null || true
  fi
}
inject_agents_template() {
  sync_markdown_template "$agents_template" "$agents_target" "$agents_template_marker" "AGENTS.md"
  agents_action="$markdown_template_action"
}

inject_custom_agent_routing_template() {
  sync_markdown_template "$custom_agent_routing_template" "$agents_target" "$custom_agent_routing_marker" "custom-agent routing"
  custom_agent_routing_action="$markdown_template_action"
}
remove_agents_template() {
  remove_markdown_template "$agents_template" "$agents_target" "$agents_template_marker" "AGENTS.md"
  agents_action="$markdown_template_action"
}

remove_custom_agent_routing_template() {
  remove_markdown_template "$custom_agent_routing_template" "$agents_target" "$custom_agent_routing_marker" "custom-agent routing"
  custom_agent_routing_action="$markdown_template_action"
}
