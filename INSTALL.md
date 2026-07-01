# Installation and Smoke Test

## Install

Requires Node.js 18+ when syncing Codex config or hooks. The installer uses repository-local JavaScript and vendored `smol-toml` for config TOML merge; Python 3.11 `tomllib` is not required.

```bash
scripts/install.sh
```

The script copies three public skills under `$HOME/.agents/skills`:

```text
alpha-goal
executor
verifier
```

## Options

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
scripts/install.sh --target global
scripts/install.sh --target codex
scripts/install.sh --target claude
scripts/install.sh --uninstall --target global
scripts/install.sh --uninstall --target codex
scripts/install.sh --uninstall --target claude
scripts/install.sh --force
scripts/install.sh --no-sync-user-templates
scripts/install.sh --no-sync-user-hooks
scripts/install.sh --verbose
```

## Behavior

The script creates copied directories at `$HOME/.agents/skills/<skill-name>` for required public skills and cleans same-repo links for merged old public skills. `global` and `claude` targets also create `$HOME/.claude/skills/<skill-name>` symlinks pointing at the shared copies. During migration, it also removes same-repo skill symlinks left under `${CODEX_HOME:-$HOME/.codex}/skills`; real files, directories, and symlinks to other locations are preserved there. The selected `--target` controls configuration sync and whether Claude skill links are created:

- `global`: sync Codex config plus Claude `CLAUDE.md`, and link Claude skills.
- `codex`: sync Codex config only.
- `claude`: sync Claude `CLAUDE.md` and link Claude skills.

Without `--target`, an interactive terminal shows a color+Unicode arrow-key menu for `global`, `codex`, or `claude`; `codex` is selected by default and Enter confirms the highlighted target. The menu states that shared skills install to `$HOME/.agents/skills`, and uses Up/Down plus Enter only; number keys do not select a target. The installer prints a grouped summary after install or uninstall; the summary shows only active effects for the selected target and omits skipped lines. Install summaries omit `Result`, `Skills ... linked`, and `Install target` lines. Non-interactive runs still default to `codex`. Codex config uses `${CODEX_HOME:-$HOME/.codex}` or `--codex-home`. Claude config uses `$HOME/.claude/CLAUDE.md` from `templates/CLAUDE.md`, and Claude skill links use `$HOME/.claude/skills`.

When installing skill copies, an existing `$HOME/.agents/skills/<skill-name>` symlink is migrated without `--force` only when it points to `skills/<skill-name>` in this repository or another worktree with the same Git common directory. Existing real directories at `$HOME/.agents/skills/<skill-name>` are removed and recopied. Git detection failures, external symlinks, and symlinks to other repo-relative paths still require `--force` or are refused; ordinary files are always refused. Claude skill symlinks follow the same same-repo adoption rule, but existing non-symlink Claude skill paths are preserved.

Use `--uninstall` to remove managed install artifacts for the selected target. `--uninstall --target codex` removes only managed Codex configuration and keeps shared `$HOME/.agents/skills` copies plus Claude skill links. `--uninstall --target claude` removes only managed Claude `CLAUDE.md` content and keeps shared skills plus Claude skill links. `--uninstall --target global` removes managed Codex and Claude configuration plus this repository's copied skills under `$HOME/.agents/skills` and Claude skill links under `$HOME/.claude/skills`. Uninstall does not remove legacy `${CODEX_HOME:-$HOME/.codex}/skills` paths.

Uninstall is conservative outside the managed copied-skill path. It removes only managed Markdown blocks, managed hooks, `config.toml` that byte-for-byte matches `templates/config.toml`, skill copies with the install marker, and skill symlinks that resolve to this repository or the shared skill copy. Mixed user Markdown keeps user content, mixed or modified `config.toml` is preserved, unmanaged hooks are preserved, configuration symlinks are not followed or deleted, and unmanaged skill directories or external symlinks are preserved. `--no-sync-user-templates` skips Markdown and `config.toml` cleanup; `--no-sync-user-hooks` skips hooks cleanup.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `PostCompact` hook with matcher `^(manual|auto)$` and prints a static policy telling Codex to decide whether `alpha-goal`, `executor`, or `verifier` applies after manual or automatic compaction, and to load the matching skill before continuing. For active Alpha Goal tasks, it resumes from draft or accepted `goal-contract.md` first and reads `technical_design.md` with the Goal Contract when it exists; accepted status gates only `executor` execution handoff. `verifier` covers evidence, claim boundary, defect/risk sweep, and material unclaimed issues. Use `--no-sync-user-templates` to skip Codex AGENTS/config and Claude CLAUDE template updates. Use `--no-sync-user-hooks` to skip Codex hook template updates.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test checks installed skill copies, Claude skill links, target-specific config sync, hook recovery text, and state fixture shape with a temporary HOME and temporary CODEX_HOME, without requiring runtime skill scripts or touching real user configuration. The PTY portion also asserts the target menu structure, ANSI color, Unicode selected state, grouped summary output, and that summary output omits skipped lines and the removed install summary lines.

```bash
set -euo pipefail
tmp_home="$(mktemp -d)"
tmp_codex_home="$tmp_home/.codex"
mkdir -p "$tmp_codex_home"
cat >"$tmp_codex_home/hooks.json" <<'EOF'
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "^compact$",
        "hooks": [
          {
            "type": "command",
            "command": ": 'codex-alpha-goal-compact-recovery:v1'; printf '%s\\n' 'old managed hook'"
          }
        ]
      }
    ]
  }
}
EOF
HOME="$tmp_home" CODEX_HOME="$tmp_codex_home" scripts/install.sh --target global
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
workspace_slug="$(basename "$repo_root")"
for skill in alpha-goal executor verifier; do
  test -d "$tmp_home/.agents/skills/$skill"
  test ! -L "$tmp_home/.agents/skills/$skill"
  test -f "$tmp_home/.agents/skills/$skill/SKILL.md"
  test -L "$tmp_home/.claude/skills/$skill"
  test "$(readlink "$tmp_home/.claude/skills/$skill")" = "$tmp_home/.agents/skills/$skill"
