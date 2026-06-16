---
name: alpha-goal
description: "Route engineering, debugging, design, and verification through the minimal closed-loop skill suite. Use when the next control boundary is unclear, or for engineering/design/debug/verification work needing goal-contract, system-model, control-loop, evidence-verify, or decision-synthesis."
---

# Alpha Goal

Route the task as a cybernetic loop. Keep only the information needed to reduce error. Output follows conversation/repo language; keep schema labels stable.

## Kernel

- Reference: desired state, scope, non-goals, acceptance evidence, claim boundary.
- Plant: repository/system/workflow being changed.
- State: known facts, residual error, risks, blockers.
- Sensor: tests, diffs, logs, probes, review, user evidence.
- Actuator: bounded edits/probes by `control-loop`.
- Comparator: `evidence-verify` judges claims against evidence.
- Memory: chat for one-turn low-risk read-only work; durable `.alpha-goal/` ledger for handoff, mutation, risk, or final claims.
- Disturbance: changed requirements, dirty tree, missing tools, hidden owners, flaky sensors.

## Resources

Read `references/cybernetic-routing.md` for unclear routes. Read `references/closed-loop-ledger.md` before cross-skill, multi-turn, mutation, subagent, risk, or final-claim work. The Closed-loop Ledger stable latest entry is `.alpha-goal/control-state/latest.md`; stage artifacts attach via registry.

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
- qualitative or value-laden goals have Indicator Handoff or `decision-synthesis` before execution/claims;
- strongest disturbance has sensor, containment, and route trigger;
- final claims will be compared by `evidence-verify`, not asserted by the executor.

## Ledger

Use the smallest record that preserves control state. Durable ledger is required when work crosses skills or turns, uses subagents, mutates files, has material risk, contains Indicator Handoff/Disturbance Register/Adaptive Learning/Controller Hierarchy, or supports final/ready/safe/complete/repair claims; update `.alpha-goal/control-state/latest.md` unless writes are forbidden/unavailable, then state chat-only limits. Chat-only state is acceptable only for one-turn, low-risk, read-only work with no handoff or readiness claim. Before writing `.alpha-goal/`, ensure it is ignored; add `.alpha-goal/` to repo root `.gitignore` only as a process-artifact setup mutation.

Minimal ledger fields:

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
