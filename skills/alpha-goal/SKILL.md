---
name: alpha-goal
description: "Must use for any engineering/design/implementation/diagnose/repair requests; through interviewing user, clarify real intention/requirements, identify outcome, scope, decision boundaries, and design."
---

# Alpha Goal

`alpha-goal` owns workflow control for engineering/design/implementation/diagnose/repair goals.

It may use other skills as bounded observers, domain specialists, evaluators, but delegated skills must not control phase progression, redefine the target, expand or narrow scope, set acceptance evidence, waive non-goals, decide authority, or make final/ready/complete claims.

**Must Execute phase to phase strictly whenever using this skill:**

```text
Pre-flight -> Discovery -> Clarify with User -> Assumption Stress Test -> Final Design -> Ask for Confirmation
```

`Clarify with User` is the core phase.

## Phase 0: Pre-flight
1. Classify the work type as one of the following:
   - `exploration`: Skip only for concrete read-only fact lookup; use this skill when exploration is about intent, scope, acceptance, or decision boundaries.
   - `design/implementation/maintenance`: Follow all phases order strictly.
   - `diagnose/repair`: Must start with Phase 1 to frame symptom/evidence and confirm root cause. If root cause is not 100% confirmed, limit follow-up to diagnostic probes or hypothesis-testing slices. If repair is needed, treat confirmed root cause as evidence-backed context, use Phase 2+ to define repair boundary and authorization. Do not implement/design directly.
   - `other`: Ask for more details to classify again.

2. If the work may be mixed, ask for the minimum details needed to split it into sequenced work items.

3. Resolve the Alpha Goal state root before writing runtime artifacts. Always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

## Phase 1: Discovery

Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when concrete targets, acceptance evidence, non-goals, decision boundaries, and authority are already explicit.

For deictic bug requests without a discoverable locator, inspect immediate context; if no failing command/log/issue/code pointer is discoverable, ask for the minimal reproducer or error signal before execution routing.

Use subagents, one or more, for independent parallel subtasks when that improves throughput.

### critical thinking for discovery

- **layer 1 - Problem validity**:
   - Does the phenomenon described by the user truly constitute a "problem"? Is it possible that this is normal behavior?
   - Are the user's attributions (if any) reasonable? Is the causal relationship reliable?
   - Are there any underlying assumptions that need to be verified?
- **layer 2 - Context sufficientness**:
   - Is the existing information sufficient to support the analysis? What key information is missing?
   - What information needs to be supplemented by the user to continue? (Prioritize: Must have / Ideal / Enhanced)
   - If information is insufficient, clearly tell the user "What level of analysis can I currently reach, and what is still missing?"
- **layer 3 - Hidden Issues**:
   - Based on the available information, can any other issues be identified that the user might have overlooked?
   - Are these hidden issues connected to the problem raised by the user?
   - Is there a deeper root cause hidden beneath the surface phenomena?

