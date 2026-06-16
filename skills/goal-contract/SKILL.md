---
name: goal-contract
description: "Convert ambiguous engineering, debugging, design, or artifact requests into a minimal Goal Contract: reference state, scope, non-goals, decision boundaries, acceptance evidence, and implementation authorization."
---

# Goal Contract

Define the setpoint before control action. Ask only for user-owned decisions; inspect discoverable facts first. For read-only audit/advice requests, return findings within the no-mutation boundary; do not require mutation authorization or persisted artifacts unless requested.

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
8. Record whether user/repo authority exists for the next stage. Clear scope is necessary but not sufficient; if mutation/probe authority is missing, route to user/blocker.

## Output

Persist to `.alpha-goal/context/YYYYMMDD-<slug>.md` when work spans turns/agents or has material risk; otherwise a chat contract is enough. A chat contract may be non-durable, but it must still contain all required fields before mutation authorization. If the user forbids file writes, keep artifacts in chat.

```markdown
Goal Contract:
- Reference state:
- In scope:
- Non-goals:
- Constraints:
- Decision boundaries:
- Unresolved user-owned decisions: none / ...
- Blocked downstream action: none / ...
- Acceptance evidence:
- Claim boundary:
- Indicator Handoff:
- Authorization:
- Next route: ask/blocker if unresolved user-owned decisions or blocked downstream action is not none
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
