---
name: decision-synthesis
description: "Synthesize complex engineering or socio-technical decisions before a Goal Contract: combine qualitative judgment, quantitative evidence, stakeholder constraints, models, contradictions, and user-owned decisions."
---

# Decision Synthesis

Use when the problem is not only implementation: goals, indicators, owners, risks, or values conflict.

## Resources

Load only when useful: `references/complexity-triage.md`, `references/stakeholder-decision-boundaries.md`, `references/synthesis-round.md`, `references/synthesis-record-schema.md`.

## Triage

- Simple: clear goal and evidence -> `goal-contract`.
- Complicated: many parts but stable objective -> `system-model` then `goal-contract`.
- Complex: feedback, uncertainty, stakeholders, or tradeoffs dominate -> run synthesis rounds.
- Complex-giant-like: multiple organizations/controllers, weak sensors, high coupling, high consequence -> synthesize conservatively and expose user-owned choices.

## Synthesis round

```markdown
Synthesis Round:
- Question:
- Human/expert judgments:
- Machine evidence and models:
- Quantitative indicators:
- Qualitative judgments:
- Quantitative signals:
- Qualitative constraints:
- Conflict or contradiction:
- User-owned decision:
- Next hypothesis to verify:
- Indicator handoff candidate:
```

Distinguish recommendation from decision. The agent may analyze options and propose indicators; the user owns priority/value/risk-acceptance choices, external commitments, credentials, deployment, and irreversible side effects.

## Output

Persist `.alpha-goal/synthesis/YYYYMMDD-<slug>.md` for multi-round or handoff work.

```markdown
Decision Synthesis Record:
- Situation:
- Options:
- Evidence:
- Tradeoffs:
- User-owned decisions:
- Recommended route:
- Indicator Handoff:
```

TUI summary:

```markdown
Synthesis Summary

| Field | Value |
| --- | --- |
| Question | |
| Tension | |
| Indicators | |
| Decision | |
| Route | |
```

Route to `goal-contract` when reference and indicators are stable; to `system-model` when plant/coupling needs mapping; to blocker/user when a user-owned decision is unresolved.
