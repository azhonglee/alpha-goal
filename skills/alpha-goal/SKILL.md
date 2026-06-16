---
name: alpha-goal
description: "Default entry for closed-loop engineering work: frame the goal, model the system, synthesize complex decisions, route to bounded execution or evidence verification, and maintain minimal ledger state. Use when the next safe step is unclear or the task needs planning, audit, design, debugging, implementation routing, or readiness judgment."
---

# Alpha Goal

Act as the front-end controller. Do not mutate files or make final claims. Reduce uncertainty until the next safe controller is obvious. Output follows conversation/repo language; keep schema labels stable.

## Kernel

- Discovery interview: preflight context, inspect safely discoverable facts, pressure-test assumptions, then ask one high-leverage human question only for confirmation or user-owned decisions.
- Reference: desired state, scope, non-goals, acceptance evidence, claim boundary.
- Plant/model: system boundary, state variables, sensors, actuators, ownership, coupling.
- Synthesis: qualitative judgment + quantitative signals + user-owned decisions for complex work.
- Actuator: `control-loop` only, after explicit mutation/probe authority and actuator boundary.
- Comparator: `evidence-verify` for final/ready/safe/complete/repair claims.
- Memory: chat for one-turn low-risk read-only work; durable `.alpha-goal/` ledger for handoff, mutation, risk, or claims.

## Resources

Do not load references by default. Use them only when the compact rules below are insufficient:

- `references/contract-and-model.md`: target/evidence/authority or plant/sensor/actuator/ownership/coupling remains unclear after fact discovery.
- `references/synthesis.md`: stakeholder/value/indicator conflict, high coupling, high consequence, or complex-giant-like work.

## Process

```text
Discover facts -> Frame -> Model -> Synthesize if needed -> Route -> Ledger handoff
```

1. For vague, overloaded, or brownfield requests, run Discovery Interview before planning: inspect applicable rules/docs/code/contracts/context; record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps.
2. Treat repo language as evidence, not authority. Cross-check user claims against discoverable code/docs; if sources conflict, name the conflict in the next confirmation question.
3. Classify each gap as `[from-code][auto-confirmed]` descriptive fact, `[from-code]` inferred fact needing confirmation, `[from-research]` external fact, or `[from-user]` human decision. Do not ask for discoverable facts until inspected.
4. Ask at most one high-leverage question per round, targeting the weakest readiness gate. Prefer intent/boundaries before implementation detail. Use `request_user_input` when available; otherwise ask plainly.
5. Pressure-test answers before crystallizing: ask for an example, expose an assumption, force a tradeoff, or use one boundary-stressing scenario when behavior/handoff edges are unclear.
6. Do not route to execution until intent, outcome, scope, non-goals, acceptance evidence, decision boundaries, claim boundary, and authority are explicit enough to observe error.
7. If target/scope/evidence/claim/authority remains unclear, frame it with a Goal Contract.
8. If plant/sensor/actuator/ownership/coupling remains unclear, produce a Control Model before execution.
9. If qualitative, value-laden, multi-party, or weakly quantified objectives exist, synthesize and create Indicator Handoff before action/claims.
10. If user-owned decisions, credentials, permissions, external side effects, public claims, or irreversible commitments are unresolved, ask/block.
11. If explicit bounded action authority exists and material ambiguity is resolved, route to `control-loop`; `alpha-goal` may record authority but never creates it.
12. If work appears done or any final/ready/safe/complete/repair claim is needed, route to `evidence-verify`.

## Stability gates

Before execution-capable routing, verify:

- preflight context intake inspected relevant local facts before asking, or the missing observer is named;
- repo/doc/code terminology conflicts are surfaced, not silently resolved;
- facts vs judgments are labeled and remaining ambiguities are confirmation needs or user-owned decisions;
- at least one pressure pass occurred for non-trivial ambiguous work, or the reason it was unnecessary is recorded;
- reference state is explicit enough to observe error;
- actuator boundary says what may and may not change;
- mutation/probe authority comes from explicit user/repo instruction, not an agent-written contract;
- sensor evidence exists or the missing observer is named;
- strongest disturbance has sensor, containment, and route trigger;
- user-owned decisions and blocked downstream actions are recorded;
- final claims will be compared by `evidence-verify`, not asserted here.

## Ledger

Use `.alpha-goal/control-state/latest.md` when durable handoff is required. Before writing `.alpha-goal/`, ensure it is ignored; add `.alpha-goal/` to repo root `.gitignore` only as a process-artifact setup mutation.

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
