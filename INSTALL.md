# Installation and Smoke Test

## Install

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

The compact recovery hook definition lives in `templates/hooks.json`. It is a `SessionStart` hook for `compact` starts and prints a static policy telling Codex to decide whether `alpha-goal`, `control-loop`, or `goal-verify` applies after compaction, and to load the matching skill before continuing. `goal-verify` covers evidence, claim boundary, defect/risk sweep, and material unclaimed issues. Use `--no-sync-user-templates` to skip AGENTS/config template updates and `--no-sync-user-hooks` to skip hook template updates.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test separately checks installed skill links, hook recovery text, and state fixture shape without requiring runtime skill scripts.

```bash
set -euo pipefail
tmp_codex_home="$(mktemp -d)"
export CODEX_HOME="$tmp_codex_home"
scripts/install.sh --no-sync-user-templates
for skill in alpha-goal control-loop goal-verify; do
  test -f "$tmp_codex_home/skills/$skill/SKILL.md"
done
task_root="$tmp_codex_home/$(basename "$PWD")/20260623-smoke"
mkdir -p "$task_root"
cat >"$task_root/context.md" <<'EOF'
Context: smoke
EOF
cat >"$task_root/interview.md" <<'EOF'
Interview: smoke
EOF
cat >"$task_root/goal-contract.md" <<'EOF'
Trigger Contract: manual
Autonomy Level: L3 Modify worktree
EOF
python3 -m json.tool "$tmp_codex_home/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_codex_home/hooks.json"
grep -q "treat pre-compaction remembered skill text as stale" "$tmp_codex_home/hooks.json"
grep -q "goal-contract.md first" "$tmp_codex_home/hooks.json"
grep -q "context.md/interview.md" "$tmp_codex_home/hooks.json"
grep -q "control-state/latest.md" "$tmp_codex_home/hooks.json"
grep -q "goal-contract.md" "$tmp_codex_home/hooks.json"
grep -q "run-profile.md" "$tmp_codex_home/hooks.json"
grep -q "loop-state.md" "$tmp_codex_home/hooks.json"
grep -q "memory.md" "$tmp_codex_home/hooks.json"
grep -q "HARDENING or VERIFICATION" "$tmp_codex_home/hooks.json"
grep -q "verification.md/evidence.md" "$tmp_codex_home/hooks.json"
grep -q '\$alpha-goal' "$tmp_codex_home/hooks.json"
grep -q '\$control-loop' "$tmp_codex_home/hooks.json"
grep -q '\$goal-verify' "$tmp_codex_home/hooks.json"
npx --no-install tsx tools/validate_skills.ts .
rm -rf "$tmp_codex_home"
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$control-loop 根据 Goal Contract 和已有条件检查点做下一轮最小安全 slice。
$goal-verify 验证目标完成、证据覆盖、声明边界和 material 未声明缺陷/风险，并返回可继续 harden 的 Gap。
```

## Count budget

The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks.
This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, autonomy gates, behavior-level gates, and evaluator feedback without over-compressing their meaning.
