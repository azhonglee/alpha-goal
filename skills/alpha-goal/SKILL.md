---
name: alpha-goal
description: "Must use for any engineering/design/implementation/diagnose/repair requests; through interviewing user, clarify real intention/requirements, identify outcome, scope, decision boundaries, and design."
---

# Alpha Goal

`alpha-goal` owns workflow control for engineering/design/implementation/diagnose/repair goals. It discovers facts, clarifies user-owned decisions, writes the canonical Goal Contract, and routes accepted work to `$control-loop`.

Delegated skills may observe, review, or evaluate, but must not control phase progression, redefine target/scope, set acceptance evidence, waive non-goals, decide authority, or make final/ready/complete claims.

Run this skill as a state machine. Do Not Compact or Merge phases:

```text
Pre-flight -> Discovery -> Clarify with User -> Assumption Stress Test -> Final Design -> Ask for Confirmation
```

`Clarify with User` is the core phase.

## State Machine

Run the state machine as behavior, not paperwork:

```pseudo
function alpha_goal(user_request):
  state = init_alpha_goal_state(user_request)

  preflight = run_preflight(state)
  if preflight.route == SKIP_ALPHA_GOAL:
    return preflight.route
  if preflight.route == HANDOFF_TO_CONTROL_LOOP:
    return preflight.route
  if preflight.route == NEED_USER_INPUT:
    return ask_user(preflight.question)
  apply_preflight_result(state, preflight)

  discovery = run_discovery(state)
  if discovery.route == NEED_USER_INPUT:
    return ask_user(discovery.question)
  if discovery.route == RETURN_TO_ALPHA_GOAL:
    return discovery.route
  record_discovery_notes(state, discovery)
  persist_goal_contract_draft(state)

  while true:
    question = prepare_clarification_question(state)
    answer = ask_one_user_question(question)
    interpret_answer_as_navigation_evidence(state, answer)
    score = score_clarity(state)
    gates = readiness_gate_check(state)
    if should_continue_clarifying(state, score, gates):
      continue
    break

  stress = run_assumption_stress_test(state)
  refresh_contract_draft(state, stress)
  if stress.changed_intent_scope_acceptance_authority_or_claim_boundary:
    record_stress_result_in_Interview_ledger(state, stress)
    return RETURN_TO_CLARIFY

  design = write_final_design(state)
  design = self_review_and_fix_design(design)

  confirmation = ask_for_confirmation(design, state)
  return route_after_confirmation(confirmation, design, state)
```

## Pre-flight

```pseudo
function run_preflight(state):
  work_type = classify_work_type(state.request)
  state.work_type = work_type

  if work_type == exploration and concrete_read_only_fact_lookup(state.request):
    return route(SKIP_ALPHA_GOAL)

  if work_type == other:
    return need_user_input(minimum_details_needed_to_classify)

  if work_type in [design, implementation, maintenance]:
    state.required_phases = all_phases

  if work_type in [diagnose, repair]:
    state.required_phases = all_phases_starting_with_discovery
    state.repair_rule = "If root cause is not 100% confirmed, only run diagnostic probes or hypothesis-testing slices. Do not implement/design directly."

  split_mixed_work_into_sequenced_items(state)

  state.state_root = resolve_state_root(
    template = "${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/",
    workspace_slug = slug(repo_root or Goal Contract target workspace),
    never_from_session_directory = true
  )

  matched = match_task_state(
    by = [goal_contract_path, state_directory, trigger_metadata]
  )

  # Match the task state before execution.
  if matched.unique:
    state.goal_contract = read(matched.goal_contract_path)
    state.resume_from_matched_contract = true
    if state.goal_contract.status == accepted and trigger_contract_maps_to_existing_authorized_work(state.goal_contract, state.trigger_metadata):
      return route(HANDOFF_TO_CONTROL_LOOP)
    state.discovery_skip_reason = "matched Goal Contract already supplies task state"
  if matched.multiple_or_stale_after_local_state_inspection:
    return need_user_input(clarify_task_identity)

  return continue(state)
```

## Discovery

Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when target, acceptance evidence, non-goals, decision boundaries, authority, claim boundary, and Trigger Contract are explicit.

