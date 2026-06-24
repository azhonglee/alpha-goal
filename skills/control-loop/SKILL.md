---
name: control-loop
description: "Goal-contract-driven bounded executor and hardener. Use only after an accepted Goal Contract authorizes implementation, repair, or hardening. Do not use for ambiguous planning."
---

# Control Loop

## Core Principle
1. Goal Contract is authority.
2. Execution is actuator output.
3. Evidence is sensor input.
4. `$goal-verify` is comparator.
5. Route decision is control output.

Execution results are evidence, not automatic completion.  
Passing tests, changed files, clean builds, or successful commands may support a claim, but they do not by themselves authorize final-ready, safe, complete, fixed, shipped, or MR-ready claims.

`control-loop` may implement, repair, harden, and collect evidence inside the approved boundaries. It may not redefine target, scope, acceptance evidence, non-goals, decision boundaries, claim boundary, trigger contract, or authority.

## Runtime Flow

**Run the loop as behavior, not paperwork:**

```pseudo
function control_loop(goal_contract):
  goal = read_accepted_goal_contract(goal_contract)
  checkpoint = read_checkpoint_if_present_or_needed(goal)

  assert_goal_contract_valid(goal)
  assert_execution_environment_safe(goal)

  while true:
    slice = plan_highest_value_verifiable_slice(goal, checkpoint)
    assert_slice_within_goal_contract(slice, goal)

    outcome = execute_slice(slice)
    evidence = collect_execution_evidence(slice, outcome)
    classified = classify_execution_evidence(evidence, goal)

    record_checkpoint_if_needed(classified)

    if classified.changed_goal_authority:
      return RETURN_TO_ALPHA_GOAL

    if classified.blocked:
      return BLOCKED

    if classified.same_goal_fixable_gap:
      continue

    verification = run_goal_verify_before_completion_claim(classified, goal)
    route = route_after_verification(verification, goal)

    if route == NEXT_ITERATION:
      continue

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

control-loop may not change any of them.
If any of these need to change, RETURN_TO_ALPHA_GOAL

## Evidence Classification
Treat execution output as classified evidence, not automatic authority.

Classify each result before making a route decision:
- [from-code-change] implementation change made inside authorized scope
- [from-test-pass] test or check passed
- [from-test-fail] test or check failed
- [from-build-pass] build/type/lint check passed
- [from-build-fail] build/type/lint check failed
- [from-runtime-observation] observed runtime behavior
- [from-review] reviewer or subagent finding
- [from-environment] environment/tooling/credential state
- [from-gap] difference between current evidence and acceptance evidence
- [from-blocker] missing permission, tool, data, environment, credential, or user decision

Rules:
Auto-confirm only raw execution facts.
Do not infer completion from partial success.
Do not infer safety from absence of failure.
Do not infer acceptance from passing unrelated tests.
Do not infer authority from implementation convenience.
Only `$goal-verify` may support final-ready, safe, complete, fixed, hardened, shipped, or MR-ready claims.

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
[ ] No unresolved same-goal fixable gap remains
[ ] No unresolved blocker remains
[ ] No source-of-truth conflict remains
[ ] No scope/authority/claim-boundary change occurred
[ ] `$goal-verify` verdict allows final route

If any item is unchecked, DO NOT claim complete.

## Stop / Return Rules
Return to $alpha-goal when:
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
- goal-verify passes
- No required work remains

## Checkpoint Policy
`<Alpha Goal state root>/YYYYMMDD-<TaskName>/checkpoint.md` is recovery support, not progress.
Resolve Alpha Goal state root as `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`, where `<workspace-slug>` is `slug(repo_root or Goal Contract target workspace)`.

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
- Known gaps
- Blockers
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
