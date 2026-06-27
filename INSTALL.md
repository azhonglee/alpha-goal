# Installation and Smoke Test

## Install

Requires Node.js 18+ when syncing Codex config or hooks. The installer uses repository-local JavaScript and vendored `smol-toml` for config TOML merge; Python 3.11 `tomllib` is not required.

```bash
scripts/install.sh
```

The script installs three public skills as direct symlinks under `$HOME/.agents/skills`:

```text
alpha-goal
control-loop
goal-verify
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

The script creates `$HOME/.agents/skills/<skill-name>` links for required public skills and cleans same-repo links for merged old public skills. During migration, it also removes same-repo skill symlinks left under `${CODEX_HOME:-$HOME/.codex}/skills`; real files, directories, and symlinks to other locations are preserved. The selected `--target` controls configuration sync only:

- `global`: sync Codex config plus Claude `CLAUDE.md`.
- `codex`: sync Codex config only.
- `claude`: sync Claude `CLAUDE.md` only.

Without `--target`, an interactive terminal prompts for `global`, `codex`, or `claude`; non-interactive runs default to `codex`. Codex config uses `${CODEX_HOME:-$HOME/.codex}` or `--codex-home`. Claude config uses `$HOME/.claude/CLAUDE.md` from `templates/CLAUDE.md`.

Use `--uninstall` to remove managed install artifacts for the selected target. `--uninstall --target codex` removes only managed Codex configuration and keeps shared `$HOME/.agents/skills` links. `--uninstall --target claude` removes only managed Claude `CLAUDE.md` content and keeps shared skills. `--uninstall --target global` removes managed Codex and Claude configuration plus this repository's skill symlinks under `$HOME/.agents/skills`. Uninstall does not remove legacy `${CODEX_HOME:-$HOME/.codex}/skills` paths.

Uninstall is conservative. It removes only managed Markdown blocks, managed hooks, `config.toml` that byte-for-byte matches `templates/config.toml`, and skill symlinks that resolve to this repository. Mixed user Markdown keeps user content, mixed or modified `config.toml` is preserved, unmanaged hooks are preserved, configuration symlinks are not followed or deleted, and real skill directories or external symlinks are preserved. `--no-sync-user-templates` skips Markdown and `config.toml` cleanup; `--no-sync-user-hooks` skips hooks cleanup.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `SessionStart` hook for `compact` starts and prints a static policy telling Codex to decide whether `alpha-goal`, `control-loop`, or `goal-verify` applies after compaction, and to load the matching skill before continuing. For active Alpha Goal tasks, it resumes from draft or accepted `goal-contract.md` first and reads `technical_design.md` with the Goal Contract when it exists; accepted status gates only `control-loop` execution handoff. `goal-verify` covers evidence, claim boundary, defect/risk sweep, and material unclaimed issues. Use `--no-sync-user-templates` to skip Codex AGENTS/config and Claude CLAUDE template updates. Use `--no-sync-user-hooks` to skip Codex hook template updates.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test checks installed skill links, target-specific config sync, hook recovery text, and state fixture shape with a temporary HOME and temporary CODEX_HOME, without requiring runtime skill scripts or touching real user configuration.

```bash
set -euo pipefail
tmp_home="$(mktemp -d)"
tmp_codex_home="$tmp_home/.codex"
HOME="$tmp_home" CODEX_HOME="$tmp_codex_home" scripts/install.sh --target global
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
workspace_slug="$(basename "$repo_root")"
for skill in alpha-goal control-loop goal-verify; do
  test -f "$tmp_home/.agents/skills/$skill/SKILL.md"
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
grep -q "treat pre-compaction remembered skill text as stale" "$tmp_codex_home/hooks.json"
grep -q "draft or accepted goal-contract.md first" "$tmp_codex_home/hooks.json"
grep -q "accepted status gates only control-loop execution handoff" "$tmp_codex_home/hooks.json"
grep -q "control-state/latest.md" "$tmp_codex_home/hooks.json"
grep -q "goal-contract.md" "$tmp_codex_home/hooks.json"
grep -q "technical_design.md" "$tmp_codex_home/hooks.json"
grep -q "checkpoint.md" "$tmp_codex_home/hooks.json"
grep -q "verification-triggered recovery" "$tmp_codex_home/hooks.json"
grep -q "Run Profile, Loop State, Verification, and Evidence" "$tmp_codex_home/hooks.json"
grep -q '\$alpha-goal' "$tmp_codex_home/hooks.json"
grep -q '\$control-loop' "$tmp_codex_home/hooks.json"
grep -q '\$goal-verify' "$tmp_codex_home/hooks.json"

tmp_codex_only="$(mktemp -d)"
HOME="$tmp_codex_only" CODEX_HOME="$tmp_codex_only/.codex" scripts/install.sh --target codex
test -f "$tmp_codex_only/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_codex_only/.codex/AGENTS.md"
test ! -e "$tmp_codex_only/.claude/CLAUDE.md"

tmp_claude_only="$(mktemp -d)"
HOME="$tmp_claude_only" CODEX_HOME="$tmp_claude_only/.codex" scripts/install.sh --target claude
test -f "$tmp_claude_only/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_claude_only/.claude/CLAUDE.md"
test ! -e "$tmp_claude_only/.codex/AGENTS.md"

tmp_noninteractive="$(mktemp -d)"
HOME="$tmp_noninteractive" CODEX_HOME="$tmp_noninteractive/.codex" scripts/install.sh </dev/null
test -f "$tmp_noninteractive/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_noninteractive/.codex/AGENTS.md"
test ! -e "$tmp_noninteractive/.claude/CLAUDE.md"

