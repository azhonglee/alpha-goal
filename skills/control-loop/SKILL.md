---
name: control-loop
description: "Goal-contract-driven bounded executor and hardener. Use only after an accepted Goal Contract authorizes implementation or hardening. Do not use for ambiguous planning."
---

# Control Loop

Control Loop is the Goal Contract driven bounded executor and hardener after `$alpha-goal`, not task discovery or scheduling. Consume an accepted Goal Contract and optimize for useful target-state movement: ship the most useful verifiable bounded slice, collect evidence, compare, then harden or finish.

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
    slice = plan_most_useful_verifiable_slice(goal, checkpoint)
    assert_slice_boundaries(slice, goal, checkpoint)
    if slice.kind == repair and not root_cause_confirmed:
      return RETURN_TO_ALPHA_GOAL
    if slice.kind not_in [implementation, hardening, repair]:
      return BLOCKED

    outcome = execute_slice(slice, goal, checkpoint)
    if outcome.material_contradiction:
      return route_material_contradiction_without_patching_around_it(outcome, goal, checkpoint)

    evidence = collect_raw_evidence(outcome, slice)
    review = review_slice_outcome(slice, outcome, evidence, goal, checkpoint)
    gap = compare_to_goal(evidence, review, goal.acceptance_evidence, goal.claim_boundary, material_defect_risk_surface(slice, goal))

    if gap.changed_contract_or_authority:
      return RETURN_TO_ALPHA_GOAL
    if gap.blocked:
      return BLOCKED
    if gap.harden:
      checkpoint_only_if_needed(gap)
      continue
    if gap.fixable:
      checkpoint_only_if_needed(gap)
      continue

    verification = goal_verify_before_final_or_route(evidence, goal)
    route = route_after_verification(verification)
    if route == NEXT_ITERATION:
      checkpoint_only_if_needed(verification.gap)
      continue
    return route
```

## Boundaries

```pseudo
function assert_goal_boundaries(goal, checkpoint):
  require(goal_contract_readable, else = BLOCKED)
  require(not goal.missing_or_draft_or_stale_or_conflicting, else = RETURN_TO_ALPHA_GOAL)
  require(goal.status == accepted)
  require(goal.issued_by == "alpha-goal")
  require(goal.is_canonical)  # accepted Goal Contract is canonical
  require(goal.has_required_fields)  # Intent, Outcome, Scope, Repo surfaces, Acceptance evidence, Non-goals, Decision boundary, Claim boundary, Autonomy level
  deny(goal.created_or_derived_by_control_loop)  # control-loop never creates or derives it

  deny(primary_branch_mutation)  # Do not mutate primary main/master/trunk
  require(worktree.kind == repo_local_worktree unless safer_repo_policy_exists)  # repo-local worktree
  preserve(unrelated_user_changes)  # unrelated user changes
  require(goal_verify_before_final_ready_safe_complete_shipped_fixed_hardened_or_MR_ready_claims)  # Before any final_ready, safe, complete, shipped, fixed, hardened, or MR-ready claim, run $goal-verify.
  require(goal_verify_before_risky_broad_or_final_claims)  # high-risk, subjective-quality, cross-module, external-side-effect, scheduled, webhook, verification-triggered, PR-ready, or final-claim work requires $goal-verify.

function assert_slice_boundaries(slice, goal, checkpoint):
  require(slice.target within goal.target)
  require(slice.scope within goal.scope)
  require(slice.effect not_in goal.non_goals)
  require(slice.effect within goal.constraints)
  require(slice.effect within goal.authorization)
  require(slice.effect within goal.actuator_boundary)
  require(slice.surface within goal.repo_surfaces)
  require(slice.claim within goal.claim_boundary)  # claim boundary
  require(slice.effect within checkpoint.run_profile when present)
  require(autonomy_allows(goal.Autonomy_level, slice.requested_action))  # Autonomy level
  require(cross_repo_integration_claim only_if integration_evidence_covers_each_repo_boundary)
