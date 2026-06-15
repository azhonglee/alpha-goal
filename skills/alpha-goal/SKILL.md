---
name: alpha-goal
description: "Convert ambiguous engineering, debugging, design, or artifact requests into a safe Goal Contract: reference state, scope, non-goals, decision boundaries, acceptance evidence, and implementation authorization."
---

# Alpha Goal

Use this skill to form the reference state for a controlled engineering effort. It turns intent into a Goal Contract before any mutation-capable iteration begins.

## Control interpretation

In engineering-cybernetics terms, this skill defines the setpoint and safe control boundary:

- `reference`: desired outcome and acceptance criteria;
- `error signal`: what would count as mismatch between desired and current state;
- `actuator boundary`: what `loop` may change, probe, or delegate;
- `sensor plan`: what evidence can observe success, failure, or root cause;
- `control memory`: the ledger state that preserves reference/current/error/route history across stages;
- `stability conditions`: non-goals, stop conditions, claim boundary, and reframe triggers.

## Boundaries

- Do not edit implementation files, push, open PRs/MRs, deploy, repair data, request credentials, or claim implementation completion.
- Write process artifacts only after the artifact safety gate; otherwise keep the result in chat.
- Before writing `.alpha-goal/control-state/`, confirm `.alpha-goal/` is ignored or an alternative path is explicitly approved.
- Ask only for user-owned decisions. Discover codebase or document facts yourself when safe and available.
- Goal Contract acceptance authorizes only handoff to `loop`; it does not authorize push, deployment, data repair, production actions, or external side effects.
- For diagnostics, do not assume repair authorization merely because a plausible cause exists. Define what evidence authorizes repair.
- Keep proportionality: gather only what materially changes scope, risk, authority, evidence, or next safe action.

## Load resources when needed

- `references/ambiguity-scoring.md`: score uncertainty only when it changes clarification effort or handoff safety.
- `references/indicator-handoff.md`: convert qualitative objectives or synthesis indicators into measurable evidence.
- `references/goal-contract-schema.md`: produce a durable or handoff-ready Goal Contract.

## Process

```text
Observe request -> Model uncertainty -> Clarify -> Pressure-test -> Crystallize -> Review -> Handoff
```

### 1. Observe request

Collect enough context to classify the problem:

- user intent, desired outcome, proposed solution, deadline, constraints, and non-goals;
- target repo/path/service/module/document/data/workflow and likely touchpoints;
- existing work, durable specs, incidents, logs, tickets, or prior decisions;
- Synthesis Round indicators, qualitative objectives, or metrics that must become observable evidence;
- unknowns that affect authority, scope, risk, acceptance, decision boundaries, or claim wording;
- for brownfield work, facts observed directly versus inferences.

If a Closed-loop Ledger exists, read it before changing the Goal Contract. If it conflicts with current user intent or fresh facts, label the superseded state and reframe instead of silently continuing.

If the system boundary or feedback signals are too unclear to write a reliable contract, route to `system-model` first and return with a model summary.

### 2. Model uncertainty

Score ambiguity only to guide effort, not to create ceremony. Use `low / medium / high` unless numeric scoring helps.

Clarity dimensions:

- Intent clarity: why this matters.
- Outcome clarity: what end state is wanted.
- Scope clarity: what is included and excluded.
- Constraint clarity: technical, business, safety, legal, or timing limits.
- Success clarity: how completion will be judged.
- Context clarity: brownfield facts, existing work, ownership, and environment.
- Control clarity: observability, controllability, disturbances, and claim boundary.

Numeric option:

```text
Greenfield ambiguity = 1 - (intent*0.25 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.15)
Brownfield ambiguity = 1 - (intent*0.20 + outcome*0.20 + scope*0.18 + constraints*0.14 + success*0.14 + context*0.14)
Control ambiguity = 1 - (reference*0.25 + actuator_boundary*0.20 + sensor_plan*0.20 + disturbance_bounds*0.15 + claim_boundary*0.20)
```

Default thresholds:

- `quick`: ambiguity <= 0.30 for low-risk framing.
- `standard`: ambiguity <= 0.20 for ordinary implementation handoff.
- `deep`: ambiguity <= 0.15 for broad, high-risk, multi-repo, data, security, or production-affecting work.

### 3. Clarify

Ask only when material user-owned uncertainty remains. Prefer one high-leverage question per round.

Priority order:

