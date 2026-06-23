---
name: control-loop
description: "Goal-contract-driven bounded executor and hardener. Use only after an accepted Goal Contract authorizes implementation or hardening. Do not use for ambiguous planning."
---

# Control Loop

Control Loop is the Goal Contract driven bounded executor and hardener after `$alpha-goal`, not task discovery or scheduling. Consume an accepted Goal Contract and optimize for useful target-state movement: ship the smallest verifiable slice, collect evidence, compare, then harden or finish.

State artifacts support execution and recovery; writing them is never the objective. Use `checkpoint.md` only when it protects recovery, evidence handoff, or verification.

## Execution Loop

Run the loop as behavior, not paperwork:

```pseudo
function control_loop(goal_contract):
  # Read Goal, Read Checkpoint
  goal = read_accepted_goal_contract(goal_contract)
  checkpoint = read_checkpoint_when_present_or_required(goal)
  assert_goal_boundaries(goal, checkpoint)
  load_references_if_needed(goal, checkpoint)

  while true:
    slice = plan_most_useful_deliverable_slice_current(goal, checkpoint)
    assert_slice_boundaries(slice, goal)

    outcome = act(slice)
    evidence = collect_raw_evidence(outcome)
    review = review_slice_outcome(slice, outcome, evidence, goal)
    gap = compare_to_goal(evidence, review, goal.acceptance_evidence, goal.claim_boundary)

    if gap.changed_contract_or_authority:
      return RETURN_TO_ALPHA_GOAL
    if gap.blocked:
      return BLOCKED
    if gap.fixable:
      checkpoint_only_if_needed(gap)
      continue

    verification = goal_verify_if_required(evidence, goal)
    route = route_after_verification(verification)
    if route == NEXT_ITERATION:
      checkpoint_only_if_needed(verification.gap)
      continue
    return route
```

## Boundaries

```pseudo
function assert_goal_boundaries(goal, checkpoint):
  require(goal.status == accepted, else = RETURN_TO_ALPHA_GOAL or BLOCKED)
  require(goal.issued_by == "alpha-goal")
  require(goal.is_canonical)  # accepted Goal Contract is canonical
  require(goal.has_required_fields)  # Intent, Outcome, Scope, Acceptance evidence, Non-goals, Decision boundary, Claim boundary, Autonomy level
  deny(goal.created_or_derived_by_control_loop)  # control-loop never creates or derives it

  deny(primary_branch_mutation)  # Do not mutate primary main/master/trunk
  require(worktree.kind == repo_local_worktree unless safer_repo_policy_exists)  # repo-local worktree
  preserve(unrelated_user_changes)  # unrelated user changes
  require(goal_verify_before_final_ready_safe_complete_claims)  # $goal-verify

function assert_slice_boundaries(slice, goal):
  require(slice.target within goal.target)
  require(slice.scope within goal.scope)
  require(slice.effect not_in goal.non_goals)
  require(slice.effect within goal.constraints)
  require(slice.effect within goal.authorization)
  require(slice.effect within goal.actuator_boundary)
  require(slice.claim within goal.claim_boundary)  # claim boundary
  require(autonomy_allows(goal.Autonomy_level, slice.requested_action))  # Autonomy level
```

## Reference Routing

```pseudo
function load_references_if_needed(goal, checkpoint):
  state_root_template = "${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/"  # Alpha Goal state root
  workspace_slug = basename(current_session_directory)  # last directory name of the current session directory path
  state_root = materialize(state_root_template, workspace_slug)

  # State writes are checkpoints, not progress.
  if exact checkpoint.md or control-state/latest.md fields are needed:
    read("references/state-artifacts.md")
    remember("control-state/latest.md is only a global recovery index")
    fields_may_include("Loop State", Memory, Evidence, Verification)

  if final_ready_safe_complete_or_MR_ready_claim:
    read("references/completion-gates.md")

  if replacement_or_prohibition_or_broad_evidence_boundary:
    read("references/completion-gates.md")

  optional_preflight =
    "npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts --task YYYYMMDD-TaskName"
```

## Routes

```pseudo
function route_after_verification(verification):
  if verification.verdict == PASS_TO_FINAL:
    finish_delivery_boundary()
    return PASS_TO_FINAL

  if verification.verdict == NEXT_ITERATION:
    if verification.Gap.kind == same_goal_fixable:
      # `NEXT_ITERATION` with fixable `Gap`
      return NEXT_ITERATION
    if verification.Gap.kind == scope_or_authority_change:
      return RETURN_TO_ALPHA_GOAL
    if verification.Gap.kind == missing_permission_or_external_state:
      return BLOCKED
    return route_verification_result(verification)

  if verification.changed_target_scope_authority_or_claim:
    return RETURN_TO_ALPHA_GOAL

  if missing(permission or tool or data or environment or credential or user_owned_decision):
    return BLOCKED

  # Stop/re-route
  if changed(authority or actuator_boundary or acceptance_evidence or claim_boundary):
    return RETURN_TO_ALPHA_GOAL
  if changed(run_profile or risk or assumption or stop_condition):
    return RETURN_TO_ALPHA_GOAL or BLOCKED

  return route_verification_result(verification)
```