```

## Slice Execution

```pseudo
function plan_most_useful_verifiable_slice(goal, checkpoint):
  slice = choose_highest_value_bounded_action_verifiable_now(goal, checkpoint)
  require(slice.has_authorized_executable_action)
  require(slice.coherent_acceptance_and_risk_relevant)
  require(slice.evidence_defined_before_acting)
  require(slice.evidence_maps_to(goal.acceptance_evidence, goal.claim_boundary, material_defect_risk_surface(slice, goal)))
  require(slice.validation_observer_available, else = BLOCKED)
  require(slice.names_risks_assumptions_side_effects_cleanup_rollback_containment_stop_conditions)
  require(slice.names_allowed_surfaces_unchecked_surfaces_and_strongest_material_risk)
  require(slice.follows_repo_integration_order when cross_repo_goal)
  return slice

function execute_slice(slice, goal, checkpoint):
  require(slice.stays_inside_planned_slice_and_goal_contract)
  require(slice.effect within checkpoint.run_profile when present)
  check(slice.assumptions, slice.stop_conditions)

  if material_contradiction:
    stop_without_patching_around_it()
    return outcome(material_contradiction)

  make_one_targeted_change_unless_coordinated_edits_required()

  if slice.requires_embedded_review_or_audit_or_loophole_finding:
    require(slice.kind in [implementation, hardening, repair])
    require(slice.authorized_by_goal and slice.embedded_in_implementation_or_hardening)
    allow(collect_evidence and apply_same_goal_fixes)
    deny(standalone_final_judgment_without_goal_verify)

  preserve(failing_outputs)
  preserve(unrelated_user_changes)
  deny(hiding_failed_outputs or rerunning_failures_away or summarizing_intentions_as_success)
  record(external_side_effects and cleanup_or_rollback_containment_actions)
  return outcome

function review_slice_outcome(slice, outcome, evidence, goal, checkpoint):
  require(evidence.is_fresh)
  require(slice.complete only_if evidence.changes_or_confirms(goal.target_state))
  if not evidence.changes_or_confirms(goal.target_state):
    deny(slice_complete_or_success_claim)
  classify(evidence as gate or advisory or exploration or blocked)
  compare(outcome, goal.acceptance_evidence, goal.claim_boundary, checkpoint.run_profile when present)
  inspect(material_defect_risk_surface(slice, goal))
  limit_claim_to_strongest_direct_evidence_and_checked_surface()
  return review

function compare_to_goal(evidence, review, acceptance_evidence, claim_boundary, risk_surface):
  gap = compare(evidence, review, acceptance_evidence, claim_boundary, risk_surface)
  if feedback_missing_expected_effect_or_threshold:
    if authorized_acceptance_equivalent_fallback_exists:
      return gap.fixable_by_authorized_acceptance_equivalent_fallback
    if direction_valid_and_weak(evidence or edge or compatibility or cleanup or verification_gap):
      return gap.harden
    if can_harden_inside_same_goal_and_profile:
      return gap.fixable
    if goal_or_boundary_must_change:  # reframe
      return gap.changed_contract_or_authority
    return gap.blocked
  return gap
```

## Reference Routing

```pseudo
function load_references_if_needed(goal, checkpoint):
  state_root_template = "${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/"  # Alpha Goal state root
  workspace_slug = slug(repo_root or Goal Contract target workspace)
  state_root = materialize(state_root_template, workspace_slug)

  # State writes are checkpoints, not progress.
  if exact checkpoint.md or control-state/latest.md fields are needed:
    read("references/state-artifacts.md")
    remember("control-state/latest.md is only a global recovery index")
    fields_may_include("Loop State", Memory, Evidence, Verification)

  if final_ready_safe_complete_shipped_fixed_hardened_or_MR_ready_claim:
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
    return BLOCKED  # unclassified verifier gap cannot drive execution

  if verification.changed_target_scope_authority_or_claim:
    return RETURN_TO_ALPHA_GOAL

  if missing(permission or tool or data or environment or credential or user_owned_decision):
    return BLOCKED

  # Stop/re-route
  if changed_or_unclear(target or scope or authority or source_reference or acceptance_evidence or non_goal or decision_boundary or actuator_boundary or Trigger_Contract or Autonomy_level or claim_boundary):
    return RETURN_TO_ALPHA_GOAL
  if changed_or_unclear(run_profile or risk or assumption or stop_condition or user_owned_decision or new_subsystem_or_skill or edits_beyond_approved_boundary):
    if user_or_goal_decision_required:
      return RETURN_TO_ALPHA_GOAL
    return BLOCKED

  return BLOCKED  # unrecognized verifier output cannot support progress
```