1. intent, outcome, scope, non-goals, and authority;
2. acceptance evidence, claim boundary, and stop conditions;
3. constraints, tradeoffs, and user-owned decisions;
4. brownfield context only when it cannot be discovered safely.

Readiness gates before handoff:

- target and desired outcome are explicit enough to detect error;
- included scope and excluded non-goals are clear;
- decision boundaries state what the agent may decide without confirmation;
- acceptance criteria and evidence expectations are testable enough for the next action;
- material qualitative goals have an Indicator Handoff with sensor, threshold or tolerance, and evidence boundary, or an explicit missing-sensor gap;
- diagnostic contracts define symptoms, observations, hypotheses, and root-cause evidence needed before repair;
- claim boundary states what final wording may and may not say;
- at least one pressure pass has checked an assumption, example, counterexample, or tradeoff for non-trivial work.

If the user stops early, either narrow the artifact, ask for explicit risk acceptance, or return a bounded unresolved-gap contract.

### 4. Pressure-test

Use lenses only when they reduce real uncertainty:

- `contrarian`: what assumption would make this goal wrong?
- `simplifier`: what is the smallest useful scope?
- `ontologist`: what entity, state, or cause is really changing?
- `evidence-checker`: how would we know the result is wrong?
- `disturbance-checker`: what external change or hidden coupling can destabilize the plan?

Follow-up ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the dependency that makes the answer true.
3. Force a tradeoff: exclude, defer, or reject something.
4. If the answer stays symptom-level, reframe toward state, boundary, or root cause.

### 5. Crystallize

Produce the lightest safe artifact:

- `Clarifying question`: name the user-owned decision.
- `Bounded exploration answer`: summarize findings, evidence, residual uncertainty, and whether a Goal Contract is needed before mutation.
- `Design/spec`: resolve a decision boundary without authorizing implementation.
- `Goal Contract`: authorize a bounded `loop` handoff after user acceptance.
- `Diagnostic Contract`: authorize diagnosis first, and repair only after recorded root-cause evidence.

Goal Contract schema:

```text
Goal Contract:
- Metadata: profile, rounds, final ambiguity, context type, date/slug
- Reference state: desired outcome and final claim boundary
- Current state: observed facts, inferences, and unresolved uncertainty
- Scope: in-scope, out-of-scope, non-goals
- Control model: controlled object, allowed control variables, observability signals, disturbances, coupling risks
- Indicator handoff: qualitative objective, metric/proxy, operational definition, sensor, timing, threshold/tolerance, evidence boundary, owner, route trigger
- Decision boundaries: agent-owned versus user-owned decisions
- Constraints and assumptions: resolved assumptions and conditions
- Acceptance criteria: testable evidence expectations
- Diagnostic gate: symptom, hypotheses, cause-evidence needed, repair authorization gate, if applicable
- Pressure-test findings: assumption/tradeoff/evidence probes
- Handoff: accepted indicators, allowed first loop mode, evidence floor, stop/reframe triggers
- Ledger update: path or chat-only state, latest error signal, next route
```

Default durable paths when safe and useful:

```text
.alpha-goal/context/YYYYMMDD-<slug>.md
.alpha-goal/control-state/YYYYMMDD-<slug>.md
docs/design/YYYYMMDD-<slug>-goal-contract.md
.alpha-goal/interviews/YYYYMMDD-<slug>.md
```

### 6. Review

Self-review the artifact:

- Does it answer the actual request rather than fill a template?
- Are non-goals, actuator boundary, sensor plan, and claim boundary explicit?
- Are qualitative objectives connected to indicators, sensors, thresholds/tolerances, and evidence boundaries where needed?
- Are observed facts labeled separately from inference?
- Would `loop` know what not to do?
- Would `verify` know what evidence is required?
- Would a later skill recover reference, current state, last error, and next route from the ledger or chat state?
- Does any next step require user permission, risk acceptance, credentials, external side effects, data repair, push, PR/MR, deployment, or production access?

If review fails, return to the earliest phase that can fix it.

### 7. Handoff

Handoff means passing a user-accepted Goal Contract to `loop`. Non-contract artifacts inform later work but do not authorize implementation.

When a contract is ready, ask the user to accept, reject, or change it unless the runtime already contains explicit acceptance. If accepted, update the ledger with reference, current state, actuator boundary, evidence floor, and next route before handoff when artifact writing is safe; otherwise include the ledger state in chat. If rejected or changed, return to clarification.
