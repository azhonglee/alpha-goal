---
name: loop
description: Run bounded control iterations under an approved Goal Contract: plan one slice, execute or probe safely, sense feedback, compare error, record evidence, and route to continue, harden, verify, reframe, or block.
---

# Loop

Use this skill to advance an approved goal through bounded iterations. It is the controller/actuator stage of the suite.

## Entry requirements before mutation

All must be true before editing implementation files:

- an approved Goal Contract or equivalent context identifies reference state, desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, acceptance evidence, and claim boundary;
- target/scope boundary and final claim boundary are clear enough to decide changed files and final wording;
- applicable local rules, durable specs, and active plans have been read;
- repository, worktree, submodule, ownership, dirty-state, and unrelated user-change boundaries are understood;
- isolated edit path is ready, or creating it is the first explicitly recorded setup mutation;
- `.worktrees/`, `.alpha-goal/`, or alternative process-artifact paths are ignored or explicitly approved;
- strongest material risk, loop mode, evidence floor, and mutation preflight are recorded.

Before mutation, cite the contract source actually read: file path, chat excerpt, or explicit equivalent context. If it is unavailable, do not infer it from phrases like “existing Goal Contract”; return to `alpha-goal`.

If system boundary, sensors, actuators, disturbances, or coupling are unclear enough to affect safe action, route to `system-model` before mutation.

## Load resources when needed

- `references/worktree-safety.md`: isolated edit paths and primary-checkout safety.
- `references/execution-boundaries.md`: delegation, ownership, submodules, generated output, and user-owned changes.
- `references/loop-modes.md`: mode choice, evidence type, debug receipt, and route decisions.
- `references/plan-template.md`: durable dynamic plans for multi-slice or handoff-heavy work.
- `references/iteration-record-schema.md`: compact or formal Iteration Record semantics.
- `scripts/mutation-preflight.sh`: read-only git/path preflight.

## Iteration process

Each pass is a control cycle:

```text
Plan control slice -> Preflight -> Execute or probe -> Sense feedback -> Compare error -> Record -> Route
```

A single `loop` run may perform multiple bounded passes when context, authorization, risk, and user-owned decisions remain stable and each pass is recorded proportionally.

### 1. Plan control slice

Dynamic planning answers only the current iteration:

- the smallest coherent acceptance-relevant slice that can be completed and observed now;
- control variables to change and variables intentionally held constant;
- fresh evidence needed after the slice and how it will be sensed;
- files, modules, repos, generated outputs, and ownership surfaces allowed to change;
- assumptions, disturbances, and stop conditions for reframe, block, or unsafe execution;
- expected artifacts, side effects, cleanup, rollback, or containment needs;
- strongest material risk and evidence floor;
- success, failure, feedback, and reframe routes;
- whether a durable plan is necessary.

Create or update a durable plan only for multiple independent loops, modules, repos, handoff/recovery needs, external side effects, irreversible/high-risk changes, rollback/compatibility decisions, contested ownership, or user request.

### 2. Preflight

Run `scripts/mutation-preflight.sh` or record equivalent manual facts before mutation. Low-risk slices may use compact preflight; dirty state, generated outputs, submodules, cross-file behavior, or user changes require fuller preflight.

Preflight must answer:

- am I in the intended repository and boundary?
- is the current checkout primary, linked worktree, or otherwise unsafe?
- what unrelated user changes exist?
- which local rule files apply?
- are process-artifact paths ignored or approved?
- what evidence floor is required by the strongest material risk?

### 3. Execute or probe

- For a mutation slice, make one coherent targeted change unless the approved slice explicitly requires coordinated edits.
- For a read-only/probe slice, do not mutate; produce evidence, diagnosis, or a route decision.
- Preserve and interpret failing outputs; do not hide, rerun away, or summarize them as success.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- Prefer targeted edits; defer unrelated cleanup unless necessary for the approved slice and recorded as risk-reducing.
- Record artifacts, generated outputs, side effects, cleanup, and rollback/containment actions as they occur.
- Stay inside the approved target, scope, non-goals, constraints, authorization, and claim boundary.

For debugging, identify and record root cause before repair. If root cause is not confirmed, limit changes to diagnostic probes, reversible instrumentation, or explicitly hypothesis-testing slices that do not alter the intended fix surface.

Use subagents only for independent ownership surfaces, read-only review, evidence audit, test/log analysis, or risk assessment. Do not allow overlapping mutation without coordination, and inspect returned evidence before accepting it.

Forbidden unless explicitly requested and risk is recorded:

- editing or deleting files in a primary `main`/`master`/`trunk` checkout;
- creating a branch in a primary checkout when an isolated worktree should be used;
- mutating a candidate repo not selected by the approved context;
- crossing repo, worktree, submodule, or ownership boundaries;
- unrelated broad formatting or opportunistic refactor;
- final completion, merge-ready, ship-ready, production-safe, or root-cause-fixed claims.

### 4. Sense feedback

Collect fresh feedback after the material action:

- tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection;
- user, reviewer, or subagent feedback;
- stale, contradicted, or newly discovered specs/plans/rules;
- environment, permission, dependency, data, or upstream-state changes;
- regression, compatibility, migration, security, observability, or data-risk signals.

Classify evidence:

- `gate evidence`: can satisfy acceptance or claim boundary;
- `advisory evidence`: identifies risk but does not prove completion;
- `exploration evidence`: maps possibilities only;
- `blocked evidence`: shows missing environment, tool, data, or permission.

### 5. Compare error and decide route

Compare current state against the reference, not against effort spent.

Choose one primary route:

- `ITERATION_CONTINUES`: goal remains valid and another bounded slice should proceed or be recommended.
- `ITERATION_HARDEN`: implementation direction is valid but evidence, edge cases, compatibility, cleanup, or observability are insufficient.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears covered and the evidence bundle is ready for independent `verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, constraints, decision boundaries, authorization, or final claim changed or is unreliable.
- `RETURN_TO_SYSTEM_MODEL`: plant boundary, sensors, actuators, disturbances, or coupling became materially unclear.
- `BLOCKED`: missing permission, tool, data, environment, credential, or user-owned decision prevents safe progress.

Do not choose `ITERATION_READY_FOR_VERIFY` merely because implementation is done. Choose it only when fresh evidence plausibly covers acceptance and claim boundary.

### 6. Record

Produce an Iteration Record before handoff, blocking, or materially changing direction. Use compact records for low-risk passes, but preserve:

- approved context and boundary;
- dynamic plan and preflight;
- action or probe;
- fresh evidence and evidence class;
- acceptance delta and error remaining;
- feedback and disturbances;
- route decision;
- next action.

Do not make final completion claims in the Iteration Record. Completion judgment belongs to `verify`.

### 7. Route next

- For `ITERATION_CONTINUES` or `ITERATION_HARDEN`, start the next bounded pass only when context, risk, budget, and authorization remain stable; otherwise record the recommended next pass and pause.
- For `ITERATION_READY_FOR_VERIFY`, hand off to `verify` with the current claim, Goal Contract, diff/artifact evidence, and fresh checks.
- For `RETURN_TO_ALPHA_GOAL`, stop mutation and revise the contract.
- For `RETURN_TO_SYSTEM_MODEL`, stop mutation and model the system boundary.
- For `BLOCKED`, stop and report the smallest missing input, permission, tool, data, environment, or safe-state condition.
