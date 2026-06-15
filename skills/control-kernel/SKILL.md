---
name: control-kernel
description: "Route engineering, debugging, design, and verification work through the closed-loop control skill suite: alpha-goal, system-model, loop, verify, and meta-synthesis. Use when the next skill or control boundary is unclear."
---

# Control Kernel

Use this skill to select and stabilize the next action in the skill suite. It is a router and control governor, not an implementation skill.

## Cybernetic frame

Treat the user request as a control problem:

- `reference`: desired outcome, acceptance criteria, and final claim boundary;
- `plant`: repository, product, data flow, document system, workflow, or organization being changed;
- `state`: what is currently known about goal, scope, implementation, evidence, risk, and blockers;
- `observer`: tests, logs, diffs, runtime probes, user feedback, reviewer feedback, and read-only repository facts;
- `actuator`: bounded changes made by `loop` under an approved Goal Contract;
- `comparator`: `verify`, which compares fresh evidence against the reference and claim boundary;
- `memory`: a Closed-loop Ledger that carries reference, current state, error, control action, feedback, and route history across skills;
- `disturbance`: changing requirements, dirty working tree, missing tools, flaky tests, conflicting specs, hidden ownership, broad claims, or external side effects.

## Boundaries

- Do not mutate implementation files, deploy, push, open PRs/MRs, repair data, or claim completion.
- Do not bypass `alpha-goal` when the desired reference state is ambiguous.
- Do not bypass `system-model` when observability, controllability, ownership, or coupling is unclear enough to affect safe action.
- Do not bypass `verify` when making a completion, correctness, readiness, merge, ship, or safety claim.
- Keep routing proportional: choose the smallest next skill that reduces material uncertainty.
- Do not write `.alpha-goal/` artifacts unless `.alpha-goal/` is ignored or the user explicitly approved the process-artifact path.

## Load resources when needed

- `references/cybernetic-routing.md`: route selection and stability failure patterns.
- `references/closed-loop-ledger.md`: cross-stage state memory schema and update rules.

## Process

```text
Classify state -> Select next skill -> Check stability gates -> Emit route card
```

### 1. Classify state

Identify the current dominant uncertainty. If a Closed-loop Ledger exists, read its latest reference, current state, residual error, and route decision before classifying:

- unclear target, intent, scope, non-goals, acceptance, or authorization -> goal ambiguity;
- unclear plant boundary, state variables, observability, controllability, disturbances, or coupling -> model ambiguity;
- approved goal exists and a bounded action can improve evidence or implementation -> execution need;
- work appears done but claim/evidence boundary is unresolved -> verification need;
- many stakeholders, weak quantification, conflicting values, or complex giant-system behavior -> synthesis need;
- missing tool, permission, data, environment, or user-owned decision -> blocker.

If no ledger exists and the task is likely to span multiple skills, initialize one in chat or at `.alpha-goal/control-state/YYYYMMDD-<slug>.md` after the artifact safety gate.

### 2. Select next skill

Use this routing table:

| Current state | Next skill | Reason |
| --- | --- | --- |
| User asks for implementation but goal boundary is unclear | `alpha-goal` | define reference/setpoint before control action |
| Goal is broad and system structure is unclear | `system-model` then `alpha-goal` | model the plant before writing the contract |
| Active approved Goal Contract exists and mutation/probe is needed | `loop` | execute one bounded control action and collect feedback |
| Evidence bundle exists and a final claim is proposed | `verify` | compare output state to reference and claim boundary |
| Problem is socio-technical, strategic, multi-agent, or complex giant-system-like | `meta-synthesis` | synthesize qualitative and quantitative views before contract |
| Required user-owned decision or external permission is missing | user clarification / blocker | do not invent authority |

### 3. Check stability gates

Before routing to an execution-capable path, ensure:

- the reference state is explicit enough to detect error;
- the actuator boundary says what may change and what must not change;
- observer signals are available or a missing-observer blocker is stated;
- disturbances and couplings are either bounded or routed to modeling/synthesis;
- the ledger or chat state records the last error signal and why the selected next skill reduces it;
- final claims will be checked by `verify` rather than stated by the executor.

### 4. Emit route card

Output a compact card:

```text
Control Route:
- Ledger:
- Active state:
- Dominant uncertainty:
- Error signal:
- Selected skill:
- Why this skill:
- Required context to load or ask for:
- Safety boundary:
- Next action:
```

If the user explicitly named a skill and the route is safe, respect that selection and state any residual gates.
