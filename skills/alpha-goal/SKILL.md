---
name: alpha-goal
description: "Route engineering, debugging, design, and verification through the minimal closed-loop skill suite. Use when the next control boundary is unclear, or for engineering/design/debug/verification work needing goal-contract, system-model, control-loop, evidence-verify, or decision-synthesis."
---

# Alpha Goal

Route the task as a cybernetic loop. Keep only the information needed to reduce error.

## Kernel

- Reference: desired state, scope, non-goals, acceptance evidence, claim boundary.
- Plant: repository/system/workflow being changed.
- State: known facts, residual error, risks, blockers.
- Sensor: tests, diffs, logs, probes, review, user evidence.
- Actuator: bounded edits/probes by `control-loop`.
- Comparator: `evidence-verify` judges claims against evidence.
- Memory: lightweight ledger in chat or `.alpha-goal/` when durable handoff is useful.
- Disturbance: changed requirements, dirty tree, missing tools, hidden owners, flaky sensors.

## Resources

Load only when needed: `references/cybernetic-routing.md`, `references/closed-loop-ledger.md`. The durable memory is the Closed-loop Ledger under `.alpha-goal/control-state`; route fields include Control Law, Indicator Handoff, Adaptive Learning, Controller Hierarchy, Disturbance Register, Error signal, and Selected skill.

## Routing

1. If reference/scope/acceptance/authority is unclear -> `goal-contract`.
2. If plant boundary, sensors, actuators, coupling, or disturbances are unclear -> `system-model`.
3. If many stakeholders, weak indicators, conflicting values, or strategic tradeoffs dominate -> `decision-synthesis`.
4. If an approved reference exists and a safe bounded action can reduce error -> `control-loop`.
5. If work appears done or any completion/ready/safe claim is needed -> `evidence-verify`.
6. If a user-owned decision, credential, permission, environment, or external side effect is missing -> ask or block; do not invent authority.

Respect an explicitly named skill when safe, but state any missing gate.

## Stability gates

Before execution-capable routing, verify:

- reference state is explicit enough to observe error;
- actuator boundary says what may and may not change;
- sensor evidence exists or the missing observer is named;
- strongest disturbance has sensor, containment, and route trigger;
- final claims will be compared by `evidence-verify`, not asserted by the executor.

## Ledger

Use the smallest durable record that helps continuity. Before writing `.alpha-goal/`, ensure it is ignored; add `.alpha-goal/` to repo root `.gitignore` only as a process-artifact setup mutation. For simple one-turn work, chat state plus git/test evidence is enough.

Minimal ledger fields:

```text
Latest Control Route:
- Reference:
- Current state:
- Error signal:
- Selected skill:
- Boundary:
- Disturbance:
- Next action:
```

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
