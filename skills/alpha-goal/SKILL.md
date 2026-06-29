---
name: alpha-goal
description: "Must use to gate engineering/design/implementation requests before modification, implementation, repair, refactor, or hardening. Use inspection facts as entry evidence; run Loop Q&A to clarify intent, outcome, boundaries, non-goals, success criteria, acceptance evidence, and key technical design before producing a Goal Contract and Technical Design for user confirmation."
---

# Alpha Goal

`alpha-goal` owns goal definition and design clarification.
Implementation starts only after a user-accepted Goal Contract hands off to `executor` skill.

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
- A dimension is not covered by one answer by default. Coverage requires a pressure-tested decision, boundary, implementation impact, and evidence signal.
- The highest-risk goal dimension and highest-risk design dimension each receive follow-up until no blocking gap remains.
- Planned questions, unanswered questions, and hypothetical answers do not reduce coverage.

Clarification exit invariants:
- `no_confidence_only`: Do not use confidence alone as exit evidence.
- `no_round_count`: Do not use round count as completion evidence.
- `no_blocking_gap_handoff`: Do not propose implementation, code edits, or `$executor` handoff while any blocking goal or design gap remains.

## Clarification

**Evaluate:**
- Problem validity: whether the phenomenon is real and causal claims are reliable.
- Context sufficiency: what is known, missing, must-have, or merely ideal.
- Hidden issues: deeper root cause, adjacent issue, or dependency risk.

Loop Q&A until the user-owned decisions and technical design are explicit enough to write the artifacts.

### Loop Q&A

**Rules:**
- Ask one high-leverage question per round.
- One question means one decision variable: confirm a conflict, request a decision, choose a solution, demand an example, expose an assumption, force a tradeoff, or test a boundary-stressing case.
- Do not ask for discoverable facts.
- Present options conversationally with recommendation and reasoning.
- Use `request_user_input` or equivalent structured input.
- Update `goal-contract.md` and `technical_design.md` after each answer.
- Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in `goal-contract.md` under `Interview ledger`.
- Revisit the same dimension when the first answer lacks an example, boundary, tradeoff, design consequence, or acceptance signal.
- Ask one round, wait for the answer, then decide whether to follow up on the same dimension or move to the next one.
- Do not pre-generate a complete questionnaire and then proceed as if the questions were answered.

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
4. Ask what architecture, component, interface, data model, data flow, test, or risk decision follows.
5. If the answer stays symptom-level, reframe toward essence/root cause.

Follow-up policy:
- Do not mark a dimension `covered` after the first answer unless that answer already includes decision, boundary, design consequence, and acceptance evidence.
- Ask another round for the same dimension when the pressure ladder exposes any blocking gap.
- Do not rotate to the next dimension when the current answer creates a blocking design, boundary, or evidence gap.
- Record the coverage chain for each required dimension: first question, answer source, pressure-test result, coverage status.
- Prefer depth over breadth: fewer well-tested dimensions are better than many shallow checkmarks.

**Step 4: Evaluate coverage**

For each dimension, record:
- `covered`: explicit enough to drive execution and verification.
- `blocking`: missing decision or design detail would change implementation.
- `non-material`: uncertainty remains, but would not change execution.
- `deferred non-goal`: intentionally excluded from this goal.

If any blocking gap remains, continue Loop Q&A.
Round count never closes Clarification.

### Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- **Contrarian:** challenge a core assumption.
- **Simplifier:** probe minimum viable scope.
- **Ontologist:** ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

### Write Artifacts

Follow `references/goal-contract-book.md` to write the Goal Contract. Set `Issued by = alpha-goal`.
Follow `references/technical-design-book.md` to write the Technical Design. Link the Goal Contract and Technical Design to each other.
Write artifacts only from answered, auto-confirmed, or cited facts. Keep unresolved required fields as `[blocking]`; do not fill them from hypothetical answers.

### Review Gate And Show Summary

- Self-check the Goal Contract and Technical Design before asking for approval:
  - All required Goal Contract and Technical Design fields are present.
  - No required field relies on current-state facts as desired behavior.
  - No blocking goal or design gap remains in the coverage matrix.
  - Each success criterion maps to acceptance evidence and a validation observer.
  - Key design decisions cover architecture, components, interfaces, data models, data flow, tests, and risks.
  - Non-goals, execution boundary, decision boundary, and claim boundary are explicit.
- Run independent review for non-trivial implementation, repair, refactor, hardening, or cross-file behavior changes:
  - Prefer a subagent review when available; if skipped, record the reason.
  - Pass raw artifacts and the user request, not your intended answer.
  - Require the reviewer to check shallow Q&A, missing design detail, missing acceptance evidence, and premature implementation risk.
- Fix accepted findings.
- Record self-check and independent review results in the task artifacts or checkpoint.
- Produce a visible Review Record with self-check result, independent review result or skipped reason, findings fixed, and remaining non-material uncertainties.

After Review Gate completes, present the Goal Contract Summary first.
- The approval request message must include, in order: Goal Contract Summary, Review Record
- If the summary or Review Record is missing or incomplete, stay in Review Gate.
- TUI Presentation Style:
```markdown
Goal Contract Summary (Design Summary)
| Field | Value |
| --- | --- |
| Goal | ... |
| Non-goals | ... |
| Execution boundary | ... |
| Key design decisions | ... |
```

## Confirmation Gate

Use `request_user_input` to ask for approve/launch, refine, or reject.
- On approval: set `Contract status: accepted`; hand off to `$executor`.
- On rejection: keep `Contract status: draft`.
- On refine: keep `Contract status: draft`; return to `Clarification` with user feedback.
