---
name: alpha-goal
description: "Use to gate engineering/design/implementation requests before modification, implementation, repair, refactor, or hardening. Use inspection facts as entry evidence; run Loop Q&A to clarify intent, outcome, boundaries, non-goals, success criteria, acceptance evidence, and material technical design before producing user-confirmed artifacts."
---

# Alpha Goal

`alpha-goal` owns goal definition and design clarification.
Implementation starts only after a user-accepted Goal Contract hands off to `executor` skill.

## Entry Gate

Enter `alpha-goal` for engineering, design, implementation, repair, refactor, or hardening request. Skip only for concrete read-only work.

**Anti-Pattern:** "Too Clear to Need clarification" or "Too Simple to Need design"
- Every project MUST go through the workflow below; the contract or design may be short, but it must be explicit and user-confirmed.

**Check Point:**
- Resolve Alpha Goal state root as `$HOME/.alpha-goal/<workspace-slug>/`, where `<workspace-slug>` is `slug(repo_root or Goal Contract target workspace)`.
- Inspect the relevant files, docs, recent commits, and existing patterns.
- Identify facts, conflicts, unknowns, dependencies, and source-of-truth conflicts.
- Record inspection results in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`.

## Clarification Gate

Do not leave `Clarification` while any material blocking gap remains:
- Goal Contract coverage: Intent, Outcome, Scope, Constraints, Non-goals, Decision boundary, Claim boundary, Authorization source, Success Criteria, Acceptance evidence.
- Technical Design coverage is required only for implementation, repair, refactor, hardening, cross-file behavior changes, interface/data-model changes, or material risk.
- Every unresolved unknown is classified as `blocking`, `non-material`, or `deferred non-goal`.
- Required coverage means: decision, boundary, implementation impact, acceptance/observer, and status.
- Planned questions, unanswered questions, hypothetical answers, confidence, and round count do not reduce coverage.
- Mark uncertainty `non-material` only when it cannot change implementation, tests, acceptance, or risk handling.

Blocking gap classifier:
- A gap is `blocking` when a different answer could change behavior, touched files/components, interfaces/API, data model, persistence, migration, external dependency, permission, environment, test strategy, validation observer, rollout, rollback, security, privacy, performance, or risk handling.
- A gap is `deferred non-goal` only when the user or authoritative source explicitly excludes it from this goal.

Clarification exit invariants:
- `no_confidence_only`: Do not use confidence alone as exit evidence.
- `no_round_count`: Do not use round count as completion evidence.
- `no_blocking_gap_handoff`: Do not propose implementation, code edits, or `executor` skill handoff while any blocking goal or design gap remains.

## Clarification

**Evaluate:**
- Problem validity: whether the phenomenon is real and causal claims are reliable.
- Context sufficiency: what is known, missing, must-have, or merely ideal.
- Hidden issues: deeper root cause, adjacent issue, or dependency risk.

Loop Q&A until the user-owned decisions and any required technical design are explicit enough to write the artifacts.

### Loop Q&A

**Rules:**
- Ask one high-leverage question per round.
- One question means one decision variable: confirm a conflict, request a decision, choose a solution, demand an example, expose an assumption, force a tradeoff, or test a boundary-stressing case.
- Do not ask for discoverable facts.
- Present options conversationally with recommendation and reasoning.
- Use `request_user_input` or equivalent structured input.
- Record material decisions, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in task artifacts.
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

Rank open gaps before choosing the next target:
- Prefer the gap with the highest blast radius, irreversibility, external dependency, user-owned semantics, data/API contract impact, validation ambiguity, or rollback risk.
- Do not move to a lower-risk dimension while a higher-risk blocking design or goal gap remains.
- Use the Design table only when Technical Design coverage is required.

| Goal Priority | Dimension |
| --- | --- |
| 1 | intent, outcome, scope, execution boundary, non-goals |
| 2 | constraints, success criteria, acceptance evidence, claim boundary |
| 3 | context/current facts, actuator boundary, sensor/observer, external/current facts |

| Design Priority | Dimension |
| --- | --- |
| 1 | Architecture, components, data flow, interfaces/API, data models |
| 2 | Persistence, middleware, infrastructure, external dependencies |
| 3 | Test strategy, scalability, risks, rollback |

**Step 2: Ask and record**

Prompt format:

```text
Round {n} | Target: {dimension} | Gap: {blocking|non-material|deferred}
Why this blocks: ...
Decision needed: ...
Recommended option: ...
Question: ...
Coverage cells affected: decision / boundary / implementation impact / acceptance observer
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

