#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"
install_module_dir="$script_dir/install"
source_skill_root="$repo_root/skills"
source_agent_root="$repo_root/agents"

# Source modules from shared primitives to feature-specific orchestration.
source "$install_module_dir/common.sh"
source "$install_module_dir/interactive.sh"
source "$install_module_dir/transaction.sh"
source "$install_module_dir/markdown.sh"
source "$install_module_dir/config.sh"
source "$install_module_dir/hooks.sh"
source "$install_module_dir/skills.sh"
source "$install_module_dir/agents.sh"
source "$install_module_dir/context.sh"
source "$install_module_dir/preflight.sh"

initialize_install_defaults
while [[ $# -gt 0 ]]; do
  case "$1" in
    --uninstall)
      uninstall=true
      shift
      ;;
    --non-interactive)
      non_interactive=true
      shift
      ;;
    *)
      die "Unknown option: $1 (supported options: --uninstall and --non-interactive)"
      ;;
  esac
done

initialize_install_target_context

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

if [[ "$sync_codex_config" == true && "$sync_custom_agents" == true ]]; then
  if [[ ! -f "$custom_agent_routing_template" || -L "$custom_agent_routing_template" ]]; then
    die "Missing regular custom-agent routing template: $custom_agent_routing_template"
  fi
  if [[ "$uninstall" != true ]]; then
    preflight_custom_agent_targets
  fi
fi

prepare_skill_selection

if [[ "$uninstall" == true ]]; then
  if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true ]]; then
    preflight_hooks_template
  fi

  begin_install_transaction

  if [[ "$sync_codex_config" == true && "$sync_custom_agents" == true ]]; then
    remove_custom_agent_routing_template
    remove_custom_agent_files
  elif [[ "$sync_codex_config" == true ]]; then
    log "Skipped custom-agent cleanup by interactive choice"
  fi

  if [[ "$sync_codex_config" == true && "$sync_user_templates" == true ]]; then
    remove_agents_template
    remove_config_template
  elif [[ "$sync_codex_config" == true ]]; then
    log "Skipped Codex user template cleanup by interactive choice"
  else
    log "Skipped Codex user template cleanup for selected target: $install_target"
  fi

  if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true ]]; then
    remove_hooks_template
  elif [[ "$sync_codex_config" == true ]]; then
    log "Skipped user hook cleanup by interactive choice"
  else
    log "Skipped user hook cleanup for selected target: $install_target"
  fi

  if [[ "$sync_claude_config" == true && "$sync_user_templates" == true ]]; then
    remove_claude_template
  elif [[ "$sync_claude_config" == true ]]; then
    log "Skipped Claude user template cleanup by interactive choice"
  else
    log "Skipped Claude user template cleanup for selected target: $install_target"
  fi

  if [[ "$sync_codex_config" == true ]]; then
    for skill_name in "${required_skills[@]}"; do
      remove_installed_skill_link "$skill_name"
    done
  fi
  if [[ "$sync_claude_config" == true ]]; then
    for skill_name in "${required_skills[@]}"; do
      remove_claude_skill_link "$skill_name"
    done
  fi

  commit_install_transaction
  if [[ "$sync_codex_config" == true && "$sync_custom_agents" == true ]]; then
    remove_empty_custom_agents_root
  fi
  print_uninstall_summary
  exit 0
fi

preflight_install_targets
begin_install_transaction
register_selected_legacy_transaction_paths

if [[ "$sync_codex_config" == true ]]; then
  mkdir -p "$target_root"
fi
if [[ "$sync_claude_config" == true ]]; then
  mkdir -p "$claude_skill_root"
fi

if [[ "$sync_codex_config" == true && "$sync_user_templates" == true ]]; then
  mkdir -p "$codex_home"
  inject_agents_template
  sync_config_template
elif [[ "$sync_codex_config" == true ]]; then
  log "Skipped Codex user template sync by interactive choice"
else
  log "Skipped Codex user template sync for selected target: $install_target"
fi

if [[ "$sync_codex_config" == true && "$sync_custom_agents" == true ]]; then
  sync_custom_agent_files
  inject_custom_agent_routing_template
elif [[ "$sync_codex_config" == true ]]; then
  log "Skipped custom-agent sync by interactive choice"
fi

if [[ "$sync_claude_config" == true && "$sync_user_templates" == true ]]; then
  mkdir -p "$claude_home"
  inject_claude_template
elif [[ "$sync_claude_config" == true ]]; then
  log "Skipped Claude user template sync by interactive choice"
else
  log "Skipped Claude user template sync for selected target: $install_target"
fi

if [[ "$sync_codex_config" == true ]]; then
  install_skill_copies_to_root "$target_root"
fi
if [[ "$sync_claude_config" == true ]]; then
  install_skill_copies_to_root "$claude_skill_root"
fi

if [[ "$sync_codex_config" == true ]]; then
  for support_name in adapters tools templates scripts; do
    remove_legacy_support_link "$support_name"
  done

  for obsolete_skill in "${renamed_legacy_skills[@]}"; do
    remove_obsolete_skill_link "$obsolete_skill"
  done

  for obsolete_skill in evidence-verify goal-contract system-model decision-synthesis control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review; do
    remove_obsolete_skill_link "$obsolete_skill"
  done

  remove_legacy_codex_skill_links
fi

if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true ]]; then
  sync_hooks_template
elif [[ "$sync_codex_config" == true ]]; then
  log "Skipped user hook sync by interactive choice"
else
  log "Skipped user hook sync for selected target: $install_target"
fi

commit_install_transaction
print_summary
