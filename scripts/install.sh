#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [--uninstall]

Install this repository's public skill directories as copied directories.
The codex target installs skills under $HOME/.codex/skills by default. The claude
target installs independent Claude skill copies under $HOME/.claude/skills.

Install runs ask for the target app configuration and whether to install the
optional executor/verifier role pair. alpha-goal is always installed. Uninstall
runs ask for cleanup choices. Non-interactive runs are refused.

The codex target can also install the repository's managed Custom Agents and
routing block under $HOME/.codex. It syncs Codex AGENTS.md, config.toml,
selected skills, and hooks.json when the optional roles are selected. The
claude target syncs Claude CLAUDE.md and selected skills. The interactive all
menu option syncs both targets.
With --uninstall, each target removes only its managed configuration, Custom
Agents when selected, and skill copies.

Options:
  --uninstall
            Run the interactive uninstall flow.
EOF
}

die() {
  echo "$*" >&2
  exit 1
}

uninstall=false
verbose=false
sync_user_templates=true
sync_user_hooks=true
install_optional_roles=true
sync_custom_agents=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --uninstall)
      uninstall=true
      shift
      ;;
    *)
      die "Unknown option: $1 (only --uninstall is supported; run scripts/install.sh in an interactive terminal for configuration)"
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

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
repo_root="$(cd "$script_dir/.." && pwd -P)"
source_skill_root="$repo_root/skills"
source_agent_root="$repo_root/agents"

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
  if [[ -z "${HOME:-}" ]]; then
    die "HOME is unavailable; cannot resolve \$HOME/.codex"
  fi

  printf '%s\n' "$HOME/.codex"
}

default_skills_root() {
  printf '%s\n' "$(default_codex_home)/skills"
}