done
test -f "$tmp_codex_home/AGENTS.md"
test -f "$tmp_codex_home/config.toml"
test -f "$tmp_codex_home/hooks.json"
test -f "$tmp_home/.claude/CLAUDE.md"
grep -q "generate-with-template:claude-md" "$tmp_home/.claude/CLAUDE.md"
task_root="$tmp_codex_home/$workspace_slug/20260623-smoke"
mkdir -p "$task_root"
cat >"$task_root/goal-contract.md" <<'EOF'
Contract status: accepted
Issued by: alpha-goal
Technical Context: smoke
Discovery notes: smoke
Interview ledger: smoke
Intent: smoke
Outcome: smoke
Scope: smoke
Repo surfaces: smoke
Constraints: smoke
Assumptions + resolutions: smoke
Acceptance evidence: smoke
Dependency/integration order: smoke
Non-goals: smoke
Decision boundary: smoke
Claim boundary: smoke
Authorization Source: smoke
Handoff ledger: smoke
EOF
mkdir -p "$tmp_codex_home/$workspace_slug/control-state"
cat >"$tmp_codex_home/$workspace_slug/control-state/latest.md" <<EOF
# Control State Latest
State directory: $task_root
Goal Contract: $task_root/goal-contract.md
Checkpoint: none
Current Phase: IMPLEMENTATION
Next route: none
Updated at: 2026-06-23T00:00:00Z
EOF
python3 -m json.tool "$tmp_codex_home/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_codex_home/hooks.json"
node - "$tmp_codex_home/hooks.json" <<'JS'
const fs = require("node:fs");
const hooksPath = process.argv[2];
const data = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
const groups = data?.hooks?.PostCompact || [];
const managed = groups.flatMap(group => (group.hooks || []).map(hook => ({ group, hook })))
  .filter(entry => String(entry.hook.command || "").includes("codex-alpha-goal-compact-recovery:v1"));
if (managed.length !== 1) throw new Error(`expected one managed PostCompact hook, found ${managed.length}`);
if (managed[0].group.matcher !== "^(manual|auto)$") throw new Error("managed PostCompact matcher mismatch");
const sessionStart = data?.hooks?.SessionStart || [];
const oldManaged = sessionStart.flatMap(group => group.hooks || [])
  .filter(hook => /codex-alpha-goal-compact-recovery:v[0-9]+/.test(String(hook.command || "")));
