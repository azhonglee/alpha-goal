# shellcheck shell=bash

initialize_install_target_context() {
  require_interactive_terminal
  install_target="$(resolve_install_target)"
  sync_codex_config=false
  sync_claude_config=false
  case "$install_target" in
    codex)
      sync_codex_config=true
      ;;
    claude)
      sync_claude_config=true
      ;;
    all)
      sync_codex_config=true
      sync_claude_config=true
      ;;
  esac

  if [[ "$uninstall" != true ]]; then
    install_optional_roles="$(prompt_yes_no "Install executor and verifier" true)"
  fi

  codex_home=""
  target_root=""
  if [[ "$sync_codex_config" == true ]]; then
    if ! codex_default_home="$(default_codex_home)"; then
      exit 1
    fi
    codex_home="$(absolute_path "$codex_default_home")"
    if [[ "$uninstall" == true ]]; then
      codex_home="$(absolute_path "$(prompt_text "Codex home" "$codex_default_home")")"
    fi
    target_root="$(absolute_path "$codex_home/skills")"
  fi

  claude_home=""
  claude_skill_root=""
  if [[ "$sync_claude_config" == true ]]; then
    if ! claude_default_home="$(default_claude_home)"; then
      exit 1
    fi
    claude_home="$(absolute_path "$claude_default_home")"
    claude_skill_root="$claude_home/skills"
  fi

  if [[ "$sync_codex_config" == true ]]; then
    if [[ "$uninstall" == true ]]; then
      sync_custom_agents="$(prompt_yes_no "Clean up Codex custom agents" true)"
    else
      sync_custom_agents="$(prompt_yes_no "Install Codex custom agents" true)"
    fi
  fi
  if [[ "$uninstall" == true ]]; then
    sync_user_templates="$(prompt_yes_no "Clean up user templates" true)"
  else
    sync_user_templates=true
  fi
  if [[ "$sync_codex_config" == true ]]; then
    if [[ "$uninstall" == true ]]; then
      sync_user_hooks="$(prompt_yes_no "Clean up Codex user hooks" true)"
    elif [[ "$install_optional_roles" == true ]]; then
      sync_user_hooks=true
    else
      sync_user_hooks=false
    fi
  else
    sync_user_hooks=false
  fi
  if [[ "$uninstall" == true ]]; then
    verbose="$(prompt_yes_no "Print detailed uninstall output" false)"
  else
    verbose=false
  fi
  if [[ "$install_target" == "all" ]]; then
    codex_skill_root_real="$(normalize_path "$target_root")"
    claude_skill_root_real="$(normalize_path "$claude_skill_root")"
    if [[ "$codex_skill_root_real" == "$claude_skill_root_real" ]]; then
      die "The interactive all target requires distinct Codex and Claude skill roots; both resolved to $codex_skill_root_real"
    fi
  fi

  agents_template="$repo_root/templates/AGENTS.md"
  claude_template="$repo_root/templates/CLAUDE.md"
  config_template="$repo_root/templates/config.toml"
  hooks_template="$repo_root/templates/hooks.json"
  custom_agent_routing_template="$repo_root/templates/custom-agent-routing.md"
  agents_target=""
  config_target=""
  hooks_target=""
  custom_agents_root=""
  legacy_codex_skill_root=""
  if [[ "$sync_codex_config" == true ]]; then
    agents_target="$codex_home/AGENTS.md"
    config_target="$codex_home/config.toml"
    hooks_target="$codex_home/hooks.json"
    custom_agents_root="$codex_home/agents"
    legacy_codex_skill_root="$codex_home/skills"
  fi
  claude_target=""
  if [[ "$sync_claude_config" == true ]]; then
    claude_target="$claude_home/CLAUDE.md"
  fi
  agents_template_marker="<!-- generate-with-template:agents-md -->"
  custom_agent_routing_marker="<!-- generate-with-template:custom-agent-routing -->"
  claude_template_marker="<!-- generate-with-template:claude-md -->"
  skill_copy_marker=".alpha-goal-skill-copy"
  custom_agent_copy_marker="# alpha-goal-managed-custom-agent:v1"
  custom_agent_names=()
  copied_count=0
  replaced_count=0
  already_count=0
  legacy_removed_count=0
  agents_action="skipped"
  claude_action="skipped"
  config_action="skipped"
  hooks_action="skipped"
  custom_agent_routing_action="skipped"
  custom_agent_installed_count=0
  custom_agent_replaced_count=0
  custom_agent_removed_count=0
  custom_agent_preserved_count=0
  uninstall_skill_removed_count=0
  uninstall_skill_preserved_count=0
  uninstall_skill_missing_count=0

  if [[ "$sync_codex_config" == true ]]; then
    if [[ "$uninstall" == true ]]; then
      if [[ "$sync_user_hooks" == true ]]; then
        require_node_runtime
      fi
    elif [[ "$sync_user_templates" == true || "$sync_user_hooks" == true ]]; then
      require_node_runtime
    fi
  fi
  if [[ "$sync_codex_config" == true && "$sync_custom_agents" == true ]]; then
    load_custom_agent_names
  fi
}
