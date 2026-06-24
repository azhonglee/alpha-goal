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
```pseudo
function alpha_goal(user_request):
  state = init_alpha_goal_state(user_request)
  preflight = preflight(state)
  if preflight.route in [SKIP_ALPHA_GOAL, HANDOFF_TO_CONTROL_LOOP]:
    return preflight.route
  if preflight.route == NEED_USER_INPUT:
    return request_user_input(preflight.question)
  if preflight.route != CONTINUE:
    return BLOCKED
  discovery = discovery(state)
  if discovery.route == NEED_USER_INPUT:
    return request_user_input(discovery.question)
  if discovery.route == BLOCKED:
    return BLOCKED
  if discovery.route != READY_TO_CLARIFY:
    return BLOCKED
  write_draft_goal_contract(state, discovery.notes)
Clarify:
  while true:
    question = prepare_one_high_leverage_question(state)
    answer = request_user_input(question)
    interpret_answer_as_navigation_evidence(state, answer)
    clarity = score_clarity(state)
    gates = readiness_gate_check(state, clarity)
    if should_continue_clarifying(state, gates, clarity):
      continue
    break
  stress = assumption_stress_test(state)
  if stress.changes_intent_target_scope_acceptance_authority_or_claim_boundary:
    record_in_Interview_ledger(state, stress)
    goto Clarify
  revise_contract_draft_from_stress(state, stress)
  design = write_final_design(state)
  design = self_review_and_fix(design)
  confirmation = ask_for_confirmation(design)
  if confirmation == APPROVE:
    persist_accepted_goal_contract(design)
    return HANDOFF_TO_CONTROL_LOOP
  if confirmation == REFINE:
    revise_contract_draft_from_feedback(state, confirmation.feedback)
    rerun_gates(state)
    goto Clarify
  return STOP_REJECTED

function route(name, question = null, notes = null): return { route: name, question: question, notes: notes }
```

## Pre-flight
```pseudo
function preflight(state):
  work_type = classify_work_type(state.request)
  if work_type == exploration and is_concrete_read_only_fact_lookup(state.request):
    return route(SKIP_ALPHA_GOAL)
  if work_type == other:
    return route(NEED_USER_INPUT, question = "What type of work is this?")
  split_mixed_work_into_sequence(state)
  state.state_root = resolve("Alpha Goal state root", "${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/", slug = "slug(repo_root or Goal Contract target workspace)", never_session_directory = true)
  matched = match_task_state(by = [goal_contract_path, state_directory, trigger_metadata])
  # Match the task state before rediscovery.
  if matched.unique:
    state.contract = read(matched.goal_contract)
    if accepted_trigger_contract_maps_to_existing_authorized_work(state.contract):
      return route(HANDOFF_TO_CONTROL_LOOP)
  if matched.multiple_or_stale:
    return route(NEED_USER_INPUT, question = "Which existing Goal Contract should this resume?")
  return route(CONTINUE)
```

## Discovery
Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when target, Acceptance evidence, non-goals, decision boundaries, authority, Claim boundary, and Trigger Contract are explicit or source-backed.

```pseudo
function discovery(state):
  if discovery_not_needed(state):
    return route(READY_TO_CLARIFY, notes = "Discovery skipped; all required sources are explicit or source-backed.")

  observers = [AGENTS_or_repo_rules, README_getting_started_install_docs, specs_ADRs_contracts, target_files_current_implementation, local_glossary_context, branch_status_if_mutation_may_follow, direct_contradictions]
  complete_minimum_preflight(observers) # minimum preflight
  if missing_required_observer(observers):
    return route(BLOCKED, notes = missing_required_observer(observers))
  if diagnose_or_repair(state) and root_cause_not_fully_confirmed:
    limit_to_diagnostic_probes_or_hypothesis_tests()
  if deictic_bug_request_without_locator:
    inspect_immediate_context()
    if no_failing_command_log_issue_or_code_pointer:
      return route(NEED_USER_INPUT, question = "Please provide the minimal reproducer or error signal.")
  optionally_use_subagents_for_independent_parallel_discovery()
  notes = critical_thinking(problem_validity, context_sufficientness, hidden_issues)
  return route(READY_TO_CLARIFY, notes = notes)
```

Record concise `Discovery notes` in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`; set `Contract status: draft` and `Issued by: alpha-goal`, then keep target/scope fields unset until Final Design.

## Clarify with User
Ask User one high-leverage question per round; one question means one decision variable. Ground clarification in facts and observations, not habits, assumptions, current implementation, or prior solutions.

```pseudo
function prepare_one_high_leverage_question(state):
  weakest = first_blocking_gate_or_lowest_scoring_dimension(state)
  question = generate_question(
    target = weakest,
    purpose in [confirm_conflict, request_user_decision, demand_example, expose_assumption, force_tradeoff, test_boundary_scenario],
    prefer = [intent_outcome_scope_non_goals_decision_boundaries, constraints_success_acceptance_authority_claim_boundary, context_actuator_sensor_external_facts]
  )
  if previous_answer_is_shallow:
    apply_pressure_ladder(example_or_counterexample, hidden_assumption, boundary_or_tradeoff, essence_or_root_cause)
  require(question.has_one_decision_variable)
  deny(asking_for_discoverable_repo_facts)
  return format_question(round = state.round, target = weakest, clarity = state.clarity_score, question = question)
