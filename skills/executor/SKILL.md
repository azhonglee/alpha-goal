---
name: executor
description: "Goal-contract-driven bounded executor and hardener. Use only after an accepted Goal Contract authorizes implementation, repair, or hardening. Do not use for ambiguous planning."
---

# Executor

## Core Principle
1. Goal Contract is authority.
2. Execution is actuator output.
3. Evidence is sensor input.
4. `verifier` skill is comparator.
5. Route decision is control output.

Execution results are evidence, not automatic completion.  
Passing tests, changed files, clean builds, or successful commands may support a claim, but they do not by themselves authorize final-ready, safe, complete, fixed, shipped, or MR-ready claims.

`executor` may implement, repair, harden, and collect evidence inside the approved boundaries. It may not redefine target, scope, acceptance evidence, non-goals, decision boundaries, claim boundary, trigger contract, or authority.

## Acceptance Coverage Matrix
Before planning work, convert Goal Contract acceptance evidence into an acceptance coverage matrix.

Matrix rows:
- Required acceptance item
- Source: Goal Contract, or `technical_design.md` when in scope
- Evidence needed
- Current evidence
- Status: `pending`, `satisfied`, `failed`, `blocked`, or `deferred-non-goal`
- Remaining gap

Rules:
- Every required acceptance item starts as `pending`.
- If `technical_design.md` exists and is inside scope, map each in-scope design item to an acceptance item or mark it `deferred-non-goal`.
- `deferred-non-goal` requires an explicit Goal Contract or user exclusion.
- `pending`, `failed`, or `blocked` required items prohibit PASS_TO_FINAL.
- Matrix state may be recorded in `checkpoint.md` for recovery, evidence handoff, or verification handoff.

## Runtime Flow

**Run the loop as behavior, not paperwork:**

```pseudo
function executor(goal_contract):
  goal = read_accepted_goal_contract(goal_contract)
  design = read_technical_design_if_present_and_applicable(goal)
  checkpoint = read_checkpoint_if_present_or_needed(goal)
  matrix = build_acceptance_coverage_matrix(goal, design, checkpoint)

  assert_goal_contract_valid(goal)
  assert_execution_environment_safe(goal)

  while true:
    slice = plan_highest_value_unmet_matrix_item(goal, matrix, checkpoint)
    assert_slice_within_goal_contract(slice, goal)

    outcome = execute_slice(slice)
    evidence = collect_execution_evidence(slice, outcome)
    classified = classify_execution_evidence(evidence, goal)
    matrix = update_acceptance_coverage_matrix(matrix, classified)

    record_checkpoint_if_needed(classified, matrix)

    if classified.changed_goal_authority:
      return RETURN_TO_ALPHA_GOAL

    if classified.blocked or matrix.has_blocked_required_item:
      return BLOCKED

    if classified.same_goal_fixable_gap or matrix.has_pending_or_failed_required_item:
      continue

    verification = run_verifier_before_completion_claim(classified, matrix, goal)
    route = route_after_verification(verification, goal)

    if route == NEXT_ITERATION:
      continue

    if route == PASS_TO_FINAL and matrix.has_no_unmet_required_item:
      return PASS_TO_FINAL

    if route == PASS_TO_FINAL:
      return NEXT_ITERATION

    return route
```

## Authority 
The Goal Contract defines:
- target
- scope
- constraints
- acceptance evidence
- non-goals
- decision boundary
- claim boundary
- authorization source

executor may not change any of them.
If any of these need to change, RETURN_TO_ALPHA_GOAL

## Evidence Classification
Treat execution output as classified evidence, not automatic authority.

Classify each result before making a route decision:
- [from-test] result=pass|fail; test or check evidence.
- [from-build] result=pass|fail; build, type, lint, or syntax evidence.
- [from-runtime] result=observed|failed; runtime behavior evidence.
- [from-review] result=finding|clear; reviewer or subagent finding evidence.
- [from-inspection] result=observed; implementation change or code inspection evidence.
- [from-environment] result=available|unavailable; tooling, credential, or environment evidence.
- [from-gap] result=same-goal-fixable|scope-change|authority-change; difference between current evidence and acceptance evidence.
- [from-blocker] result=blocked; missing permission, tool, data, environment, credential, or user decision.

Legacy evidence aliases map to canonical evidence:
- `from-test-pass` -> [from-test] result=pass
- `from-test-fail` -> [from-test] result=fail
- `from-build-pass` -> [from-build] result=pass
- `from-build-fail` -> [from-build] result=fail
- `from-runtime-observation` -> [from-runtime] result=observed
- `from-code-change` -> [from-inspection] result=observed

