# Installation and Smoke Test

## Install

Requires Linux, Node.js 18+, Python 3, and util-linux `flock`. The installer uses repository-local JavaScript, vendored `smol-toml`, and Python only from the standard library.

```bash
scripts/install.sh
```

The script copies three public skills under the selected target's skill root:

```text
codex:  $HOME/.codex/skills
claude: $HOME/.claude/skills
```

## Options

```bash
scripts/install.sh
scripts/install.sh --uninstall
```

## Behavior

The script creates copied skill directories under target-specific independent roots. `codex` uses `$HOME/.codex/skills`; `claude` uses `$HOME/.claude/skills`. `--uninstall` is the only supported CLI option. All other choices are made in the interactive terminal flow:

- `codex`: sync Codex config and Codex skill copies.
- `claude`: sync Claude `CLAUDE.md` and Claude skill copies.
- `all`: sync or uninstall both Codex and Claude in one run.

The target menu uses Up/Down plus Enter only; `codex` is selected by default. Install asks only for that target menu, ignores `CODEX_HOME`, and then uses fixed defaults: Codex home `$HOME/.codex`, template sync enabled, Codex hook sync enabled, and verbose output disabled. For uninstall, the flow asks for the target, Codex home when relevant, template cleanup, hook cleanup when relevant, and verbose output.

Non-interactive runs are refused. Any CLI argument other than `--uninstall`, including `--help`, `--target`, `--codex-home`, `--force`, sync toggles, or `--verbose`, is rejected.

Successful install and uninstall runs print one concise success line. Failures continue to print the specific error and exit non-zero.

When installing skill copies, an existing target skill symlink is migrated only when it points to `skills/<skill-name>` in this repository or another worktree with the same Git common directory. A real directory is replaced only when it contains a valid, regular `.alpha-goal-skill-copy` marker; the new copy is staged before the managed target is moved. If activation and restoration are both obstructed, the installer exits without deleting the previous copy or staged replacement and reports both recovery paths. Unmanaged or malformed directories, Git detection failures, external symlinks, symlinks to other repo-relative paths, and ordinary files are refused. Codex and Claude receive the same runtime-neutral skill tree; Claude capability mapping is a conditional reference in that tree, not installer-injected prose.

Use `--uninstall` to enter the interactive uninstall flow. The selected target controls which managed configuration and skill copies are removed.

Uninstall is conservative outside the managed copied-skill path. It removes only managed Markdown blocks, managed hooks, `config.toml` that byte-for-byte matches `templates/config.toml`, skill copies with the install marker, and skill symlinks that resolve to this repository. Mixed user Markdown keeps user content, mixed or modified `config.toml` is preserved, unmanaged hooks are preserved, configuration symlinks are not followed or deleted, and unmanaged skill directories or external symlinks are preserved. The interactive cleanup prompts control whether Markdown/config and hook cleanup run.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `PostCompact` hook without a matcher and must not set matcher. It reloads only from an explicit current artifact path and delegates identity, owner, recovery, and termination decisions to the checkpoint helper and selected skills instead of duplicating their protocol.

Hook replacement is keyed by marker family. The current v3 template replaces other managed numbered versions in that family before it is added. The installer also removes the experimental `codex-compact-skill-recovery` family and preserves unmanaged hooks.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test checks source-identical skill copies; one-shot checkpoint updates, stale-write rejection, and automatic mutex release; missing-key TOML merge while preserving explicit values; adapter discoverability; managed hook replacement; idempotence; failure preservation; concise output; fresh and mixed-config uninstall behavior; rejected arguments; refused unmanaged targets; and ignored `CODEX_HOME`. It uses temporary homes and does not touch real user configuration.

```bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

run_installer() {
  local home_dir="$1"
  shift
  HOME="$home_dir" CODEX_HOME="$home_dir/ignored-codex-home" python3 - "$repo_root/scripts/install.sh" "$@" <<'PY'
import os
import pty
import select
import subprocess
import sys
import time

script = sys.argv[1]
args = sys.argv[2:]
target = os.environ.get("TARGET_CHOICE", "codex")
is_uninstall = "--uninstall" in args
codex_home_input = os.environ.get("CODEX_HOME_INPUT", "")
template_input = os.environ.get("TEMPLATE_INPUT", "")
hook_input = os.environ.get("HOOK_INPUT", "")
verbose_input = os.environ.get("VERBOSE_INPUT", "")

if target == "codex":
    target_action = [b"\r"]
elif target == "claude":
    target_action = [b"\x1b[B", b"\r"]
elif target == "all":
    target_action = [b"\x1b[B", b"\x1b[B", b"\r"]
else:
    raise SystemExit(f"unknown TARGET_CHOICE: {target}")

actions = [(b"Choose which app configuration", target_action)]
if is_uninstall:
    actions.extend([
        (b"Codex home", [codex_home_input.encode(), b"\r"]),
        (b"Clean up user templates", [template_input.encode(), b"\r"]),
        (b"Clean up Codex user hooks", [hook_input.encode(), b"\r"]),
        (b"Print detailed", [verbose_input.encode(), b"\r"]),
    ])

master, slave = pty.openpty()
proc = subprocess.Popen(
    ["bash", script, *args],
    stdin=slave,
    stdout=slave,
    stderr=slave,
    close_fds=True,
)
os.close(slave)

output = bytearray()
sent = set()
deadline = time.time() + 30
while True:
    if time.time() > deadline:
        proc.kill()
        raise SystemExit("interactive installer timed out")
    ready, _, _ = select.select([master], [], [], 0.1)
    if ready:
        try:
            chunk = os.read(master, 4096)
        except OSError:
            chunk = b""
        if not chunk:
            break
        output.extend(chunk)
        for pattern, chunks in actions:
            if pattern in output and pattern not in sent:
                for item in chunks:
                    os.write(master, item)
                    time.sleep(0.05)
                sent.add(pattern)
    if proc.poll() is not None:
        while True:
            ready, _, _ = select.select([master], [], [], 0)
            if not ready:
                break
            try:
                chunk = os.read(master, 4096)
            except OSError:
                break
            if not chunk:
                break
            output.extend(chunk)
        break

os.close(master)
sys.stdout.buffer.write(output)
if proc.returncode is None:
    returncode = proc.wait(timeout=5)
else:
    returncode = proc.returncode
raise SystemExit(returncode)
PY
}

expect_invalid_arg() {
  local tmp_invalid
  tmp_invalid="$(mktemp -d)"
  if HOME="$tmp_invalid" "$repo_root/scripts/install.sh" "$@" >/tmp/alpha-goal-invalid.out 2>/tmp/alpha-goal-invalid.err; then
    echo "expected invalid argument failure: $*" >&2
    exit 1
  fi
  grep -q "only --uninstall is supported" /tmp/alpha-goal-invalid.err
  rm -rf "$tmp_invalid"
}

assert_simple_success_output() {
  local output="$1"
  local message="$2"
  local message_count
  local completion_count

  grep -q "$message" <<<"$output"
  message_count="$(grep -F -o "$message" <<<"$output" | wc -l | tr -d ' ')"
  test "$message_count" -eq 1
  completion_count="$(grep -E -o "Alpha Goal [[:alnum:] _-]+ completed\\." <<<"$output" | wc -l | tr -d ' ')"
  test "$completion_count" -eq 1
  ! grep -q "Alpha Goal install summary" <<<"$output"
  ! grep -q "Alpha Goal uninstall summary" <<<"$output"
  ! grep -q "Codex skills root:" <<<"$output"
  ! grep -q "Claude skills root:" <<<"$output"
  ! grep -q "Skills root:" <<<"$output"
  ! grep -q "Codex home:" <<<"$output"
  ! grep -q "Claude home:" <<<"$output"
  ! grep -q "Templates" <<<"$output"
  ! grep -q "Hooks" <<<"$output"
  ! grep -q "╭─" <<<"$output"
  ! grep -q "╰─" <<<"$output"
}

assert_skill_tree_matches() {
  local source="$1"
  local target="$2"
  local source_count
  local target_count

  source_count="$(find "$source" -type f | wc -l | tr -d ' ')"
  target_count="$(find "$target" -type f ! -name '.alpha-goal-skill-copy' | wc -l | tr -d ' ')"
  test "$source_count" -eq "$target_count"
  while IFS= read -r source_file; do
    local relative_file="${source_file#"$source"/}"
    cmp "$source_file" "$target/$relative_file"
  done < <(find "$source" -type f | sort)
}

tmp_codex="$(mktemp -d)"
codex_output="$(run_installer "$tmp_codex")"
assert_simple_success_output "$codex_output" "Alpha Goal install completed."
! grep -q "Codex home \\[" <<<"$codex_output"
! grep -q "Replace external" <<<"$codex_output"
! grep -q "Sync user templates" <<<"$codex_output"
! grep -q "Sync Codex user hooks" <<<"$codex_output"
! grep -q "Print detailed" <<<"$codex_output"
for skill in alpha-goal executor verifier; do
  test -d "$tmp_codex/.codex/skills/$skill"
  test ! -L "$tmp_codex/.codex/skills/$skill"
  test -f "$tmp_codex/.codex/skills/$skill/SKILL.md"
  assert_skill_tree_matches "$repo_root/skills/$skill" "$tmp_codex/.codex/skills/$skill"
done
test -x "$tmp_codex/.codex/skills/alpha-goal/scripts/authority-digest.js"
test -x "$tmp_codex/.codex/skills/executor/scripts/checkpoint-lock.sh"
test -x "$tmp_codex/.codex/skills/executor/scripts/checkpoint-update.js"
test -x "$tmp_codex/.codex/skills/executor/scripts/checkpoint-lock.js"
test "$(node "$repo_root/skills/alpha-goal/scripts/authority-digest.js" "$repo_root/skills/alpha-goal/references/goal-contract-book.md")" = "$(node "$tmp_codex/.codex/skills/alpha-goal/scripts/authority-digest.js" "$tmp_codex/.codex/skills/alpha-goal/references/goal-contract-book.md")"
lock_checkpoint="$tmp_codex/lock-smoke/checkpoint.md"
mkdir -p "$(dirname "$lock_checkpoint")"
lock_helper="$tmp_codex/.codex/skills/executor/scripts/checkpoint-lock.sh"

init_successor=$'checkpoint_revision: 0\nactive_owner: executor\npayload: initial\n'
printf '%s' "$init_successor" | (cd /tmp && bash "$lock_helper" init "$lock_checkpoint") >/dev/null
cmp <(printf '%s' "$init_successor") "$lock_checkpoint"

handoff_successor=$'checkpoint_revision: 1\nactive_owner: verifier\npayload: verify-next\n'
printf '%s' "$handoff_successor" | bash "$lock_helper" execute "$lock_checkpoint" 0 verifier >/dev/null
cmp <(printf '%s' "$handoff_successor") "$lock_checkpoint"

next_successor=$'checkpoint_revision: 2\nactive_owner: executor\nroute: NEXT_ITERATION\npayload: next-iteration\n'
printf '%s' "$next_successor" | bash "$lock_helper" verify "$lock_checkpoint" 1 NEXT_ITERATION >/dev/null
cmp <(printf '%s' "$next_successor") "$lock_checkpoint"

before_invalid="$(sha256sum "$lock_checkpoint" | awk '{print $1}')"
if printf '%s' "$next_successor" | bash "$lock_helper" execute "$lock_checkpoint" 1 executor >/dev/null 2>&1; then
  echo "stale expected revision should fail" >&2
  exit 1
fi
test "$before_invalid" = "$(sha256sum "$lock_checkpoint" | awk '{print $1}')"
status_json="$(bash "$lock_helper" status "$lock_checkpoint")"
node -e 'const s=JSON.parse(process.argv[1]); if (s.revision !== "2" || s.owner !== "executor") process.exit(1)' "$status_json"
test -f "$tmp_codex/.codex/AGENTS.md"
test -f "$tmp_codex/.codex/config.toml"
test -f "$tmp_codex/.codex/hooks.json"
test ! -e "$tmp_codex/ignored-codex-home/skills/alpha-goal"
test ! -e "$tmp_codex/.claude/CLAUDE.md"
test ! -e "$tmp_codex/.claude/skills/alpha-goal"
! grep -q "references/claude-adapter.md" "$tmp_codex/.codex/skills/alpha-goal/SKILL.md"
python3 -m json.tool "$tmp_codex/.codex/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v3" "$tmp_codex/.codex/hooks.json"
grep -q "Use only an explicit current artifact path" "$tmp_codex/.codex/hooks.json"
grep -q "follow top-level active_owner" "$tmp_codex/.codex/hooks.json"
grep -q "legacy alpha-goal owner loads executor only to terminate it to caller" "$tmp_codex/.codex/hooks.json"
grep -q "caller reports PASS/BLOCKED/GOAL_CHANGED as terminal" "$tmp_codex/.codex/hooks.json"
grep -q "Later work uses a new Alpha Goal task directory" "$tmp_codex/.codex/hooks.json"
grep -q "accepted with valid completeness/digest loads alpha-goal to confirm the goal is unchanged" "$tmp_codex/.codex/hooks.json"
! grep -q "technical_design.md" "$tmp_codex/.codex/hooks.json"
grep -q "checkpoint.md" "$tmp_codex/.codex/hooks.json"
codex_repeat_output="$(run_installer "$tmp_codex")"
assert_simple_success_output "$codex_repeat_output" "Alpha Goal install completed."
test "$(grep -o "codex-alpha-goal-compact-recovery:v3" "$tmp_codex/.codex/hooks.json" | wc -l | tr -d ' ')" -eq 1

tmp_claude="$(mktemp -d)"
claude_output="$(TARGET_CHOICE=claude run_installer "$tmp_claude")"
assert_simple_success_output "$claude_output" "Alpha Goal install completed."
for skill in alpha-goal executor verifier; do
  test -d "$tmp_claude/.claude/skills/$skill"
  test ! -L "$tmp_claude/.claude/skills/$skill"
  test -f "$tmp_claude/.claude/skills/$skill/SKILL.md"
  assert_skill_tree_matches "$repo_root/skills/$skill" "$tmp_claude/.claude/skills/$skill"
done
test -f "$tmp_claude/.claude/CLAUDE.md"
test ! -e "$tmp_claude/.codex/AGENTS.md"
test ! -e "$tmp_claude/.codex/skills/alpha-goal"
! grep -q "references/claude-adapter.md" "$tmp_claude/.claude/skills/alpha-goal/SKILL.md"
grep -q '\$HOME/.claude/skills/alpha-goal/references/claude-adapter.md' "$tmp_claude/.claude/CLAUDE.md"
cmp "$repo_root/skills/alpha-goal/references/claude-adapter.md" "$tmp_claude/.claude/skills/alpha-goal/references/claude-adapter.md"

tmp_all="$(mktemp -d)"
all_install_output="$(TARGET_CHOICE=all run_installer "$tmp_all")"
assert_simple_success_output "$all_install_output" "Alpha Goal install completed."
! grep -q "Codex home \\[" <<<"$all_install_output"
! grep -q "Replace external" <<<"$all_install_output"
! grep -q "Sync user templates" <<<"$all_install_output"
! grep -q "Sync Codex user hooks" <<<"$all_install_output"
! grep -q "Print detailed" <<<"$all_install_output"
for skill in alpha-goal executor verifier; do
  test -d "$tmp_all/.codex/skills/$skill"
  test -d "$tmp_all/.claude/skills/$skill"
done
test -f "$tmp_all/.codex/AGENTS.md"
test -f "$tmp_all/.codex/config.toml"
test -f "$tmp_all/.codex/hooks.json"
test -f "$tmp_all/.claude/CLAUDE.md"
! grep -q "references/claude-adapter.md" "$tmp_all/.codex/skills/alpha-goal/SKILL.md"
! grep -q "references/claude-adapter.md" "$tmp_all/.claude/skills/alpha-goal/SKILL.md"
grep -q '\$HOME/.claude/skills/alpha-goal/references/claude-adapter.md' "$tmp_all/.claude/CLAUDE.md"

tmp_upgrade="$(mktemp -d)"
mkdir -p "$tmp_upgrade/.codex"
python3 - "$tmp_upgrade/.codex/hooks.json" <<'PY'
import json
import sys

data = {
    "hooks": {
        "PostCompact": [
            {"hooks": [{"type": "command", "command": ": 'codex-alpha-goal-compact-recovery:v1'; printf old"}]},
            {"hooks": [{"type": "command", "command": ": 'codex-alpha-goal-compact-recovery:v2'; printf old2"}]},
            {"hooks": [{"type": "command", "command": ": 'codex-compact-skill-recovery:experimental'; printf experimental"}]},
            {"hooks": [{"type": "command", "command": "printf unmanaged"}]},
        ]
    }
}
with open(sys.argv[1], "w") as handle:
    json.dump(data, handle)
PY
upgrade_output="$(run_installer "$tmp_upgrade")"
assert_simple_success_output "$upgrade_output" "Alpha Goal install completed."
! grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_upgrade/.codex/hooks.json"
! grep -q "codex-alpha-goal-compact-recovery:v2" "$tmp_upgrade/.codex/hooks.json"
! grep -q "codex-compact-skill-recovery:experimental" "$tmp_upgrade/.codex/hooks.json"
test "$(grep -o "codex-alpha-goal-compact-recovery:v3" "$tmp_upgrade/.codex/hooks.json" | wc -l | tr -d ' ')" -eq 1
grep -q "printf unmanaged" "$tmp_upgrade/.codex/hooks.json"

tmp_merge="$(mktemp -d)"
mkdir -p "$tmp_merge/.codex"
cat > "$tmp_merge/.codex/config.toml" <<'EOF'
[features]
multi_agent = false

[custom]
keep = "yes"
EOF
merge_install_output="$(run_installer "$tmp_merge")"
assert_simple_success_output "$merge_install_output" "Alpha Goal install completed."
node - "$tmp_merge/.codex/config.toml" "$repo_root/vendor/smol-toml/dist/index.cjs" <<'JS'
const fs = require("node:fs");
const toml = require(process.argv[3]);
const data = toml.parse(fs.readFileSync(process.argv[2], "utf8"));
if (data.features?.multi_agent !== false) process.exit(1);
if (data.features?.default_mode_request_user_input !== true) process.exit(1);
if (data.features?.child_agents_md !== true) process.exit(1);
if (data.features?.multi_agent_v2?.usage_hint_enabled !== true) process.exit(1);
if (data.agents?.max_threads !== 6 || data.agents?.max_depth !== 1) process.exit(1);
if (data.custom?.keep !== "yes") process.exit(1);
JS
merge_uninstall_output="$(run_installer "$tmp_merge" --uninstall)"
assert_simple_success_output "$merge_uninstall_output" "Alpha Goal uninstall completed."
test -f "$tmp_merge/.codex/config.toml"
grep -q 'keep = "yes"' "$tmp_merge/.codex/config.toml"
grep -q 'multi_agent = false' "$tmp_merge/.codex/config.toml"
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_merge/.codex/skills/$skill"
done
test ! -e "$tmp_merge/.codex/AGENTS.md"
test ! -e "$tmp_merge/.codex/hooks.json"

all_uninstall_output="$(TARGET_CHOICE=all run_installer "$tmp_all" --uninstall)"
assert_simple_success_output "$all_uninstall_output" "Alpha Goal uninstall completed."
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_all/.codex/skills/$skill"
  test ! -e "$tmp_all/.claude/skills/$skill"
done
test ! -e "$tmp_all/.codex/AGENTS.md"
test ! -e "$tmp_all/.codex/config.toml"
test ! -e "$tmp_all/.codex/hooks.json"
test ! -e "$tmp_all/.claude/CLAUDE.md"

tmp_noninteractive_install="$(mktemp -d)"
tmp_noninteractive_uninstall="$(mktemp -d)"
if noninteractive_install_output="$(HOME="$tmp_noninteractive_install" "$repo_root/scripts/install.sh" </dev/null 2>&1)"; then
  echo "non-interactive install should fail" >&2
  exit 1
fi
grep -q "Interactive terminal required" <<<"$noninteractive_install_output"
test ! -e "$tmp_noninteractive_install/.codex/skills/alpha-goal"
if noninteractive_uninstall_output="$(HOME="$tmp_noninteractive_uninstall" "$repo_root/scripts/install.sh" --uninstall </dev/null 2>&1)"; then
  echo "non-interactive uninstall should fail" >&2
  exit 1
fi
grep -q "Interactive terminal required" <<<"$noninteractive_uninstall_output"
test ! -e "$tmp_noninteractive_uninstall/.codex/skills/alpha-goal"

tmp_conflict="$(mktemp -d)"
if conflict_output="$(TARGET_CHOICE=all CODEX_HOME_INPUT="$tmp_conflict/.claude" run_installer "$tmp_conflict" --uninstall 2>&1)"; then
  echo "interactive all uninstall should reject identical skill roots" >&2
  exit 1
fi
grep -q "requires distinct Codex and Claude skill roots" <<<"$conflict_output"

tmp_link_conflict="$(mktemp -d)"
mkdir -p "$tmp_link_conflict/.claude"
ln -s "$tmp_link_conflict/.claude" "$tmp_link_conflict/.codex"
if link_conflict_output="$(TARGET_CHOICE=all run_installer "$tmp_link_conflict" 2>&1)"; then
  echo "interactive all should reject symlinked identical skill roots" >&2
  exit 1
fi
grep -q "requires distinct Codex and Claude skill roots" <<<"$link_conflict_output"

tmp_external="$(mktemp -d)"
mkdir -p "$tmp_external/.codex/skills" "$tmp_external/external-alpha-goal"
ln -s "$tmp_external/external-alpha-goal" "$tmp_external/.codex/skills/alpha-goal"
if external_output="$(run_installer "$tmp_external" 2>&1)"; then
  echo "install should refuse external skill symlinks without an override" >&2
  exit 1
fi
grep -q "External skill symlinks are not replaced during install" <<<"$external_output"
test -L "$tmp_external/.codex/skills/alpha-goal"

tmp_unmanaged="$(mktemp -d)"
mkdir -p "$tmp_unmanaged/.codex/skills/alpha-goal"
printf 'user-owned\n' > "$tmp_unmanaged/.codex/skills/alpha-goal/sentinel"
if unmanaged_output="$(run_installer "$tmp_unmanaged" 2>&1)"; then
  echo "install should refuse an unmanaged same-name skill directory" >&2
  exit 1
fi
grep -q "Refusing to replace unmanaged or malformed skill directory" <<<"$unmanaged_output"
grep -q "user-owned" "$tmp_unmanaged/.codex/skills/alpha-goal/sentinel"
test ! -e "$tmp_unmanaged/.codex/skills/alpha-goal/.alpha-goal-skill-copy"

tmp_malformed="$(mktemp -d)"
mkdir -p "$tmp_malformed/.codex/skills/alpha-goal"
printf 'not-a-managed-marker\n' > "$tmp_malformed/.codex/skills/alpha-goal/.alpha-goal-skill-copy"
printf 'keep-me\n' > "$tmp_malformed/.codex/skills/alpha-goal/sentinel"
if malformed_output="$(run_installer "$tmp_malformed" 2>&1)"; then
  echo "install should refuse a malformed managed marker" >&2
  exit 1
fi
grep -q "Refusing to replace unmanaged or malformed skill directory" <<<"$malformed_output"
grep -q "keep-me" "$tmp_malformed/.codex/skills/alpha-goal/sentinel"

tmp_recovery="$(mktemp -d)"
run_installer "$tmp_recovery" >/dev/null
printf 'old-copy\n' > "$tmp_recovery/.codex/skills/alpha-goal/recovery-sentinel"
mkdir -p "$tmp_recovery/fake-bin"
real_mv="$(command -v mv)"
python3 - "$tmp_recovery/fake-bin/mv" <<'PY'
import os
import sys

wrapper = r'''#!/usr/bin/env bash
if [[ "$1" == *"/.alpha-goal-skill-stage."*"/alpha-goal" && "$2" == *"/.codex/skills/alpha-goal" ]]; then
  mkdir -p "$2"
  printf 'source=concurrent-writer\n' > "$2/.alpha-goal-skill-copy"
  printf 'collision\n' > "$2/user-sentinel"
fi
exec "$REAL_MV" "$@"
'''
with open(sys.argv[1], "w") as handle:
    handle.write(wrapper)
os.chmod(sys.argv[1], 0o755)
PY
if recovery_output="$(PATH="$tmp_recovery/fake-bin:$PATH" REAL_MV="$real_mv" run_installer "$tmp_recovery" 2>&1)"; then
  echo "collision-injected replacement should fail" >&2
  exit 1
fi
grep -q "Previous managed copy preserved at:" <<<"$recovery_output"
recovery_stage="$(find "$tmp_recovery/.codex/skills" -maxdepth 1 -type d -name '.alpha-goal-skill-stage.*' -print -quit)"
test -n "$recovery_stage"
grep -q "old-copy" "$recovery_stage/original/recovery-sentinel"
test -f "$recovery_stage/alpha-goal/SKILL.md" || test -f "$tmp_recovery/.codex/skills/alpha-goal/alpha-goal/SKILL.md"
grep -q "collision" "$tmp_recovery/.codex/skills/alpha-goal/user-sentinel"

codex_uninstall_output="$(run_installer "$tmp_codex" --uninstall)"
assert_simple_success_output "$codex_uninstall_output" "Alpha Goal uninstall completed."
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_codex/.codex/skills/$skill"
done
test ! -e "$tmp_codex/.codex/AGENTS.md"
test ! -e "$tmp_codex/.codex/config.toml"
test ! -e "$tmp_codex/.codex/hooks.json"

claude_uninstall_output="$(TARGET_CHOICE=claude run_installer "$tmp_claude" --uninstall)"
assert_simple_success_output "$claude_uninstall_output" "Alpha Goal uninstall completed."
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_claude/.claude/skills/$skill"
done
test ! -e "$tmp_claude/.claude/CLAUDE.md"

expect_invalid_arg --target
expect_invalid_arg --target codex
expect_invalid_arg --target claude
expect_invalid_arg --target all
expect_invalid_arg --target=codex
expect_invalid_arg --target=claude
expect_invalid_arg --target=all
expect_invalid_arg --codex-home
expect_invalid_arg --codex-home /tmp/x
expect_invalid_arg --codex-home=/tmp/x
expect_invalid_arg --uninstall --target codex
expect_invalid_arg --uninstall --target claude
expect_invalid_arg --force
expect_invalid_arg --sync-user-templates
expect_invalid_arg --no-sync-user-templates
expect_invalid_arg --sync-user-hooks
expect_invalid_arg --no-sync-user-hooks
expect_invalid_arg --verbose
expect_invalid_arg -h
expect_invalid_arg --help
expect_invalid_arg positional

bash -n scripts/install.sh
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
node tools/test_checkpoint_lock.js
rm -rf "$tmp_codex" "$tmp_claude" "$tmp_all" "$tmp_upgrade" "$tmp_merge" "$tmp_noninteractive_install" "$tmp_noninteractive_uninstall" "$tmp_conflict" "$tmp_link_conflict" "$tmp_external" "$tmp_unmanaged" "$tmp_malformed" "$tmp_recovery"
rm -f /tmp/alpha-goal-invalid.out /tmp/alpha-goal-invalid.err
```

## Prompts

```text
$alpha-goal 根据请求和已发现事实形成 Goal Frame，再判断走 DIRECT 还是 PERSIST。
$executor 从已接受的 Goal Contract 恢复并执行下一批授权工作。
$verifier 对当前持久 checkpoint 做风险边界或最终状态验证。
```

## Count budget

The validator keeps non-script skill instructions strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and excluded because they are executable resources rather than loaded skill instruction prose. Structure validation deliberately ignores skill prose; semantic quality is covered by independent review against the static boundary corpus and, when separately authorized, runtime evaluations.
