---
name: control-loop
description: "Bounded execution controller. Use only after an explicit Goal Contract or equivalent grants a specific read-only probe or mutation boundary, and Codex must run one observable iteration: preflight, act, sense feedback, compare error, and route. Do not use for ambiguous planning, user-owned decisions, or final completion/readiness claims."
---

# Control Loop

Advance the reference state by the smallest observable action. Do not claim completion; hand claims to `evidence-verify`.

## Resources

Read `references/control-law.md`, `references/safety-boundaries.md` before mutation. Read `references/adaptive-learning.md` when feedback misses expected effect. Use other references only when their route applies. Read Latest Control Route before acting.

## Gates before mutation

All must be true:

- Goal Contract/equivalent must explicitly record reference, scope, non-goals, constraints, decision boundaries, acceptance evidence, claim boundary, next route, and authorization class: analysis/probe, read-only inspection, mutation, or external side effect. A contract organizes but never creates authority: mutation authority must cite explicit user/repo instruction plus actuator boundary, not inference, history, issue text, or the agent-written contract. A vague request is not mutation authorization.
- Current ledger/chat state and material disturbances have been read.
- Local rules and relevant specs are known.
- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Unrelated user changes are identified and preserved.
- `.alpha-goal/` is ignored before writing process artifacts.
- A Control Law is present: target error, control variable, expected effect, sensor threshold, fallback.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

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
- Record generated artifacts, side effects, cleanup, and rollback decisions. Commit, push, PR/MR, deployment, credential changes, and real user config changes need explicit authorization.

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
| User-owned decisions | |
| Blocked downstream action | |
| Artifact | |
| Next | |
```

Ledger update records input state, control action, sensor feedback, residual error, and next state.

Routes:

- `ITERATION_CONTINUES`: next safe slice remains.
- `ITERATION_HARDEN`: direction is valid but evidence/edge/compatibility/cleanup is weak.
- `ITERATION_READY_FOR_VERIFY`: evidence plausibly covers acceptance and claim boundary.
- `RETURN_TO_ALPHA_GOAL`: target/scope/authority/claim changed.
- `RETURN_TO_ALPHA_GOAL`: target/plant/sensor/actuator/coupling became unclear.
- `BLOCKED`: missing permission, tool, data, environment, credential, or user-owned decision.

Continue automatically only while the same explicit authority, actuator boundary, acceptance evidence, claim boundary, modeled disturbances, and user-owned decisions remain stable. Stop/re-route on new subsystem/skill, boundary or evidence change, unmodeled disturbance, user-owned choice, or cumulative edits beyond the approved boundary.