tmp_skip="$(mktemp -d)"
HOME="$tmp_skip" CODEX_HOME="$tmp_skip/.codex" scripts/install.sh --target global --no-sync-user-templates --no-sync-user-hooks
test -f "$tmp_skip/.agents/skills/alpha-goal/SKILL.md"
test ! -e "$tmp_skip/.codex/AGENTS.md"
test ! -e "$tmp_skip/.codex/config.toml"
test ! -e "$tmp_skip/.codex/hooks.json"
test ! -e "$tmp_skip/.claude/CLAUDE.md"

tmp_migration="$(mktemp -d)"
mkdir -p "$tmp_migration/.codex/skills" "$tmp_migration/external"
ln -s "$repo_root/skills/alpha-goal" "$tmp_migration/.codex/skills/alpha-goal"
ln -s "$repo_root/skills/control-loop" "$tmp_migration/.codex/skills/control-loop"
ln -s "$tmp_migration/external" "$tmp_migration/.codex/skills/external-skill"
HOME="$tmp_migration" CODEX_HOME="$tmp_migration/.codex" scripts/install.sh --target claude
test -f "$tmp_migration/.agents/skills/alpha-goal/SKILL.md"
test ! -e "$tmp_migration/.codex/skills/alpha-goal"
test ! -e "$tmp_migration/.codex/skills/control-loop"
test -L "$tmp_migration/.codex/skills/external-skill"

tmp_uninstall_global="$(mktemp -d)"
HOME="$tmp_uninstall_global" CODEX_HOME="$tmp_uninstall_global/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_global" CODEX_HOME="$tmp_uninstall_global/.codex" scripts/install.sh --uninstall --target global
for skill in alpha-goal control-loop goal-verify; do
  test ! -e "$tmp_uninstall_global/.agents/skills/$skill"
done
test ! -e "$tmp_uninstall_global/.codex/AGENTS.md"
test ! -e "$tmp_uninstall_global/.codex/config.toml"
test ! -e "$tmp_uninstall_global/.codex/hooks.json"
test ! -e "$tmp_uninstall_global/.claude/CLAUDE.md"

tmp_uninstall_target="$(mktemp -d)"
HOME="$tmp_uninstall_target" CODEX_HOME="$tmp_uninstall_target/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_target" CODEX_HOME="$tmp_uninstall_target/.codex" scripts/install.sh --uninstall --target codex
test -f "$tmp_uninstall_target/.agents/skills/alpha-goal/SKILL.md"
test -f "$tmp_uninstall_target/.claude/CLAUDE.md"
test ! -e "$tmp_uninstall_target/.codex/AGENTS.md"
test ! -e "$tmp_uninstall_target/.codex/config.toml"
test ! -e "$tmp_uninstall_target/.codex/hooks.json"
HOME="$tmp_uninstall_target" CODEX_HOME="$tmp_uninstall_target/.codex" scripts/install.sh --uninstall --target claude
test -f "$tmp_uninstall_target/.agents/skills/alpha-goal/SKILL.md"
test ! -e "$tmp_uninstall_target/.claude/CLAUDE.md"

tmp_uninstall_noninteractive="$(mktemp -d)"
HOME="$tmp_uninstall_noninteractive" CODEX_HOME="$tmp_uninstall_noninteractive/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_noninteractive" CODEX_HOME="$tmp_uninstall_noninteractive/.codex" scripts/install.sh --uninstall </dev/null
test -f "$tmp_uninstall_noninteractive/.agents/skills/alpha-goal/SKILL.md"
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
rm "$tmp_uninstall_safety/.agents/skills/control-loop"
mkdir -p "$tmp_uninstall_safety/.agents/skills/control-loop"
rm "$tmp_uninstall_safety/.agents/skills/goal-verify"
ln -s "$tmp_uninstall_safety/external" "$tmp_uninstall_safety/.agents/skills/goal-verify"
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
test -d "$tmp_uninstall_safety/.agents/skills/control-loop"
test -L "$tmp_uninstall_safety/.agents/skills/goal-verify"

tmp_uninstall_skip="$(mktemp -d)"
HOME="$tmp_uninstall_skip" CODEX_HOME="$tmp_uninstall_skip/.codex" scripts/install.sh --target global
HOME="$tmp_uninstall_skip" CODEX_HOME="$tmp_uninstall_skip/.codex" scripts/install.sh --uninstall --target global --no-sync-user-templates --no-sync-user-hooks
test -f "$tmp_uninstall_skip/.codex/AGENTS.md"
test -f "$tmp_uninstall_skip/.codex/config.toml"
test -f "$tmp_uninstall_skip/.codex/hooks.json"
test -f "$tmp_uninstall_skip/.claude/CLAUDE.md"

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

node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
rm -rf "$tmp_home" "$tmp_codex_only" "$tmp_claude_only" "$tmp_noninteractive" "$tmp_skip" "$tmp_migration" "$tmp_uninstall_global" "$tmp_uninstall_target" "$tmp_uninstall_noninteractive" "$tmp_uninstall_toml" "$tmp_uninstall_blank_toml" "$tmp_uninstall_safety" "$tmp_uninstall_skip" "$tmp_uninstall_invalid_hooks"
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$control-loop 根据 Goal Contract 和已有条件检查点做下一轮最有用且可验证的有界 slice。
$goal-verify 验证目标完成、证据覆盖、声明边界和 material 未声明缺陷/风险，并返回可继续 harden 的 Gap。
```

## Count budget

The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks.
This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, authority gates, behavior-level gates, and evaluator feedback without over-compressing their meaning.