if (oldManaged.length) throw new Error("managed compact recovery hook remained under SessionStart");
JS
grep -q "treat pre-compaction remembered skill text as stale" "$tmp_codex_home/hooks.json"
grep -q "draft or accepted goal-contract.md first" "$tmp_codex_home/hooks.json"
grep -q "accepted status gates only executor execution handoff" "$tmp_codex_home/hooks.json"
grep -q "control-state/latest.md" "$tmp_codex_home/hooks.json"
grep -q "goal-contract.md" "$tmp_codex_home/hooks.json"
grep -q "technical_design.md" "$tmp_codex_home/hooks.json"
grep -q "checkpoint.md" "$tmp_codex_home/hooks.json"
grep -q "verification-triggered recovery" "$tmp_codex_home/hooks.json"
grep -q "Run Profile, Loop State, Verification, and Evidence" "$tmp_codex_home/hooks.json"
grep -q '\$alpha-goal' "$tmp_codex_home/hooks.json"
grep -q '\$executor' "$tmp_codex_home/hooks.json"
grep -q '\$verifier' "$tmp_codex_home/hooks.json"

tmp_codex_only="$(mktemp -d)"
HOME="$tmp_codex_only" CODEX_HOME="$tmp_codex_only/.codex" scripts/install.sh --target codex
test -d "$tmp_codex_only/.agents/skills/alpha-goal"
test ! -L "$tmp_codex_only/.agents/skills/alpha-goal"
test -f "$tmp_codex_only/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_codex_only/.codex/AGENTS.md"
test ! -e "$tmp_codex_only/.claude/CLAUDE.md"
test ! -e "$tmp_codex_only/.claude/skills/alpha-goal"

tmp_claude_only="$(mktemp -d)"
HOME="$tmp_claude_only" CODEX_HOME="$tmp_claude_only/.codex" scripts/install.sh --target claude
test -d "$tmp_claude_only/.agents/skills/alpha-goal"
test ! -L "$tmp_claude_only/.agents/skills/alpha-goal"
test -f "$tmp_claude_only/.agents/skills/alpha-goal/SKILL.md"
test -L "$tmp_claude_only/.claude/skills/alpha-goal"
test "$(readlink "$tmp_claude_only/.claude/skills/alpha-goal")" = "$tmp_claude_only/.agents/skills/alpha-goal"
test -f "$tmp_claude_only/.claude/CLAUDE.md"
test ! -e "$tmp_claude_only/.codex/AGENTS.md"

tmp_noninteractive="$(mktemp -d)"
HOME="$tmp_noninteractive" CODEX_HOME="$tmp_noninteractive/.codex" scripts/install.sh </dev/null
test -d "$tmp_noninteractive/.agents/skills/alpha-goal"
test ! -L "$tmp_noninteractive/.agents/skills/alpha-goal"
test -f "$tmp_noninteractive/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_noninteractive/.codex/AGENTS.md"
test ! -e "$tmp_noninteractive/.claude/CLAUDE.md"
test ! -e "$tmp_noninteractive/.claude/skills/alpha-goal"

tmp_skip="$(mktemp -d)"
HOME="$tmp_skip" CODEX_HOME="$tmp_skip/.codex" scripts/install.sh --target global --no-sync-user-templates --no-sync-user-hooks >"$tmp_skip/install.out"
grep -q "│ Skills root:" "$tmp_skip/install.out"
! grep -q "│ Install target:" "$tmp_skip/install.out"
! grep -q "│ Result:" "$tmp_skip/install.out"
! grep -Eq "│ Skills: .* linked" "$tmp_skip/install.out"
! grep -q "skipped" "$tmp_skip/install.out"
! grep -q "Configuration" "$tmp_skip/install.out"
! grep -q "Templates" "$tmp_skip/install.out"
! grep -q "Hooks" "$tmp_skip/install.out"
test -d "$tmp_skip/.agents/skills/alpha-goal"
test ! -L "$tmp_skip/.agents/skills/alpha-goal"
test -f "$tmp_skip/.agents/skills/alpha-goal/SKILL.md"
test -L "$tmp_skip/.claude/skills/alpha-goal"
test ! -e "$tmp_skip/.codex/AGENTS.md"
test ! -e "$tmp_skip/.codex/config.toml"
test ! -e "$tmp_skip/.codex/hooks.json"
test ! -e "$tmp_skip/.claude/CLAUDE.md"

