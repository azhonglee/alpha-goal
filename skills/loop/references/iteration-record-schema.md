# Iteration Record Schema

Use this reference when a loop result needs a durable or handoff-ready record. Keep it proportional: include fields only when they affect judgment, handoff, recovery, or accountability.

## Compact record

```text
Iteration Record:
- Boundary:
- Control slice:
- Action:
- Evidence:
- Error/acceptance delta:
- Control law result:
- Ledger update:
- Decision:
- Next:
```

## Conditional fields

Add when relevant:

- `Dynamic plan`: multi-slice, multi-repo/module, contested ownership, recovery, rollback, compatibility, or handoff sequencing.
- `Preflight`: mutation path, dirty state, worktree, submodule, local rules, or user-change evidence.
- `Changed files`: intentional touched paths when there is a diff.
- `Generated artifacts`: generated files, reports, binaries, or documents.
- `Acceptance delta`: criteria covered, partially covered, or uncovered.
- `Control law result`: target error, expected effect, observed feedback, threshold status, fallback, and residual error for mutation or diagnostic-probe slices.
- `Feedback handling`: user, reviewer, test, runtime, or advisory feedback that changed the route.
- `Risk/ownership`: cross-boundary, generated-output, migration, compatibility, concurrency, data, security, or observability risk.
- `Ledger update`: input state, error signal, control action, sensor feedback, residual error, route decision, and next state when the task spans skills or turns.
- `Debug Receipt`: required for bug/root-cause claims.
- `Delegation receipt`: required when subagents own an independent surface.

## Verdict vocabulary

- `ITERATION_CONTINUES`: another bounded slice should proceed or be recommended.
- `ITERATION_HARDEN`: direction is valid but evidence, edge cases, compatibility, or cleanup are insufficient.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears covered; final judgment belongs to `verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, constraints, decision boundary, authorization, or claim boundary needs reframing.
- `RETURN_TO_SYSTEM_MODEL`: plant boundary, observability, controllability, disturbance, or coupling needs modeling.
- `BLOCKED`: smallest missing input, permission, tool, data, environment, or safe-state condition is named.
