# Installation and Smoke Test

## Install

Requires Node.js 18+ when syncing Codex config or hooks. The installer uses repository-local JavaScript and vendored `smol-toml` for config TOML merge; Python 3.11 `tomllib` is not required.

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

The target menu uses Up/Down plus Enter only; `codex` is selected by default. Install asks only for that target menu, ignores `CODEX_HOME`, and then uses fixed defaults: Codex home `$HOME/.codex`, `force=false`, template sync enabled, Codex hook sync enabled, and verbose output disabled. For uninstall, the flow asks for the target, Codex home when relevant, template cleanup, hook cleanup when relevant, and verbose output.

Non-interactive runs are refused. Any CLI argument other than `--uninstall`, including `--help`, `--target`, `--codex-home`, `--force`, sync toggles, or `--verbose`, is rejected.

Successful install and uninstall runs print one concise success line. Failures continue to print the specific error and exit non-zero.

When installing skill copies, an existing target skill symlink is migrated only when it points to `skills/<skill-name>` in this repository or another worktree with the same Git common directory. Existing managed real directories are removed and recopied. Git detection failures, external symlinks, symlinks to other repo-relative paths, and ordinary files are refused. For `claude`, the installer injects a ClaudeAdapter Entry Gate reminder into the installed Alpha Goal copy; `codex` installs leave that reminder out.

Use `--uninstall` to enter the interactive uninstall flow. The selected target controls which managed configuration and skill copies are removed.

Uninstall is conservative outside the managed copied-skill path. It removes only managed Markdown blocks, managed hooks, `config.toml` that byte-for-byte matches `templates/config.toml`, skill copies with the install marker, and skill symlinks that resolve to this repository. Mixed user Markdown keeps user content, mixed or modified `config.toml` is preserved, unmanaged hooks are preserved, configuration symlinks are not followed or deleted, and unmanaged skill directories or external symlinks are preserved. The interactive cleanup prompts control whether Markdown/config and hook cleanup run.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `PostCompact` hook without a matcher and must not set matcher; it prints a static policy telling Codex to reload `alpha-goal`, `executor`, or `verifier` when applicable after compaction. For active Alpha Goal work, it resumes from `goal-contract.md`, reads `technical_design.md` when present for implementation, repair, refactor, hardening, cross-file behavior, interface/data-model changes, or material risk after Goal Contract Confirmation Gate selects technical design, resolves the task from an explicit artifact path when available; otherwise scans task directories and stops on ambiguity instead of choosing the newest task, and requires `checkpoint.md` for executor checklist, slice evidence, and verification handoff. `executor` requires an accepted Goal Contract and persists its checklist in `checkpoint.md`; `verifier` runs after every important slice. Native Goal Sync is not hook-driven: `alpha-goal` may create or reuse the current thread's native goal only after approval, and the calling Agent manages terminal lifecycle updates from verifier routes.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test checks target-specific skill copies, config sync, ClaudeAdapter injection, hook recovery text, install prompt reduction, concise success output, uninstall cleanup, rejected legacy CLI arguments, refused external symlinks, and ignored `CODEX_HOME` values. It does not touch real user configuration.

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
done
test -f "$tmp_codex/.codex/AGENTS.md"
test -f "$tmp_codex/.codex/config.toml"
test -f "$tmp_codex/.codex/hooks.json"
test ! -e "$tmp_codex/ignored-codex-home/skills/alpha-goal"
test ! -e "$tmp_codex/.claude/CLAUDE.md"
test ! -e "$tmp_codex/.claude/skills/alpha-goal"
! grep -q "references/claude-adapter.md" "$tmp_codex/.codex/skills/alpha-goal/SKILL.md"
python3 -m json.tool "$tmp_codex/.codex/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_codex/.codex/hooks.json"
grep -q "read goal-contract.md first" "$tmp_codex/.codex/hooks.json"
grep -q "technical_design.md" "$tmp_codex/.codex/hooks.json"
grep -q "checkpoint.md" "$tmp_codex/.codex/hooks.json"

tmp_claude="$(mktemp -d)"
claude_output="$(TARGET_CHOICE=claude run_installer "$tmp_claude")"
assert_simple_success_output "$claude_output" "Alpha Goal install completed."
for skill in alpha-goal executor verifier; do
  test -d "$tmp_claude/.claude/skills/$skill"
  test ! -L "$tmp_claude/.claude/skills/$skill"
  test -f "$tmp_claude/.claude/skills/$skill/SKILL.md"
done
test -f "$tmp_claude/.claude/CLAUDE.md"
test ! -e "$tmp_claude/.codex/AGENTS.md"
test ! -e "$tmp_claude/.codex/skills/alpha-goal"
grep -q "references/claude-adapter.md" "$tmp_claude/.claude/skills/alpha-goal/SKILL.md"

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
grep -q "references/claude-adapter.md" "$tmp_all/.claude/skills/alpha-goal/SKILL.md"

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

if HOME="$(mktemp -d)" "$repo_root/scripts/install.sh" </dev/null; then
  echo "non-interactive install should fail" >&2
  exit 1
fi
if HOME="$(mktemp -d)" "$repo_root/scripts/install.sh" --uninstall </dev/null; then
  echo "non-interactive uninstall should fail" >&2
  exit 1
fi

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
  echo "install should refuse external skill symlinks with force=false" >&2
  exit 1
fi
grep -q "External skill symlinks are not replaced during install" <<<"$external_output"
test -L "$tmp_external/.codex/skills/alpha-goal"

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
rm -rf "$tmp_codex" "$tmp_claude" "$tmp_all" "$tmp_conflict" "$tmp_link_conflict" "$tmp_external"
rm -f /tmp/alpha-goal-invalid.out /tmp/alpha-goal-invalid.err
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$executor 根据 Goal Contract 和已有条件检查点做下一轮最有用且可验证的有界 slice。
$verifier 对照验收证据和 hard-blocking checklist 验证完成、声明边界和 blocker，并返回下一步 route。
```

## Count budget

The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks.
This budget preserves trigger behavior, durable state, authority gates, hard-blocking acceptance checks, route decisions, and verifier feedback without over-compressing their meaning.