tmp_migration="$(mktemp -d)"
mkdir -p "$tmp_migration/.agents/skills" "$tmp_migration/.codex/skills" "$tmp_migration/external"
ln -s "$repo_root/skills/alpha-goal" "$tmp_migration/.agents/skills/alpha-goal"
ln -s "$repo_root/skills/control-loop" "$tmp_migration/.agents/skills/control-loop"
ln -s "$repo_root/skills/goal-verify" "$tmp_migration/.agents/skills/goal-verify"
ln -s "$repo_root/skills/alpha-goal" "$tmp_migration/.codex/skills/alpha-goal"
ln -s "$repo_root/skills/executor" "$tmp_migration/.codex/skills/executor"
ln -s "$repo_root/skills/control-loop" "$tmp_migration/.codex/skills/control-loop"
ln -s "$repo_root/skills/goal-verify" "$tmp_migration/.codex/skills/goal-verify"
ln -s "$tmp_migration/external" "$tmp_migration/.codex/skills/external-skill"
HOME="$tmp_migration" CODEX_HOME="$tmp_migration/.codex" scripts/install.sh --target claude
test -d "$tmp_migration/.agents/skills/alpha-goal"
test ! -L "$tmp_migration/.agents/skills/alpha-goal"
test -f "$tmp_migration/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_migration/.agents/skills/executor/SKILL.md"
test -f "$tmp_migration/.agents/skills/verifier/SKILL.md"
test -L "$tmp_migration/.claude/skills/alpha-goal"
test ! -L "$tmp_migration/.agents/skills/control-loop"
test ! -L "$tmp_migration/.agents/skills/goal-verify"
test ! -e "$tmp_migration/.codex/skills/alpha-goal"
test ! -e "$tmp_migration/.codex/skills/executor"
test ! -L "$tmp_migration/.codex/skills/control-loop"
test ! -L "$tmp_migration/.codex/skills/goal-verify"
test -L "$tmp_migration/.codex/skills/external-skill"

tmp_legacy_external="$(mktemp -d)"
mkdir -p "$tmp_legacy_external/.agents/skills" "$tmp_legacy_external/.codex/skills" "$tmp_legacy_external/external-control-loop" "$tmp_legacy_external/external-goal-verify"
ln -s "$tmp_legacy_external/external-control-loop" "$tmp_legacy_external/.agents/skills/control-loop"
ln -s "$tmp_legacy_external/external-goal-verify" "$tmp_legacy_external/.codex/skills/goal-verify"
HOME="$tmp_legacy_external" CODEX_HOME="$tmp_legacy_external/.codex" scripts/install.sh --target codex
test -L "$tmp_legacy_external/.agents/skills/control-loop"
test -L "$tmp_legacy_external/.codex/skills/goal-verify"
test -f "$tmp_legacy_external/.agents/skills/executor/SKILL.md"
test -f "$tmp_legacy_external/.agents/skills/verifier/SKILL.md"

tmp_worktree_link="$(mktemp -d)"
tmp_other_worktree="$(mktemp -d)"
rm -rf "$tmp_other_worktree"
git worktree add --detach "$tmp_other_worktree" HEAD >/dev/null
mkdir -p "$tmp_worktree_link/.agents/skills"
ln -s "$tmp_other_worktree/skills/alpha-goal" "$tmp_worktree_link/.agents/skills/alpha-goal"
HOME="$tmp_worktree_link" CODEX_HOME="$tmp_worktree_link/.codex" scripts/install.sh --target codex
test -d "$tmp_worktree_link/.agents/skills/alpha-goal"
test ! -L "$tmp_worktree_link/.agents/skills/alpha-goal"
test -f "$tmp_worktree_link/.agents/skills/alpha-goal/SKILL.md"
git worktree remove --force "$tmp_other_worktree" >/dev/null

