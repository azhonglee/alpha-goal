# shellcheck shell=bash

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--non-interactive] [--uninstall]

Install this repository's public skill directories as copied directories.
The codex target installs under ${CODEX_HOME:-$HOME/.codex}. The claude target
installs independent Claude skill copies under $HOME/.claude/skills.

Install runs ask for the target app configuration and whether to install the
optional executor/verifier role pair. deep-interview, alpha-goal, and
technical-design are always installed. Uninstall runs ask for cleanup choices.
--non-interactive uses the complete default Codex preset without prompts.

The codex target can also install the repository's managed Custom Agents and
routing block under the Codex configuration root. It syncs AGENTS.md, config.toml,
selected skills, and hooks.json when the optional roles are selected. The
claude target syncs Claude CLAUDE.md and selected skills. The interactive all
menu option syncs both targets.
With --uninstall, each target removes only its managed configuration, Custom
Agents when selected, and skill copies.

Options:
  --non-interactive
            Use the default Codex target and all default managed features
            without terminal prompts. With --uninstall, remove the default
            managed Codex installation without terminal prompts.
  --uninstall
            Run the interactive uninstall flow.
EOF
}

die() {
  echo "$*" >&2
  exit 1
}
log() {
  if [[ "$verbose" == true ]]; then
    echo "$*"
  fi
}

require_node_runtime() {
  if ! command -v node >/dev/null 2>&1; then
    die "Node.js 18+ is required to sync config.toml or hooks.json."
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
  if [[ -n "${CODEX_HOME:-}" ]]; then
    printf '%s\n' "$CODEX_HOME"
    return
  fi

  if [[ -z "${HOME:-}" ]]; then
    die "HOME is unavailable and CODEX_HOME is unset; cannot resolve the Codex configuration root"
  fi

  printf '%s\n' "$HOME/.codex"
}

default_skills_root() {
  printf '%s\n' "$(default_codex_home)/skills"
}

display_codex_skills_root() {
  if [[ -z "${CODEX_HOME:-}" && -z "${HOME:-}" ]]; then
    printf '%s\n' "unavailable (HOME and CODEX_HOME unset)"
    return
  fi
  absolute_path "$(default_skills_root)"
}

default_claude_home() {
  if [[ -z "${HOME:-}" ]]; then
    die "HOME is unavailable; cannot resolve \$HOME/.claude"
  fi

  printf '%s\n' "$HOME/.claude"
}

display_claude_skills_root() {
  if [[ -z "${HOME:-}" ]]; then
    printf '%s\n' "unavailable (HOME unset)"
    return
  fi
  printf '%s\n' "$(absolute_path "$(default_claude_home)")/skills"
}

validate_install_target() {
  case "$1" in
    codex|claude|all)
      ;;
    *)
      die "Invalid install target: $1 (expected codex, claude, or all)"
      ;;
  esac
}
initialize_install_defaults() {
  uninstall=false
  non_interactive=false
  verbose=false
  sync_user_templates=true
  sync_user_hooks=true
  install_optional_roles=true
  sync_custom_agents=false
}

print_summary() {
  echo "Alpha Goal install completed."
  print_target_summary
  printf 'Skills: %s synced (%s created, %s replaced).\n' \
    "$installed" "$copied_count" "$replaced_count"
  if [[ "$sync_codex_config" == true ]]; then
    printf 'Codex config: AGENTS.md %s; config.toml %s; hooks.json %s.\n' \
      "$agents_action" "$config_action" "$hooks_action"
    if [[ "$sync_custom_agents" == true ]]; then
      printf 'Custom Agents: %s created, %s replaced; routing %s.\n' \
        "$custom_agent_installed_count" "$custom_agent_replaced_count" "$custom_agent_routing_action"
    else
      echo "Custom Agents: kept existing (not synced)."
    fi
  fi
  if [[ "$sync_claude_config" == true ]]; then
    printf 'Claude config: CLAUDE.md %s.\n' "$claude_action"
  fi
  if [[ "$install_optional_roles" != true ]]; then
    echo "Optional roles: kept existing (not synced)."
  fi
}

print_uninstall_summary() {
  echo "Alpha Goal uninstall completed."
  print_target_summary
  printf 'Skills: %s removed, %s preserved, %s not found.\n' \
    "$uninstall_skill_removed_count" "$uninstall_skill_preserved_count" "$uninstall_skill_missing_count"
  if [[ "$sync_codex_config" == true ]]; then
    printf 'Codex config: AGENTS.md %s; config.toml %s; hooks.json %s.\n' \
      "$agents_action" "$config_action" "$hooks_action"
    if [[ "$sync_custom_agents" == true ]]; then
      printf 'Custom Agents: %s removed, %s preserved; routing %s.\n' \
        "$custom_agent_removed_count" "$custom_agent_preserved_count" "$custom_agent_routing_action"
    else
      echo "Custom Agents: kept existing (cleanup skipped)."
    fi
  fi
  if [[ "$sync_claude_config" == true ]]; then
    printf 'Claude config: CLAUDE.md %s.\n' "$claude_action"
  fi
}

print_target_summary() {
  case "$install_target" in
    codex)
      printf 'Target: Codex (%s).\n' "$codex_home"
      ;;
    claude)
      printf 'Target: Claude (%s).\n' "$claude_home"
      ;;
    all)
      printf 'Targets: Codex (%s); Claude (%s).\n' "$codex_home" "$claude_home"
      ;;
  esac
}
