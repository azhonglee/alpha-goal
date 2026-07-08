# Installation and Smoke Test

## Install

Requires Node.js 18+ when syncing Codex config or hooks. The installer uses repository-local JavaScript and vendored `smol-toml` for config TOML merge; Python 3.11 `tomllib` is not required.

```bash
scripts/install.sh
```

The script copies three public skills under the selected target's skill root:

```text
codex:  ${CODEX_HOME:-$HOME/.codex}/skills
claude: $HOME/.claude/skills
```

## Options

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
scripts/install.sh --target codex
scripts/install.sh --target claude
scripts/install.sh --uninstall --target codex
scripts/install.sh --uninstall --target claude
scripts/install.sh --force
scripts/install.sh --no-sync-user-templates
scripts/install.sh --no-sync-user-hooks
scripts/install.sh --verbose
```

## Behavior

The script creates copied skill directories under target-specific independent roots. `codex` uses `${CODEX_HOME:-$HOME/.codex}/skills`; `claude` uses `$HOME/.claude/skills`. The selected `--target` controls configuration sync and skill copy destination:

- `codex`: sync Codex config and Codex skill copies.
- `claude`: sync Claude `CLAUDE.md` and Claude skill copies.

Without `--target`, an interactive terminal shows a color+Unicode arrow-key menu for `codex` or `claude`; `codex` is selected by default and Enter confirms the highlighted target. The menu uses Up/Down plus Enter only; number keys do not select a target. The installer prints a grouped summary after install or uninstall; the summary shows only active effects for the selected target and omits skipped lines. Install summaries omit `Result`, `Skills ... linked`, and `Install target` lines. Non-interactive runs still default to `codex`. Codex config uses `${CODEX_HOME:-$HOME/.codex}` or `--codex-home`. Claude config uses `$HOME/.claude/CLAUDE.md` from `templates/CLAUDE.md`.

When installing skill copies, an existing target skill symlink is migrated without `--force` only when it points to `skills/<skill-name>` in this repository or another worktree with the same Git common directory. Existing managed real directories are removed and recopied. Git detection failures, external symlinks, and symlinks to other repo-relative paths still require `--force` or are refused; ordinary files are always refused. For `claude`, the installer injects a ClaudeAdapter Entry Gate reminder into the installed Alpha Goal copy; `codex` and default non-interactive installs leave that reminder out.

Use `--uninstall` to remove managed install artifacts for the selected target. `--uninstall --target codex` removes managed Codex configuration and Codex skill copies. `--uninstall --target claude` removes managed Claude `CLAUDE.md` content and Claude skill copies.

Uninstall is conservative outside the managed copied-skill path. It removes only managed Markdown blocks, managed hooks, `config.toml` that byte-for-byte matches `templates/config.toml`, skill copies with the install marker, and skill symlinks that resolve to this repository. Mixed user Markdown keeps user content, mixed or modified `config.toml` is preserved, unmanaged hooks are preserved, configuration symlinks are not followed or deleted, and unmanaged skill directories or external symlinks are preserved. `--no-sync-user-templates` skips Markdown and `config.toml` cleanup; `--no-sync-user-hooks` skips hooks cleanup.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `PostCompact` hook without a matcher and must not set matcher; it prints a static policy telling Codex to reload `alpha-goal`, `executor`, or `verifier` when applicable after compaction. For active Alpha Goal work, it resumes from `goal-contract.md`, reads `technical_design.md` when present for implementation, repair, refactor, hardening, cross-file behavior, interface/data-model changes, or material risk after Goal Contract Confirmation Gate selects technical design, uses `control-state/latest.md` only when task identity is ambiguous, and uses `checkpoint.md` for recovery, evidence handoff, or verification handoff. `executor` still requires an accepted Goal Contract, and `verifier` compares evidence with the hard-blocking acceptance checklist before returning a route. Native Goal Sync is not hook-driven: `alpha-goal` may create or reuse the current thread's native goal only after user approval of the Goal Contract. Use `--no-sync-user-templates` to skip Codex AGENTS/config and Claude CLAUDE template updates. Use `--no-sync-user-hooks` to skip Codex hook template updates.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test checks target-specific skill copies, config sync, ClaudeAdapter injection, hook recovery text, and uninstall cleanup with temporary HOME and temporary CODEX_HOME values. It does not touch real user configuration.

```bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

tmp_codex="$(mktemp -d)"
HOME="$tmp_codex" CODEX_HOME="$tmp_codex/.codex" scripts/install.sh --target codex
for skill in alpha-goal executor verifier; do
  test -d "$tmp_codex/.codex/skills/$skill"
  test ! -L "$tmp_codex/.codex/skills/$skill"
  test -f "$tmp_codex/.codex/skills/$skill/SKILL.md"
done
test -f "$tmp_codex/.codex/AGENTS.md"
test -f "$tmp_codex/.codex/config.toml"
test -f "$tmp_codex/.codex/hooks.json"
test ! -e "$tmp_codex/.claude/CLAUDE.md"
test ! -e "$tmp_codex/.claude/skills/alpha-goal"
! grep -q "references/claude-adapter.md" "$tmp_codex/.codex/skills/alpha-goal/SKILL.md"

tmp_claude="$(mktemp -d)"
HOME="$tmp_claude" CODEX_HOME="$tmp_claude/.codex" scripts/install.sh --target claude
for skill in alpha-goal executor verifier; do
  test -d "$tmp_claude/.claude/skills/$skill"
  test ! -L "$tmp_claude/.claude/skills/$skill"
  test -f "$tmp_claude/.claude/skills/$skill/SKILL.md"
done
test -f "$tmp_claude/.claude/CLAUDE.md"
test ! -e "$tmp_claude/.codex/AGENTS.md"
test ! -e "$tmp_claude/.codex/skills/alpha-goal"
grep -q "references/claude-adapter.md" "$tmp_claude/.claude/skills/alpha-goal/SKILL.md"

tmp_default="$(mktemp -d)"
HOME="$tmp_default" CODEX_HOME="$tmp_default/.codex" scripts/install.sh </dev/null
test -d "$tmp_default/.codex/skills/alpha-goal"
test -f "$tmp_default/.codex/AGENTS.md"
test ! -e "$tmp_default/.claude/skills/alpha-goal"

HOME="$tmp_codex" CODEX_HOME="$tmp_codex/.codex" scripts/install.sh --uninstall --target codex
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_codex/.codex/skills/$skill"
done
test ! -e "$tmp_codex/.codex/AGENTS.md"
test ! -e "$tmp_codex/.codex/config.toml"
test ! -e "$tmp_codex/.codex/hooks.json"

HOME="$tmp_claude" CODEX_HOME="$tmp_claude/.codex" scripts/install.sh --uninstall --target claude
for skill in alpha-goal executor verifier; do
  test ! -e "$tmp_claude/.claude/skills/$skill"
done
test ! -e "$tmp_claude/.claude/CLAUDE.md"

python3 -m json.tool "$tmp_default/.codex/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_default/.codex/hooks.json"
grep -q "read goal-contract.md first" "$tmp_default/.codex/hooks.json"
grep -q "technical_design.md" "$tmp_default/.codex/hooks.json"
grep -q "checkpoint.md" "$tmp_default/.codex/hooks.json"

bash -n scripts/install.sh
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
rm -rf "$tmp_codex" "$tmp_claude" "$tmp_default"
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