tmp_external_link="$(mktemp -d)"
mkdir -p "$tmp_external_link/.agents/skills" "$tmp_external_link/external/alpha-goal"
ln -s "$tmp_external_link/external/alpha-goal" "$tmp_external_link/.agents/skills/alpha-goal"
if HOME="$tmp_external_link" CODEX_HOME="$tmp_external_link/.codex" scripts/install.sh --target codex; then
  echo "expected external skill symlink install to fail without --force" >&2
  exit 1
fi

tmp_wrong_path_link="$(mktemp -d)"
mkdir -p "$tmp_wrong_path_link/.agents/skills"
ln -s "$repo_root/templates" "$tmp_wrong_path_link/.agents/skills/alpha-goal"
if HOME="$tmp_wrong_path_link" CODEX_HOME="$tmp_wrong_path_link/.codex" scripts/install.sh --target codex; then
  echo "expected non-skill same-repo symlink install to fail without --force" >&2
  exit 1
fi

tmp_real_dir="$(mktemp -d)"
mkdir -p "$tmp_real_dir/.agents/skills/alpha-goal"
printf 'stale\n' >"$tmp_real_dir/.agents/skills/alpha-goal/stale"
HOME="$tmp_real_dir" CODEX_HOME="$tmp_real_dir/.codex" scripts/install.sh --target codex
test -d "$tmp_real_dir/.agents/skills/alpha-goal"
test ! -L "$tmp_real_dir/.agents/skills/alpha-goal"
test -f "$tmp_real_dir/.agents/skills/alpha-goal/SKILL.md"
test ! -e "$tmp_real_dir/.agents/skills/alpha-goal/stale"

tmp_file_path="$(mktemp -d)"
mkdir -p "$tmp_file_path/.agents/skills"
printf 'not a directory\n' >"$tmp_file_path/.agents/skills/alpha-goal"
if HOME="$tmp_file_path" CODEX_HOME="$tmp_file_path/.codex" scripts/install.sh --target codex; then
  echo "expected ordinary skill file install to fail" >&2
  exit 1
fi

tmp_uninstall_global="$(mktemp -d)"
HOME="$tmp_uninstall_global" CODEX_HOME="$tmp_uninstall_global/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_global" CODEX_HOME="$tmp_uninstall_global/.codex" scripts/install.sh --uninstall --target global
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_uninstall_global/.agents/skills/$skill"
  test ! -e "$tmp_uninstall_global/.claude/skills/$skill"
done
test ! -e "$tmp_uninstall_global/.codex/AGENTS.md"
test ! -e "$tmp_uninstall_global/.codex/config.toml"
test ! -e "$tmp_uninstall_global/.codex/hooks.json"
test ! -e "$tmp_uninstall_global/.claude/CLAUDE.md"

tmp_uninstall_target="$(mktemp -d)"
HOME="$tmp_uninstall_target" CODEX_HOME="$tmp_uninstall_target/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_target" CODEX_HOME="$tmp_uninstall_target/.codex" scripts/install.sh --uninstall --target codex
test -f "$tmp_uninstall_target/.agents/skills/alpha-goal/SKILL.md"
test -L "$tmp_uninstall_target/.claude/skills/alpha-goal"
test -f "$tmp_uninstall_target/.claude/CLAUDE.md"
test ! -e "$tmp_uninstall_target/.codex/AGENTS.md"
test ! -e "$tmp_uninstall_target/.codex/config.toml"
test ! -e "$tmp_uninstall_target/.codex/hooks.json"
HOME="$tmp_uninstall_target" CODEX_HOME="$tmp_uninstall_target/.codex" scripts/install.sh --uninstall --target claude
test -f "$tmp_uninstall_target/.agents/skills/alpha-goal/SKILL.md"
test -L "$tmp_uninstall_target/.claude/skills/alpha-goal"
test ! -e "$tmp_uninstall_target/.claude/CLAUDE.md"

