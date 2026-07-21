# shellcheck shell=bash
install_transaction_state="inactive"
install_transaction_dir=""
install_transaction_keys=()
install_transaction_paths=()
install_transaction_backups=()
install_transaction_backup_hardlinks=()
install_transaction_backup_anchors=()
install_transaction_original_states=()
install_transaction_created_dirs=()
install_transaction_transients=()
install_transaction_snapshot_dirs=()
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
  local backup_hardlink=false
  local backup_anchor=""
  local link_count
  local snapshot_dir
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
    if [[ -f "$actual_target" && ! -L "$actual_target" ]]; then
      cp -a -- "$actual_target" "$backup" || die "Failed to snapshot install target: $actual_target"
      link_count="$(python3 - "$actual_target" <<'PY'
import os
import sys

print(os.stat(sys.argv[1]).st_nlink)
PY
)" || die "Failed to inspect hard-link count for install target: $actual_target"
      if (( link_count > 1 )); then
        snapshot_dir="$(mktemp -d "$(dirname "$actual_target")/.alpha-goal-install-snapshot.XXXXXX")" ||
          die "Failed to create hard-link snapshot directory for install target: $actual_target"
        backup_anchor="$snapshot_dir/value"
        if ! ln "$actual_target" "$backup_anchor"; then
          rm -rf -- "$snapshot_dir"
          die "Failed to create hard-link snapshot for install target: $actual_target"
        fi
        install_transaction_snapshot_dirs+=("$snapshot_dir")
        backup_hardlink=true
      fi
    else
      cp -a -- "$actual_target" "$backup" || die "Failed to snapshot install target: $actual_target"
    fi
    original_state="present"
  fi
  install_transaction_keys+=("$key")
  install_transaction_paths+=("$actual_target")
  install_transaction_backups+=("$backup")
  install_transaction_backup_hardlinks+=("$backup_hardlink")
  install_transaction_backup_anchors+=("$backup_anchor")
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
transaction_path_matches_snapshot() {
  local index="$1"
  python3 - \
    "${install_transaction_paths[$index]}" \
    "${install_transaction_backups[$index]}" \
    "${install_transaction_original_states[$index]}" \
    "${install_transaction_backup_hardlinks[$index]}" \
    "${install_transaction_backup_anchors[$index]}" <<'PY'
import os
import stat
import sys

target, backup, original_state, backup_hardlink, backup_anchor = sys.argv[1:]

if original_state == "missing":
    raise SystemExit(0 if not os.path.lexists(target) else 1)


def same(left, right):
    try:
        left_stat = os.lstat(left)
        right_stat = os.lstat(right)
    except FileNotFoundError:
        return False

    if stat.S_IFMT(left_stat.st_mode) != stat.S_IFMT(right_stat.st_mode):
        return False
    if stat.S_IMODE(left_stat.st_mode) != stat.S_IMODE(right_stat.st_mode):
        return False
    if stat.S_ISLNK(left_stat.st_mode):
        return os.readlink(left) == os.readlink(right)
    if stat.S_ISREG(left_stat.st_mode):
        if backup_hardlink == "true":
            try:
                anchor_stat = os.lstat(backup_anchor)
            except FileNotFoundError:
                return False
            if not os.path.samestat(left_stat, anchor_stat):
                return False
        if left_stat.st_size != right_stat.st_size:
            return False
        with open(left, "rb") as left_file, open(right, "rb") as right_file:
            while True:
                left_chunk = left_file.read(1024 * 1024)
                right_chunk = right_file.read(1024 * 1024)
                if left_chunk != right_chunk:
                    return False
                if not left_chunk:
                    return True
    if stat.S_ISDIR(left_stat.st_mode):
        left_names = sorted(os.listdir(left))
        if left_names != sorted(os.listdir(right)):
            return False
        return all(same(os.path.join(left, name), os.path.join(right, name)) for name in left_names)
    return left_stat.st_rdev == right_stat.st_rdev


raise SystemExit(0 if same(target, backup) else 1)
PY
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
  local backup_hardlink
  local backup_anchor
  set +e
  for ((index=${#install_transaction_paths[@]} - 1; index >= 0; index--)); do
    target="${install_transaction_paths[$index]}"
    backup="${install_transaction_backups[$index]}"
    backup_hardlink="${install_transaction_backup_hardlinks[$index]}"
    backup_anchor="${install_transaction_backup_anchors[$index]}"
    if [[ "$uninstall" == true ]] && transaction_path_matches_snapshot "$index"; then
      continue
    fi
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
      if ! mkdir -p "$(dirname "$target")"; then
        echo "Failed to restore install target from snapshot: $target" >&2
        failed=true
      elif [[ "$backup_hardlink" == true ]]; then
        if ! python3 - "$backup" "$backup_anchor" <<'PY'
import os
import stat
import sys

source, anchor = sys.argv[1:]
source_stat = os.stat(source)
anchor_stat = os.stat(anchor)


def same_content():
    if source_stat.st_size != anchor_stat.st_size:
        return False
    with open(source, "rb") as source_file, open(anchor, "rb") as anchor_file:
        while True:
            source_chunk = source_file.read(1024 * 1024)
            anchor_chunk = anchor_file.read(1024 * 1024)
            if source_chunk != anchor_chunk:
                return False
            if not source_chunk:
                return True


content_changed = not same_content()
mode_changed = stat.S_IMODE(source_stat.st_mode) != stat.S_IMODE(anchor_stat.st_mode)
mtime_changed = source_stat.st_mtime_ns != anchor_stat.st_mtime_ns
if content_changed:
    with open(source, "rb") as source_file, open(anchor, "wb") as anchor_file:
        while True:
            chunk = source_file.read(1024 * 1024)
            if not chunk:
                break
            anchor_file.write(chunk)
if mode_changed:
    os.chmod(anchor, stat.S_IMODE(source_stat.st_mode))
if content_changed or mtime_changed:
    os.utime(anchor, ns=(anchor_stat.st_atime_ns, source_stat.st_mtime_ns))
PY
        then
          echo "Failed to restore hard-link snapshot contents: $target" >&2
          failed=true
        elif ! ln "$backup_anchor" "$target"; then
          echo "Failed to restore hard-link identity from snapshot: $target" >&2
          failed=true
        fi
      elif ! cp -a -- "$backup" "$target"; then
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
    echo "Install rollback was incomplete; recovery snapshots remain at: $install_transaction_dir ${install_transaction_snapshot_dirs[*]}" >&2
    return 1
  fi
  echo "Install failed; restored all managed targets changed by this run." >&2
  return 0
}

cleanup_install_transaction_snapshots() {
  local retained_path="$install_transaction_dir"
  local snapshot_dir
  local failed=false
  local retained_paths=()
  if [[ -z "$retained_path" ]]; then
    return 0
  fi
  if ! rm -rf -- "$retained_path" || [[ -e "$retained_path" || -L "$retained_path" ]]; then
    retained_paths+=("$retained_path")
    failed=true
  fi
  if (( ${#install_transaction_snapshot_dirs[@]} > 0 )); then
    for snapshot_dir in "${install_transaction_snapshot_dirs[@]}"; do
      if ! rm -rf -- "$snapshot_dir" || [[ -e "$snapshot_dir" || -L "$snapshot_dir" ]]; then
        retained_paths+=("$snapshot_dir")
        failed=true
      fi
    done
  fi
  if [[ "$failed" == false ]]; then
    install_transaction_dir=""
    install_transaction_snapshot_dirs=()
    return 0
  fi
  echo "Warning: transaction snapshots could not be removed; retained at: ${retained_paths[*]}" >&2
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
register_skill_transaction_paths() {
  local root="$1"
  local skill_file
  local skill_dir
  local skill_name

  if [[ "$uninstall" == true ]]; then
    for skill_name in "${required_skills[@]}"; do
      transaction_register_path "$root/$skill_name"
    done
    return
  fi

  for skill_file in "${skill_files[@]}"; do
    skill_dir="$(cd "$(dirname "$skill_file")" && pwd -P)"
    skill_name="$(basename "$skill_dir")"
    transaction_register_path "$root/$skill_name"
  done
}
begin_install_transaction() {
  local name
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
    register_skill_transaction_paths "$target_root"
  fi
  if [[ "$sync_claude_config" == true ]]; then
    if [[ "$sync_user_templates" == true ]]; then
      transaction_register_path "$claude_target" true
    fi
    register_skill_transaction_paths "$claude_skill_root"
  fi
  install_transaction_state="active"
}

commit_install_transaction() {
  install_transaction_state="committed"
  cleanup_install_transaction_snapshots || true
  trap - EXIT
}
