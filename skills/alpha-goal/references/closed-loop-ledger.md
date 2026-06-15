# Closed-loop Ledger

Use this reference when a task spans multiple skills, may resume across turns, or needs durable state to prevent the loop from losing reference, error, action, or feedback history.

## Purpose

The ledger is a control-state memory, not a work diary. Keep only information that changes routing, safety, evidence, or final claim judgment.

Default durable path:

```text
.alpha-goal/control-state/YYYYMMDD-<slug>.md
```

Optional append-only machine log:

```text
.alpha-goal/iterations/YYYYMMDD-<slug>.jsonl
```

Default behavior is to write the ledger under `.alpha-goal/`. Before the first write in a repository, check whether `.alpha-goal/` is ignored. If it is not ignored and the repo root `.gitignore` is writable, add this line before writing ledger artifacts:

```gitignore
.alpha-goal/
```

Treat adding `.alpha-goal/` to `.gitignore` as a process-artifact setup mutation, not an implementation mutation. Use chat-only ledger state only when the user explicitly forbids file writes, no repository path exists, or `.gitignore` cannot be updated safely; state that reason in the `Ledger path` field.

## Ledger schema

```text
Closed-loop Ledger:
- Task slug:
- Last updated:
- Ledger path:
- Reference:
  - Desired outcome:
  - Acceptance evidence:
  - Claim boundary:
  - Indicator handoff:
    - Qualitative objective:
    - Metric/proxy:
    - Sensor:
    - Threshold/tolerance:
    - Evidence boundary:
- Current state:
  - Observed facts:
  - Inferences:
  - Unknowns:
  - Active risks/disturbances:
  - Disturbance register:
    - Disturbance:
    - Likelihood/impact:
    - Sensor:
    - Containment:
    - Route trigger:
  - Controller hierarchy:
    - Global controller:
    - Local controllers:
    - Coupling variables:
    - Arbitration/escalation:
- Control state:
  - Active route:
  - Dominant uncertainty:
  - Last error signal:
  - Last control law:
  - Last control action:
  - Last sensor feedback:
  - Residual error:
  - Adaptive learning:
    - Learning trigger:
    - Observed mismatch:
    - Adjustment:
    - Reuse condition:
    - Invalidation condition:
  - Next route:
- Cycle log:
  - Cycle:
    - Input state:
    - Selected skill:
    - Error signal:
    - Control law:
      - Target error:
      - Control variable:
      - Expected effect:
      - Sensor threshold:
      - Fallback action:
    - Control action or probe:
    - Variables changed:
    - Variables held constant:
    - Disturbance register update:
    - Adaptive learning record:
    - Sensor feedback:
    - Evidence boundary:
    - Residual error:
    - Route decision:
    - Next state:
```

## Stage responsibilities

- `alpha-goal`: discover or initialize the ledger, classify active control state, and write route decisions.
- `decision-synthesis`: record synthesized objectives, Synthesis Rounds, user-owned decisions, and unresolved stakeholder conflicts that affect the reference.
- `system-model`: record plant boundary, state variables, sensors, actuators, Controller Hierarchy, Disturbance Register, coupling, and model adequacy.
- `goal-contract`: record or update the reference state, Indicator Handoff, acceptance evidence, claim boundary, actuator boundary, and stop/reframe triggers.
- `control-loop`: append each bounded control cycle: Control Law, disturbance update, adaptive learning, action/probe, feedback, error delta, and next route.
- `evidence-verify`: compare ledger state, indicator evidence, disturbance handling, adaptive learning, and final claim; record final verdict or residual gap.

## Update rules

- Update the ledger when reference, Indicator Handoff, plant model, Controller Hierarchy, Disturbance Register, Adaptive Learning Record, Control Law, actuator boundary, evidence floor, route, or residual error changes materially.
- Do not duplicate full command output; link or summarize evidence and point to `.alpha-goal/evidence/` when durable logs are needed.
- Do not store secrets, tokens, credentials, private user data, or production-only sensitive records.
- Label stale or superseded state instead of silently overwriting it.
- If the ledger conflicts with the current Goal Contract, system model, diff, or fresh evidence, route to `goal-contract`, `system-model`, or `evidence-verify` before further mutation.