tmp_uninstall_noninteractive="$(mktemp -d)"
HOME="$tmp_uninstall_noninteractive" CODEX_HOME="$tmp_uninstall_noninteractive/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_noninteractive" CODEX_HOME="$tmp_uninstall_noninteractive/.codex" scripts/install.sh --uninstall </dev/null
test -f "$tmp_uninstall_noninteractive/.agents/skills/alpha-goal/SKILL.md"
test -L "$tmp_uninstall_noninteractive/.claude/skills/alpha-goal"
test -f "$tmp_uninstall_noninteractive/.claude/CLAUDE.md"
test ! -e "$tmp_uninstall_noninteractive/.codex/AGENTS.md"

tmp_uninstall_toml="$(mktemp -d)"
HOME="$tmp_uninstall_toml" CODEX_HOME="$tmp_uninstall_toml/.codex" scripts/install.sh --target codex
printf '\n# user edit\n' >>"$tmp_uninstall_toml/.codex/config.toml"
out="$(HOME="$tmp_uninstall_toml" CODEX_HOME="$tmp_uninstall_toml/.codex" scripts/install.sh --uninstall --target codex)"
grep -q "config.toml preserved" <<<"$out"
test -f "$tmp_uninstall_toml/.codex/config.toml"

tmp_uninstall_blank_toml="$(mktemp -d)"
mkdir -p "$tmp_uninstall_blank_toml/.codex"
: >"$tmp_uninstall_blank_toml/.codex/config.toml"
HOME="$tmp_uninstall_blank_toml" CODEX_HOME="$tmp_uninstall_blank_toml/.codex" scripts/install.sh --target codex
out="$(HOME="$tmp_uninstall_blank_toml" CODEX_HOME="$tmp_uninstall_blank_toml/.codex" scripts/install.sh --uninstall --target codex)"
grep -q "config.toml preserved" <<<"$out"
test -f "$tmp_uninstall_blank_toml/.codex/config.toml"

tmp_uninstall_safety="$(mktemp -d)"
mkdir -p "$tmp_uninstall_safety/external"
HOME="$tmp_uninstall_safety" CODEX_HOME="$tmp_uninstall_safety/.codex" scripts/install.sh --target global
rm "$tmp_uninstall_safety/.agents/skills/executor"
mkdir -p "$tmp_uninstall_safety/.agents/skills/executor"
rm "$tmp_uninstall_safety/.agents/skills/verifier"
ln -s "$tmp_uninstall_safety/external" "$tmp_uninstall_safety/.agents/skills/verifier"
mv "$tmp_uninstall_safety/.codex/config.toml" "$tmp_uninstall_safety/external/config.toml"
ln -s "$tmp_uninstall_safety/external/config.toml" "$tmp_uninstall_safety/.codex/config.toml"
ln -sf "$tmp_uninstall_safety/external/AGENTS.md" "$tmp_uninstall_safety/.codex/AGENTS.md"
ln -sf "$tmp_uninstall_safety/external/hooks.json" "$tmp_uninstall_safety/.codex/hooks.json"
ln -sf "$tmp_uninstall_safety/external/CLAUDE.md" "$tmp_uninstall_safety/.claude/CLAUDE.md"
out="$(HOME="$tmp_uninstall_safety" CODEX_HOME="$tmp_uninstall_safety/.codex" scripts/install.sh --uninstall --target global)"
grep -q "config.toml preserved" <<<"$out"
test -L "$tmp_uninstall_safety/.codex/AGENTS.md"
test -L "$tmp_uninstall_safety/.codex/config.toml"
test -L "$tmp_uninstall_safety/.codex/hooks.json"
test -L "$tmp_uninstall_safety/.claude/CLAUDE.md"
test -d "$tmp_uninstall_safety/.agents/skills/executor"
test -L "$tmp_uninstall_safety/.agents/skills/verifier"

