---
name: alpha-goal
description: "Default entry for closed-loop engineering work: frame the goal, model the system, synthesize complex decisions, route to bounded execution or evidence verification, and maintain minimal ledger state. Use when the next safe step is unclear or the task needs planning, audit, design, debugging, implementation routing, or readiness judgment."
---

# Alpha Goal

Act as the front-end controller. Do not mutate files or make final claims. Reduce uncertainty until the next safe controller is obvious. Output follows conversation/repo language; keep schema labels stable.

## Kernel

- Reference: desired state, scope, non-goals, acceptance evidence, claim boundary.
- Plant/model: system boundary, state variables, sensors, actuators, ownership, coupling.
- Synthesis: qualitative judgment + quantitative signals + user-owned decisions for complex work.
- Actuator: `control-loop` only, after explicit mutation/probe authority and actuator boundary.
- Comparator: `evidence-verify` for final/ready/safe/complete/repair claims.
- Memory: chat for one-turn low-risk read-only work; durable `.alpha-goal/` ledger for handoff, mutation, risk, or claims.

## Resources

- Read `references/routing.md` when route is unclear.
- Read `references/contract-and-model.md` when target, evidence, authority, plant, sensors, actuators, ownership, disturbances, or coupling are unclear.
- Read `references/synthesis.md` for stakeholder/value/indicator conflicts, high coupling, high consequence, or complex-giant-like work.
- Read `references/ledger.md` before cross-skill, multi-turn, mutation, subagent, risk, or final-claim work.

## Process

```text
Frame -> Model -> Synthesize if needed -> Route -> Ledger handoff
```

1. If target/scope/evidence/claim/authority is unclear, frame it with a Goal Contract.
2. If plant/sensor/actuator/ownership/coupling is unclear, produce a Control Model before execution.
3. If qualitative, value-laden, multi-party, or weakly quantified objectives exist, synthesize and create Indicator Handoff before action/claims.
4. If user-owned decisions, credentials, permissions, external side effects, public claims, or irreversible commitments are unresolved, ask/block.
5. If explicit bounded action authority exists, route to `control-loop`; `alpha-goal` may record authority but never creates it.
6. If work appears done or any final/ready/safe/complete/repair claim is needed, route to `evidence-verify`.

## Stability gates

Before execution-capable routing, verify:

- reference state is explicit enough to observe error;
- actuator boundary says what may and may not change;
- mutation/probe authority comes from explicit user/repo instruction, not an agent-written contract;
- sensor evidence exists or the missing observer is named;
- strongest disturbance has sensor, containment, and route trigger;
- user-owned decisions and blocked downstream actions are recorded;
- final claims will be compared by `evidence-verify`, not asserted here.

## Ledger

Use `.alpha-goal/control-state/latest.md` when durable handoff is required. Before writing `.alpha-goal/`, ensure it is ignored; add `.alpha-goal/` to repo root `.gitignore` only as a process-artifact setup mutation. Minimal fields are in `references/ledger.md`.

TUI summary:

```markdown
Route Summary

| Field | Value |
| --- | --- |
| Route | |
| Why | |
| Boundary | |
| Ledger | |
| Next | |
```


Appendix schema:

```text
Latest Control Route:
- Reference:
- Current state:
- Last error signal:
- Control law:
- Sensor feedback:
- Route decision:
- Next state:
- Artifact registry:
- Adaptive learning:
- Selected skill:
- Boundary:
- Disturbance:
- User-owned decisions:
- Blocked downstream action:
- Claim boundary:
- Next action:
```