Closure test:
- Before marking a dimension `covered`, ask: if this answer were wrong, what code, test, data, interface, dependency, risk treatment, or acceptance evidence would change?
- If any material item would change, keep the dimension `blocking`.
- If nothing material would change, record why it is `non-material` or `deferred non-goal`.

**Step 4: Update coverage state**

After the closure test, set the dimension status to `covered`, `blocking`, `non-material`, or `deferred non-goal` using the Clarification Gate classifier.
If any blocking gap remains, continue Loop Q&A; round count never closes Clarification.

### Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- **Contrarian:** challenge a core assumption.
- **Simplifier:** probe minimum viable scope.
- **Ontologist:** ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

### Write Artifacts

Follow `references/goal-contract-book.md` to write the Goal Contract. Set `Issued by = alpha-goal`.
Follow `references/technical-design-book.md` to write the Technical Design only when its coverage is required. Link the Goal Contract and Technical Design when both exist.
Write artifacts only from answered, auto-confirmed, or cited facts. Keep unresolved required fields as `[blocking]`; do not fill them from hypothetical answers.

### Review Gate And Show Summary

- Self-check the Goal Contract and any required Technical Design before asking for approval:
  - Coverage check: required fields exist, no blocking gap remains, and every covered dimension has decision, boundary, implementation impact, acceptance/observer, and status.
  - Authority check: current-state facts do not define desired behavior; non-goals, execution boundary, decision boundary, and claim boundary are explicit.
  - Acceptance check: success criteria map to acceptance evidence and validation observers; when Technical Design is required, key design decisions cover architecture, components, interfaces, data models, data flow, tests, and risks.
  - Closure check: no covered dimension relies only on confidence, round count, planned questions, or an untested assumption; recheck the highest-risk covered dimension.
- Run independent review for non-trivial implementation, repair, refactor, hardening, or cross-file behavior changes:
  - Prefer a subagent review when available; if skipped, record the reason.
  - Pass raw artifacts and the user request, not your intended answer.
  - Require the reviewer to check shallow Q&A, missing design detail, missing acceptance evidence, and premature implementation risk.
- Fix accepted findings.
- Record self-check and independent review results in the task artifacts or checkpoint.

After Review Gate completes, present the Goal Contract Summary first.
- The approval request message must include the Goal Contract Summary.
- If the Goal Contract Summary is missing or incomplete, stay in Review Gate.
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

Use `request_user_input` or equivalent structured input to ask for approve/launch, refine, or reject.
- On approval: set `Contract status: accepted`; perform Native Goal Sync; hand off to `executor` skill.
- On rejection: keep `Contract status: draft`.
- On refine: keep `Contract status: draft`; return to `Clarification` with user feedback.

## Native Goal Sync

Native Goal Sync is a lifecycle side effect, not authority.
- Before approval, do not invoke `create_goal`.
- On approval, call `get_goal` before creating a new native goal.
- If no unfinished active native goal exists, invoke `create_goal` with an objective built from the Goal Contract Summary and Technical Design link when present.
- If an unfinished active native goal already represents the same accepted contract, continue to `executor` skill.
- If an unfinished active native goal conflicts with the accepted contract, do not overwrite, clear, pause, replace, or repurpose it; do not hand off to `executor` as synced. Return to Confirmation with a blocking sync conflict for user decision.
- If Native Goal Sync fails, record the gap or blocker in the task artifact or checkpoint; do not treat sync failure as permission to redefine scope, acceptance, authority, or hand off as synced.
