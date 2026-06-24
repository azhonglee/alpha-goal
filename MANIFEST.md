# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: fact discovery, clarification, Goal Contract, trigger contract, authority boundary, route. |
| `skills/control-loop/` | Goal-contract-driven bounded actuator/controller: act or harden authorized slices; use Goal Contract as the required input and one conditional checkpoint for recovery, trigger handling, durable evidence, or verification. |
| `skills/goal-verify/` | Independent goal verifier for evidence coverage, claim boundaries, defect/risk sweep, and verification gaps. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`.

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Installs the three public skills as direct symlinks, cleans same-repo old skill links, syncs optional user templates, and syncs `templates/hooks.json` without running skill validation. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints read-only git/path preflight evidence. |
| `tools/validate_skills.ts` | No | Validates the public-skill contract, references, word+punctuation budget, scripts, docs, and schemas. |

## User Hooks

`templates/hooks.json` defines one user-level `SessionStart` / `^compact$` hook, marked by `codex-alpha-goal-compact-recovery:v1`. `scripts/install.sh` merges that template into `${CODEX_HOME:-$HOME/.codex}/hooks.json`. The hook prints a static compact recovery policy that asks Codex to re-check `alpha-goal`, `control-loop`, and `goal-verify` after compaction and load the applicable skill, including accepted Goal Contract execution in `control-loop`, goal verification, claim-boundary checks, and defect/risk sweep when needed.

Hook replacement is by marker family, not exact version, so later `:v2` template markers replace existing `:v1` hooks. The installer also migrates the earlier experimental `codex-compact-skill-recovery` family.

## Runtime Artifacts

Default runtime artifacts live under the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`, where `<workspace-slug>` comes from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/goal-contract.md` | Default `alpha-goal` artifact and canonical accepted contract, including contract status, discovery notes, interview ledger, Trigger Contract, and handoff ledger. |
| `<state-root>/YYYYMMDD-<TaskName>/checkpoint.md` | Conditional task checkpoint containing only needed sections: run profile, loop state, memory, iteration, evidence, and verification; memory entries keep evidence, confidence, and invalidation. |
| `<state-root>/control-state/latest.md` | Optional global recovery index pointing to the latest accepted task state, Goal Contract, optional checkpoint, phase, route, and update time; not a stage artifact. |

## Count Budget

The enforced count budget is the whole `skills/` tree, capped at 15,000 word+punctuation units. Counted units are words plus punctuation/symbol marks. The cap preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, authority gates, behavior-level gates, and evaluator feedback without over-compressing their meaning.