```pseudo
function run_discovery(state):
  if state.resume_from_matched_contract:
    return discovery_skipped_with_existing_Goal_Contract_state

  if discovery_can_be_skipped(state):
    return discovery_skipped_with_source_backed_reason

  # Complete minimum preflight before asking the user.
  inspect([
    applicable_AGENTS_or_repo_rules,
    README_getting_started_install_docs,
    relevant_specs_ADRs_contracts,
    target_files_current_implementation,
    local_glossary_context,
    current_branch_status_when_mutation_may_follow,
    direct_contradictions
  ])

  if discoverable_observer_missing:
    name_missing_observer_instead_of_asking_user_to_summarize_repo_facts()

  if deictic_bug_request_without_discoverable_locator:
    inspect_immediate_context()
    if no_failing_command_log_issue_or_code_pointer:
      return need_user_input(minimal_reproducer_or_error_signal)

  if state.work_type in [diagnose, repair] and not root_cause_100_percent_confirmed:
    limit_to_diagnostic_probes_or_hypothesis_testing_slices()

  use_subagents_for_independent_parallel_subtasks_when_it_improves_throughput()

  return critical_thinking_notes([
    problem_validity_is_the_phenomenon_truly_a_problem_are_causal_claims_reliable_what_assumptions_need_testing,
    context_sufficientness_what_can_be_concluded_now_what_is_must_have_vs_ideal,
    hidden_issues_deeper_root_cause_adjacent_issue_or_overlooked_dependency
  ])
```

Record key points in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`. If the contract is still draft, set `Contract status: draft` and `Issued by: alpha-goal`, then keep target/scope fields unset until Final Design.

## Clarify with User

Ground clarification in facts and observations, not habits, assumptions, current implementation, or prior solutions. Loop Deep Discussion until clarity score is above `0.92` and all readiness gates pass.

```pseudo
function prepare_clarification_question(state):
  target = first_blocking_gate_or_lowest_scoring_dimension(state)

  question = generate_one_question(
    purpose in [
      confirm_conflict,
      request_user_decision,
      demand_example,
      expose_assumption,
      force_tradeoff,
      test_boundary_stressing_scenario
    ],
    using = [
      original_request_and_probable_intent,
      prior_QA,
      known_facts_conflicts_unknowns_source_of_truth_conflicts,
      readiness_gates_and_clarity_score_dimensions,
      brownfield_context_and_active_Assumption_Stress_Test_mode
    ],
    prefer_ladder = [
      intent_outcome_scope_non_goals_decision_boundaries,
      constraints_success_criteria_acceptance_evidence_authority_claim_boundary,
      context_current_facts_actuator_boundary_sensor_observer_external_current_facts
    ]
  )

  if previous_answer_is_shallow_or_untested:
    apply_pressure_ladder([
      ask_for_concrete_example_counterexample_or_evidence_signal,
      probe_hidden_assumption_or_dependency,
      force_boundary_or_tradeoff_what_to_reject_defer_or_not_do,
      reframe_symptom_to_essence_or_root_cause
    ])

  require(Non_goals_and_Decision_Boundaries_eventually_explicit)
  return format_round_question(target, state.clarity_score, question)
```

Ask User one high-leverage question per round. One question means one decision variable. Do not ask for discoverable facts. Ask only for user-owned decisions, credentials, permissions, external side effects, public claims, irreversible commitments, missing acceptance evidence, or unresolved source-of-truth conflicts.

Present options conversationally with your recommendation and reasoning. Use structured user-input tooling (`request_user_input` / equivalent):

```text
Round {n} | Target: {weakest_dimension} | Clarity: {score}%
{question backed by clear context}
```

```pseudo
function interpret_answer_as_navigation_evidence(state, answer):
  # Treat the answer as navigation evidence, not requirements or authority.
  record_in_Interview_ledger(state, [
    task,
    probable_intent,
    known_facts,
    conflicts,
    unknowns,
    non_goals,
    decision_boundary_gaps
  ])

  treat_repo_language_as_evidence_not_authority()
  cross_check_user_claims_against_code_and_docs()
  name_competing_sources_on_conflict()

  classify_gaps([
    "[from-code][auto-confirmed]" for descriptive_fact,
    "[from-code]" for inferred_fact_needing_confirmation,
    "[from-research]" for bounded_fresh_external_or_current_fact,
    "[from-user]" for human_decision
  ])

  auto_confirm_only_descriptive_facts()
  deny_auto_confirming([
    desired_behavior,
    requirements,
    acceptance_evidence,
    non_goals,
    tradeoffs,
    authority
  ])

  if ambiguity_depends_on_external_best_practices_standards_APIs_dependency_versions_laws_schedules_or_prices:
    gather_bounded_fresh_evidence_first()
    ask_only_for_the_decision_boundary()
