---
name: control-loop
description: "Native-goal-driven bounded executor and hardener. Use after an accepted Goal Contract authorizes implementation, or when an explicit or active Codex Native Goal must be run, resumed, finished, or reported through create_goal/update_goal gates. Do not use for ambiguous planning."
---

# Control Loop

Control Loop is the native-goal-driven bounded executor and hardener after `$alpha-goal`, not task discovery or scheduling. Optimize for useful target-state movement.

State artifacts support execution and recovery; writing them is never the objective. Use `checkpoint.md` only when it protects recovery, evidence handoff, or verification.

## Execution Loop

Run the loop as behavior, not paperwork:

```pseudo
function control_loop(goal_contract):
  # Inspect Native Goal
  native_goal = inspect_native_goal_if_available()
  if native_goal.absent and !goal_contract.explicit_native_goal_start:
    # do not call `create_goal`
    do_not_call(create_goal)

  # Read Goal, Read Checkpoint
  goal = read_accepted_goal_contract(goal_contract)
  checkpoint = read_checkpoint_when_present_or_required(goal)
  assert_boundaries(goal, checkpoint, native_goal)
  load_references_if_needed(goal, checkpoint)

  while true:
    slice = plan_smallest_deliverable_slice(goal, checkpoint)
    outcome = act(slice)
    evidence = collect_raw_evidence(outcome)
    gap = compare_to_goal(evidence, goal.acceptance_evidence, goal.claim_boundary)

    if gap.changed_contract_or_authority:
      return RETURN_TO_ALPHA_GOAL
    if gap.blocked:
      update_native_goal_lifecycle_if_allowed(native_goal, update_goal blocked)
      return BLOCKED
    if gap.fixable:
      checkpoint_only_if_needed(gap)
      continue

    verification = goal_verify_if_required(evidence, goal)
    route = route_after_verification(verification, native_goal)
    if route == NEXT_ITERATION:
      checkpoint_only_if_needed(verification.gap)
      continue
    return route
```

## Boundaries

```pseudo
function assert_boundaries(goal, checkpoint, native_goal):
  require(goal.status == accepted, else = RETURN_TO_ALPHA_GOAL or BLOCKED)
  require("accepted Goal Contract is canonical")
  deny("control-loop` never creates or derives it")

  require(action in goal.target)
  require(action in goal.scope)
  require(action not_in goal.non_goals)
  require(action within goal.constraints)
  require(action within goal.authorization)
  require(action within goal.actuator_boundary)
  require(claim within goal.claim_boundary)  # claim boundary
  require(action <= goal.Autonomy_level)  # Autonomy level

  if native_goal.objective exists:
    allow("native goal objective seeds intent/progress/budget")
    deny("cannot expand, narrow, waive, or replace Goal Contract authority")

  if create_goal requested:
    require(explicit_request)
  else:
    do_not_call(create_goal)

  if unfinished_native_goal_already_exists:  # unfinished native goal already exists
    resume_or_route_conflict_to($alpha-goal)

  require(update_goal complete only_when objective_achieved and no_required_work_remains)
  require(update_goal blocked only_after "same blocker for three consecutive goal turns")

  require("Do not mutate primary main/master/trunk")
  require("repo-local worktree" unless safer_repo_policy_exists)
  preserve("unrelated user changes")
  require($goal-verify before final_ready_safe_complete_claims)
```

## Reference Routing

```pseudo
function load_references_if_needed(goal, checkpoint):
  # Alpha Goal state root
  state_root = "${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/"
  # <workspace-slug> is the last directory name of the current session directory path
  workspace_slug = basename(current_session_directory)

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
function route_after_verification(verification, native_goal):
  if verification.verdict == PASS_TO_FINAL:
    finish_delivery_boundary()
    update_native_goal_lifecycle_if_allowed(native_goal, update_goal complete)
    return PASS_TO_FINAL

  if verification.verdict == NEXT_ITERATION and verification.Gap.fixable:
    # `NEXT_ITERATION` with fixable `Gap`
    return NEXT_ITERATION

  if verification.changed_target_scope_authority_or_claim:
    return RETURN_TO_ALPHA_GOAL

  if missing(permission or tool or data or environment or credential or user_owned_decision):
    return BLOCKED

  # Stop/re-route
  if changed(authority or actuator_boundary or acceptance_evidence or claim_boundary):
    return RETURN_TO_ALPHA_GOAL
  if changed(native_goal_binding or run_profile or risk or assumption or stop_condition):
    return RETURN_TO_ALPHA_GOAL or BLOCKED

  return route_verification_result(verification)
```