Rules:
Auto-confirm only raw execution facts.
Do not infer completion from partial success.
Do not infer safety from absence of failure.
Do not infer acceptance from passing unrelated tests.
Do not infer authority from implementation convenience.
Only `verifier` skill may support final-ready, safe, complete, fixed, hardened, shipped, or MR-ready claims.

## Partial Delivery Rule
Partial delivery is not failure, but it is not completion.

Classify as NEXT_ITERATION when:
- A useful slice landed.
- Tests, builds, commits, or runtime checks passed.
- Any required matrix item remains `pending`, `failed`, or `blocked`.
- Any in-scope `technical_design.md` item remains unmapped, unsatisfied, or not explicitly `deferred-non-goal`.

Final responses for partial delivery must say partial, list remaining gaps, and avoid complete, fixed, shipped, or MR-ready claims unless `verifier` returns PASS_TO_FINAL and the matrix has zero unmet required acceptance items.

## Slice Boundary Gates
Before executing a slice, all must pass:
[ ] Slice target is inside Goal Contract target
[ ] Slice scope is inside Goal Contract scope
[ ] Slice does not violate non-goals
[ ] Slice respects constraints
[ ] Slice respects authorization source
[ ] Slice respects actuator boundary
[ ] Slice requested action is allowed by autonomy level
[ ] Slice claim is inside claim boundary
[ ] Slice has observable evidence path

If any of these fail, DO NOT EXECUTE; RETURN_TO_ALPHA_GOAL or BLOCKED

## Execution Gates
Before mutating files:
[ ] Accepted Goal Contract loaded
[ ] Issued by = alpha-goal
[ ] Worktree / branch safety checked
[ ] Primary branch mutation denied unless explicitly authorized
[ ] Unrelated user changes identified and preserved
[ ] Relevant repo rules inspected
[ ] Required dependencies/tools available
[ ] Rollback or recovery path understood for risky changes

## Completion Gate
Before returning final success:
[ ] Acceptance evidence collected
[ ] Evidence directly maps to Goal Contract acceptance evidence
[ ] Acceptance coverage matrix has no `pending`, `failed`, or `blocked` required item
[ ] In-scope `technical_design.md` items are satisfied, mapped, or explicitly `deferred-non-goal`
[ ] Partial delivery, if any, is labeled partial and routed NEXT_ITERATION
[ ] No unresolved same-goal fixable gap remains
[ ] No unresolved blocker remains
[ ] No source-of-truth conflict remains
[ ] No scope/authority/claim-boundary change occurred
[ ] `verifier` skill verdict allows final route

If any item is unchecked, DO NOT claim complete.

## Stop / Return Rules
Return to `alpha-goal` skill when:
- Target changes
- Scope changes
- Acceptance evidence changes
- Non-goals change
- Decision boundary changes
- Claim boundary changes
- Authorization source changes
- Autonomy level changes
- Actuator boundary changes

Return BLOCKED when:
- Permission missing
- Credential missing
- Environment unavailable
- Tool unavailable
- Required data unavailable
- User-owned decision unresolved
- External system unavailable

Continue next iteration when:
- Gap is fixable
- Gap is inside same Goal Contract
- Required action is authorized
- Evidence path is clear

Finish only when:
- Goal Contract acceptance evidence is satisfied
- verifier passes
- route is PASS_TO_FINAL
- Acceptance coverage matrix has zero unmet required acceptance items
- No required work remains
- No loopholes remain

## Checkpoint Policy
`<Alpha Goal state root>/YYYYMMDD-<TaskName>/checkpoint.md` is recovery support, not progress.
Resolve Alpha Goal state root as `$HOME/.alpha-goal/<workspace-slug>/`, where `<workspace-slug>` is `slug(repo_root or Goal Contract target workspace)`.

Create or update checkpoint only when it helps:
- Recovery
- Evidence handoff
- Verification handoff
- Long-running execution
- Interrupted execution
- Multi-step repair

Checkpoint may record:
- Current slice
- Completed actions
- Raw evidence
- Acceptance coverage matrix
- Known gaps
- Blockers
- Loopholes
- Next route

Checkpoint may not redefine:
- Goal
- Scope
- Acceptance
- Non-goals
- Authority
- Claim boundary

## Before Final Response Checklist
[ ] State what changed
[ ] State evidence collected
[ ] State verification result
[ ] State remaining gaps, if any
[ ] Avoid claims beyond Goal Contract claim boundary
[ ] If incomplete, route clearly: NEXT_ITERATION / BLOCKED / RETURN_TO_ALPHA_GOAL
