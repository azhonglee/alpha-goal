# shellcheck shell=bash

menu_rendered_rows=0
wizard_key=""

menu_supports_color() {
  [[ -t 2 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]
}

menu_supports_cursor() {
  [[ -t 2 && "${TERM:-}" != "dumb" ]]
}

initialize_menu_style() {
  reset=""
  bold=""
  dim=""
  cyan=""
  green=""
  yellow=""

  if menu_supports_color; then
    reset=$'\033[0m'
    bold=$'\033[1m'
    dim=$'\033[2m'
    cyan=$'\033[36m'
    green=$'\033[32m'
    yellow=$'\033[33m'
  fi
}

menu_print_line() {
  if menu_supports_cursor; then
    printf '\033[K%s\n' "$1" >&2
  else
    printf '%s\n' "$1" >&2
  fi
  menu_rendered_rows=$((menu_rendered_rows + 1))
}

begin_menu_render() {
  if menu_supports_cursor; then
    printf '\033[H\033[2J' >&2
  elif [[ "$menu_rendered_rows" -gt 0 ]]; then
    printf '\n' >&2
  else
    printf '' >&2
  fi
  menu_rendered_rows=0
}

render_wizard_header() {
  local step="$1"
  local title="$2"
  local operation="Install"

  if [[ "$uninstall" == true ]]; then
    operation="Uninstall"
  fi

  menu_print_line "${cyan}${bold}◆ Alpha Goal ${operation}${reset}"
  menu_print_line "${dim}Step ${step} of 3${reset}  ${bold}${title}${reset}"
  menu_print_line "${dim}Target  >  Features  >  Review${reset}"
  menu_print_line ""
}

render_choice_row() {
  local active="$1"
  local label="$2"
  local summary="$3"
  local marker

  if [[ "$active" == true ]]; then
    marker="${green}>${reset}"
    label="${bold}${label}${reset}"
    summary="${yellow}${summary}${reset}"
  else
    marker="${dim} ${reset}"
  fi
  menu_print_line "  ${marker} ${label}  ${summary}"
}

render_toggle_row() {
  local active="$1"
  local selected="$2"
  local label="$3"
  local summary="$4"
  local cursor=" " checkbox="[ ]"

  if [[ "$active" == true ]]; then
    cursor="${green}>${reset}"
    label="${bold}${label}${reset}"
  fi
  if [[ "$selected" == true ]]; then
    checkbox="${green}[x]${reset}"
  else
    checkbox="${dim}[ ]${reset}"
  fi
  menu_print_line "  ${cursor} ${checkbox} ${label}"
  menu_print_line "      ${dim}${summary}${reset}"
}

render_install_target_menu() {
  local selected="$1"
  local skills_root="$2"
  local index
  local labels=("Codex" "Claude" "Codex + Claude")
  local summaries=("recommended" "Claude only" "both apps")
  local details=(
    "Updates Codex configuration and selected skills"
    "Updates Claude configuration and selected skills"
    "Updates both Codex and Claude configuration and selected skills"
  )

  if [[ "$uninstall" == true ]]; then
    details=(
      "Removes managed Codex config and Codex skills"
      "Removes managed Claude config and Claude skills"
      "Removes managed Codex and Claude config and skills"
    )
  fi

  initialize_menu_style
  begin_menu_render

  if [[ "$uninstall" == true ]]; then
    menu_print_line "${cyan}${bold}◆ Alpha Goal Uninstall${reset}"
    menu_print_line "${dim}Choose which app configuration to clean up.${reset}"
    menu_print_line "${dim}Use Up/Down and Enter to confirm.${reset}"
  else
    render_wizard_header "1" "Choose target"
  fi
  menu_print_line "${dim}Skill roots:${reset} ${skills_root}"
  menu_print_line ""

  for index in "${!labels[@]}"; do
    if [[ "$index" -eq "$selected" ]]; then
      render_choice_row true "${labels[$index]}" "${summaries[$index]}"
    else
      render_choice_row false "${labels[$index]}" "${summaries[$index]}"
    fi
    menu_print_line "    ${dim}${details[$index]}${reset}"
  done

  if [[ "$uninstall" != true ]]; then
    menu_print_line ""
    menu_print_line "${dim}Up/Down move  Enter continue  q/Esc cancel${reset}"
  fi
}

read_wizard_key() {
  local key rest=""

  if ! IFS= read -rsn1 key; then
    printf '\n' >&2
    die "No selection received"
  fi

  case "$key" in
    "") wizard_key="enter" ;;
    " ") wizard_key="space" ;;
    b|B) wizard_key="back" ;;
    q|Q) wizard_key="cancel" ;;
    $'\033')
      if IFS= read -rsn2 -t 1 rest; then
        case "$rest" in
          "[A") wizard_key="up" ;;
          "[B") wizard_key="down" ;;
          *) wizard_key="cancel" ;;
        esac
      else
        wizard_key="cancel"
      fi
      ;;
    *) wizard_key="other" ;;
  esac
}

