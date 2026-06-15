---
name: system-model
description: "Build a control-system model before engineering action: controlled object, state variables, observability, controllability, actuators, disturbances, coupling, and evidence sensors. Use for architecture, debugging, brownfield, or complex-system uncertainty."
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
- `alpha-goal` cannot produce a reliable Goal Contract without a plant model.

## Boundaries

- Do not mutate implementation files, repair data, push, deploy, or claim completion.
- Do not decide user-owned goals, risk acceptance, or business tradeoffs.
- Do not over-model simple low-risk work where target, scope, evidence, and ownership are already clear.
- Label observed facts, inferred structure, assumptions, and missing sensors separately.
- If a Closed-loop Ledger exists, update only model-relevant state: plant boundary, state variables, sensors, actuators, disturbances, coupling, and model adequacy.

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
- time boundary: current behavior, migration phase, release window, incident window, or historical state.

If a ledger exists, compare its plant/current-state assumptions to observed facts. Mark stale assumptions before routing back to `alpha-goal` or `loop`.

If a repository is available and read-only inspection is safe, use `scripts/repo-sensor-snapshot.sh` or equivalent manual checks to gather structure, status, and local rules.

### 2. Identify state and signals

Map:

- state variables: data shape, configuration, branch, version, lifecycle phase, runtime status, user-visible behavior, evidence coverage;
- inputs: user actions, API calls, jobs, events, prompts, configuration, dependencies, data feeds;
- outputs: UI behavior, responses, files, metrics, logs, tests, artifacts, reports;
- sensors: tests, logs, static analysis, diffs, runtime probes, examples, screenshots, user feedback, review comments;
- actuators: code edits, config changes, migrations, prompts, scripts, documentation, process changes, test changes;
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

Create a compact coupling map. Use a matrix only when it clarifies risk.

```text
Coupling Map:
- Surface A -> Surface B:
  - Shared state/artifact:
  - Disturbance:
  - Risk:
  - Isolation strategy:
```

Stabilization strategies:

- isolate worktree or ownership surface;
- reduce slice size;
- add or reuse a sensor before changing behavior;
- sequence changes so one control variable moves at a time;
- return to `alpha-goal` if coupling changes scope or claim boundary;
- route to `meta-synthesis` if objectives or stakeholders conflict.

### 6. Judge model adequacy

Output either a compact or full Control Model.

Compact model:

```text
Control Model:
- Boundary:
- State variables:
- Sensors:
- Actuators:
- Candidate control laws:
- Disturbances/couplings:
- Observability:
- Controllability:
- Model adequacy:
- Ledger update:
- Recommended route:
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
- Candidate control laws:
  - Target error:
  - Control variable:
  - Candidate action or probe:
  - Sensor and threshold:
  - Risk/fallback:
- Disturbances:
- Coupling map:
- Stability conditions:
- Missing information:
- Model adequacy: sufficient | sufficient with narrowed claim | insufficient | blocked
- Ledger update: path or chat-only state, model changes, residual model uncertainty, next route
- Recommended route: alpha-goal | loop | verify | meta-synthesis | blocker
```

Route to `alpha-goal` when the model is sufficient to write or revise a Goal Contract. Route to `loop` only when an approved Goal Contract already exists and this model merely informs the next bounded slice. Route to `verify` only when comparing evidence to a claim is the next action.
