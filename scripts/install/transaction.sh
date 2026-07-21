# shellcheck shell=bash
install_transaction_state="inactive"
install_transaction_dir=""
install_transaction_keys=()
install_transaction_paths=()
install_transaction_backups=()
install_transaction_original_states=()
install_transaction_created_dirs=()
install_transaction_transients=()
atomic_stage_dir=""
atomic_work_path=""
atomic_target_path=""

array_contains() {
  local candidate="$1"
  shift
  local item
  for item in "$@"; do
    if [[ "$item" == "$candidate" ]]; then
      return 0
    fi
  done
  return 1
}
transaction_path_key() {
  local target="$1"
  local follow_symlink="${2:-false}"
  printf '%s|%s\n' "$(absolute_path "$target")" "$follow_symlink"
}
transaction_path_index() {
  local target="$1"
  local follow_symlink="${2:-false}"
  local key
  local index
  key="$(transaction_path_key "$target" "$follow_symlink")"
  for ((index=0; index<${#install_transaction_keys[@]}; index++)); do
    if [[ "${install_transaction_keys[$index]}" == "$key" ]]; then
      printf '%s\n' "$index"
      return
    fi
  done
  return 1
}
transaction_mutation_path() {
  local target="$1"
  local follow_symlink="${2:-false}"
  if [[ "$follow_symlink" == true ]]; then
    normalize_path "$target"
  else
    printf '%s/%s\n' "$(normalize_path "$(dirname "$target")")" "$(basename "$target")"
  fi
}
transaction_target_path() {
  local target="$1"
  local follow_symlink="${2:-false}"
  local index
  if [[ "$install_transaction_state" == "active" ]]; then
    index="$(transaction_path_index "$target" "$follow_symlink")" || die "Install transaction did not register target: $target"
    printf '%s\n' "${install_transaction_paths[$index]}"
  else
    transaction_mutation_path "$target" "$follow_symlink"
  fi
}
transaction_track_created_parents() {
  local target="$1"
  local parent
  local next
  local index
  local missing=()
  parent="$(dirname "$target")"
  while [[ ! -e "$parent" && ! -L "$parent" ]]; do
    missing+=("$parent")
    next="$(dirname "$parent")"
    if [[ "$next" == "$parent" ]]; then
      break
    fi
    parent="$next"
  done
  for ((index=${#missing[@]} - 1; index >= 0; index--)); do
    if [[ "${#install_transaction_created_dirs[@]}" -eq 0 ]] ||
       ! array_contains "${missing[$index]}" "${install_transaction_created_dirs[@]}"; then
      install_transaction_created_dirs+=("${missing[$index]}")
    fi
  done
}

transaction_register_path() {
  local target="$1"
  local follow_symlink="${2:-false}"
  local actual_target
  local key
  local backup
  local original_state="missing"
  actual_target="$(transaction_mutation_path "$target" "$follow_symlink")"
  key="$(transaction_path_key "$target" "$follow_symlink")"
  if [[ "${#install_transaction_paths[@]}" -gt 0 ]] &&
     array_contains "$actual_target" "${install_transaction_paths[@]}"; then
    die "Install transaction target aliases an already registered path: $target -> $actual_target"
  fi
  transaction_track_created_parents "$actual_target"
  backup="$install_transaction_dir/snapshots/${#install_transaction_paths[@]}"
  if [[ -e "$actual_target" || -L "$actual_target" ]]; then
    cp -a -- "$actual_target" "$backup" || die "Failed to snapshot install target: $actual_target"
    original_state="present"
  fi
  install_transaction_keys+=("$key")
  install_transaction_paths+=("$actual_target")
  install_transaction_backups+=("$backup")
  install_transaction_original_states+=("$original_state")
}
transaction_register_transient() {
  local target="$1"
  if [[ "$install_transaction_state" != "active" ]]; then
    return
  fi
  if [[ "${#install_transaction_transients[@]}" -eq 0 ]] ||
     ! array_contains "$target" "${install_transaction_transients[@]}"; then
    install_transaction_transients+=("$target")
  fi
}

atomic_replace_path() {
  local source="$1"
  local target="$2"
  local source_kind="$3"
  local target_policy="$4"
  python3 - "$source" "$target" "$source_kind" "$target_policy" <<'PY'
import os
import stat
import sys
source, target, source_kind, target_policy = sys.argv[1:]
def kind(path):
    if not os.path.lexists(path):
        return "missing"
    mode = os.lstat(path).st_mode
    if stat.S_ISREG(mode):
        return "file"
    if stat.S_ISDIR(mode):
        return "directory"
    if stat.S_ISLNK(mode):
        return "symlink"
    return "other"
def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)
if source_kind not in {"file", "directory"}:
    fail(f"Unsupported atomic replace source kind: {source_kind}")
if target_policy not in {"file-or-missing", "missing"}:
    fail(f"Unsupported atomic replace target policy: {target_policy}")
if kind(source) != source_kind:
    fail(f"Atomic replace source has unexpected type: {source}")
target_kind = kind(target)
allowed = {"missing"} if target_policy == "missing" else {"missing", "file"}
if target_kind not in allowed:
    fail(f"Atomic replace target has unexpected type: {target} ({target_kind})")
try:
    os.replace(source, target)
except OSError as error:
    fail(f"Atomic replace failed for {target}: {error}")
if kind(target) != source_kind or os.path.lexists(source):
    fail(f"Atomic replace postcondition failed: {target}")
PY
}

atomic_prepare_file_target() {
  local target="$1"
  local follow_symlink="${2:-true}"
  atomic_stage_dir=""
  atomic_work_path="$target"
  atomic_target_path="$target"
  if [[ "$install_transaction_state" != "active" ]]; then
    return
  fi
  atomic_target_path="$(transaction_target_path "$target" "$follow_symlink")"
  mkdir -p "$(dirname "$atomic_target_path")"
  atomic_stage_dir="$(mktemp -d "$(dirname "$atomic_target_path")/.alpha-goal-write.XXXXXX")"
  transaction_register_transient "$atomic_stage_dir"
  atomic_work_path="$atomic_stage_dir/value"
  if [[ -e "$atomic_target_path" || -L "$atomic_target_path" ]]; then
    if [[ ! -f "$atomic_target_path" || -L "$atomic_target_path" ]]; then
      die "Atomic file target is not a regular file: $atomic_target_path"
    fi
    cp -p -- "$atomic_target_path" "$atomic_work_path"
  fi
}
atomic_discard_file_target() {
  if [[ -n "$atomic_stage_dir" ]]; then
    rm -rf -- "$atomic_stage_dir"
  fi
  atomic_stage_dir=""
  atomic_work_path=""
  atomic_target_path=""
}
atomic_commit_file_target() {
  if [[ "$install_transaction_state" != "active" ]]; then
    return
  fi
  if [[ ! -f "$atomic_work_path" || -L "$atomic_work_path" ]]; then
    die "Atomic staged file is missing or non-regular: $atomic_work_path"
  fi
  atomic_replace_path "$atomic_work_path" "$atomic_target_path" file file-or-missing ||
    die "Failed to atomically replace install target: $atomic_target_path"
  atomic_discard_file_target
}

rollback_install_transaction() {
  local failed=false
  local index
  local target
  local backup
  set +e
  for ((index=${#install_transaction_paths[@]} - 1; index >= 0; index--)); do
    target="${install_transaction_paths[$index]}"
    backup="${install_transaction_backups[$index]}"
    if [[ -z "$target" || "$target" == "/" ]]; then
      echo "Refusing unsafe rollback target: $target" >&2
      failed=true
      continue
    fi
    if ! rm -rf -- "$target"; then
      echo "Failed to clear install target during rollback: $target" >&2
      failed=true
      continue
    fi
    if [[ "${install_transaction_original_states[$index]}" == "present" ]]; then
      if ! mkdir -p "$(dirname "$target")" || ! cp -a -- "$backup" "$target"; then
        echo "Failed to restore install target from snapshot: $target" >&2
        failed=true
      fi
    fi
  done
  for target in "${install_transaction_transients[@]}"; do
    if [[ -n "$target" && "$target" != "/" ]] && ! rm -rf -- "$target"; then
      echo "Failed to remove transaction transient: $target" >&2
      failed=true
    fi
  done
  for ((index=${#install_transaction_created_dirs[@]} - 1; index >= 0; index--)); do
    rmdir -- "${install_transaction_created_dirs[$index]}" 2>/dev/null || true
  done
  if [[ "$failed" == true ]]; then
    echo "Install rollback was incomplete; recovery snapshots remain at: $install_transaction_dir" >&2
    return 1
  fi
  echo "Install failed; restored all managed targets changed by this run." >&2
  return 0
}

cleanup_install_transaction_snapshots() {
  local retained_path="$install_transaction_dir"
  if [[ -z "$retained_path" ]]; then
    return 0
  fi
  if rm -rf -- "$retained_path" && [[ ! -e "$retained_path" && ! -L "$retained_path" ]]; then
    install_transaction_dir=""
    return 0
  fi
  echo "Warning: transaction snapshots could not be removed; retained at: $retained_path" >&2
  return 1
}
install_transaction_exit() {
  local status=$?
  local rollback_status=0
  trap - EXIT
  if [[ "$install_transaction_state" == "active" || "$install_transaction_state" == "preparing" ]]; then
    rollback_install_transaction || rollback_status=$?
  fi
  if [[ "$rollback_status" -eq 0 ]]; then
    cleanup_install_transaction_snapshots || true
  fi
  if [[ "$rollback_status" -ne 0 ]]; then
    exit "$rollback_status"
  fi
  exit "$status"
}
begin_install_transaction() {
  local name
  local skill_file
  local skill_dir
  local skill_name
  install_transaction_dir="$(mktemp -d "${TMPDIR:-/tmp}/alpha-goal-install-transaction.XXXXXX")"
  mkdir -p "$install_transaction_dir/snapshots"
  install_transaction_state="preparing"
  trap install_transaction_exit EXIT
  if [[ "$sync_codex_config" == true ]]; then
    if [[ "$sync_user_templates" == true || "$sync_custom_agents" == true ]]; then
      transaction_register_path "$agents_target" true
    fi
    if [[ "$sync_user_templates" == true ]]; then
      transaction_register_path "$config_target" true
    fi
    if [[ "$sync_custom_agents" == true ]]; then
      for name in "${custom_agent_names[@]}"; do
        transaction_register_path "$custom_agents_root/$name.toml"
      done
    fi
    if [[ "$sync_user_hooks" == true ]]; then
      transaction_register_path "$hooks_target" true
    fi
    for skill_file in "${skill_files[@]}"; do
      skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
      skill_name="$(basename "$skill_dir")"
      transaction_register_path "$target_root/$skill_name"
    done
  fi
  if [[ "$sync_claude_config" == true ]]; then
    if [[ "$sync_user_templates" == true ]]; then
      transaction_register_path "$claude_target" true
    fi
    for skill_file in "${skill_files[@]}"; do
      skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
      skill_name="$(basename "$skill_dir")"
      transaction_register_path "$claude_skill_root/$skill_name"
    done
  fi
  install_transaction_state="active"
}

commit_install_transaction() {
  install_transaction_state="committed"
  cleanup_install_transaction_snapshots || true
  trap - EXIT
}