```

Treat each answer as navigation evidence, not requirements or authority. Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps under `Interview ledger`.

```pseudo
function interpret_answer_as_navigation_evidence(state, answer):
  for claim in classify_answer(answer):
    mark_as([from_code_auto_confirmed, from_code_needs_confirmation, from_research, from_user])
  cross_check_user_claims_against_code_docs()
  name_source_of_truth_conflicts()
  deny_auto_confirming(desired_behavior, requirements, acceptance_evidence, non_goals, tradeoffs, authority)
```

Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue. If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask only for the decision boundary.

## Readiness Gate Check
```pseudo
function score_clarity(state):
  clarity_score = 0.30 * intent + 0.20 * outcome + 0.15 * scope + 0.12 * constraints + 0.10 * success + 0.08 * decision_boundary + 0.05 * context
  record_dimension_scores_with_justification_and_gap()
  return clarity_score

function readiness_gate_check(state, clarity):
  gates = [intent, outcome, scope, constraints, acceptance_evidence, context_current_facts, non_goals, decision_boundaries, claim_boundary, trigger_contract, authorization_source, source_of_truth_conflicts, external_current_facts, actuator_boundary, sensor_observer]
  for gate in gates:
    gate.status = pass_only_if_explicit_or_source_backed(gate)
  return gates
function should_continue_clarifying(state, gates, clarity):
  if any_gate_unresolved(gates) or unresolved(non_goals or decision_boundaries) or no_explicit_assumption_probe_completed or no_persistent_followup_completed or next_answer_could_change_execution_acceptance_authority_or_claim_boundary:
    return true
  if qualitative_or_value_laden_or_weakly_quantified_goal:
    create_indicator_handoff(primary_metric, guardrail_metric, tradeoff_owner, evidence_boundary)
  if not boundary_scenario_pressure_tested_from_inspected_facts:
    return true
  return clarity <= 0.92
```

For qualitative, value-laden, multi-party, weakly quantified, or UX/performance/quality-adjective objectives, create Indicator Handoff. Before closing Clarify, pressure-test the interpretation with at least one boundary scenario from inspected facts.

## Assumption Stress Test
```pseudo
function assumption_stress_test(state):
  used_modes = []
  findings = []
  for mode in [Contrarian, Simplifier, Ontologist]:
    if applies(mode, state):
      findings.append(run_stress_mode(mode, state))
      used_modes.append(mode)
  if used_modes.empty:
    findings.append(record_why_no_mode_applied())
  return { used_modes: used_modes, findings: findings, changes_intent_target_scope_acceptance_authority_or_claim_boundary: material_contract_change(findings) }
```

## Final Design
Write the design to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`; copy to `docs/specs/YYYYMMDD-<TaskName>.md` when useful or required by repo convention. The state-root `goal-contract.md` is canonical. Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.

Design Content Must Include: Contract status [contract_status], Issued by [issued_by], Technical Context [context], Discovery notes [discovery_notes], Interview ledger [interview_ledger], Intent [intent], Root Cause [root_cause] optional only for repair design, Outcome [outcome], Scope [scope], Repo surfaces [repo_surfaces], Constraints [constraints], Assumptions + resolutions [assumptions_resolutions], Acceptance evidence [acceptance_evidence], Dependency/integration order [repo_integration_order], Non-goals [non_goal], Decision boundary [decision_boundary], Claim boundary [claim_boundary], Trigger Contract [trigger_contract], Handoff ledger [ledger].

Trigger Contract is a required field and gate. Keep only source, mapping, replay/staleness, and handoff boundary needed for this Goal Contract; do not expand trigger rules inside this skill.

## Artifact policy
`alpha-goal` writes only `goal-contract.md`. The contract contains `Contract status`, `Issued by`, `Discovery notes`, `Interview ledger`, canonical target, scope, non-goals, acceptance evidence, claim boundary, Trigger Contract, and handoff ledger.

Do not create separate discovery, interview, loop, memory, evidence, verification, or latest-pointer files from `alpha-goal`. `$control-loop` or `$goal-verify` may create a single task `checkpoint.md` only when conditional execution, recovery, evidence handoff, or verification requires it. A global `control-state/latest.md` may exist only as a recovery index to an accepted Goal Contract, not as a stage artifact.

Self-review the design for completion and reasonability. Use subagents for independent review when useful, then fix accepted findings.

## Ask for Confirmation
Show Design Summary. Include `Root Cause` only for repair designs.

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
