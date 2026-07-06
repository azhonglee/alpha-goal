---
name: alpha-goal
description: "Must use to gate engineering/design/implementation requests before modification, implementation, repair, refactor, or hardening. Use inspection facts as entry evidence; clarify intent, outcome, boundaries, non-goals, success criteria, acceptance evidence, and key technical design before producing a user-confirmed Goal Contract."
---

# Alpha Goal

`alpha-goal` owns goal definition and design clarification.
Implementation starts only after an accepted Goal Contract hands off to `executor` skill.

## Entry Gate

Use for engineering, design, implementation, repair, refactor, or hardening requests.
Skip only for concrete read-only work.

Before asking or writing a contract:
- Inspect relevant files, docs, recent commits, and existing patterns.
- Record facts, conflicts, unknowns, dependencies, and source-of-truth conflicts in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`.
- Treat inspection as evidence, not permission to modify.

## Clarification Gate

Do not leave `Clarification` while a blocking gap remains.

Required coverage:
- Goal Contract: Intent, Outcome, Scope, Constraints, Non-goals, Execution boundary, Decision boundary, Claim boundary, Authorization source, Success Criteria, Acceptance evidence.
- Technical Design: required for implementation, repair, refactor, hardening, cross-file behavior changes, interface/data-model changes, or material risk. Short design notes are enough for low-risk local changes.

Blocking gap classifier:
- `blocking`: a different answer could change behavior, touched files/components, API/interface, data model, persistence, migration, dependency, permission, environment, test strategy, validation observer, rollout, rollback, security, privacy, performance, or risk handling.
- `non-material`: uncertainty remains but cannot change implementation, tests, acceptance, or risk handling.
- `deferred non-goal`: the user or an authoritative source explicitly excludes the item.

Clarification exit invariants:
- `no_confidence_only`: Do not use confidence alone as exit evidence.
- `no_round_count`: Do not use round count as completion evidence.
- `no_blocking_gap_handoff`: Do not propose implementation, code edits, or `executor` skill handoff while any blocking goal or design gap remains.

## Clarification

Run a blocking-gap loop:
1. Pick the highest-risk open gap by blast radius, irreversibility, external dependency, user-owned semantics, API/data impact, validation ambiguity, or rollback risk.
2. Ask one high-leverage question about one decision variable.
3. Recommend an option with reasoning.
4. Classify the answer before updating artifacts.
5. Pressure-test material answers with an example, counterexample, boundary, design consequence, or acceptance signal.
6. Mark the gap `covered`, `blocking`, `non-material`, or `deferred non-goal`.

Question format:

```text
Round {n} | Target: {dimension} | Gap: {blocking|non-material|deferred}
Why this blocks: ...
Decision needed: ...
Recommended option: ...
Question: ...
Coverage affected: decision / boundary / implementation impact / acceptance observer
```

Answer sources:
- `[from-code][auto-confirmed]`: descriptive implementation fact.
- `[from-code]`: inferred implementation fact needing confirmation.
- `[from-research]`: external/current fact.
- `[from-user]`: explicit user decision, constraint, acceptance signal, non-goal, authority, example, or clarification.

Authority rules:
- Auto-confirm only descriptive facts.
- Treat repo language as evidence, not desired behavior.
- Current-state facts cannot define requirements, acceptance evidence, non-goals, tradeoffs, or authority.
- Only explicit user decisions, explicit authorization, or authoritative specs/issues may update authority fields.
- If ambiguity depends on current external APIs, standards, laws, schedules, prices, or dependency versions, gather bounded fresh evidence first, then ask for the decision boundary.

Use Assumption Stress Test only when it changes the contract:
- Contrarian: challenge a core assumption.
- Simplifier: probe minimum viable scope.
- Ontologist: reframe symptom-level requests toward root cause.

## Write Artifacts

Follow `references/goal-contract-book.md` to write the Goal Contract. Set `Issued by = alpha-goal`.
Follow `references/technical-design-book.md` when a Technical Design is required.
Write only answered, auto-confirmed, or cited facts. Keep unresolved required fields as `[blocking]`.

## Review Gate And Show Summary

Before approval:
- Required Goal Contract fields are present.
- Required Technical Design fields are present when design is required.
- No required field uses current-state facts as desired behavior.
- No blocking goal or design gap remains.
- Success criteria map to acceptance evidence and validation observers.
- Non-goals, execution boundary, decision boundary, and claim boundary are explicit.
- Highest-risk covered dimension would not change implementation or validation if restated.

For non-trivial implementation, repair, refactor, hardening, or cross-file behavior changes:
- Prefer independent review when available.
- Pass raw artifacts and user request, not your intended answer.
- Fix accepted findings.
- Record review results in the task artifacts or checkpoint.

Present this summary before asking for approval:

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
- On approval: set `Contract status: accepted`; hand off to `executor` skill.
- On rejection: keep `Contract status: draft`.
- On refine: keep `Contract status: draft`; return to `Clarification`.
