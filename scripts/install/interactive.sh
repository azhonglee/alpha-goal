# shellcheck shell=bash

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

  prompt_skills_root="codex $(display_codex_skills_root) / claude $(display_claude_skills_root)"
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
