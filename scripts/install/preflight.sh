# shellcheck shell=bash

preflight_writable_parent() {
  local target="$1"
  local label="$2"
  local parent
  local ancestor

  parent="$(dirname "$target")"
  ancestor="$parent"
  while [[ ! -e "$ancestor" && ! -L "$ancestor" ]]; do
    if [[ "$(dirname "$ancestor")" == "$ancestor" ]]; then
      break
    fi
    ancestor="$(dirname "$ancestor")"
  done
  if [[ ! -d "$ancestor" ]]; then
    die "Cannot create $label because its parent chain contains a non-directory path: $ancestor"
  fi
  if [[ ! -w "$ancestor" ]]; then
    die "Cannot create $label because its nearest existing parent is not writable: $ancestor"
  fi
}

preflight_file_target() {
  local target="$1"
  local label="$2"
  local actual_target

  if [[ -L "$target" && ! -e "$target" ]]; then
    die "Refusing to write $label through broken symlink: $target"
  fi
  if [[ -e "$target" && ! -f "$target" ]]; then
    die "Refusing to write $label into non-file path: $target"
  fi
  if [[ -e "$target" && ( ! -r "$target" || ! -w "$target" ) ]]; then
    die "Existing $label is not readable and writable: $target"
  fi
  actual_target="$(normalize_path "$target")"
  preflight_writable_parent "$actual_target" "$label actual target"
}

copy_file_for_preflight() {
  local source="$1"
  local target="$2"

  if [[ -e "$source" ]]; then
    mkdir -p "$(dirname "$target")"
    cp -L -- "$source" "$target"
  fi
}

preflight_unique_targets=()
preflight_unique_labels=()

normalized_paths_overlap() {
  local left="$1"
  local right="$2"

  [[ "$left" == "$right" ]] ||
    [[ "$left" == "/" && "$right" == /* ]] ||
    [[ "$right" == "/" && "$left" == /* ]] ||
    [[ "$right" == "$left"/* ]] ||
    [[ "$left" == "$right"/* ]]
}

preflight_register_unique_target() {
  local target="$1"
  local label="$2"
  local follow_final_symlink="${3:-true}"
  local resolved
  local index

  if [[ "$follow_final_symlink" == true ]]; then
    resolved="$(normalize_path "$target")"
  else
    resolved="$(normalize_path "$(dirname "$target")")/$(basename "$target")"
  fi
  for ((index=0; index<${#preflight_unique_targets[@]}; index++)); do
    if normalized_paths_overlap "${preflight_unique_targets[$index]}" "$resolved"; then
      die "Install targets overlap: $label resolves to $resolved while ${preflight_unique_labels[$index]} resolves to ${preflight_unique_targets[$index]}"
    fi
  done
  preflight_unique_targets+=("$resolved")
  preflight_unique_labels+=("$label")
}

preflight_install_targets() {
  local preflight_root
  local skill_file
  local skill_dir
  local skill_name
  local root
  local name

  preflight_root="$(mktemp -d "${TMPDIR:-/tmp}/alpha-goal-install-preflight.XXXXXX")"

  if ! (
    set -e
    preflight_unique_targets=()
    preflight_unique_labels=()

    if [[ "$sync_codex_config" == true ]]; then
      if [[ "$sync_user_templates" == true || "$sync_custom_agents" == true ]]; then
        preflight_register_unique_target "$agents_target" "Codex AGENTS.md"
        preflight_file_target "$agents_target" "AGENTS.md"
      fi
      if [[ "$sync_user_templates" == true ]]; then
        preflight_register_unique_target "$config_target" "Codex config.toml"
        preflight_file_target "$config_target" "config.toml"
      fi
      if [[ "$sync_user_hooks" == true ]]; then
        preflight_register_unique_target "$hooks_target" "Codex hooks.json"
        preflight_file_target "$hooks_target" "hooks.json"
      fi
      if [[ "$sync_custom_agents" == true ]]; then
        preflight_writable_parent "$custom_agents_root/${custom_agent_names[0]}.toml" "Codex custom agents"
        preflight_custom_agent_targets
        for name in "${custom_agent_names[@]}"; do
          preflight_register_unique_target "$custom_agents_root/$name.toml" "Codex custom agent $name"
        done
      fi
    fi
    if [[ "$sync_claude_config" == true && "$sync_user_templates" == true ]]; then
      preflight_register_unique_target "$claude_target" "Claude CLAUDE.md"
      preflight_file_target "$claude_target" "CLAUDE.md"
    fi

    if [[ "$sync_codex_config" == true ]]; then
      root="$target_root"
      preflight_writable_parent "$root/alpha-goal" "Codex skill root"
      for skill_file in "${skill_files[@]}"; do
        skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
        skill_name="$(basename "$skill_dir")"
        preflight_register_unique_target "$root/$skill_name" "Codex skill $skill_name" false
        preflight_skill_target "$skill_dir" "$root/$skill_name" "$skill_name"
      done
    fi
    if [[ "$sync_claude_config" == true ]]; then
      root="$claude_skill_root"
      preflight_writable_parent "$root/alpha-goal" "Claude skill root"
      for skill_file in "${skill_files[@]}"; do
        skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
        skill_name="$(basename "$skill_dir")"
        preflight_register_unique_target "$root/$skill_name" "Claude skill $skill_name" false
        preflight_skill_target "$skill_dir" "$root/$skill_name" "$skill_name"
      done
    fi

    if [[ "$sync_codex_config" == true ]]; then
      copy_file_for_preflight "$agents_target" "$preflight_root/codex/AGENTS.md"
      copy_file_for_preflight "$config_target" "$preflight_root/codex/config.toml"
      copy_file_for_preflight "$hooks_target" "$preflight_root/codex/hooks.json"
      agents_target="$preflight_root/codex/AGENTS.md"
      config_target="$preflight_root/codex/config.toml"
      hooks_target="$preflight_root/codex/hooks.json"
      custom_agents_root="$preflight_root/codex/agents"

      if [[ "$sync_user_templates" == true ]]; then
        inject_agents_template
        sync_config_template
      fi
      if [[ "$sync_custom_agents" == true ]]; then
        mkdir -p "$custom_agents_root"
        for name in "${custom_agent_names[@]}"; do
          cp -- "$source_agent_root/$name.toml" "$custom_agents_root/$name.toml"
        done
        inject_custom_agent_routing_template
      fi
      if [[ "$sync_user_hooks" == true ]]; then
        sync_hooks_template
      fi
    fi

    if [[ "$sync_claude_config" == true ]]; then
      copy_file_for_preflight "$claude_target" "$preflight_root/claude/CLAUDE.md"
      claude_target="$preflight_root/claude/CLAUDE.md"
      if [[ "$sync_user_templates" == true ]]; then
        inject_claude_template
      fi
    fi

    mkdir -p "$preflight_root/source-skills"
    for skill_file in "${skill_files[@]}"; do
      skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
      skill_name="$(basename "$skill_dir")"
      cp -R -- "$skill_dir" "$preflight_root/source-skills/$skill_name"
      test -f "$preflight_root/source-skills/$skill_name/SKILL.md"
    done
  ); then
    rm -rf -- "$preflight_root"
    die "Install preflight failed; no managed target was changed."
  fi

  rm -rf -- "$preflight_root"
}
