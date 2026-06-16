---
name: control-loop
description: "Run bounded control iterations under an approved Goal Contract: plan one slice, preflight, execute or probe safely, sense feedback, compare error, record evidence, and route to continue, harden, verify, reframe, or block."
---

# Control Loop

Advance the reference state by the smallest observable action. Do not claim completion; hand claims to `evidence-verify`.

## Resources

Load only when useful: `references/worktree-safety.md`, `references/execution-boundaries.md`, `references/loop-modes.md`, `references/plan-template.md`, `references/control-law.md`, `references/adaptive-learning.md`, `references/iteration-record-schema.md`, `references/auto-execution.md`. Read Latest Control Route before acting.

## Gates before mutation

All must be true:

- Goal Contract or equivalent states reference, scope, non-goals, constraints, decision boundaries, acceptance evidence, claim boundary, and authorization.
- Current ledger/chat state and material disturbances have been read.
- Local rules and relevant specs are known.
- Work is isolated from primary `main`/`master`/`trunk` unless explicit authorization says otherwise.
- Unrelated user changes are identified and preserved.
- `.alpha-goal/` is ignored before writing process artifacts.
- A Control Law is present: target error, control variable, expected effect, sensor threshold, fallback.

If any gate is missing, route to `goal-contract`, `system-model`, or blocker instead of editing.

## Iteration

```text
Plan slice -> Preflight -> Act/probe -> Sense -> Compare -> Record -> Route
```

### 1. Plan slice

Choose one coherent acceptance-relevant slice. State:

```text
Control Law:
- Target error:
- Control variable:
- Expected effect:
- Sensor threshold:
- Fallback:
- Allowed changes:
- Held constant:
```

Create a durable plan only for multi-module, multi-agent, risky, external-side-effect, rollback-heavy, or user-requested work.

### 2. Preflight

Run `npx --yes tsx skills/control-loop/scripts/mutation-preflight.ts` from repo root, or record equivalent facts: root, branch/worktree, status, applicable rule files, ignored `.worktrees/` and `.alpha-goal/`, submodules, strongest evidence floor.

### 3. Act or probe

- Mutate only the approved boundary.
- Prefer targeted edits and existing tools.
- Preserve raw failures; never mask defects with cosmetic fallbacks.
- Do not stash/revert/delete unrelated changes without approval.
- Use subagents only for independent review/work surfaces; tell workers they are not alone in the codebase.
- Record generated artifacts, side effects, cleanup, and rollback decisions.

### 4. Sense and compare

Collect fresh evidence after the action: tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection. Classify it as gate / advisory / exploration / blocked evidence.

Compare observed feedback to the Control Law and Goal Contract. If the expected effect or threshold is not met, harden, fallback, reframe, or block. If feedback contradicts a reusable assumption, record an Adaptive Learning Record: trigger, mismatch, adjustment, reuse condition, invalidation condition.

### 5. Record and route

Persist `.alpha-goal/iterations/YYYYMMDD-<slug>.md` for multi-turn/risky/handoff work; otherwise summarize in chat. Store bulky evidence under `.alpha-goal/evidence/` when useful.

```markdown
Iteration Summary

| Field | Value |
| --- | --- |
| Action | |
| Feedback | |
| Residual error | |
| Artifact | |
| Next | |
```

Ledger update records input state, control action, sensor feedback, residual error, and next state.

Routes:

- `ITERATION_CONTINUES`: next safe slice remains.
- `ITERATION_HARDEN`: direction is valid but evidence/edge/compatibility/cleanup is weak.
- `ITERATION_READY_FOR_VERIFY`: evidence plausibly covers acceptance and claim boundary.
- `RETURN_TO_ALPHA_GOAL`: target/scope/authority/claim changed.
- `RETURN_TO_SYSTEM_MODEL`: plant/sensor/actuator/coupling became unclear.
- `BLOCKED`: missing permission, tool, data, environment, credential, or user-owned decision.

Continue automatically when the next slice is authorized, low-risk, deterministic, and observable; otherwise state the concrete stop reason.
