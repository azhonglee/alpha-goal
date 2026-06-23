# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: fact discovery, clarification, Goal Contract, trigger contract, autonomy boundary, route. |
| `skills/control-loop/` | Bounded actuator/controller: act or harden authorized slices; use Goal Contract as the required input and conditional checkpoints for recovery, trigger handling, durable evidence, or verification. |
| `skills/goal-verify/` | Independent goal verifier for evidence coverage, claim boundaries, defect/risk sweep, and verification gaps. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`.

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Installs the three public skills as direct symlinks, cleans same-repo old skill links, syncs optional user templates, and syncs `templates/hooks.json` without running skill validation. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints read-only git/path preflight evidence. |
| `tools/validate_skills.ts` | No | Validates the three-skill contract, references, word+punctuation budget, scripts, docs, and schemas. |

## User Hooks

`templates/hooks.json` defines one user-level `SessionStart` / `^compact$` hook, marked by `codex-alpha-goal-compact-recovery:v1`. `scripts/install.sh` merges that template into `${CODEX_HOME:-$HOME/.codex}/hooks.json`. The hook prints a static compact recovery policy that asks Codex to re-check `alpha-goal`, `control-loop`, and `goal-verify` after compaction and load the applicable skill, including goal verification, claim-boundary checks, and defect/risk sweep when needed.

Hook replacement is by marker family, not exact version, so later `:v2` template markers replace existing `:v1` hooks. The installer also migrates the earlier experimental `codex-compact-skill-recovery` family.

## Runtime Artifacts

Default runtime artifacts live under the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/context.md` | Default `alpha-goal` artifact: discovered facts, contradictions, and concise critical thinking. |
| `<state-root>/YYYYMMDD-<TaskName>/interview.md` | Default `alpha-goal` artifact: clarification records and decision-boundary notes. |
| `<state-root>/YYYYMMDD-<TaskName>/goal-contract.md` | Default `alpha-goal` artifact and canonical contract, including Trigger Contract and Autonomy Level. |
| `<state-root>/YYYYMMDD-<TaskName>/run-profile.md` | Conditional execution profile for scheduled/webhook/verification-triggered runs, external side effects, actions above L3, or explicit human checkpoints; cannot redefine the Goal Contract. |
| `<state-root>/YYYYMMDD-<TaskName>/loop-state.md` | Conditional recovery checkpoint: current objective, phase, completed/pending work, known risks, last verification gap, next slice, stop condition. |
| `<state-root>/YYYYMMDD-<TaskName>/memory.md` | Conditional compressed learning: reusable confirmed facts, root causes, constraints, working strategies, failed strategies, with evidence, confidence, and invalidation. |
| `<state-root>/YYYYMMDD-<TaskName>/iteration.md` | Conditional execution run log for handoff/recovery; records facts only and does not store persistent current state. |
| `<state-root>/YYYYMMDD-<TaskName>/evidence.md` | Conditional durable evidence, logs, screenshots, traces, or check outputs. |
| `<state-root>/YYYYMMDD-<TaskName>/verification.md` | Conditional verification verdict artifacts and next Gap for evaluator feedback. |
| `<state-root>/control-state/latest.md` | Conditional latest recovery pointer with State directory, Goal Contract, optional checkpoint paths, Current Phase, Next route, and Updated at. |

## Count Budget

The enforced count budget is the whole `skills/` tree, capped at 15,000 word+punctuation units. Counted units are words plus punctuation/symbol marks. The cap preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, autonomy gates, behavior-level gates, and evaluator feedback without over-compressing their meaning.
