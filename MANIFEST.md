# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: clarify intent, outcome, constraints, boundaries, authority, design handoff, and route approved launches. |
| `skills/control-loop/` | Bounded actuator/controller for safe execution and feedback. |
| `skills/evidence-verify/` | Independent comparator for evidence and claim boundaries. |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Installs the three public skills as direct symlinks, cleans same-repo old skill links, syncs optional user templates, and validates install targets. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints read-only git/path preflight evidence. |
| `skills/evidence-verify/scripts/evidence-summary.ts` | No | Prints read-only diff/status evidence. |
| `tools/validate_skills.ts` | No | Validates the three-skill contract, byte budget, scripts, docs, and schemas. |
| `tools/validate_skillset.ts` | No | Compatibility wrapper for `tools/validate_skills.ts`. |

## Runtime Artifacts

| Path | Purpose |
|---|---|
| `.alpha-goal/control-state/latest.md` | Stable latest Closed-loop Ledger entry when durable handoff is required. |
| `.alpha-goal/context/` | Optional clarification and design-context artifacts. |
| `.alpha-goal/iterations/` | Optional execution iteration artifacts. |
| `.alpha-goal/evidence/` | Optional durable evidence, logs, screenshots, traces, or check outputs. |
| `.alpha-goal/verification/` | Optional verification verdict artifacts. |

## Byte Budget

The enforced control-byte budget is the whole `skills/` tree, capped at 30,000 bytes.