default_claude_home() {
  if [[ -z "${HOME:-}" ]]; then
    die "HOME is unavailable; cannot resolve \$HOME/.claude"
  fi

  printf '%s\n' "$HOME/.claude"
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

menu_rendered_rows=0

menu_supports_color() {
  [[ -t 2 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]
}

render_install_target_menu() {
  local selected="$1"
  local skills_root="$2"
  local operation="Install"
  local reset="" bold="" dim="" cyan="" green="" yellow=""
  local marker label summary index
  local labels=("codex" "claude" "all")
  local summaries=("Codex only (recommended)" "Claude only" "Codex and Claude")
  local details=(
    "Updates Codex configuration and selected skills"
    "Updates Claude configuration and selected skills"
    "Updates both Codex and Claude configuration and selected skills"
  )

  if [[ "$uninstall" == true ]]; then
    operation="Uninstall"
    details=(
      "Removes managed Codex config and Codex skills"
      "Removes managed Claude config and Claude skills"
      "Removes managed Codex and Claude config and skills"
    )
  fi

  if menu_supports_color; then
    reset=$'\033[0m'
    bold=$'\033[1m'
    dim=$'\033[2m'
    cyan=$'\033[36m'
    green=$'\033[32m'
    yellow=$'\033[33m'
  fi

  menu_rendered_rows=0
  printf '\r' >&2

  printf '\033[K%s◆ Alpha Goal %s%s\n' "$cyan$bold" "$operation" "$reset" >&2
  menu_rendered_rows=$((menu_rendered_rows + 1))
  printf '\033[K%sSkills install to:%s %s\n' "$dim" "$reset" "$skills_root" >&2
  menu_rendered_rows=$((menu_rendered_rows + 1))
  printf '\033[K%sChoose which app configuration to update. Use ↑/↓ and Enter to confirm.%s\n' "$dim" "$reset" >&2
  menu_rendered_rows=$((menu_rendered_rows + 1))
  printf '\033[K\n' >&2
  menu_rendered_rows=$((menu_rendered_rows + 1))

  for index in "${!labels[@]}"; do
    if [[ "$index" -eq "$selected" ]]; then
      marker="${green}●${reset}"
      label="${bold}${labels[$index]}${reset}"
      summary="${yellow}${summaries[$index]}${reset}"
    else
      marker="${dim}○${reset}"
      label="${labels[$index]}"
      summary="${summaries[$index]}"
    fi

    printf '\033[K  %s %s  %s\n' "$marker" "$label" "$summary" >&2
    menu_rendered_rows=$((menu_rendered_rows + 1))
    printf '\033[K    %s%s%s\n' "$dim" "${details[$index]}" "$reset" >&2
    menu_rendered_rows=$((menu_rendered_rows + 1))
  done

  # printf '\033[K\n' >&2
  # menu_rendered_rows=$((menu_rendered_rows + 1))
  # printf '\033[K%sUse ↑/↓ and Enter to confirm%s' "$cyan" "$reset" >&2
}

prompt_install_target() {
  local targets=(codex claude all)
  local selected=0
  local key rest
  local prompt_skills_root

  prompt_skills_root="codex $(absolute_path "$(default_skills_root)") / claude $(absolute_path "$(default_claude_home)")/skills"
  render_install_target_menu "$selected" "$prompt_skills_root"
  while true; do
    if ! IFS= read -rsn1 key; then
      printf '\n' >&2
      die "No target selected"
    fi

    case "$key" in
      "")
        printf '\n' >&2
        printf '%s\n' "${targets[$selected]}"
        return
        ;;
      $'\033')
        if IFS= read -rsn2 -t 1 rest; then
          case "$rest" in
            "")
              printf '\n' >&2
              printf '%s\n' "${targets[$selected]}"
              return
              ;;
            "[A")
              selected=$(( (selected + ${#targets[@]} - 1) % ${#targets[@]} ))
              printf '\033[%sA' "$menu_rendered_rows" >&2
              render_install_target_menu "$selected" "$prompt_skills_root"
              ;;
            "[B")
              selected=$(( (selected + 1) % ${#targets[@]} ))
              printf '\033[%sA' "$menu_rendered_rows" >&2
              render_install_target_menu "$selected" "$prompt_skills_root"
              ;;
          esac
        fi
        ;;
      *)
        ;;
    esac
  done
}

prompt_text() {
  local label="$1"
  local default_value="$2"
  local answer

  printf '%s [%s]: ' "$label" "$default_value" >&2
  if ! IFS= read -r answer; then
    printf '\n' >&2
    die "No value entered for $label"
  fi

  if [[ -z "$answer" ]]; then
    printf '%s\n' "$default_value"
  else
    printf '%s\n' "$answer"
  fi
}

prompt_yes_no() {
  local label="$1"
  local default_value="$2"
  local answer prompt

  if [[ "$default_value" == true ]]; then
    prompt="Y/n"
  else
    prompt="y/N"
  fi

  while true; do
    printf '%s [%s]: ' "$label" "$prompt" >&2
    if ! IFS= read -r answer; then
      printf '\n' >&2
      die "No value entered for $label"
    fi

    case "$answer" in
      "")
        printf '%s\n' "$default_value"
        return
        ;;
      y|Y|yes|YES|Yes)
        printf '%s\n' "true"
        return
        ;;
      n|N|no|NO|No)
        printf '%s\n' "false"
        return
        ;;
      *)
        echo "Please answer yes or no." >&2
        ;;
    esac
  done
}

require_interactive_terminal() {
  if [[ ! -t 0 ]]; then
    die "Interactive terminal required; only --uninstall may be passed as a CLI option"
  fi
}

resolve_install_target() {
  if [[ -t 0 ]]; then
    prompt_install_target
    return
  fi

  die "Interactive terminal required; cannot choose install target"
}

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

codex_home="$(absolute_path "$(default_codex_home)")"
if [[ "$uninstall" == true && "$sync_codex_config" == true ]]; then
  codex_home="$(absolute_path "$(prompt_text "Codex home" "$(default_codex_home)")")"
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
target_root="$(absolute_path "$codex_home/skills")"
claude_home="$(absolute_path "$(default_claude_home)")"
claude_skill_root="$claude_home/skills"
skill_install_root="$target_root"
if [[ "$sync_claude_config" == true && "$sync_codex_config" != true ]]; then
  skill_install_root="$claude_skill_root"
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
agents_target="$codex_home/AGENTS.md"
claude_target="$claude_home/CLAUDE.md"
config_target="$codex_home/config.toml"
hooks_target="$codex_home/hooks.json"
custom_agents_root="$codex_home/agents"
legacy_codex_skill_root="$codex_home/skills"
agents_template_marker="<!-- generate-with-template:agents-md -->"
custom_agent_routing_marker="<!-- generate-with-template:custom-agent-routing -->"
claude_template_marker="<!-- generate-with-template:claude-md -->"
skill_copy_marker=".alpha-goal-skill-copy"
custom_agent_copy_marker="# alpha-goal-managed-custom-agent:v1"
custom_agent_names=(scout builder reviewer)
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

