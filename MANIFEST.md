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
| `scripts/install.sh` | Yes | Installs the three public skills as direct symlinks, cleans same-repo old skill links, syncs optional user templates, and validates install targets. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints read-only git/path preflight evidence. |
| `skills/evidence-verify/scripts/evidence-summary.ts` | No | Prints read-only diff/status evidence. |
| `tools/validate_skills.ts` | No | Validates the three-skill contract, references, byte budget, scripts, docs, and schemas. |

## Runtime Artifacts

Default runtime artifacts live under the Alpha Goal state root. Resolve it from `ALPHA_GOAL_STATE_ROOT` when set; otherwise use `${CODEX_HOME:-$HOME/.codex}/state/alpha-goal/<workspace-slug>/`. The state root is user-level by default and does not require a repo. Repo-local `.alpha-goal/` is a compatibility/explicit-policy override only.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/interview.md` | Clarification records and decision-boundary notes. |
| `<state-root>/YYYYMMDD-<TaskName>/iteration.md` | Latest execution iteration state when durable handoff is required. |
| `<state-root>/YYYYMMDD-<TaskName>/evidence.md` | Durable evidence, logs, screenshots, traces, or check outputs. |
| `<state-root>/YYYYMMDD-<TaskName>/verification.md` | Verification verdict artifacts. |
| `<state-root>/control-state/latest.md` | Stable latest Closed-loop Ledger entry when needed. |

## Byte Budget

The enforced control-byte budget is the whole `skills/` tree, capped at 30,000 bytes.
