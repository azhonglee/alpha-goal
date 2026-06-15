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

Before writing, confirm `.alpha-goal/` is ignored or the user explicitly approved another process-artifact path. If writing is unsafe, keep the ledger in chat and name the missing artifact path.

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
- Current state:
  - Observed facts:
  - Inferences:
  - Unknowns:
  - Active risks/disturbances:
- Control state:
  - Active route:
  - Dominant uncertainty:
  - Last error signal:
  - Last control law:
  - Last control action:
  - Last sensor feedback:
  - Residual error:
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
    - Sensor feedback:
    - Evidence boundary:
    - Residual error:
    - Route decision:
    - Next state:
```

## Stage responsibilities

- `control-kernel`: discover or initialize the ledger, classify active control state, and write route decisions.
- `meta-synthesis`: record synthesized objectives, user-owned decisions, and unresolved stakeholder conflicts that affect the reference.
- `system-model`: record plant boundary, state variables, sensors, actuators, disturbances, coupling, and model adequacy.
- `alpha-goal`: record or update the reference state, acceptance evidence, claim boundary, actuator boundary, and stop/reframe triggers.
- `loop`: append each bounded control cycle: Control Law, action/probe, feedback, error delta, and next route.
- `verify`: compare ledger state, evidence, and final claim; record final verdict or residual gap.

## Update rules

- Update the ledger when reference, plant model, Control Law, actuator boundary, evidence floor, route, or residual error changes materially.
- Do not duplicate full command output; link or summarize evidence and point to `.alpha-goal/evidence/` when durable logs are needed.
- Do not store secrets, tokens, credentials, private user data, or production-only sensitive records.
- Label stale or superseded state instead of silently overwriting it.
- If the ledger conflicts with the current Goal Contract, system model, diff, or fresh evidence, route to `alpha-goal`, `system-model`, or `verify` before further mutation.
