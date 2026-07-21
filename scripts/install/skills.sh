# shellcheck shell=bash

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

preflight_skill_target() {
  local source="$1"
  local target="$2"
  local label="$3"
  local source_real

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
      return
    fi

    echo "Refusing to replace existing symlink: $target -> $raw_current_target" >&2
    echo "External skill symlinks are not replaced during install." >&2
    exit 1
  fi

  if [[ -e "$target" ]] && ! is_managed_skill_copy_dir "$target"; then
    echo "Refusing to replace unmanaged or malformed skill directory: $target" >&2
    echo "Only directories with a valid $skill_copy_marker marker are replaced." >&2
    exit 1
  fi
}

copy_skill_dir() {
  local source="$1"
  local target="$2"
  local label="$3"
  local transaction_target="$target"
  local source_real
  local activation_marker=".alpha-goal-activation-token"
  local activation_token
  local replaced=false
  local stage_root
  local staged
  local backup

  target="$(transaction_target_path "$transaction_target" false)"
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
  transaction_register_transient "$stage_root"
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
  if ! atomic_replace_path "$staged" "$target" directory missing; then
    if [[ "$replaced" == true ]] && { [[ -e "$backup" ]] || [[ -L "$backup" ]]; }; then
      if [[ -e "$target" ]] || [[ -L "$target" ]]; then
        echo "Failed to activate staged skill because the target reappeared: $target" >&2
        echo "Previous managed copy preserved at: $backup" >&2
        echo "Staged replacement preserved at: $staged" >&2
        exit 1
      fi
      if ! atomic_replace_path "$backup" "$target" directory missing; then
        echo "Failed to restore the previous managed skill: $target" >&2
        echo "Previous managed copy preserved at: $backup" >&2
        echo "Staged replacement preserved at: $staged" >&2
        exit 1
      fi
      if ! is_managed_skill_copy_dir "$target"; then
        echo "Restored skill failed managed-target validation: $target" >&2
        exit 1
      fi
    fi
    rm -rf "$stage_root"
    die "Failed to activate staged skill copy: $target"
  fi
  if [[ ! -d "$target" || -L "$target" ]] ||
     [[ ! -f "$target/$activation_marker" || -L "$target/$activation_marker" ]] ||
     [[ "$(cat "$target/$activation_marker" 2>/dev/null || true)" != "$activation_token" ]] ||
     [[ ! -f "$target/SKILL.md" || -L "$target/SKILL.md" ]] ||
     [[ -e "$target/$label/$activation_marker" || -L "$target/$label/$activation_marker" ]] ||
     ! is_managed_skill_copy_dir "$target"; then
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
  if ! rm "$target/$activation_marker"; then
    echo "Activated skill failed activation-marker cleanup: $target" >&2
    if [[ "$replaced" == true ]] && { [[ -e "$backup" ]] || [[ -L "$backup" ]]; }; then
      echo "Previous managed copy preserved at: $backup" >&2
    fi
    exit 1
  fi
  if [[ ! -d "$target" || -L "$target" ]] ||
     [[ -e "$target/$activation_marker" || -L "$target/$activation_marker" ]] ||
     ! is_managed_skill_copy_dir "$target"; then
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

legacy_support_link_is_removable() {
  local root="$1"
  local support_name="$2"
  local legacy_source="$repo_root/$support_name"
  local target="$root/$support_name"
  local current_target

  [[ -L "$target" ]] || return 1
  current_target="$(resolve_link_target "$target")"
  [[ "$current_target" == "$legacy_source" ]]
}

remove_legacy_support_link_from_root() {
  local root="$1"
  local support_name="$2"
  local target="$root/$support_name"
  local fixed_target

  if [[ "$install_transaction_state" == "active" ]] && transaction_path_index "$target" false >/dev/null 2>&1; then
    fixed_target="$(transaction_target_path "$target" false)"
    rm "$fixed_target"
    legacy_removed_count=$((legacy_removed_count + 1))
    log "Removed legacy support link: $fixed_target"
    return
  fi

  if ! legacy_support_link_is_removable "$root" "$support_name"; then
    return
  fi

  rm "$target"
  legacy_removed_count=$((legacy_removed_count + 1))
  log "Removed legacy support link: $target"
}

remove_legacy_support_link() {
  remove_legacy_support_link_from_root "$target_root" "$1"
}

same_repo_skill_link_is_removable() {
  local root="$1"
  local skill_name="$2"
  local target="$root/$skill_name"
  local current_target
  local legacy_skillset_source=""

  [[ -L "$target" ]] || return 1

  current_target="$(resolve_link_target "$target")"
  if [[ "$skill_name" == "alpha-goal" ]]; then
    legacy_skillset_source="$source_skill_root"
  fi
  [[ "$current_target" == "$source_skill_root/$skill_name" || "$current_target" == "$repo_root/$skill_name" || ( -n "$legacy_skillset_source" && "$current_target" == "$legacy_skillset_source" ) ]] || same_git_common_dir_skill_path "$current_target" "$skill_name"
}

remove_same_repo_skill_link_from_root() {
  local root="$1"
  local skill_name="$2"
  local target="$root/$skill_name"
  local fixed_target

  if [[ "$install_transaction_state" == "active" ]] && transaction_path_index "$target" false >/dev/null 2>&1; then
    fixed_target="$(transaction_target_path "$target" false)"
    rm "$fixed_target"
    legacy_removed_count=$((legacy_removed_count + 1))
    log "Removed obsolete skill link: $fixed_target"
    return
  fi

  if ! same_repo_skill_link_is_removable "$root" "$skill_name"; then
    return
  fi

  rm "$target"
  legacy_removed_count=$((legacy_removed_count + 1))
  log "Removed obsolete skill link: $target"
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
prepare_skill_selection() {
  required_skills=(alpha-goal executor verifier)
  renamed_legacy_skills=(control-loop goal-verify)
  install_skills=(alpha-goal)
  if [[ "$install_optional_roles" == true ]]; then
    install_skills+=(executor verifier)
  fi
  skill_files=()
  local skill_name
  local skill_file
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
  installed=0
}
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
register_codex_legacy_transaction_paths() {
  local root="$1"
  local name
  for name in adapters tools templates scripts; do
    if legacy_support_link_is_removable "$root" "$name"; then
      transaction_register_path "$root/$name"
    fi
  done
  for name in "${renamed_legacy_skills[@]}" evidence-verify goal-contract system-model decision-synthesis control-kernel loop verify meta-synthesis goal-frame goal-loop goal-iterate goal-review; do
    if same_repo_skill_link_is_removable "$root" "$name"; then
      transaction_register_path "$root/$name"
    fi
  done
}

register_selected_legacy_transaction_paths() {
  local name
  if [[ "$sync_codex_config" != true ]]; then
    return
  fi
  register_codex_legacy_transaction_paths "$target_root"
  if [[ "$legacy_codex_skill_root" != "$target_root" ]]; then
    register_codex_legacy_transaction_paths "$legacy_codex_skill_root"
    for name in "${required_skills[@]}"; do
      if same_repo_skill_link_is_removable "$legacy_codex_skill_root" "$name"; then
        transaction_register_path "$legacy_codex_skill_root/$name"
      fi
    done
  fi
}
