# Cybernetic Conformance

Use this reference when checking whether a task actually followed the closed-loop control model, not just whether documents contain control vocabulary.

## State transition checks

Valid high-level route transitions:

```text
START -> alpha-goal
alpha-goal -> decision-synthesis | system-model | goal-contract | control-loop | evidence-verify | user | blocker
decision-synthesis -> goal-contract | system-model | control-loop | evidence-verify | user | blocker
system-model -> goal-contract | control-loop | evidence-verify | decision-synthesis | blocker
goal-contract -> control-loop | system-model | user | blocker
control-loop -> control-loop | evidence-verify | alpha-goal | system-model | blocker
evidence-verify -> final | control-loop | goal-contract | system-model | blocker
```

Reject or reframe these transitions unless an explicit no-write chat state explains the exception:

- `control-loop` before a reference and actuator boundary exist.
- `evidence-verify` before fresh evidence exists.
- final claim before `evidence-verify`.
- implementation mutation from a primary checkout when an isolated worktree is required.

## Invariants

- reference before action: a Goal Contract or equivalent context identifies target, scope, non-goals, authority, acceptance evidence, and claim boundary before mutation.
- plant before broad control: system boundary, sensors, actuators, disturbances, and coupling are modeled before high-blast-radius action.
- sensor before claim: the sensor must be fresh enough and cross the same boundary as the proposed claim.
- comparator before final: `evidence-verify` must compare evidence, residual error, and final claim boundary before completion wording.
- memory before resume: cross-skill work resumes from `.alpha-goal/YYYYMMDD-<slug>/control-state.md`, not from a compact chat summary.
- legacy artifact path guard: runtime artifacts stay under `.alpha-goal/YYYYMMDD-<slug>/`; legacy category paths are validation failures.

Conditional transition rules:

- `decision-synthesis -> control-loop` is valid only when an approved Goal Contract already exists and synthesis narrows the next slice without changing reference, scope, authority, risk acceptance, or claim boundary.
- `decision-synthesis -> evidence-verify` is valid only when synthesis did not authorize mutation and the next action is comparing an existing evidence bundle to a proposed claim.
- `system-model -> control-loop` is valid only when an approved Goal Contract exists and the model only updates plant, sensor, actuator, disturbance, or coupling facts within that contract.

## Schema sidecar

When a task is long-running, high-risk, or likely to resume, emit a machine-readable Schema sidecar in `.alpha-goal/YYYYMMDD-<slug>/schema/` for the stage artifact. The sidecar is JSON and uses these required keys so a validator can check route recovery, state transitions, evidence boundaries, and claim boundaries:

```json
{
  "artifact_kind": "goal-contract | system-model | decision-synthesis | iteration-record | verification-verdict | conformance-report",
  "task_slug": "YYYYMMDD-<slug>",
  "artifact_path": ".alpha-goal/YYYYMMDD-<slug>/artifact.md",
  "reference_id": "stable identifier or null",
  "route_state": "alpha-goal | decision-synthesis | system-model | goal-contract | control-loop | evidence-verify | final | user | blocker",
  "prior_route": "previous route or null",
  "next_route": "next route or final",
  "target_error": "mismatch being reduced or null",
  "control_variable": "approved control variable or null",
  "sensor": "fresh evidence signal or null",
  "threshold_or_tolerance": "decision threshold or null",
  "evidence_boundary": "artifact | helper | module | service | user-visible | production | safety | custom",
  "residual_error": "remaining mismatch or null",
  "claim_boundary": "widest claim supported by evidence or null",
  "generated_at": "ISO-8601 timestamp"
}
```

Stage-specific required keys:

- `goal-contract`: `reference_id`, `claim_boundary`, `evidence_boundary`, `next_route`.
- `system-model`: `sensor`, `evidence_boundary`, `next_route`.
- `decision-synthesis`: `reference_id` when reusing an existing Goal Contract, otherwise `claim_boundary` or `next_route`.
- `iteration-record`: `target_error`, `control_variable`, `sensor`, `threshold_or_tolerance`, `residual_error`, `next_route`.
- `verification-verdict`: `sensor`, `evidence_boundary`, `claim_boundary`, `residual_error`, `next_route`.
- `conformance-report`: `artifact_path`, `route_state`, `prior_route`, `next_route`, `residual_error`, `claim_boundary`.

## Conformance report

Use `.alpha-goal/YYYYMMDD-<slug>/conformance-report.md` when a final or handoff claim needs an audit trail:

```text
Cybernetic Conformance Report:
- Artifact layout: pass | fail
- State transition: pass | fail
- Reference before action: pass | fail
- Control Law completeness: pass | fail
- Disturbance handling: pass | fail | not applicable
- Indicator handoff: pass | fail | not applicable
- Sensor before claim: pass | fail
- Comparator before final: pass | fail
- Legacy artifact path scan: pass | fail
- Required next route:
```
