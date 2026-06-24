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
function alpha_goal(request):
  state = init(request)

  preflight = preflight(state)
  if preflight.route in [SKIP_ALPHA_GOAL, HANDOFF_TO_CONTROL_LOOP]:
    return preflight.route
  if preflight.route == NEED_USER_INPUT:
    return request_user_input(preflight.question)

  discovery = discovery(state)
  if discovery.route == NEED_USER_INPUT:
    return request_user_input(discovery.question)
  if discovery.route == RETURN_TO_ALPHA_GOAL:
    return discovery.route
  write_draft_goal_contract(state, discovery)

  while true:
    question = prepare_one_high_leverage_question(state)
    answer = request_user_input(question)
    interpret_answer_as_navigation_evidence(state, answer)
    gates = readiness_gate_check(state, score_clarity(state))
    if should_continue_clarifying(state, gates):
      continue
    break

  stress = assumption_stress_test(state)
  if stress.changes_intent_target_scope_acceptance_authority_or_claim_boundary:
    record_in_Interview_ledger(state, stress)
    return RETURN_TO_CLARIFY

  design = write_final_design(state)
  design = self_review_and_fix(design)
  confirmation = ask_for_confirmation(design)
  if confirmation == APPROVE:
    persist_accepted_goal_contract(design)
    return HANDOFF_TO_CONTROL_LOOP
  if confirmation == REFINE:
    update_draft_contract_from_feedback(design, confirmation)
    rerun_gates(state)
    return RETURN_TO_ALPHA_GOAL
  return STOP_REJECTED
```

## Pre-flight

Classify work type:
- `exploration`: skip only for concrete read-only fact lookup; use this skill when intent, scope, acceptance, or decision boundaries are involved.
- `design/implementation/maintenance`: follow all phases.
- `diagnose/repair`: start with Discovery. If root cause is not 100% confirmed, only run diagnostic probes or hypothesis-testing slices. Do not implement/design directly.
- `other`: ask for minimum details needed to classify.

Then split mixed work into sequenced items and resolve the Alpha Goal state root before writing runtime artifacts: `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`, never from the session directory.

Match the task state by Goal Contract path, state directory, and trigger metadata. If matched, read `goal-contract.md`; if the accepted Trigger Contract maps to existing authorized work, route to `$control-loop` instead of rediscovering. If multiple or stale candidates remain after local state inspection, clarify task identity before execution.

## Discovery

Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when target, acceptance evidence, non-goals, decision boundaries, authority, claim boundary, and Trigger Contract are explicit or source-backed.

Complete minimum preflight before asking: inspect applicable AGENTS/repo rules, README/getting-started/install docs, specs/ADRs/contracts, target files/current implementation, local glossary/context, current branch/status when mutation may follow, and direct contradictions. If missing, name the missing observer instead of asking the user to summarize discoverable repo facts.

For deictic bug requests without a discoverable locator, inspect immediate context; if no failing command/log/issue/code pointer is discoverable, request the minimal reproducer or error signal before draft writing. Use subagents for independent parallel subtasks when useful.

Record concise critical thinking in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`:
- problem validity: is the phenomenon truly a problem; are causal claims reliable; what assumptions need testing?
- context sufficientness: what can be concluded now; what must be supplemented; what is must-have vs ideal?
- hidden issues: what deeper root cause, adjacent issue, or overlooked dependency may affect the goal?

If the contract is still draft, set `Contract status: draft` and `Issued by: alpha-goal`, then keep target/scope fields unset until Final Design.

## Clarify with User

Ground clarification in facts and observations, not habits, assumptions, current implementation, or prior solutions. Ask User one high-leverage question per round; one question means one decision variable.

Prepare the question from the first blocking gate or lowest-scoring dimension. Prefer intent and boundaries before implementation details:
- Ladder 1: intent, outcome, scope, non-goals, decision boundaries.
- Ladder 2: constraints, success criteria, acceptance evidence, authority, claim boundary.
- Ladder 3: context/current facts, actuator boundary, sensor/observer, external/current facts.