prompt_install_target() {
  local targets=(codex claude all)
  local selected=0
  local prompt_skills_root

  prompt_skills_root="codex $(display_codex_skills_root) / claude $(display_claude_skills_root)"
  menu_rendered_rows=0
  while true; do
    render_install_target_menu "$selected" "$prompt_skills_root"
    read_wizard_key
    case "$wizard_key" in
      enter)
        printf '\n' >&2
        menu_rendered_rows=0
        printf '%s\n' "${targets[$selected]}"
        return
        ;;
      up) selected=$(( (selected + ${#targets[@]} - 1) % ${#targets[@]} )) ;;
      down) selected=$(( (selected + 1) % ${#targets[@]} )) ;;
      cancel)
        printf '\nInstallation cancelled.\n' >&2
        return 130
        ;;
    esac
  done
}

render_install_features() {
  local target="$1"
  local selected="$2"
  local optional_roles="$3"
  local custom_agents="$4"

  initialize_menu_style
  begin_menu_render
  render_wizard_header "2" "Choose features"
  menu_print_line "${dim}Target:${reset} ${bold}${target}${reset}"
  menu_print_line ""
  if [[ "$selected" -eq 0 ]]; then
    render_toggle_row true "$optional_roles" \
      "Executor + verifier" "Install the persistent execution and final-audit roles"
  else
    render_toggle_row false "$optional_roles" \
      "Executor + verifier" "Install the persistent execution and final-audit roles"
  fi
  if [[ "$target" == codex || "$target" == all ]]; then
    if [[ "$selected" -eq 1 ]]; then
      render_toggle_row true "$custom_agents" \
        "Codex Custom Agents" "Install managed agent profiles and routing guidance"
    else
      render_toggle_row false "$custom_agents" \
        "Codex Custom Agents" "Install managed agent profiles and routing guidance"
    fi
  fi
  menu_print_line ""
  menu_print_line "${dim}Up/Down move  Space toggle  Enter continue  b back  q/Esc cancel${reset}"
}

format_enabled() {
  if [[ "$1" == true ]]; then
    printf '%s' "enabled"
  else
    printf '%s' "disabled"
  fi
}

render_install_review() {
  local target="$1"
  local optional_roles="$2"
  local custom_agents="$3"
  local codex_root="$4"
  local claude_root="$5"

  initialize_menu_style
  begin_menu_render
  render_wizard_header "3" "Review installation"
  menu_print_line "${bold}Target${reset}"
  case "$target" in
    codex) menu_print_line "  Codex   ${dim}${codex_root}${reset}" ;;
    claude) menu_print_line "  Claude  ${dim}${claude_root}${reset}" ;;
    all)
      menu_print_line "  Codex   ${dim}${codex_root}${reset}"
      menu_print_line "  Claude  ${dim}${claude_root}${reset}"
      ;;
  esac
  menu_print_line ""
  menu_print_line "${bold}Features${reset}"
  menu_print_line "  alpha-goal            ${green}enabled${reset}"
  menu_print_line "  executor + verifier   $(format_enabled "$optional_roles")"
  if [[ "$target" == codex || "$target" == all ]]; then
    menu_print_line "  Codex Custom Agents   $(format_enabled "$custom_agents")"
  fi
  menu_print_line ""
  menu_print_line "${yellow}${bold}Press Enter to install${reset}  ${dim}b back  q/Esc cancel${reset}"
}

run_install_wizard() {
  local targets=(codex claude all)
  local target_selected=0
  local feature_selected=0
  local optional_roles=true
  local custom_agents=true
  local page="target"
  local target feature_count
  local prompt_skills_root
  local codex_root claude_root

  codex_root="$(display_codex_skills_root)"
  claude_root="$(display_claude_skills_root)"
  prompt_skills_root="codex ${codex_root} / claude ${claude_root}"
  menu_rendered_rows=0

  while true; do
    target="${targets[$target_selected]}"
    case "$page" in
      target)
        render_install_target_menu "$target_selected" "$prompt_skills_root"
        ;;
      features)
        feature_count=1
        if [[ "$target" == codex || "$target" == all ]]; then
          feature_count=2
        fi
        if [[ "$feature_selected" -ge "$feature_count" ]]; then
          feature_selected=$((feature_count - 1))
        fi
        render_install_features "$target" "$feature_selected" "$optional_roles" "$custom_agents"
        ;;
      review)
        render_install_review "$target" "$optional_roles" "$custom_agents" "$codex_root" "$claude_root"
        ;;
    esac

    read_wizard_key
    case "$wizard_key" in
      cancel)
        printf '\nInstallation cancelled.\n' >&2
        return 130
        ;;
      back)
        case "$page" in
          features) page="target" ;;
          review) page="features" ;;
        esac
        ;;
      up)
        case "$page" in
          target) target_selected=$(( (target_selected + ${#targets[@]} - 1) % ${#targets[@]} )) ;;
          features) feature_selected=$(( (feature_selected + feature_count - 1) % feature_count )) ;;
        esac
        ;;
      down)
        case "$page" in
          target) target_selected=$(( (target_selected + 1) % ${#targets[@]} )) ;;
          features) feature_selected=$(( (feature_selected + 1) % feature_count )) ;;
        esac
        ;;
      space)
        if [[ "$page" == features ]]; then
          if [[ "$feature_selected" -eq 0 ]]; then
            if [[ "$optional_roles" == true ]]; then optional_roles=false; else optional_roles=true; fi
          else
            if [[ "$custom_agents" == true ]]; then custom_agents=false; else custom_agents=true; fi
          fi
        fi
        ;;
      enter)
        case "$page" in
          target) page="features" ;;
          features) page="review" ;;
          review)
            printf '\n' >&2
            menu_rendered_rows=0
            if [[ "$target" == claude ]]; then
              custom_agents=false
            fi
            printf '%s\t%s\t%s\n' "$target" "$optional_roles" "$custom_agents"
            return
            ;;
        esac
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
