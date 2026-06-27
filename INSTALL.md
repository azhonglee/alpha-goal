# Installation and Smoke Test

## Install

Requires Node.js 18+. The installer uses repository-local JavaScript and vendored `smol-toml` for config TOML merge; Python 3.11 `tomllib` is not required.

```bash
scripts/install.sh
```

Default Codex home is `$HOME/.codex`. The script installs three public skills as direct symlinks:

```text
alpha-goal
control-loop
goal-verify
```

## Options

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
scripts/install.sh --force
scripts/install.sh --no-sync-user-templates
scripts/install.sh --no-sync-user-hooks
scripts/install.sh --verbose
```

## Behavior

The script creates `${CODEX_HOME:-$HOME/.codex}/skills/<skill-name>` links for required public skills and cleans same-repo links for merged old public skills. By default it also syncs user-level templates, including `templates/hooks.json` into `${CODEX_HOME:-$HOME/.codex}/hooks.json`.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `SessionStart` hook for `compact` starts and prints a static policy telling Codex to decide whether `alpha-goal`, `control-loop`, or `goal-verify` applies after compaction, and to load the matching skill before continuing. For active Alpha Goal tasks, it resumes from draft or accepted `goal-contract.md` first and reads `technical_design.md` with the Goal Contract when it exists; accepted status gates only `control-loop` execution handoff. `goal-verify` covers evidence, claim boundary, defect/risk sweep, and material unclaimed issues. Use `--no-sync-user-templates` to skip AGENTS/config template updates and `--no-sync-user-hooks` to skip hook template updates.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test separately checks installed skill links, hook recovery text, and state fixture shape with a temporary CODEX_HOME, without requiring runtime skill scripts or touching real user configuration.

```bash
set -euo pipefail
tmp_codex_home="$(mktemp -d)"
export CODEX_HOME="$tmp_codex_home"
scripts/install.sh --no-sync-user-templates
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
workspace_slug="$(basename "$repo_root")"
for skill in alpha-goal control-loop goal-verify; do
  test -f "$tmp_codex_home/skills/$skill/SKILL.md"
done
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
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
rm -rf "$tmp_codex_home"
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
