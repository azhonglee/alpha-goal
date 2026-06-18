---
name: alpha-goal
description: "Use for any engineering/design/implementation/diagnose/repair requests; clarify real intention/requirements, identify outcome, scope, non-goals, decision boundaries, authority, and design."
---

# Alpha Goal

Exert your utmost efforts to clarify the real intention, outcome, constraints, boundaries, and success criteria of the request. Do not implement or make final claims inside this skill.

## State root

Resolve the Alpha Goal state root before writing runtime artifacts. Always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

## Pre-flight
1. Classify the work type as one of the following:
   - `exploration`: Skip only for concrete read-only fact lookup; use this skill when exploration is about intent, scope, acceptance, or decision boundaries.
   - `design`: Run all phases.
   - `implementation`: Run all phases.
   - `maintenance`: Run all phases.
   - `diagnose/repair`: Start with Phase 1 to frame the symptom and evidence boundary, then confirm the root cause with proof. If repair is needed, continue from Phase 2 through the remaining phases to define the repair boundary and authorization. If root cause is not 100% confirmed, limit follow-up to diagnostic probes or hypothesis-testing slices. Do not implement directly.
   - `other`: Ask for more details to classify again.

2. If the work may be mixed, ask for the minimum details needed to split it into sequenced work items.

## Phase 1: Discovery

Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when concrete targets, acceptance evidence, non-goals, decision boundaries, and authority are already explicit.

For deictic bug requests without a discoverable locator, inspect immediate context; if no failing command/log/issue/code pointer is discoverable, ask for the minimal reproducer or error signal before execution routing.

Use subagents, one or more, for independent parallel subtasks when that improves throughput.

If work appears done or any final/ready/safe/complete/repair claim is needed, route to `evidence-verify`.

## Phase 2: Clarify

Loop Socratic-deep-interview until you 100% understand the requirements and remain no ambiguity at all.

Before the first user-facing question, complete minimum preflight: applicable AGENTS/repo rules, README/getting-started/install docs, relevant docs/plans/ADRs/contracts, target files/current implementation, local glossary/context if present, current branch/status when mutation may follow, and direct contradictions. If missing, name the missing observer instead of asking for repo facts; never ask the user to summarize discoverable repository facts merely to save inspection effort.

For `diagnose/repair`, treat a confirmed root cause as evidence-backed context. Clarify the repair scope, affected surfaces, authorization, acceptance evidence, non-goals, and repair-complete claim boundary. If root cause is not confirmed, do not proceed to repair design; route only to diagnostic probes or hypothesis-testing slices.

### Socratic Interviewing Loop
1. Ask User one high-leverage question per round. One question means one decision variable. The question should confirm a conflict, request a decision, demand an example, expose an assumption, force a tradeoff, or test one boundary-stressing scenario. Use `request_user_input` with exactly one `questions[]` item.
2. Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps. If context is too large, first inspect prompt-safe local indexes/filenames/docs/likely target surfaces. Treat the answer as navigation evidence, not requirements or authority.
3. Treat repo language as evidence, not authority. Cross-check user claims against discoverable code/docs; if sources conflict, name the competing sources. Existing patterns are compatibility signals or hypotheses, not requirements by themselves; if they affect desired behavior, scope, acceptance, or tradeoff, confirm with the user or cite an authoritative spec before mutation. If the user's answer contradicts discovered facts, treat the answer as a claim to reconcile, not as an override.
4. Classify each gap as `[from-code][auto-confirmed]` descriptive fact, `[from-code]` inferred fact needing confirmation, `[from-research] external/current fact`, or `[from-user]` human decision. Do not ask for discoverable facts until inspected; auto-confirm only descriptive facts, never choices about desired behavior, scope, pattern, or tradeoff. Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue. If unresolved ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask the user only for the decision boundary.
5. Readiness Gate Check. Mark each gate `pass` only when explicit or source-backed: intent, outcome, scope, constraints, acceptance evidence, context/current facts, non-goals, decision boundaries, claim boundary, authorization source, source-of-truth conflicts, external/current facts, actuator boundary, and sensor/observer. Count unresolved gates; target the first blocking gate each round and prefer intent/boundaries before implementation detail.
6. If qualitative, value-laden, multi-party, weakly quantified, or UX/performance/quality-adjective objectives exist, synthesize and create Indicator Handoff with primary metric, guardrail metric, tradeoff owner, and evidence boundary before action/claims.
7. Ask or block when user-owned decisions, credentials, permissions, external side effects, public claims, irreversible commitments, missing acceptance evidence, or unresolved source-of-truth conflicts remain.
8. Before asking or closing non-trivial ambiguous work, pressure-test the current interpretation with at least one boundary scenario from inspected facts; use it to choose the next single question. After each material user answer, pressure-test again if it could change scope, acceptance, authority, or claim boundary. Continue ordinary questioning only when the next answer could materially change execution, acceptance, authority, or claim boundary.

Track interview records, and append to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/interview.md`.

### Cross-repo framing

Trigger this when the requested outcome spans more than one git root, repository, subrepo, or ownership surface.

- Keep a single task-level Alpha Goal state root. Do not split runtime records by repo; record a repo manifest inside the task records and design.
- Before launch, identify each repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.
- Treat missing repo selection, write authority, integration evidence, or delivery boundary as a user-owned decision that blocks mutation.

### Clarity score

Use the clarity_score to decide whether you need to keep asking questions.
Score each weighted dimension in `[0.0, 1.0]` with justification + gap：
clarity_score = 0.3 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context

Readiness gate:
- `Non-goals` must be explicit
- `Decision Boundaries` must be explicit
- A pressure pass must be complete: at least one earlier answer has been revisited with an evidence, assumption, or tradeoff follow-up
- If either gate is unresolved, or the pressure pass is incomplete, continue interviewing even when weighted clarity is above threshold

## Phase 3: Assumption Stress Test

Use each mode once when applicable. These are normal escalation tools, not rare rescue moves:

- **Contrarian** (round 2+ or immediately when an answer rests on an untested assumption): challenge core assumptions
- **Simplifier** (round 4+ or when scope expands faster than outcome clarity): probe minimal viable scope
- **Ontologist** (round 5+ and clarity_score < 0.85, or when the user keeps describing symptoms): ask for essence-level reframing

Track used modes in state to prevent repetition.

## Phase 4: Design

1. When you have a clear understanding of the task, you can start to design the solution based on the information you have.

Design template:
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

You may add task-specific fields when they improve the design, but do not omit, rename, or weaken the contract fields above.

2. Persist `docs/specs/YYYYMMDD-<TaskName>.md`, or follow repository conventions.
3. Dispatch Self-review + Independent-review of the design and fix any acceptant findings.

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