```

Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue.

## Readiness Gate Check

```pseudo
function score_clarity(state):
  clarity_score =
    0.30 * intent +
    0.20 * outcome +
    0.15 * scope +
    0.12 * constraints +
    0.10 * success +
    0.08 * decision_boundary +
    0.05 * context

  score_each_dimension_with_justification_and_gap([
    Intent_Clarity,
    Outcome_Clarity,
    Scope_Clarity,
    Constraint_Clarity,
    Success_Criteria_Clarity,
    Context_Clarity_for_brownfield_work
  ])
  return clarity_score

function readiness_gate_check(state):
  gates = [
    intent,
    outcome,
    scope,
    constraints,
    acceptance_evidence,
    context_current_facts,
    non_goals,
    decision_boundaries,
    claim_boundary,
    Trigger_Contract,
    authorization_source,
    source_of_truth_conflicts,
    external_current_facts,
    actuator_boundary,
    sensor_observer
  ]
  mark_each_gate_pass_only_when_explicit_or_source_backed(gates)
  require_explicit([non_goals, decision_boundaries])
  return gates

function should_continue_clarifying(state, score, gates):
  # This transition may record Indicator Handoff or boundary pressure-test state.
  if any_gate_unresolved(gates):
    return true
  if unresolved(non_goals or decision_boundaries):
    return true
  if pressure_pass_incomplete:
    return true
  if no_explicit_assumption_probe_completed:
    return true
  if no_persistent_followup_completed:
    return true
  if next_answer_could_materially_change_execution_acceptance_authority_or_claim_boundary:
    return true
  if qualitative_value_laden_multi_party_weakly_quantified_or_quality_adjective_objective:
    create_indicator_handoff(primary_metric, guardrail_metric, tradeoff_owner, evidence_boundary)
  if not boundary_scenario_pressure_tested_from_inspected_facts:
    pressure-test_interpretation_with_boundary_scenario()
    return true
  if score <= 0.92:
    return true
  return false
```

Max 5 rounds per dimension; after that, proceed with warnings only when further questions would not change execution. For cross-repo framing, keep one task-level Alpha Goal state root and record repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.

If target, scope, authority, source reference, non-goals, acceptance evidence, decision boundary, actuator/sensor boundary, Trigger Contract, or claim boundary is wrong or unclear, keep Clarify active.

## Assumption Stress Test

Use each applicable mode once; if none applies, record why:

```pseudo
function run_assumption_stress_test(state):
  if contrarian_applies:
    challenge_core_assumption()
    mark_mode_used("Contrarian")
  if simplifier_applies:
    probe_minimum_viable_scope()
    mark_mode_used("Simplifier")
  if ontologist_applies:
    ask_for_essence_level_reframing_when_user_keeps_describing_symptoms()
    mark_mode_used("Ontologist")
  if no_mode_applies:
    record_reason_no_mode_applied()
  if stress_result_changes_target_scope_acceptance_authority_or_claim_boundary:
    return stress_result(route = RETURN_TO_CLARIFY)
```

## Final Design

```pseudo
function write_final_design(state):
  design = build_goal_contract([
    Contract_status,
    Issued_by,
    Technical_Context,
    Discovery_notes,
    Interview_ledger,
    Intent,
    Root_Cause_optional_only_for_repair_design,
    Outcome,
    Scope,
    Repo_surfaces,
    Constraints,
    Assumptions_resolutions,
    Acceptance_evidence,
    Dependency_integration_order,
    Non_goals,
    Decision_boundary,
    Claim_boundary,
    Trigger_Contract,
    Handoff_ledger
  ])

  write(
    path = "<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md",
    content = design,
    canonical = true
  )

  if useful_or_required_by_repo_convention:
    copy_reference_mirror_to("docs/specs/YYYYMMDD-<TaskName>.md")

  keep_contract_status_draft_until_user_confirmation_or_explicit_pre_authorized_launch()
  require_accepted_contract_before_control_loop_handoff()
  return design
