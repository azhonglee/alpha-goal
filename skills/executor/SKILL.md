---
name: executor
description: "Bounded executor. Use only after an accepted Goal Contract authorizes implementation or hardening. Do not use for ambiguous planning."
---

# Executor

## Core Principle

1. Goal Contract is authority.
2. Execution is output.
3. Evidence is input.
4. `verifier` compares.
5. Route is output.

`executor` implements, repairs, hardens, and collects evidence inside the accepted Goal Contract. It must not redefine target, scope, constraints, acceptance evidence, non-goals, decision boundary, claim boundary, or authorization source.

## Acceptance Checklist

Before planning, convert acceptance evidence into a hard-blocking checklist.

Each item records acceptance item, source, evidence needed/current evidence, status, and remaining gap.

Hard-blocking rules:
- Every required item starts `pending`.
- Every in-scope `technical_design.md` item is satisfied, mapped, or explicitly `deferred-non-goal`.
- `deferred-non-goal` requires explicit Goal Contract or user exclusion.
- Any `pending`, `failed`, or `blocked` required item prohibits PASS_TO_FINAL.
- Checklist state may be recorded in `checkpoint.md` for recovery or evidence/verification handoff.

## Runtime Flow

```pseudo
goal = read_accepted_goal_contract()
design = read_technical_design_if_present_and_applicable(goal)
checklist = build_acceptance_checklist(goal, design)
assert_execution_environment_safe(goal)

if checklist.has_blocked_required_item:
  return BLOCKED

while checklist_has_unmet_required_items:
  slice = plan_highest_value_unmet_item(goal, checklist)
  assert_slice_inside_goal_contract(slice, goal)
  outcome = execute_slice(slice)
  evidence = classify_execution_evidence(outcome)
  update_checklist(checklist, evidence)

  if authority_or_scope_changed: return RETURN_TO_ALPHA_GOAL
  if blocker_exists or checklist.has_blocked_required_item: return BLOCKED
  if same_goal_gap_exists: continue

return run_verifier(goal, checklist, evidence)
```

## Authority

Return to `alpha-goal` when target, scope, constraints, acceptance evidence, non-goals, decision boundary, claim boundary, authorization source, autonomy level, or actuator boundary changes.

## Evidence Classification

Classify raw output before routing:
- [from-test] result=pass|fail; test/check evidence.
- [from-build] result=pass|fail; build/type/lint/syntax evidence.
- [from-runtime] result=observed|failed; runtime evidence.
- [from-review] result=finding|clear; reviewer/subagent evidence.
- [from-inspection] result=observed; code/artifact inspection.
- [from-blocker] result=blocked; missing permission, credential, tool, data, environment, system, or user decision.

Rules:
- Auto-confirm only raw execution facts.
- Do not infer completion from partial success.
- Do not infer safety from absence of failure.
- Do not infer acceptance from unrelated tests.
- Do not infer authority from implementation convenience.
- Only `verifier` skill may support final-ready, safe, complete, fixed, hardened, shipped, or MR-ready claims.

## Route Rules

- PASS_TO_FINAL: acceptance evidence satisfied, checklist has zero unmet required items, no unresolved blocker, no authority drift.
- NEXT_ITERATION: same-goal fixable `pending` or `failed` gap remains and required action is authorized.
- BLOCKED: progress needs missing permission, credential, tool, data, environment, system, or user decision.
- RETURN_TO_ALPHA_GOAL: Goal Contract is no longer sufficient or new authority is required.

Partial delivery is not completion; if any required item remains `pending`, `failed`, or `blocked`, continue or report partial with gaps.

## Slice Boundary Gates

Before executing a slice:
[ ] Target, scope, constraints, non-goals, authorization source, actuator boundary, autonomy level, and claim boundary all match the Goal Contract.
[ ] Slice has an observable evidence path.

If any item fails, do not execute; route to RETURN_TO_ALPHA_GOAL or BLOCKED.

## Execution Gates

Before mutation:
[ ] Accepted Goal Contract loaded.
[ ] Issued by = alpha-goal.
[ ] Worktree / branch safety checked.
[ ] Primary branch mutation denied unless explicitly authorized.
[ ] Unrelated user changes identified and preserved.
[ ] Relevant repo rules inspected.
[ ] Required dependencies/tools available.
[ ] Rollback/recovery path understood.

## Implementation Quality Gate

Before landing slice:
[ ] Minimal accepted-slice change; follows repo patterns.
[ ] No unrelated refactor, formatting churn, dependency change, or silent fallback.
[ ] `technical_design.md` API/data/test implications are implemented or recorded as same-goal gaps.
[ ] Evidence covers touched risk, not only happy path.
[ ] New defects/conflicts/regressions become `failed` checklist items.

## Completion Gate

Before returning final success:
[ ] Acceptance evidence collected.
[ ] Evidence directly maps to Goal Contract acceptance evidence.
[ ] Acceptance checklist has no `pending`, `failed`, or `blocked` required item.
[ ] In-scope `technical_design.md` items are satisfied, mapped, or explicitly `deferred-non-goal`.
[ ] No unresolved same-goal fixable gap remains.
[ ] No unresolved blocker remains.
[ ] No source-of-truth conflict remains.
[ ] No scope/authority/claim-boundary change occurred.
[ ] `verifier` skill verdict allows final route.
[ ] route is PASS_TO_FINAL.

If any item is unchecked, do not claim complete.

## Checkpoint Policy

`<Alpha Goal state root>/YYYYMMDD-<TaskName>/checkpoint.md` is recovery support, not progress.
Resolve Alpha Goal state root as `$HOME/.alpha-goal/<workspace-slug>/`, where `<workspace-slug>` is `slug(repo_root or Goal Contract target workspace)`.

Create or update checkpoint only for recovery, evidence handoff, verification handoff, long-running execution, interrupted execution, or multi-step repair.

Checkpoint may record current slice, completed actions, raw evidence, acceptance checklist, known gaps, blockers, and next route. It may not redefine goal, scope, acceptance, non-goals, authority, or claim boundary.

## Before Final Response Checklist

[ ] State what changed.
[ ] State evidence collected.
[ ] State verification result.
[ ] State remaining gaps, if any.
[ ] Avoid claims beyond Goal Contract claim boundary.
[ ] If incomplete, route clearly: NEXT_ITERATION / BLOCKED / RETURN_TO_ALPHA_GOAL.
