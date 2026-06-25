---
name: alpha-goal
description: "Must use for any engineering/design/implementation requests."
---

# Alpha Goal

## Mission
`alpha-goal` owns workflow control for goal definition.

Loop Q&A until you have 100% confidence to understand the requirements fully and design a perfect solution.

## Boundaries
- alpha-goal does not implement, verify completion, make final-ready or complete claims
- Only an accepted Goal Contract may be handed to `$control-loop`

Quick Path:
- Skip only for concrete read-only fact lookup; Use this skill when intent, scope, acceptance, or decision boundaries are involved

**Anti-Pattern:** "Too Clear to Need clarification" or "Too Simple to Need design"
- Every project MUST go through the workflow below; The contract or design may be short, but it must be explicit and you must get approval

## Workflow

## Phase 1: Discovery
Inspect applicable: AGENTS/repo rules, README/getting-started/install docs, Relevant specs/ADRs/contracts, Target files and current implementation, Local glossary/context, Current branch/status when mutation may follow, Direct contradictions

Evaluate:
- Problem validity: whether the phenomenon is real and causal claims are reliable
- Context sufficiency: what is known, missing, must-have, or merely ideal
- Hidden issues: deeper root cause, adjacent issue, or dependency risk

Identify:
- Facts
- Conflicts
- Unknowns
- Dependencies

Record details in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`.
If the contract is still draft, set `Contract status: draft` and `Issued by: alpha-goal`; keep outcome and scope fields unset until final design.

## Phase 2: Clarify
Loop Q&A until clarity score >= `0.92` and solution clarity >= `0.95` and readiness gates pass.

Readiness gates = Goal Gates, Authority Gates, Context Gates, Repair Gate; exclude review, final user confirmation, accepted contract status, and the Before Handoff Checklist.

### Q&A Loop

**Step 1: Prepare a question**

Use current task state:
- Original request and probable intent
- Prior Q&A
- Known facts, conflicts, unknowns, and source-of-truth conflicts
- Current readiness gates and clarity dimensions
- Brownfield context and active Assumption Stress Test mode

Target the highest leverage dimension:
- Stage 1: intent, outcome, scope, non-goals, decision boundaries
- Stage 2: constraints, success criteria, acceptance evidence, claim boundary
- Stage 3: context/current facts, actuator boundary, sensor/observer, external/current facts
- Stage 4: architecture, components, data flow, interfaces, testing strategy, scalability, and risk

Rules:
- `Non-goals` and `Decision boundary` are mandatory readiness gates
- Ask one high-leverage question per round
- One question means one decision variable: confirm a conflict, request a decision, demand an example, expose an assumption, force a tradeoff, or test a boundary-stressing case
- Do not ask for discoverable facts
- Present options conversationally with recommendation and reasoning
- Use `request_user_input` or equivalent structured input when available

**Step 2: Get answer from user**

Present options conversationally with recommendation and reasoning first.

Prompt format:

```text
Round {n} | Target: {highest_leverage_dimension} | Clarity: {score}%
{question}
```

**Step 3: Challenge answer and update Goal Contract**

Pressure ladder for each answer:
1. Ask for concrete example, counterexample, or evidence signal.
2. Probe hidden assumption or dependency.
3. Force a boundary/tradeoff: what to reject, defer, or not do.
4. If the answer stays symptom-level, reframe toward essence/root cause.

Classify each answer before updating the Goal Contract:
- `[from-code][auto-confirmed]` descriptive implementation fact
- `[from-code]` inferred implementation fact needing confirmation
- `[from-research]` external/current fact
- `[from-user]` explicit user decision, constraint, acceptance signal, non-goal, authority, example, or clarification

Authority rules:
- Auto-confirm only descriptive facts
- Treat repo language as evidence, not authority
- Cross-check user claims against code/docs; name competing sources on conflict
- Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority
- Only explicit user decisions, explicit authorization, or authoritative specs/issues may update Goal Contract authority fields
- If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first; then ask only for the decision boundary

Boundary mapping: actuator boundary -> `Decision boundary`; sensor/observer boundary -> `Claim boundary`.

Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Interview ledger`.
Update the Goal Contract under `Technical Solution` when question is about architecture, components, data flow, interfaces, testing strategy, scalability, and risk.

**Step 4: Evaluate clarity score**

Score:

```text
clarity_score = 0.25 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context
solution_clarity = architecture_clarity * 0.2 + component_clarity * 0.2 + data_flow_clarity * 0.2 + interface_clarity * 0.15 + testing_strategy_clarity * 0.15 + scalability_clarity * 0.05 + risk_clarity * 0.05
```

Score each dimension in `[0, 100]` with justification and gap:
- Goal: Intent Clarity, Outcome Clarity, Scope Clarity, Constraint Clarity, Success Criteria Clarity, Context Clarity for brownfield work
- Solution: Architecture Clarity, Component Clarity, Data Flow Clarity, Interface Clarity, Testing Strategy Clarity, Scalability Clarity, Risk Clarity

**Step 5: Loop control**

Cycle control:
- Do not offer early exit before one explicit assumption probe and one persistent follow-up
- Max 6 rounds per dimension
- Proceed with warnings only when further questions would not change execution
- For cross-repo framing, keep one task-level Alpha Goal state root and record a repo manifest: repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order
- Keep Clarify active if not all stage dimensions have been asked or clarity score < 92 or solution clarity < 95

### Phase 3: Assumption Stress Test
Use each applicable mode once; if none applies, record why:
- Contrarian: challenge a core assumption
- Simplifier: probe minimum viable scope
- Ontologist: ask for essence-level reframing when the user keeps describing symptoms

Track used modes in state to prevent repetition.

### Phase 4: Write Contract

Follow the book template in `references/goal-contract-book.md` to write the Goal Contract.

### Phase 5: Review
- Self-review the Goal Contract for completeness and reasonableness
- Use subagents for independent review when useful
- Fix accepted findings

## Confirmation Gate

Present the Goal Contract Summary first.

TUI Presentation Style:
```markdown
Goal Contract Summary (Design Summary)
| Field | Value |
| --- | --- |
```

Use `request_user_input` to ask for approve/launch, refine, or reject.
- On approval: set `Contract status: accepted`; hand off to `$control-loop`
- On rejection: keep `Contract status: draft`
- On refine: keep `Contract status: draft`; return to Phase 2 with user feedback

## Hard Gates
PASS only if:
- All explicit: Intent, Outcome, Scope, Constraints, Non-goals, Decision boundary, Claim boundary, Authorization source, Acceptance evidence
- Clarity score > 0.92
- Solution clarity > 0.95
- A pressure pass is complete: at least one earlier answer was revisited with evidence, assumption, or tradeoff follow-up
