---
name: goal-contract
description: "Convert ambiguous engineering, debugging, design, or artifact requests into a minimal Goal Contract: reference state, scope, non-goals, decision boundaries, acceptance evidence, and implementation authorization."
---

# Goal Contract

Define the setpoint before control action. Ask only for user-owned decisions; inspect discoverable facts first.

## Resources

Load only when useful: `references/ambiguity-scoring.md`, `references/indicator-handoff.md`, `references/goal-contract-schema.md`. Include an artifact path for durable contracts.

## When to ask

Ask if the missing answer changes target, scope, non-goals, acceptance, risk acceptance, external side effects, credentials, deployment, push/PR authority, or final claim. Do not ask for facts safely discoverable in the repo.

## Build the contract

1. Restate desired outcome as `Reference state`.
2. Separate included scope from explicit non-goals.
3. Record constraints: repo rules, time, compatibility, safety, style, approval limits.
4. Identify decision boundaries: agent-owned, user-owned, external-owner.
5. Define acceptance evidence: commands, tests, files, runtime proof, review evidence, or manual inspection.
6. Define claim boundary: the strongest final statement evidence may support.
7. For qualitative goals, create an `Indicator Handoff` with operational definition, sensor/evidence source, threshold/tolerance, timing, and route trigger.
8. Authorize next stage only when mutation/probe scope is clear.

## Output

Persist to `.alpha-goal/context/YYYYMMDD-<slug>.md` when work spans turns/agents or has material risk; otherwise a chat contract is enough.

```markdown
Goal Contract:
- Reference state:
- In scope:
- Non-goals:
- Constraints:
- Decision boundaries:
- Acceptance evidence:
- Claim boundary:
- Indicator Handoff:
- Authorization:
- Next route:
```

TUI summary:

```markdown
Contract Summary

| Field | Value |
| --- | --- |
| Reference | |
| Scope | |
| Evidence | |
| Boundary | |
| Next | |
```

Route to `system-model` if safe execution depends on unknown plant/sensor/actuator/coupling facts. Route to `decision-synthesis` if stakeholder values or indicator choices conflict.
