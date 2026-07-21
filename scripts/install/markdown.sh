# shellcheck shell=bash

markdown_template_action=""

sync_markdown_template() {
  local template_path="$1"
  local target_path="$2"
  local logical_target_path="$target_path"
  local marker="$3"
  local label="$4"
  local template_content
  atomic_prepare_file_target "$logical_target_path" true
  target_path="$atomic_work_path"
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
    atomic_commit_file_target "$logical_target_path" true
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
    atomic_commit_file_target "$logical_target_path" true
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
      atomic_discard_file_target
      log "$label already has current managed template content: $target_path"
      ;;
    updated)
      markdown_template_action="updated"
      atomic_commit_file_target "$logical_target_path" true
      log "Updated managed $label template content in $target_path"
      ;;
    *)
      die "Unexpected $label template merge result: $result"
      ;;
  esac
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
remove_claude_template() {
  remove_markdown_template "$claude_template" "$claude_target" "$claude_template_marker" "CLAUDE.md"
  claude_action="$markdown_template_action"
}