Each question must confirm a conflict, request a decision, demand an example, expose an assumption, force a tradeoff, or test a boundary-stressing scenario. If an answer stays shallow, apply the pressure ladder: ask for example/counterexample/evidence, probe hidden assumption/dependency, force boundary/tradeoff, or reframe toward essence/root cause.

Do not ask for discoverable facts. Ask only for user-owned decisions, credentials, permissions, external side effects, public claims, irreversible commitments, missing acceptance evidence, or unresolved source-of-truth conflicts. Use structured user-input tooling (`request_user_input` / equivalent), and present options conversationally with recommendation and reasoning:

```text
Round {n} | Target: {weakest_dimension} | Clarity: {score}%
{question backed by clear context}
```

Treat each answer as navigation evidence, not requirements or authority. Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps under `Interview ledger`.

Classify gaps:
- `[from-code][auto-confirmed]` descriptive fact.
- `[from-code]` inferred fact needing confirmation.
- `[from-research]` external/current fact after bounded fresh evidence.
- `[from-user]` human decision.

Auto-confirm only descriptive facts. Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue. Treat repo language as evidence, not authority; cross-check user claims against code/docs and name competing sources on conflict.

If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask only for the decision boundary.

## Readiness Gate Check

Use weighted clarity:

```text
clarity_score = 0.3 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context
```

Score Intent Clarity, Outcome Clarity, Scope Clarity, Constraint Clarity, Success Criteria Clarity, and Context Clarity for brownfield work with justification and gap.

Mark each gate `pass` only when explicit or source-backed: intent, outcome, scope, constraints, acceptance evidence, context/current facts, non-goals, decision boundaries, claim boundary, Trigger Contract, authorization source, source-of-truth conflicts, external/current facts, actuator boundary, and sensor/observer.

`Non-goals` and `Decision Boundaries` are mandatory readiness gates and must be explicit. Continue interviewing when any gate is unresolved, pressure pass is incomplete, one explicit assumption probe or one persistent follow-up is missing, the next answer could materially change execution/acceptance/authority/claim boundary, or clarity is `<= 0.92`.

For qualitative, value-laden, multi-party, weakly quantified, or UX/performance/quality-adjective objectives, create Indicator Handoff: primary metric, guardrail metric, tradeoff owner, and evidence boundary. Before closing Clarify, pressure-test the interpretation with at least one boundary scenario from inspected facts; if scope, acceptance, authority, or claim boundary changes, return to Clarify.

Max 5 rounds per dimension; after that, proceed with warnings only when more questions would not change execution. For cross-repo framing, keep one task-level Alpha Goal state root and record repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.

## Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- **Contrarian**: challenge a core assumption.
- **Simplifier**: probe minimum viable scope.
- **Ontologist**: ask for essence-level reframing when the user keeps describing symptoms.

If the stress test changes intent, scope, acceptance evidence, authority, or claim boundary, record it in `Interview ledger` and return to Clarify before Final Design.

## Final Design

Write the design to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`; copy to `docs/specs/YYYYMMDD-<TaskName>.md` when useful or required by repo convention. The state-root `goal-contract.md` is canonical. Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.

Keep `Contract status: draft` until user confirmation or an explicit workspace/user contract authorizes autonomous launch. On approval or pre-authorized launch, persist `Contract status: accepted` before `$control-loop` handoff.

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

## Artifact policy

`alpha-goal` writes only `goal-contract.md`. The contract contains `Contract status`, `Issued by`, `Discovery notes`, `Interview ledger`, canonical target, scope, non-goals, acceptance evidence, claim boundary, Trigger Contract, and handoff ledger.

`Issued by: alpha-goal` is required before `$control-loop`; other issuers are not authoritative. `Interview ledger` is evidence ledger, not executable authority.

Do not create separate discovery, interview, loop, memory, evidence, verification, or latest-pointer files from `alpha-goal`. `$control-loop` or `$goal-verify` may create a single task `checkpoint.md` only when conditional execution, recovery, evidence handoff, or verification requires it. A global `control-state/latest.md` may exist only as a recovery index to an accepted Goal Contract, not as a stage artifact.

Self-review the design for completion and reasonability. Use subagents for independent review when useful, then fix accepted findings.

## Ask for Confirmation

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
