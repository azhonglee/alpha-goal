---
name: system-model
description: "Build a control-system model before engineering action: controlled object, state variables, observability, controllability, actuators, disturbances, coupling, controller hierarchy, and evidence sensors. Use for architecture, debugging, brownfield, or complex-system uncertainty."
---

# System Model

Use this skill when safe execution depends on understanding the system boundary and feedback signals. It is read-only unless the user explicitly asks for a modeling artifact and artifact creation is safe.

## When to use

Use `system-model` when any of these are true:

- the target repo/module/service/document/data flow is unclear;
- symptoms are reported but the failing entity, interface, or state transition is uncertain;
- multiple modules, repos, submodules, generated outputs, teams, or agents could be coupled;
- observability is weak: logs, tests, probes, or feedback signals are missing or stale;
- controllability is weak: it is unclear what variables may be changed safely;
- the work is architectural, migratory, integration-heavy, production-facing, or high blast-radius;
- `goal-contract` cannot produce a reliable Goal Contract without a plant model.

## Boundaries

- Do not mutate implementation files, repair data, push, deploy, or claim completion.
- Do not decide user-owned goals, risk acceptance, or business tradeoffs.
- Do not over-model simple low-risk work where target, scope, evidence, and ownership are already clear.
- Label observed facts, inferred structure, assumptions, and missing sensors separately.
- If a Closed-loop Ledger exists, read its `Latest Control Route` from `.alpha-goal/control-state/` before modeling and update only model-relevant state: plant boundary, state variables, sensors, actuators, disturbances, coupling, and model adequacy.

## Load resources when needed

- `references/control-model-schema.md`: produce a durable or handoff-ready Control Model.
- `references/observability-controllability-check.md`: rate sensor and actuator adequacy.
- `references/disturbance-register.md`: record disturbance likelihood, impact, sensor, containment, and route trigger.
- `references/controller-hierarchy.md`: map global/local controllers, coupling variables, arbitration, and escalation.

## Process

```text
Set boundary -> Identify state and signals -> Check observability/controllability -> Map coupling/disturbance -> Judge model adequacy -> Route
```

### 1. Set boundary

Define the system of interest:

- controlled object / plant;
- external actors and environment;
- interfaces crossing the boundary;
- ownership boundary: repo, worktree, submodule, team, data owner, or product surface;
- controller hierarchy: global controller, local controllers, coordination boundary, or none material;
- time boundary: current behavior, migration phase, release window, incident window, or historical state.

If a ledger exists, compare its latest route, plant/current-state assumptions, and next action to observed facts. Mark stale assumptions before routing back to `goal-contract`, `alpha-goal`, or `control-loop`.

If a repository is available and read-only inspection is safe, use `npx --yes tsx scripts/repo-sensor-snapshot.ts` or equivalent manual checks to gather structure, status, and local rules.

### 2. Identify state and signals

Map:

- state variables: data shape, configuration, branch, version, lifecycle phase, runtime status, user-visible behavior, evidence coverage;
- inputs: user actions, API calls, jobs, events, prompts, configuration, dependencies, data feeds;
- outputs: UI behavior, responses, files, metrics, logs, tests, artifacts, reports;
- sensors: tests, logs, static analysis, diffs, runtime probes, examples, screenshots, user feedback, review comments;
- actuators: code edits, config changes, migrations, prompts, scripts, documentation, process changes, test changes;
- indicator handoff: metrics/proxies, operational definitions, thresholds/tolerances, and evidence boundaries from `goal-contract` or `decision-synthesis`;
- disturbances: flaky dependencies, dirty working tree, clock/time zone, environment drift, missing credentials, concurrent edits, ambiguous specs.

### 3. Check observability

Ask:

- What evidence can distinguish success from failure?
- What evidence can distinguish competing root-cause hypotheses?
- Which signals are fresh final-state evidence versus advisory or stale evidence?
- What boundary does each signal actually cross: helper, module, service, user-visible, production?
- Which missing signal blocks a claim or requires a narrowed claim?

Classify sensor quality:

```text
Sensor quality: strong | adequate | weak | blocked
Reason:
Freshness:
Boundary crossed:
Claim supported:
```

### 4. Check controllability

Ask:

- Which variables may the agent control without further permission?
- Which variables require user approval, credentials, external tools, deployment, data repair, or production access?
- Can the desired state be reached through small reversible control actions?
- Are there coupled outputs where changing one variable destabilizes another?
- Is a diagnostic probe safer than a repair action?
- What sensor threshold would show that a candidate control action reduced the target error?

