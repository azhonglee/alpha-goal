# Installation and Smoke Test

## Install

```bash
scripts/install.sh
```

Default Codex home is `$HOME/.codex`. The script installs three public skills as direct symlinks:

```text
alpha-goal
control-loop
evidence-verify
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

The compact recovery hook definition lives in `templates/hooks.json`. It is a `SessionStart` hook for `compact` starts and prints a static policy telling Codex to decide whether `alpha-goal`, `control-loop`, or `evidence-verify` applies after compaction, and to load the matching skill before continuing. Use `--no-sync-user-templates` to skip AGENTS/config template updates and `--no-sync-user-hooks` to skip hook template updates.

Hook upgrades are keyed by marker family. If the template marker changes from `...:v1` to `...:v2`, the installer removes older hooks from the same family before adding the template hook. It also removes the earlier experimental `codex-compact-skill-recovery` hook family.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

The smoke test separately checks installed skill links, hook recovery text, `mutation-preflight.ts --task`, and `evidence-summary.ts --task`.

```bash
set -euo pipefail
tmp_codex_home="$(mktemp -d)"
export CODEX_HOME="$tmp_codex_home"
scripts/install.sh --no-sync-user-templates
for skill in alpha-goal control-loop evidence-verify; do
  test -f "$tmp_codex_home/skills/$skill/SKILL.md"
done
task_root="$tmp_codex_home/$(basename "$PWD")/20260623-smoke"
mkdir -p "$task_root"
cat >"$task_root/goal-contract.md" <<'EOF'
Trigger Contract: manual
Autonomy Level: L3 Modify worktree
EOF
cat >"$task_root/run-profile.md" <<EOF
Goal spec: $task_root/goal-contract.md
Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the goal spec.
Run mode: manual
Goal Contract: $task_root/goal-contract.md
Trigger event: none
Requested action: modify-worktree
Discovery source: goal-spec-only
External side effects allowed: none
Human checkpoint: none
Evaluator route: \$evidence-verify before final claim
Autonomy level: L3 Modify worktree
EOF
cat >"$task_root/loop-state.md" <<'EOF'
Current Objective: smoke
Current Phase: VERIFICATION
Completed: None yet
Pending: None yet
Known Risks: None yet
Last Verification Gap: None yet
Next Slice: run smoke validation
Stop Condition: validation complete
EOF
cat >"$task_root/memory.md" <<'EOF'
Confirmed Facts: None yet
Confirmed Root Causes: None yet
Known Constraints: None yet
Working Strategies: None yet
Failed Strategies: None yet
EOF
cat >"$task_root/evidence.md" <<'EOF'
Evidence: smoke
EOF
mkdir -p "$tmp_codex_home/$(basename "$PWD")/control-state"
cat >"$tmp_codex_home/$(basename "$PWD")/control-state/latest.md" <<EOF
# Control State Latest
State directory: $task_root
Goal Contract: $task_root/goal-contract.md
Run Profile: $task_root/run-profile.md
Loop State: $task_root/loop-state.md
Memory: $task_root/memory.md
Evidence: $task_root/evidence.md
Verification: $task_root/verification.md
Current Phase: VERIFICATION
Next route: none
Updated at: 2026-06-23T00:00:00Z
EOF
cat >"$task_root/verification.md" <<EOF
- Goal Contract: $task_root/goal-contract.md
- Loop State: $task_root/loop-state.md
- Evidence: $task_root/evidence.md
- Verified at: 2026-06-23T00:00:00Z
- Verdict: PASS_TO_FINAL
- Gap: None
- Next route: none
EOF
npx --no-install tsx "$tmp_codex_home/skills/control-loop/scripts/mutation-preflight.ts" --task 20260623-smoke
npx --no-install tsx "$tmp_codex_home/skills/evidence-verify/scripts/evidence-summary.ts" --task 20260623-smoke
python3 -m json.tool "$tmp_codex_home/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_codex_home/hooks.json"
grep -q "treat pre-compaction remembered skill text as stale" "$tmp_codex_home/hooks.json"
grep -q "control-state/latest.md" "$tmp_codex_home/hooks.json"
grep -q "goal-contract.md" "$tmp_codex_home/hooks.json"
grep -q "run-profile.md" "$tmp_codex_home/hooks.json"
grep -q "loop-state.md" "$tmp_codex_home/hooks.json"
grep -q "memory.md" "$tmp_codex_home/hooks.json"
grep -q "Memory: $task_root/memory.md" "$tmp_codex_home/$(basename "$PWD")/control-state/latest.md"
grep -q "HARDENING or VERIFICATION" "$tmp_codex_home/hooks.json"
grep -q "verification.md/evidence.md" "$tmp_codex_home/hooks.json"
grep -q '\$alpha-goal' "$tmp_codex_home/hooks.json"
grep -q '\$control-loop' "$tmp_codex_home/hooks.json"
grep -q '\$evidence-verify' "$tmp_codex_home/hooks.json"
npx --no-install tsx tools/validate_skills.ts .
rm -rf "$tmp_codex_home"
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$control-loop 根据已明确边界、loop-state 和 memory 做下一轮最小安全 slice。
$evidence-verify 检查当前证据是否支持最终声明，并返回可继续 harden 的 Gap。
```

## Count budget

The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks.
This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, autonomy gates, behavior-level script gates, and evaluator feedback without over-compressing their meaning.
