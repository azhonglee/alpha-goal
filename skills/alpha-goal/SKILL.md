---
name: alpha-goal
description: "Route engineering, debugging, design, and verification work through the closed-loop control skill suite: goal-contract, system-model, control-loop, evidence-verify, and decision-synthesis. Use when the next skill or control boundary is unclear."
---

# Alpha Goal

Use this skill to select and stabilize the next action in the skill suite. It is a router and control governor, not an implementation skill.

## Cybernetic frame

Treat the user request as a control problem:

- `reference`: desired outcome, acceptance criteria, and final claim boundary;
- `plant`: repository, product, data flow, document system, workflow, or organization being changed;
- `state`: what is currently known about goal, scope, implementation, evidence, risk, and blockers;
- `observer`: tests, logs, diffs, runtime probes, user feedback, reviewer feedback, and read-only repository facts;
- `actuator`: bounded changes made by `control-loop` under an approved Goal Contract;
- `comparator`: `evidence-verify`, which compares fresh evidence against the reference and claim boundary;
- `memory`: a Closed-loop Ledger that carries reference, current state, error, control action, feedback, and route history across skills;
- `adaptation`: Adaptive Learning Records that correct reusable control assumptions without silently changing scope or authority;
- `disturbance`: changing requirements, dirty working tree, missing tools, flaky tests, conflicting specs, hidden ownership, broad claims, or external side effects, tracked through a Disturbance Register when material.

## Boundaries

- Do not mutate implementation files, deploy, push, open PRs/MRs, repair data, or claim completion.
- Do not bypass `goal-contract` when the desired reference state is ambiguous.
- Do not bypass `system-model` when observability, controllability, ownership, or coupling is unclear enough to affect safe action.
- Do not bypass `evidence-verify` when making a completion, correctness, readiness, merge, ship, or safety claim.
- Keep routing proportional: choose the smallest next skill that reduces material uncertainty.
- Default to durable process memory under `.alpha-goal/`. Before the first write in a repository, ensure `.alpha-goal/` is ignored; if it is missing from the repo root `.gitignore`, add `.alpha-goal/` there before writing ledger artifacts.
- Use chat-only ledger state only when the user explicitly forbids file writes, no repository path exists, or `.gitignore` cannot be updated safely.

## Load resources when needed

- `references/cybernetic-routing.md`: route selection and stability failure patterns.
- `references/closed-loop-ledger.md`: cross-stage state memory schema and update rules.

## Process

```text
Classify state -> Select next skill -> Check stability gates -> Persist route card -> Show route summary
```

### 1. Classify state

Identify the current dominant uncertainty. If a Closed-loop Ledger exists, read its latest reference, current state, residual error, and route decision before classifying:

- unclear target, intent, scope, non-goals, acceptance, or authorization -> goal ambiguity;
- unclear plant boundary, state variables, observability, controllability, disturbances, or coupling -> model ambiguity;
- unclear controller hierarchy, local/global objective conflict, or coupling arbitration -> coordination ambiguity;
- approved goal exists and a bounded action can improve evidence or implementation -> execution need;
- repeated residual error, failed threshold, or contradicted control assumption -> adaptation need;
- work appears done but claim/evidence boundary is unresolved -> verification need;
- many stakeholders, weak quantification, conflicting values, or complex giant-system behavior -> synthesis need;
- missing tool, permission, data, environment, or user-owned decision -> blocker.

If no ledger exists and the task is likely to span multiple skills, initialize `.alpha-goal/control-state/YYYYMMDD-<slug>.md` after ensuring `.alpha-goal/` is ignored. Add `.alpha-goal/` to the repo root `.gitignore` first when needed.

### 2. Select next skill

Use this routing table:

| Current state | Next skill | Reason |
| --- | --- | --- |
| User asks for implementation but goal boundary is unclear | `goal-contract` | define reference/setpoint before control action |
| Goal is broad and system structure is unclear | `system-model` then `goal-contract` | model the plant before writing the contract |
| Multiple local controllers can affect one global objective | `system-model` or `decision-synthesis` | map hierarchy, coupling, arbitration, and user-owned priorities |
| Active approved Goal Contract exists and mutation/probe is needed | `control-loop` | execute one bounded control action and collect feedback |
| Evidence bundle exists and a final claim is proposed | `evidence-verify` | compare output state to reference and claim boundary |
| Problem is socio-technical, strategic, multi-agent, or complex giant-system-like | `decision-synthesis` | synthesize qualitative and quantitative views before contract |
| Required user-owned decision or external permission is missing | user clarification / blocker | do not invent authority |

### 3. Check stability gates

Before routing to an execution-capable path, ensure:

- the reference state is explicit enough to detect error;
- an execution route has a candidate Control Law: target error, control variable, expected effect, sensor threshold, fallback;
- the actuator boundary says what may change and what must not change;
- observer signals are available or a missing-observer blocker is stated;
- qualitative objectives have accepted indicators or explicitly missing sensors before execution claims depend on them;
- material disturbances are registered with likelihood, impact, sensor, containment, and route trigger, or routed to modeling/synthesis/user/blocker;
- prior Adaptive Learning Records are applied only when reuse conditions hold and invalidation conditions do not hold;
- the ledger records the last error signal and why the selected next skill reduces it, or chat-only state is explicitly justified by a no-write constraint;
- final claims will be checked by `evidence-verify` rather than stated by the executor.

### 4. Persist route card and show summary

Persist the full route card to the Closed-loop Ledger by default. Do not print the full card in the TUI unless the user explicitly asks for it, persistence is blocked, or the route is high-risk enough that the user must review every field before continuing.

Write or update this section in `.alpha-goal/control-state/YYYYMMDD-<slug>.md`:

```text
Latest Control Route:
Control Route:
- Ledger path:
- Active state:
- Dominant uncertainty:
- Error signal:
- Control law:
- Indicator handoff:
- Adaptive learning:
- Controller hierarchy:
- Disturbance register:
- Selected skill:
- Why this skill:
- Required context to load or ask for:
- Safety boundary:
- Next action:
```

Then show only a TUI-friendly summary as a Markdown table:

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

The summary must be enough for the user to understand the selected route without reading a long field list. Keep each table value concise; put long reasoning in the ledger artifact. Other skills must recover the full route from `.alpha-goal/control-state/` instead of relying on the TUI transcript. If writing is explicitly forbidden or impossible, include the full `Control Route` in chat and state the no-write reason in `Ledger`.

If the user explicitly named a skill and the route is safe, respect that selection and state any residual gates.
