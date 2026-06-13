# Iteration Record Schema

Use this reference only when a loop result needs a durable or handoff-ready record. Keep the record proportional: a field belongs only when it changes judgment, handoff, recovery, or accountability.

## Compact record

```text
Iteration Record:
- Boundary:
- Action:
- Evidence:
- Decision:
- Next:
```

### Boundary

Approved Goal Contract or equivalent context used, including target/scope/non-goals/claim boundary relevant to this slice.

### Action

What was changed, explored, tested, delegated, or blocked in this iteration. Avoid long narrative.

### Evidence

Fresh checks, probes, diff review, command output, or blocker evidence. State whether evidence is gate evidence, advisory, or exploration-only when that matters.

### Decision

One of: `continue`, `harden`, `verify`, `reframe`, or `blocked`.

### Next

Smallest next action or handoff target. If leaving `loop`, the next skill is only `verify` or `alpha-goal`; otherwise continue with another slice in the current `loop`.

## Conditional fields

Add only the fields that affect this iteration:

- `Dynamic plan`: multi-slice, multi-repo/module, contested ownership, recovery, rollback, compatibility, or handoff sequencing.
- `Preflight`: mutation path, dirty-state, worktree, submodule, local-rule, or user-change evidence when editing is involved.
- `Changed files`: intentional touched paths when there is a diff.
- `Acceptance delta`: acceptance items newly covered, partially covered, or still uncovered.
- `Feedback handling`: user, reviewer, test, runtime, or advisory feedback that changed the route.
- `Risk/ownership`: cross-boundary, generated-output, migration, compatibility, concurrency, data, security, or observability risk.
- `Debug Receipt`: required for bug/root-cause claims. See `references/loop-modes.md`.
- `Delegation receipt`: required when subagents own an independent surface.

## Verdict vocabulary

Use route-oriented labels rather than final-completion claims:

- `ITERATION_CONTINUES`: another slice is needed in the current `loop`.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears covered; final judgment belongs to `verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, decision boundary, or claim boundary needs reframing.
- `BLOCKED`: the smallest missing input, permission, tool, data, environment, or safe-state condition is named.