Record the discovery results with critical thinking to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/context.md`

## Phase 2: Clarify with User

Ground decisions in facts, observations and context; do not base on any habits, assumptions, or prior solutions.

Loop Deep Discussion until you 100% understand the requirements from multiple perspectives and remain clarity score above threshold 0.9.

### Deep Discussion Loop

### 2.1 Prepare and generate next question
Before the first user-facing question, make sure completing minimum preflight: applicable AGENTS/repo rules, README/getting-started/install docs, relevant docs/plans/ADRs/contracts, target files/current implementation, local glossary/context if present, current branch/status when mutation may follow, and direct contradictions. If missing, name the missing observer instead of asking for repo facts; never ask the user to summarize discoverable repository facts merely to save inspection effort.

Generate a question that confirms a conflict, requests a decision, demands an example, exposes an assumption, forces a tradeoff, or tests one boundary-stressing scenario.

Use the current task state to generate the next question:
- Original user request and probable intent
- Prior Q&A rounds
- Known facts, conflicts, unknowns, and source-of-truth conflicts
- Current readiness gates and clarity_score dimensions
- Brownfield context, if present
- Active Assumption Stress Test mode, if any

Target the first blocking readiness gate or the lowest-scoring clarity dimension, but prefer intent and boundaries before implementation details:
- **Stage 1 — Intent-first:** intent, outcome, scope, non-goals, decision boundaries
- **Stage 2 — Feasibility:** constraints, success criteria, acceptance evidence, authority, claim boundary
- **Stage 3 — Brownfield grounding:** context/current facts, actuator boundary, sensor/observer, external/current facts

Follow-up pressure ladder after each answer:
1. Ask for a concrete example, counterexample, or evidence signal behind the latest claim
2. Probe the hidden assumption, dependency, or belief that makes the claim true
3. Force a boundary or tradeoff: what would you explicitly not do, defer, or reject?
4. If the answer still describes symptoms, reframe toward essence / root cause before moving on

Prefer staying on the same thread for multiple rounds when it has the highest leverage. Breadth without pressure is not progress.

`Non-goals` and `Decision Boundaries` are mandatory readiness gates. Ask about them early and keep revisiting them until they are explicit.

### 2.2 Ask one question
- Ask User one high-leverage question per round. One question means one decision variable.
- Do not ask for discoverable facts until inspected. Ask only when user-owned decisions, credentials, permissions, external side effects, public claims, irreversible commitments, missing acceptance evidence, or unresolved source-of-truth conflicts remain.
- Use structured user-input tooling available in the runtime (`AskUserQuestion` / equivalent) and present:

```
Round {n} | Target: {weakest_dimension} | Clarity: {score}%
{question backed by clear context}
```

#### 2.3 Interpret answer

Treat the answer as navigation evidence, not requirements or authority.

Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps. If context is too large, first inspect prompt-safe local indexes/filenames/docs/likely target surfaces.

Treat repo language as evidence, not authority. Cross-check user claims against discoverable code/docs. If sources conflict, name the competing sources.

Existing patterns are compatibility signals or hypotheses, not requirements by themselves. If they affect desired behavior, scope, acceptance, or tradeoff, confirm with the user or cite an authoritative spec before mutation.

If the user's answer contradicts discovered facts, treat the answer as a claim to reconcile, not as an override.

Classify each gap as:
- `[from-code][auto-confirmed]` descriptive fact
- `[from-code]` inferred fact needing confirmation
- `[from-research]` external/current fact
- `[from-user]` human decision

Auto-confirm only descriptive facts, never choices about desired behavior, scope, pattern, tradeoff, acceptance evidence, non-goals, authority, or claim boundary.
Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue.

If unresolved ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask the user only for the decision boundary.

### 2.4 Score and gate

Use the clarity_score to decide whether you need to keep asking questions. Score each weighted dimension in `[0.0, 1.0]` with justification + gap:

clarity_score = 0.3 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context

Detailed dimensions:
- Intent Clarity — why the user wants this
- Outcome Clarity — what end state they want
- Scope Clarity — how far the change should go
- Constraint Clarity — technical or business limits that must hold
- Success Criteria Clarity — how completion will be judged
- Context Clarity — existing codebase understanding (brownfield only)

Readiness Gate Check. Mark each gate `pass` only when explicit or source-backed:
intent, outcome, scope, constraints, acceptance evidence, context/current facts, non-goals, decision boundaries, claim boundary, authorization source, source-of-truth conflicts, external/current facts, actuator boundary, and sensor/observer.

Readiness gate:
- `Non-goals` must be explicit.
- `Decision Boundaries` must be explicit.
- A pressure pass must be complete: at least one earlier answer has been revisited with an evidence, assumption, or tradeoff follow-up.
- If either gate is unresolved, or the pressure pass is incomplete, continue interviewing even when weighted clarity is above threshold.

If qualitative, value-laden, multi-party, weakly quantified, or UX/performance/quality-adjective objectives exist, synthesize and create Indicator Handoff with primary metric, guardrail metric, tradeoff owner, and evidence boundary before action/claims.

Before closing Clarify, pressure-test the current interpretation with at least one boundary scenario from inspected facts. If the pressure test changes scope, acceptance, authority, or claim boundary, return to `2.1`.

### 2.5 Record and route
- Do not offer early exit before the first explicit assumption probe and one persistent follow-up have happened.
- Max 5 rounds per dimension. After max rounds, allow to next dimension with warnings even if clarity score is still below threshold.

Track interview records, and append to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/interview.md`.

Continue ordinary questioning only when the next answer could materially change execution, acceptance, authority, or claim boundary.

Cross-repo framing triggers when the requested outcome spans more than one git root, repository, subrepo, or ownership surface.

For cross-repo framing:
- Keep a single task-level Alpha Goal state root. Do not split runtime records by repo; record a repo manifest inside the task records and design.
- Before launch, identify each repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.
- Treat missing repo selection, write authority, integration evidence, or delivery boundary as a user-owned decision that blocks mutation.

If target, scope, authority, source reference, non-goals, acceptance evidence, or claim boundary is wrong or unclear, keep Clarify active.

If all readiness gates pass and clarity_score is above threshold, allow to next phase.

## Phase 3: Assumption Stress Test

Use each mode once when applicable. These are normal escalation tools, not rare rescue moves:

- **Contrarian** (round 2+ or immediately when an answer rests on an untested assumption): challenge core assumptions
- **Simplifier** (round 4+ or when scope expands faster than outcome clarity): probe minimal viable scope
- **Ontologist** (round 5+ and clarity_score < 0.9, or when the user keeps describing symptoms): ask for essence-level reframing

Track used modes in state to prevent repetition.

## Phase 4: Final Design

1. When clear, design the solution around the goal.

Design Content Must Include:
Technical Context [context]
Intent[intent] （Why the user wants this）
Root Cause [root_cause] (optional, only for repair design)
Outcome [outcome]
Scope [scope]
Repo surfaces [repo_surfaces]
Constraints [constraints]
Assumptions + resolutions [assumptions_resolutions]
Acceptance evidence [acceptance_evidence]
Dependency/integration order [repo_integration_order]
Non-goals [non_goal]
Decision boundary [decision_boundary]
Claim boundary [claim_boundary]

You may add helpful task-specific fields, but do not omit, rename, or weaken the contract fields above.

2. Persist `docs/specs/YYYYMMDD-<TaskName>.md`, or follow repository conventions.
3. Dispatch Self-review + Independent-review of the design and fix any acceptant findings.
   - **completion**: 100% of the design is clear and complete.
   - **reasonability**: The design is reasonable and feasible, like SOLID, DRY, KISS, etc.

## Phase 5: Ask for Confirmation

1. Show Summary of Design. Include `Root Cause` only for repair designs.

TUI summary Style:

```markdown
Design Summary

| Field | Value |
| --- | --- |
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
| Blocking gates | |
| Ledger | |
| Next | |
```

2. Use `request_user_input` to ask for confirmation: approve and launch, refine or reject.
- Approve and launch: Hand off the design to `$control_loop` to execute.
- Refine: Ask for refinement of the design and return to suitable phase.
- Reject: Stop here.