Classify control quality:

```text
Control quality: strong | adequate | weak | blocked
Allowed actuators:
Forbidden actuators:
User-owned decisions:
```

### 5. Map coupling and disturbances

Create a clearly labeled Controller Hierarchy / Coordination Map when multiple local controllers can affect the same global objective. Load `references/controller-hierarchy.md` when controller ownership, arbitration, or escalation is unclear.

```text
Controller Hierarchy:
- Global controller:
- Local controller:
- Coupling variables:
- Arbitration rule:
- Escalation trigger:
- Recommended coordination route:
```

Do not collapse material multi-controller relationships into a prose coordination section. A Control Model is incomplete if it names multiple local controllers that can affect one global objective but does not either emit a `Controller Hierarchy:` block or explicitly state `Controller hierarchy: none material`.

Create a compact coupling map. Use a matrix only when it clarifies risk.

```text
Coupling Map:
- Surface A -> Surface B:
  - Shared state/artifact:
  - Disturbance:
  - Risk:
  - Isolation strategy:
```

Create a clearly labeled Disturbance Register for material disturbances. Load `references/disturbance-register.md` when disturbance likelihood, impact, sensor, containment, or route trigger is not obvious.

```text
Disturbance Register:
- Disturbance:
  - Source:
  - Likelihood:
  - Impact:
  - Affected state/control variable:
  - Sensor:
  - Containment:
  - Route trigger:
  - Owner or decision boundary:
```

Do not collapse material disturbances into a prose risk list. A Control Model is incomplete if it names material disturbances but does not either emit a Disturbance Register or explicitly state `Disturbance register: none material`.

High-impact or unknown-impact disturbances must have a sensor, containment, and route trigger before routing to `control-loop`.

Stabilization strategies:

- isolate worktree or ownership surface;
- reduce slice size;
- add or reuse a sensor before changing behavior;
- sequence changes so one control variable moves at a time;
- monitor registered disturbance sensors and route when a trigger fires;
- return to `goal-contract` if coupling changes scope or claim boundary;
- route to `decision-synthesis` if objectives or stakeholders conflict.

### 6. Judge model adequacy

Persist the full Control Model under `.alpha-goal/models/YYYYMMDD-<slug>-system-model.md` by default and update the Closed-loop Ledger artifact registry. Show a compact Markdown-table `Model Summary` in the TUI by default. Print the full model in chat only when the user asks, file persistence is blocked, or a modeling gap requires explicit user review.

Compact model:

```text
Control Model:
- Boundary:
- State variables:
- Sensors:
- Actuators:
- Candidate control laws:
- Controller hierarchy:
- Disturbance register:
- Coupling map:
- Observability:
- Controllability:
- Model adequacy:
- Ledger update:
- Recommended route:
```

TUI summary:

```markdown
Model Summary

| Field | Value |
| --- | --- |
| Boundary | |
| Observability | |
| Controllability | |
| Artifact | |
| Recommended route | |
```

Full model:

```text
Control Model:
- System boundary:
- Controlled object / plant:
- Environment and external actors:
- Interfaces:
- State variables:
- Inputs:
- Outputs:
- Sensors and evidence boundary:
- Actuators and authority boundary:
- Indicator handoff to sensors:
- Candidate control laws:
  - Target error:
  - Control variable:
  - Candidate action or probe:
  - Sensor and threshold:
  - Risk/fallback:
- Disturbance register:
  - Disturbance:
  - Likelihood/impact:
  - Sensor:
  - Containment:
  - Route trigger:
- Coupling map:
- Controller hierarchy:
  - Global objective:
  - Local controllers:
  - Coupling variables:
  - Arbitration/escalation:
- Stability conditions:
- Missing information:
- Model adequacy: sufficient | sufficient with narrowed claim | insufficient | blocked
- Ledger update: `.alpha-goal/control-state/YYYYMMDD-<slug>.md` path, artifact path, model changes, residual model uncertainty, next route, or explicit no-write reason
- Recommended route: goal-contract | control-loop | evidence-verify | decision-synthesis | blocker
```

Route to `goal-contract` when the model is sufficient to write or revise a Goal Contract. Route to `control-loop` only when an approved Goal Contract already exists and this model merely informs the next bounded slice. Route to `evidence-verify` only when comparing evidence to a claim is the next action.