git_common_dir_for_path() {
  local path="$1"
  local common_dir
  common_dir="$(git -C "$path" rev-parse --git-common-dir 2>/dev/null)" || return 1

  if [[ "$common_dir" == /* ]]; then
    normalize_path "$common_dir"
  else
    normalize_path "$path/$common_dir"
  fi
}

git_worktree_root_for_path() {
  local root
  root="$(git -C "$1" rev-parse --show-toplevel 2>/dev/null)" || return 1
  normalize_path "$root"
}

existing_ancestor_for_path() {
  local candidate="$1"
  while [[ ! -e "$candidate" && "$candidate" != "/" ]]; do
    candidate="$(dirname "$candidate")"
  done
  [[ "$candidate" != "/" && -e "$candidate" ]] || return 1
  printf '%s\n' "$candidate"
}

same_git_common_dir_skill_path() {
  local current_target="$1"
  local skill_name="$2"
  local target_real
  local target_probe
  local repo_common_dir
  local target_common_dir
  local target_root_path
  local target_rel

  target_real="$(normalize_path "$current_target" 2>/dev/null)" || return 1
  target_probe="$(existing_ancestor_for_path "$target_real")" || return 1
  repo_common_dir="$(git_common_dir_for_path "$repo_root")" || return 1
  target_common_dir="$(git_common_dir_for_path "$target_probe")" || return 1
  target_root_path="$(git_worktree_root_for_path "$target_probe")" || return 1

  if [[ "$repo_common_dir" != "$target_common_dir" ]]; then
    return 1
  fi

  case "$target_real" in
    "$target_root_path"/*)
      target_rel="${target_real#"$target_root_path"/}"
      ;;
    *)
      return 1
      ;;
  esac

  [[ "$target_rel" == "skills/$skill_name" ]]
}

same_git_worktree_skill_link() {
  local source="$1"
  local current_target="$2"
  local skill_name="$3"
  local source_real
  local target_real
  local source_root
  local target_root_path
  local source_common_dir
  local target_common_dir
  local target_rel

  source_real="$(normalize_path "$source" 2>/dev/null)" || return 1
  target_real="$(normalize_path "$current_target" 2>/dev/null)" || return 1
  source_root="$(git_worktree_root_for_path "$source_real")" || return 1
  target_root_path="$(git_worktree_root_for_path "$target_real")" || return 1
  source_common_dir="$(git_common_dir_for_path "$source_real")" || return 1
  target_common_dir="$(git_common_dir_for_path "$target_real")" || return 1

  if [[ "$source_common_dir" != "$target_common_dir" ]]; then
    return 1
  fi

  case "$target_real" in
    "$target_root_path"/*)
      target_rel="${target_real#"$target_root_path"/}"
      ;;
    *)
      return 1
      ;;
  esac

  [[ "$target_rel" == "skills/$skill_name" ]]
}

is_managed_skill_copy_dir() {
  local target="$1"
  local marker="$target/$skill_copy_marker"

  [[ -d "$target" && ! -L "$target" && -f "$marker" && ! -L "$marker" ]] || return 1
  [[ "$(wc -l < "$marker" | tr -d '[:space:]')" == "1" ]] || return 1
  grep -Eq '^source=.+$' "$marker"
}

copy_skill_dir() {
  local source="$1"
  local target="$2"
  local label="$3"
  local source_real
  local activation_marker=".alpha-goal-activation-token"
  local activation_token
  local replaced=false
  local stage_root
  local staged
  local backup

  source_real="$(normalize_path "$source")"

  if [[ -L "$target" ]]; then
    local raw_current_target
    local current_target
    raw_current_target="$(readlink "$target")"
    current_target="$(resolve_link_target "$target")"

    local legacy_top_level_source="$repo_root/$label"
    local legacy_skill_dir_source="$source_skill_root/$label"
    local legacy_skillset_source=""
    if [[ "$label" == "alpha-goal" ]]; then
      legacy_skillset_source="$source_skill_root"
    fi

    if [[ "$current_target" == "$source_real" || "$current_target" == "$legacy_top_level_source" || "$current_target" == "$legacy_skill_dir_source" || ( -n "$legacy_skillset_source" && "$current_target" == "$legacy_skillset_source" ) ]] || same_git_worktree_skill_link "$source" "$current_target" "$label" || same_git_common_dir_skill_path "$current_target" "$label"; then
      replaced=true
    else
      echo "Refusing to replace existing symlink: $target -> $raw_current_target" >&2
      echo "External skill symlinks are not replaced during install." >&2
      exit 1
    fi
  elif [[ -e "$target" ]]; then
    if is_managed_skill_copy_dir "$target"; then
      replaced=true
    else
      echo "Refusing to replace unmanaged or malformed skill directory: $target" >&2
      echo "Only directories with a valid $skill_copy_marker marker are replaced." >&2
      exit 1
    fi
  fi

  mkdir -p "$(dirname "$target")"
  stage_root="$(mktemp -d "$(dirname "$target")/.alpha-goal-skill-stage.XXXXXX")"
  staged="$stage_root/$label"
  backup="$stage_root/original"
  if ! cp -R "$source" "$staged"; then
    rm -rf "$stage_root"
    die "Failed to stage skill copy: $label"
  fi
  printf 'source=%s\n' "$source_real" > "$staged/$skill_copy_marker"
  activation_token="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
  printf '%s\n' "$activation_token" > "$staged/$activation_marker"

  if [[ "$replaced" == true ]]; then
    if ! mv "$target" "$backup"; then
      rm -rf "$stage_root"
      die "Failed to preserve existing managed skill before replacement: $target"
    fi
  fi
  if ! mv "$staged" "$target"; then
    if [[ "$replaced" == true ]] && { [[ -e "$backup" ]] || [[ -L "$backup" ]]; }; then
      if [[ -e "$target" ]] || [[ -L "$target" ]]; then
        echo "Failed to activate staged skill because the target reappeared: $target" >&2
        echo "Previous managed copy preserved at: $backup" >&2
        echo "Staged replacement preserved at: $staged" >&2
        exit 1
      fi
      if ! mv "$backup" "$target"; then
        echo "Failed to restore the previous managed skill: $target" >&2
        echo "Previous managed copy preserved at: $backup" >&2
        echo "Staged replacement preserved at: $staged" >&2
        exit 1
      fi
    fi
    rm -rf "$stage_root"
    die "Failed to activate staged skill copy: $target"
  fi
  if [[ ! -f "$target/$activation_marker" || -L "$target/$activation_marker" ]] ||
     [[ "$(cat "$target/$activation_marker" 2>/dev/null || true)" != "$activation_token" ]] ||
     [[ ! -f "$target/SKILL.md" || -L "$target/SKILL.md" ]] ||
     [[ -e "$target/$label/$activation_marker" || -L "$target/$label/$activation_marker" ]]; then
    echo "Staged skill did not become the managed target: $target" >&2
    if [[ "$replaced" == true ]] && { [[ -e "$backup" ]] || [[ -L "$backup" ]]; }; then
      echo "Previous managed copy preserved at: $backup" >&2
    fi
    if [[ -e "$staged" ]] || [[ -L "$staged" ]]; then
      echo "Staged replacement preserved at: $staged" >&2
    elif [[ -e "$target/$label" ]] || [[ -L "$target/$label" ]]; then
      echo "Staged replacement preserved at: $target/$label" >&2
    fi
    exit 1
  fi
  if ! rm "$target/$activation_marker" || ! is_managed_skill_copy_dir "$target"; then
    echo "Activated skill failed managed-target validation: $target" >&2
    if [[ "$replaced" == true ]] && { [[ -e "$backup" ]] || [[ -L "$backup" ]]; }; then
      echo "Previous managed copy preserved at: $backup" >&2
    fi
    exit 1
  fi
  rm -rf "$stage_root"

  if [[ "$replaced" == true ]]; then
    replaced_count=$((replaced_count + 1))
    log "Replaced skill copy: $label -> $target"
  else
    copied_count=$((copied_count + 1))
    log "Copied skill: $label -> $target"
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
  if [[ "$current_target" == "$source_skill_root/$skill_name" || "$current_target" == "$repo_root/$skill_name" || ( -n "$legacy_skillset_source" && "$current_target" == "$legacy_skillset_source" ) ]] || same_git_common_dir_skill_path "$current_target" "$skill_name"; then
    rm "$target"
    legacy_removed_count=$((legacy_removed_count + 1))
    log "Removed obsolete skill link: $target"
  fi
}

remove_obsolete_skill_link() {
  remove_same_repo_skill_link_from_root "$target_root" "$1"
}

remove_installed_skill_link() {
  local skill_name="$1"
  local target="$target_root/$skill_name"

  if [[ ! -e "$target" && ! -L "$target" ]]; then
    uninstall_skill_missing_count=$((uninstall_skill_missing_count + 1))
    log "Skill is not installed: $target"
    return
  fi

  if is_managed_skill_copy_dir "$target"; then
    rm -rf "$target"
    uninstall_skill_removed_count=$((uninstall_skill_removed_count + 1))
    log "Removed installed skill copy: $target"
    return
  fi

  if [[ ! -L "$target" ]]; then
    uninstall_skill_preserved_count=$((uninstall_skill_preserved_count + 1))
    log "Preserved unmanaged skill path during uninstall: $target"
    return
  fi

  local current_target
  current_target="$(resolve_link_target "$target")"
  local legacy_skillset_source=""
  if [[ "$skill_name" == "alpha-goal" ]]; then
    legacy_skillset_source="$source_skill_root"
  fi
  if [[ "$current_target" == "$source_skill_root/$skill_name" || "$current_target" == "$repo_root/$skill_name" || ( -n "$legacy_skillset_source" && "$current_target" == "$legacy_skillset_source" ) ]] || same_git_common_dir_skill_path "$current_target" "$skill_name"; then
    rm "$target"
    uninstall_skill_removed_count=$((uninstall_skill_removed_count + 1))
    log "Removed installed skill link: $target"
  else
    uninstall_skill_preserved_count=$((uninstall_skill_preserved_count + 1))
    log "Preserved external skill symlink during uninstall: $target"
  fi
}

remove_claude_skill_link() {
  local skill_name="$1"
  local target="$claude_skill_root/$skill_name"

  if [[ ! -e "$target" && ! -L "$target" ]]; then
    uninstall_skill_missing_count=$((uninstall_skill_missing_count + 1))
    log "Claude skill is not installed: $target"
    return
  fi

  if is_managed_skill_copy_dir "$target"; then
    rm -rf "$target"
    uninstall_skill_removed_count=$((uninstall_skill_removed_count + 1))
    log "Removed Claude skill copy: $target"
    return
  fi

  if [[ ! -L "$target" ]]; then
    uninstall_skill_preserved_count=$((uninstall_skill_preserved_count + 1))
    log "Preserved unmanaged Claude skill path during uninstall: $target"
    return
  fi

  local current_target
  current_target="$(resolve_link_target "$target")"
  local shared_target="$target_root/$skill_name"
  if [[ "$current_target" == "$shared_target" || "$current_target" == "$source_skill_root/$skill_name" || "$current_target" == "$repo_root/$skill_name" ]] || same_git_common_dir_skill_path "$current_target" "$skill_name"; then
    rm "$target"
    uninstall_skill_removed_count=$((uninstall_skill_removed_count + 1))
    log "Removed Claude skill link: $target"
  else
    uninstall_skill_preserved_count=$((uninstall_skill_preserved_count + 1))
    log "Preserved external Claude skill symlink during uninstall: $target"
  fi
}

remove_legacy_codex_skill_links() {
  if [[ "$legacy_codex_skill_root" == "$target_root" || ! -d "$legacy_codex_skill_root" ]]; then
    return
  fi

  for skill_name in "${required_skills[@]}"; do
    remove_same_repo_skill_link_from_root "$legacy_codex_skill_root" "$skill_name"
  done

  for obsolete_skill in "${renamed_legacy_skills[@]}"; do
    remove_same_repo_skill_link_from_root "$legacy_codex_skill_root" "$obsolete_skill"
  done

  for support_name in adapters tools templates scripts; do
    remove_legacy_support_link_from_root "$legacy_codex_skill_root" "$support_name"
  done

  for obsolete_skill in evidence-verify goal-contract system-model decision-synthesis control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review; do
    remove_same_repo_skill_link_from_root "$legacy_codex_skill_root" "$obsolete_skill"
  done
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
  for name in "${custom_agent_names[@]}"; do
    source="$source_agent_root/$name.toml"
    staged="$stage_root/$name.toml"
    if ! cp "$source" "$staged" || ! is_managed_custom_agent_file "$staged"; then
      rm -rf "$stage_root"
      die "Failed to stage custom agent: $name"
    fi
  done

  for name in "${custom_agent_names[@]}"; do
    target="$custom_agents_root/$name.toml"
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
    if ! mv "$staged" "$target"; then
      rm -rf "$stage_root"
      die "Failed to install custom agent: $target"
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
  if [[ -d "$custom_agents_root" && ! -L "$custom_agents_root" ]]; then
    rmdir "$custom_agents_root" 2>/dev/null || true
  fi
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

inject_custom_agent_routing_template() {
  sync_markdown_template "$custom_agent_routing_template" "$agents_target" "$custom_agent_routing_marker" "custom-agent routing"
  custom_agent_routing_action="$markdown_template_action"
}

inject_claude_template() {
  sync_markdown_template "$claude_template" "$claude_target" "$claude_template_marker" "CLAUDE.md"
  claude_action="$markdown_template_action"
}

remove_markdown_template() {
  local template_path="$1"
  local target_path="$2"
  local marker="$3"
  local label="$4"
  markdown_template_action=""

  if [[ -L "$target_path" ]]; then
    markdown_template_action="preserved"
    log "Preserved symlinked $label during uninstall: $target_path"
    return
  fi

  if [[ ! -e "$target_path" ]]; then
    markdown_template_action="not-found"
    log "$label is not installed: $target_path"
    return
  fi

  if [[ ! -f "$target_path" ]]; then
    markdown_template_action="preserved"
    log "Preserved non-file $label during uninstall: $target_path"
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
template_lines = template.splitlines()
if not template_lines or marker not in template_lines:
    print(f"Invalid managed template: {template_path}", file=sys.stderr)
    raise SystemExit(1)

block_start = template_lines[0]
target = target_path.read_text()
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
    if marker in target:
        print("preserved")
    else:
        print("current")
    raise SystemExit(0)

pieces = []
cursor = 0
for start, end in blocks:
    pieces.extend(target_lines[cursor:start])
    cursor = end
pieces.extend(target_lines[cursor:])

updated = "".join(pieces)
if not updated.strip():
    target_path.unlink()
    print("removed")
elif updated != target:
    target_path.write_text(updated)
    print("updated")
else:
    print("current")
PY
)"

  case "$result" in
    current|removed|updated|preserved)
      markdown_template_action="$result"
      log "Uninstall $label action: $result"
      ;;
    *)
      die "Unexpected $label template uninstall result: $result"
      ;;
  esac
}

remove_agents_template() {
  remove_markdown_template "$agents_template" "$agents_target" "$agents_template_marker" "AGENTS.md"
  agents_action="$markdown_template_action"
}

remove_custom_agent_routing_template() {
  remove_markdown_template "$custom_agent_routing_template" "$agents_target" "$custom_agent_routing_marker" "custom-agent routing"
  custom_agent_routing_action="$markdown_template_action"
}

remove_claude_template() {
  remove_markdown_template "$claude_template" "$claude_target" "$claude_template_marker" "CLAUDE.md"
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

print_summary() {
  echo "Alpha Goal install completed."
}

print_uninstall_summary() {
  echo "Alpha Goal uninstall completed."
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

if [[ "$sync_codex_config" == true && "$sync_custom_agents" == true ]]; then
  if [[ ! -f "$custom_agent_routing_template" || -L "$custom_agent_routing_template" ]]; then
    die "Missing regular custom-agent routing template: $custom_agent_routing_template"
  fi
  if [[ "$uninstall" != true ]]; then
    preflight_custom_agent_targets
  fi
fi

required_skills=(alpha-goal executor verifier)
renamed_legacy_skills=(control-loop goal-verify)
install_skills=(alpha-goal)
if [[ "$install_optional_roles" == true ]]; then
  install_skills+=(executor verifier)
fi
skill_files=()
for skill_name in "${required_skills[@]}"; do
  skill_file="$source_skill_root/$skill_name/SKILL.md"
  if [[ ! -f "$skill_file" ]]; then
    echo "Missing required skill: $skill_file" >&2
    exit 1
  fi
done
for skill_name in "${install_skills[@]}"; do
  skill_files+=("$source_skill_root/$skill_name/SKILL.md")
done

if [[ "$uninstall" == true ]]; then
  if [[ "$sync_codex_config" == true && "$sync_user_hooks" == true ]]; then
    preflight_hooks_template
  fi

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

  print_uninstall_summary
  exit 0
fi

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

installed=0
install_skill_copies_to_root() {
  local root="$1"
  local skill_dir
  local skill_name

  for skill_file in "${skill_files[@]}"; do
    skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
    skill_name="$(basename "$skill_dir")"
    copy_skill_dir "$skill_dir" "$root/$skill_name" "$skill_name"
    installed=$((installed + 1))
  done
}

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

print_summary