```

The state-root `goal-contract.md` is canonical. Repo specs are mirrors or references only; conflicts route back to `alpha-goal`. `$control-loop` may execute only an accepted Goal Contract.

Design Content Must Include:
- Contract status [contract_status]
- Issued by [issued_by]
- Technical Context [context]
- Discovery notes [discovery_notes]
- Interview ledger [interview_ledger]
- Intent [intent]
- Root Cause [root_cause] optional, only for repair design
- Outcome [outcome]
- Scope [scope]
- Repo surfaces [repo_surfaces]
- Constraints [constraints]
- Assumptions + resolutions [assumptions_resolutions]
- Acceptance evidence [acceptance_evidence]
- Dependency/integration order [repo_integration_order]
- Non-goals [non_goal]
- Decision boundary [decision_boundary]
- Claim boundary [claim_boundary]
- Trigger Contract [trigger_contract]
- Handoff ledger [ledger]

## Trigger Contract

Define run behavior, not just a label:

```pseudo
function build_trigger_contract(state):
  if trigger_type == manual:
    resume_from_Goal_Contract_unless_user_explicitly_overrides()
    allow_control_loop_checkpoint_only_when_recovery_needs_it()

  if trigger_type == scheduled:
    require(schedule_source_id)
    require(replay_staleness_rule)
    require(existing_Goal_Contract_mapping)
    deny_new_scope_or_authority_discovery()

  if trigger_type == webhook:
    require(event_source_id)
    require(dedupe_key)
    require(authorized_payload_to_state_mapping)
    require(replay_staleness_rule)
    if no_existing_authorized_Goal_Contract_match:
      return RETURN_TO_ALPHA_GOAL

  if trigger_type == verification_triggered:
    require(latest_verification_evidence_matches_Goal_Contract_path)
    require(latest_verification.Next_route == control-loop)
    require(Gap_fixable_inside_same_goal)
```

## Artifact policy

`alpha-goal` writes only `goal-contract.md`. The contract contains:
- `Contract status`: `draft` until confirmed or explicitly pre-authorized; `accepted` before any `$control-loop` handoff.
- `Issued by`: `alpha-goal`; other issuers are not authoritative for `$control-loop`.
- `Discovery notes`: concise discovered facts, contradictions, and critical thinking; reference long logs instead of pasting them.
- `Interview ledger`: clarification rounds, user-owned decisions, and unresolved boundary gaps; keep it as evidence ledger, not executable authority.
- Canonical target, scope, non-goals, acceptance evidence, claim boundary, Trigger Contract, and handoff ledger.

Do not create separate discovery, interview, loop, memory, evidence, verification, or latest-pointer files from `alpha-goal`. `$control-loop` or `$goal-verify` may create a single task `checkpoint.md` only when conditional execution, recovery, evidence handoff, or verification requires it. A global `control-state/latest.md` may exist only as a recovery index to an accepted Goal Contract, not as a stage artifact.

Self-review the design for completion and reasonability. Use subagents for independent review when useful, then fix accepted findings.

## Ask for Confirmation

```pseudo
function ask_for_confirmation(design, state):
  summary = render_Design_Summary(design)
  if explicit_workspace_or_user_contract_authorizes_autonomous_launch:
    return APPROVE
  return request_user_input(options = [approve_launch, refine, reject], summary = summary)

function route_after_confirmation(confirmation, design, state):
  if confirmation == APPROVE:
    set(design.Contract_status, accepted)
    persist_goal_contract_accepted(design)
    return HANDOFF_TO_CONTROL_LOOP
  if confirmation == REFINE:
    if feedback_changes_target_scope_phase_claim_or_Trigger_Contract:
      update_Goal_Contract_and_rerun_gates()
    return RETURN_TO_ALPHA_GOAL
  if confirmation == REJECT:
    return STOP_REJECTED
```

Show Summary of Design. Include `Root Cause` only for repair designs.

```markdown
Design Summary

| Field | Value |
| --- | --- |
| Contract status | |
| Intent | |
| Root Cause | |
| Outcome | |
| Scope | |
| Repo surfaces | |
| Constraints | |
| Acceptance evidence | |
| Dependency/integration order | |
| Non-goals | |
| Decision boundary | |
| Claim boundary | |
| Trigger contract | |
| Blocking gates | |
| Ledger | |
| Next | |
```

Use `request_user_input` to ask for approve/launch, refine, or reject unless an explicit workspace/user contract already authorizes autonomous launch. Overrides may select an authorized pending slice only; target, scope, phase, claim, or Trigger Contract changes require Goal Contract update and gates. On approval or pre-authorized launch, set `Contract status: accepted` and hand off to `$control-loop`.
