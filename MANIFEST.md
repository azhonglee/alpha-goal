# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: fact discovery, clarification, handoff design, route, ledger. |
| `skills/control-loop/` | Bounded actuator/controller for safe execution and feedback. |
| `skills/evidence-verify/` | Independent comparator for evidence and claim boundaries. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`.

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Installs the three public skills as direct symlinks, cleans same-repo old skill links, syncs optional user templates, syncs `templates/hooks.json`, and validates install targets. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints read-only git/path preflight evidence. |
| `skills/evidence-verify/scripts/evidence-summary.ts` | No | Prints read-only diff/status evidence. |
| `tools/validate_skills.ts` | No | Validates the three-skill contract, references, byte budget, scripts, docs, and schemas. |

## User Hooks

`templates/hooks.json` defines one user-level `SessionStart` / `^compact$` hook, marked by `codex-alpha-goal-compact-recovery:v1`. `scripts/install.sh` merges that template into `${CODEX_HOME:-$HOME/.codex}/hooks.json`. The hook prints a static compact recovery policy that asks Codex to re-check `alpha-goal`, `control-loop`, and `evidence-verify` after compaction and load the applicable skill.

Hook replacement is by marker family, not exact version, so later `:v2` template markers replace existing `:v1` hooks. The installer also migrates the earlier experimental `codex-compact-skill-recovery` family.

## Runtime Artifacts

Default runtime artifacts live under the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/interview.md` | Clarification records and decision-boundary notes. |
| `<state-root>/YYYYMMDD-<TaskName>/iteration.md` | Latest execution iteration state when durable handoff is required. |
| `<state-root>/YYYYMMDD-<TaskName>/evidence.md` | Durable evidence, logs, screenshots, traces, or check outputs. |
| `<state-root>/YYYYMMDD-<TaskName>/verification.md` | Verification verdict artifacts. |
| `<state-root>/control-state/latest.md` | Stable latest Closed-loop Ledger entry when needed. |

## Byte Budget

The enforced control-byte budget is the whole `skills/` tree, capped at 30,000 bytes.