tmp_uninstall_skip="$(mktemp -d)"
HOME="$tmp_uninstall_skip" CODEX_HOME="$tmp_uninstall_skip/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_skip" CODEX_HOME="$tmp_uninstall_skip/.codex" scripts/install.sh --uninstall --target global --no-sync-user-templates --no-sync-user-hooks >"$tmp_uninstall_skip/uninstall.out"
grep -q "│ Uninstall target: global" "$tmp_uninstall_skip/uninstall.out"
grep -q "├─ Shared skills" "$tmp_uninstall_skip/uninstall.out"
! grep -q "skipped" "$tmp_uninstall_skip/uninstall.out"
! grep -q "Configuration" "$tmp_uninstall_skip/uninstall.out"
! grep -q "Templates" "$tmp_uninstall_skip/uninstall.out"
! grep -q "Hooks" "$tmp_uninstall_skip/uninstall.out"
test -f "$tmp_uninstall_skip/.codex/AGENTS.md"
test -f "$tmp_uninstall_skip/.codex/config.toml"
test -f "$tmp_uninstall_skip/.codex/hooks.json"
test -f "$tmp_uninstall_skip/.claude/CLAUDE.md"
test ! -e "$tmp_uninstall_skip/.agents/skills/alpha-goal"
test ! -e "$tmp_uninstall_skip/.claude/skills/alpha-goal"

tmp_uninstall_invalid_hooks="$(mktemp -d)"
HOME="$tmp_uninstall_invalid_hooks" CODEX_HOME="$tmp_uninstall_invalid_hooks/.codex" scripts/install.sh --target codex
printf '{invalid' >"$tmp_uninstall_invalid_hooks/.codex/hooks.json"
if HOME="$tmp_uninstall_invalid_hooks" CODEX_HOME="$tmp_uninstall_invalid_hooks/.codex" scripts/install.sh --uninstall --target codex; then
  echo "expected invalid hooks uninstall to fail" >&2
  exit 1
fi
grep -q '{invalid' "$tmp_uninstall_invalid_hooks/.codex/hooks.json"
test -f "$tmp_uninstall_invalid_hooks/.codex/AGENTS.md"
test -f "$tmp_uninstall_invalid_hooks/.codex/config.toml"

HOME="$tmp_uninstall_global" CODEX_HOME="$tmp_uninstall_global/.codex" scripts/install.sh --uninstall --target global

python3 - <<'PY'
import os
import pty
import select
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

repo = Path.cwd()


def run_menu(keys, uninstall=False):
    tmp = Path(tempfile.mkdtemp())
    try:
        env = os.environ.copy()
        env["HOME"] = str(tmp)
        env["CODEX_HOME"] = str(tmp / ".codex")
        env["TERM"] = "xterm-256color"
        env.pop("NO_COLOR", None)
        if uninstall:
            subprocess.run(["scripts/install.sh", "--target", "global"], cwd=repo, env=env, check=True, stdout=subprocess.DEVNULL)
            cmd = ["scripts/install.sh", "--uninstall"]
        else:
            cmd = ["scripts/install.sh"]

        master, slave = pty.openpty()
        proc = subprocess.Popen(cmd, cwd=repo, env=env, stdin=slave, stdout=slave, stderr=slave, close_fds=True)
        os.close(slave)
        output = b""
        sent = False
        deadline = time.time() + 15
        while True:
            if time.time() > deadline:
                proc.kill()
                raise RuntimeError("target menu timed out")
            r, _, _ = select.select([master], [], [], 0.1)
            if master in r:
                try:
                    chunk = os.read(master, 4096)
                except OSError:
                    chunk = b""
                if not chunk:
                    break
                output += chunk
                if not sent and b"Use" in output and b"Enter" in output:
                    os.write(master, keys)
                    sent = True
            if proc.poll() is not None:
                while True:
                    r, _, _ = select.select([master], [], [], 0)
                    if master not in r:
                        break
                    try:
                        chunk = os.read(master, 4096)
                    except OSError:
                        break
                    if not chunk:
                        break
                    output += chunk
                break
        os.close(master)
        if proc.wait() != 0:
            raise RuntimeError(output.decode("utf-8", errors="replace"))
        return output.decode("utf-8", errors="replace"), tmp
    except Exception:
        shutil.rmtree(tmp, ignore_errors=True)
        raise


