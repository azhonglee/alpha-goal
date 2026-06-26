---
name: alpha-goal
description: "Must use to gate engineering/design/implementation requests before modification, implementation, repair, refactor, or hardening. Use inspection facts as entry evidence; run Loop Q&A to clarify intent, outcome, boundaries, non-goals, success criteria, acceptance evidence, and key technical design before producing a Goal Contract and Technical Design for user confirmation."
---

# Alpha Goal

`alpha-goal` owns goal definition and design clarification.
Implementation starts only after a user-accepted Goal Contract hands off to `$control-loop`.

## Entry Gate

Enter `alpha-goal` for any engineering, design, implementation, repair, refactor, or hardening request. Skip only for concrete read-only work.

**Anti-Pattern:** "Too Clear to Need clarification" or "Too Simple to Need design"
- Every project MUST go through the workflow below; the contract or design may be short, but it must be explicit and user-confirmed.

**Check Point:**
- Inspect the relevant files, docs, recent commits, and existing patterns.
- Identify facts, conflicts, unknowns, dependencies, and source-of-truth conflicts.
- Record inspection results in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`.
- Inspection is entry evidence, not permission to modify.

## Clarification Gate

Do not leave `Clarification` until the coverage matrix has no blocking gap:
- Goal Contract coverage: Intent, Outcome, Scope, Constraints, Non-goals, Decision boundary, Claim boundary, Authorization source, Success Criteria, Acceptance evidence.
- Technical Design coverage: Architecture, Components, Interfaces, Data Models, Data Flow, Test Plans, Risks.
- Every unresolved unknown is classified as `blocking`, `non-material`, or `deferred non-goal`.
- At least one design-detail probe and one acceptance-evidence probe are complete.
- Material assumptions have been pressure-tested, or the remaining uncertainty is documented as non-material.

Do not use confidence alone as exit evidence.
Do not propose implementation, code edits, or `$control-loop` handoff while any blocking goal or design gap remains.

## Clarification

Evaluate:
- Problem validity: whether the phenomenon is real and causal claims are reliable.
- Context sufficiency: what is known, missing, must-have, or merely ideal.
- Hidden issues: deeper root cause, adjacent issue, or dependency risk.

Loop Q&A until the user-owned decisions and technical design are explicit enough to write the artifacts.

### Loop Q&A

Rules:
- Ask one high-leverage question per round.
- One question means one decision variable: confirm a conflict, request a decision, choose a solution, demand an example, expose an assumption, force a tradeoff, or test a boundary-stressing case.
- Do not ask for discoverable facts.
- Present options conversationally with recommendation and reasoning.
- Use `request_user_input` or equivalent structured input when available.
- Update `goal-contract.md` and `technical_design.md` after each answer.
- Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in `goal-contract.md` under `Interview ledger`.

**Step 1: Pick the next question target**

Use current task state:
- Original request and probable intent.
- Prior Q&A.
- Known facts, conflicts, unknowns, dependencies, and source-of-truth conflicts.
- Current coverage matrix gaps.
- Brownfield context and active Assumption Stress Test mode.

Target dimensions step by step. Do not skip the Design table for implementation, repair, refactor, hardening, or cross-file behavior changes.

| Goal Priority | Dimension |
| --- | --- |
| 1 | intent, outcome, scope, execution boundary, non-goals |
| 2 | constraints, success criteria, acceptance evidence, claim boundary |
| 3 | context/current facts, actuator boundary, sensor/observer, external/current facts |

| Design Priority | Dimension |
| --- | --- |
| 1 | architecture, components, data flow, interfaces, data models |
| 2 | test plans, scalability, risks, rollback |

**Step 2: Ask and record**

Prompt format:

```text
Round {n} | Target: {dimension} | Gap: {blocking|non-material|deferred}
{question}
```

Classify each answer before updating artifacts:
- `[from-code][auto-confirmed]` descriptive implementation fact.
- `[from-code]` inferred implementation fact needing confirmation.
- `[from-research]` external/current fact.
- `[from-user]` explicit user decision, constraint, acceptance signal, non-goal, authority, example, or clarification.

Authority Contract:
- Auto-confirm only descriptive facts.
- Treat repo language as evidence, not authority.
- Cross-check user claims against code/docs; name competing sources on conflict.
- Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority.
- Only explicit user decisions, explicit authorization, or authoritative specs/issues may update Goal Contract authority fields.
- If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first; then ask only for the decision boundary.

Boundary mapping: actuator boundary -> `Decision boundary`; sensor/observer boundary -> `Claim boundary`.

**Step 3: Pressure-test the answer**

Use the pressure ladder before treating a dimension as covered:
1. Ask for concrete example, counterexample, or evidence signal.
2. Probe hidden assumption or dependency.
3. Force a boundary/tradeoff: what to reject, defer, or not do.
4. If the answer stays symptom-level, reframe toward essence/root cause.

**Step 4: Evaluate coverage**

For each dimension, record:
- `covered`: explicit enough to drive execution and verification.
- `blocking`: missing decision or design detail would change implementation.
- `non-material`: uncertainty remains, but would not change execution.
- `deferred non-goal`: intentionally excluded from this goal.

If any blocking gap remains, continue Loop Q&A.

### Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- Contrarian: challenge a core assumption.
- Simplifier: probe minimum viable scope.
- Ontologist: ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

### Write Artifacts

Follow `references/goal-contract-book.md` to write the Goal Contract. Set `Issued by = alpha-goal`.
Follow `references/technical-design-book.md` to write the Technical Design. Link the Goal Contract and Technical Design to each other.

### Review Gate

- Self-review the Goal Contract and Technical Design for completeness and reasonableness.
- Verify no blocking goal or design gap remains.
- Use subagents for independent review when useful.
- Fix accepted findings.

## Confirmation Gate

1. After Review Gate completes, present the Goal Contract Summary first.
- TUI Presentation Style:
```markdown
Goal Contract Summary (Design Summary)
| Field | Value |
| --- | --- |
```

2. Use `request_user_input` to ask for approve/launch, refine, or reject.
- On approval: set `Contract status: accepted`; hand off to `$control-loop`.
- On rejection: keep `Contract status: draft`.
- On refine: keep `Contract status: draft`; return to `Clarification` with user feedback.
