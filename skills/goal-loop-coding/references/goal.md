# Goal Stage

## Purpose

Define the source of truth before any loop or implementation work begins.

Goal answers:

- What does success mean?
- What would prove failure?
- What constraints and non-goals bound the work?

## Required Output

Create or update this goal model:

```yaml
goal:
  intent:
  success_criteria:
  constraints:
  non_goals:
  decision_boundaries:
  assumptions:
  risks:
  acceptance:
  evidence_plan:
  status:
  history:
  last_updated:
```

## Rules

- Describe outcomes, not preferred implementations.
- Make every success criterion observable.
- Include non-goals to prevent scope drift.
- Define decision boundaries: what Codex may decide independently and what needs user confirmation.
- Treat unknowns as assumptions or risks, not facts.
- When intent, success criteria, constraints, non-goals, decision boundaries, or acceptance are unclear, ask targeted user questions before implementation.
- Define acceptance before editing code.
- Select the first loop target before leaving Goal.

Bad goal:

```yaml
intent: Add Redis caching.
```

Good goal:

```yaml
intent: Reduce repeated request latency below the accepted threshold without changing public API behavior.
success_criteria:
  - repeated requests complete under the agreed threshold
  - existing API responses remain backward compatible
acceptance:
  - relevant automated tests pass
  - latency evidence is captured from a representative run
```

## Status Values

Use one status:

- `draft`: request is understood only roughly
- `discovered`: success criteria and constraints are testable enough to start
- `approved`: goal definition is accepted or clear enough to execute
- `executing`: loops are producing evidence
- `adjusted`: evidence changed assumptions, risks, constraints, or success criteria
- `completed`: acceptance is satisfied by direct evidence

## Refinement Rules

Evidence may freely update:

- assumptions
- risks
- constraints

Evidence may carefully update:

- success criteria
- acceptance

Do not change intent or non-goals without explicit justification. If intent changes materially, treat it as a new goal version.

## Goal Quality Checklist

Before implementation loops begin, verify:

- success is measurable and testable
- failure is identifiable
- constraints are explicit
- non-goals prevent scope creep
- decision boundaries are explicit
- acceptance criteria are defined
- another engineer can understand the goal without implementation details

## Socratic Interview Gate

Use an `interview` loop when the request is broad, ambiguous, or missing acceptance criteria. The interview is part of Goal discovery, not a separate skill.

Rules:

- Ask one question per round.
- Ask about intent, outcome, scope, non-goals, and decision boundaries before implementation detail.
- For brownfield work, inspect available code or docs first and ask evidence-backed confirmation questions.
- Do not ask the user for facts that can be discovered directly from the repository.
- After each answer, pressure-test the strongest claim before moving on.
- Continue interviewing while non-goals or decision boundaries remain unclear.

Pressure ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the hidden assumption that makes the answer true.
3. Force a boundary or tradeoff: what should be rejected, deferred, or escalated?
4. If the answer describes symptoms, reframe toward root cause or desired end state.

Readiness:

- Track each Goal field as `clear`, `partial`, or `missing`: intent, outcome, scope, constraints, success criteria, non-goals, decision boundaries, and brownfield context when relevant.
- Stop interviewing when intent, outcome, scope, constraints, success criteria, non-goals, and decision boundaries are clear enough to execute.
- If the user asks to proceed while ambiguity remains, record the residual risk in assumptions or risks.

## Goal Update Format

When evidence changes the goal, record the change:

```yaml
goal_update:
  changed:
  reason:
  evidence:
```

Use `history` for meaningful goal changes and `last_updated` when tracking a durable goal artifact.

## Spec And Plan Templates

Use `spec-template.md` when the Goal needs a durable requirements artifact, especially after an `interview` loop, before external handoff, or before stakeholder review. The mandatory completion review does not by itself require a spec file.

Use `plan-template.md` when the work needs an explicit execution strategy across modules, agents, risky migrations, architecture decisions, or repository/worktree/submodule boundaries.

If file modification is disallowed, draft the needed spec or plan in the conversation only and state that no artifact file was written.

Do not create these artifacts for small tasks unless the user asks for them.

Iterate until completion review can cite direct evidence that the relevant Goal, spec, or plan fields are satisfied.

## Exit Criteria

Leave Goal only when:

- intent is clear enough to act on
- success criteria are testable
- constraints and non-goals are explicit
- acceptance evidence is defined
- the next loop mode and objective are selected

If these are not true, set goal status to `draft`, select an `interview` and/or `discovery` loop to resolve the missing Goal fields, and do not begin implementation until Goal reaches `discovered`.
