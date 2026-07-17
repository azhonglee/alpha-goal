#!/usr/bin/env bash
set -u
umask 077

script_path=${BASH_SOURCE[0]}
if [[ $script_path == */* ]]; then script_dir=${script_path%/*}; else script_dir=.; fi
script_dir="$(cd "$script_dir" && pwd)"
command=${1-}
checkpoint=${2-}

fail() {
  printf '{"ok":false,"error":"%s","message":"%s"}\n' "$1" "$2" >&2
  exit "$3"
}

case ${checkpoint##*/} in
  checkpoint.jsonl) internal="$script_dir/checkpoint-append.js" ;;
  checkpoint.md) internal="$script_dir/checkpoint-update.js" ;;
  *) internal="$script_dir/checkpoint-append.js" ;;
esac

node_bin=$(command -v node 2>/dev/null) || fail NODE_UNAVAILABLE "node not found in PATH" 1

if [[ $command == status ]]; then
  exec "$node_bin" "$internal" "$@"
fi

case "$command" in
  init|execute|verify|terminate) ;;
  *) exec "$node_bin" "$internal" "$@" ;;
esac

if (( $# < 2 )); then
  exec "$node_bin" "$internal" "$@"
fi

if [[ ${checkpoint##*/} != checkpoint.jsonl && ${checkpoint##*/} != checkpoint.md ]]; then
  fail INVALID_CHECKPOINT "target must be checkpoint.jsonl or checkpoint.md" 1
fi
command -v flock >/dev/null 2>&1 || fail FLOCK_UNAVAILABLE "util-linux flock not found in PATH" 1

if ! { exec 9>"${checkpoint}.mutex"; } 2>/dev/null; then
  fail INVALID_MUTEX "cannot open checkpoint mutex" 1
fi

flock -n -E 2 9 2>/dev/null
code=$?
if (( code == 2 )); then
  fail LOCK_HELD "checkpoint mutex is held" 2
fi
if (( code != 0 )); then
  fail FLOCK_FAILED "util-linux flock failed" 1
fi

exec "$node_bin" "$internal" --locked "$@"
