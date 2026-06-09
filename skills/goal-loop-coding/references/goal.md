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
  assumptions:
  risks:
  acceptance:
  evidence_plan:
  status:
```

## Rules

- Describe outcomes, not preferred implementations.
- Make every success criterion observable.
- Include non-goals to prevent scope drift.
- Treat unknowns as assumptions or risks, not facts.
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

## Exit Criteria

Leave Goal only when:

- intent is clear enough to act on
- success criteria are testable
- constraints and non-goals are explicit
- acceptance evidence is defined
- the next loop mode and objective are selected

If these are not true, set goal status to `draft`, select a `discovery` loop to resolve the missing Goal fields, and do not begin implementation until Goal reaches `discovered`.
