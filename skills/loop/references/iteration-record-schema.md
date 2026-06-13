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

Use one of the route labels from Verdict vocabulary. Compact notes may also include the short meaning: `continue`, `harden`, `verify`, `reframe`, or `blocked`.

### Next

Smallest next action or handoff target. The next action is only another bounded `loop` pass, a handoff to `verify`, a handoff to `alpha-goal`, or an iteration-level blocked stop state.

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

- `ITERATION_CONTINUES`: goal remains valid and another bounded implementation slice should proceed or be recommended.
- `ITERATION_HARDEN`: implementation direction is valid, but evidence, edge cases, compatibility, or cleanup are insufficient; run or recommend a hardening slice.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears covered; final judgment belongs to `verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, constraints, decision boundary, authorization, or claim boundary needs reframing.
- `BLOCKED`: the smallest missing input, permission, tool, data, environment, or safe-state condition is named; this is an iteration-level blocker unless the active runtime policy says otherwise.