out, tmp = run_menu(b"\n")
assert "\x1b[36m" in out
assert "\x1b[32m●" in out
assert "\x1b[1mcodex" in out
assert "◆ Alpha Goal Install" in out
assert "Skills install to:" in out
assert "Choose which app configuration to update." in out
assert "○" in out and "global" in out
assert "Use ↑/↓ and Enter:" in out
assert "╭─ Alpha Goal install summary" in out
assert "│ Install target:" not in out
assert "│ Result:" not in out
assert " linked" not in out
assert "├─ Configuration" in out
assert "skipped" not in out
assert (tmp / ".agents/skills/alpha-goal").is_dir()
assert not (tmp / ".agents/skills/alpha-goal").is_symlink()
assert (tmp / ".codex/AGENTS.md").is_file()
assert not (tmp / ".claude/CLAUDE.md").exists()
assert not (tmp / ".claude/skills/alpha-goal").exists()
shutil.rmtree(tmp)

out, tmp = run_menu(b"\x1b[A\n")
assert "│ Install target:" not in out
assert "│ Result:" not in out
assert " linked" not in out
assert "skipped" not in out
assert (tmp / ".agents/skills/alpha-goal").is_dir()
assert not (tmp / ".agents/skills/alpha-goal").is_symlink()
assert (tmp / ".claude/skills/alpha-goal").is_symlink()
assert (tmp / ".claude/CLAUDE.md").is_file()
shutil.rmtree(tmp)

out, tmp = run_menu(b"\x1b[B\n")
assert "│ Install target:" not in out
assert "│ Result:" not in out
assert " linked" not in out
assert "│ Claude home:" in out
assert "skipped" not in out
assert (tmp / ".agents/skills/alpha-goal").is_dir()
assert not (tmp / ".agents/skills/alpha-goal").is_symlink()
assert (tmp / ".claude/skills/alpha-goal").is_symlink()
assert (tmp / ".claude/CLAUDE.md").is_file()
assert not (tmp / ".codex/AGENTS.md").exists()
shutil.rmtree(tmp)

out, tmp = run_menu(b"\x1b[B\x1b[B\n")
assert "│ Install target:" not in out
assert (tmp / ".claude/skills/alpha-goal").is_symlink()
shutil.rmtree(tmp)

out, tmp = run_menu(b"2\n")
assert "│ Install target:" not in out
assert (tmp / ".codex/AGENTS.md").is_file()
shutil.rmtree(tmp)

out, tmp = run_menu(b"\x1b\n")
assert "│ Install target:" not in out
assert (tmp / ".codex/AGENTS.md").is_file()
shutil.rmtree(tmp)

out, tmp = run_menu(b"\x1b[B\n", uninstall=True)
assert "◆ Alpha Goal Uninstall" in out
assert "╭─ Alpha Goal uninstall summary" in out
assert "│ Uninstall target: claude" in out
assert "│ Claude home:" in out
assert "│ Claude templates: CLAUDE.md removed" in out
assert "skipped" not in out
assert (tmp / ".agents/skills/alpha-goal/SKILL.md").is_file()
assert (tmp / ".claude/skills/alpha-goal").is_symlink()
assert (tmp / ".codex/AGENTS.md").is_file()
assert not (tmp / ".claude/CLAUDE.md").exists()
shutil.rmtree(tmp)
PY

node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
rm -rf "$tmp_home" "$tmp_codex_only" "$tmp_claude_only" "$tmp_noninteractive" "$tmp_skip" "$tmp_migration" "$tmp_legacy_external" "$tmp_worktree_link" "$tmp_external_link" "$tmp_wrong_path_link" "$tmp_real_dir" "$tmp_file_path" "$tmp_uninstall_global" "$tmp_uninstall_target" "$tmp_uninstall_noninteractive" "$tmp_uninstall_toml" "$tmp_uninstall_blank_toml" "$tmp_uninstall_safety" "$tmp_uninstall_skip" "$tmp_uninstall_invalid_hooks"
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$executor 根据 Goal Contract 和已有条件检查点做下一轮最有用且可验证的有界 slice。
$verifier 验证目标完成、证据覆盖、声明边界和 material 未声明缺陷/风险，并返回可继续 harden 的 Gap。
```

## Count budget

The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks.
This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, authority gates, behavior-level gates, and verifier feedback without over-compressing their meaning.
