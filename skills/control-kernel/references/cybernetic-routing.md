# Cybernetic Routing Reference

Use this reference when a request could activate multiple skills.

## Closed-loop order

A stable route usually follows:

```text
meta-synthesis? -> system-model? -> alpha-goal -> loop -> verify -> final claim
```

The optional steps are not ceremony:

- Use `meta-synthesis` when the problem's values, stakeholders, or objective function are unstable.
- Use `system-model` when the plant boundary or feedback signals are unstable.
- Use `alpha-goal` when the reference/setpoint is unstable.
- Use `loop` only after the reference and actuator boundary are stable enough.
- Use `verify` whenever a completion/readiness/correctness claim is at stake.
- Carry the Closed-loop Ledger across stages when a task spans skills or turns.

## Stability failure patterns

- Implementation before setpoint: code changes start while acceptance is vague.
- Sensor failure: final claim relies on old, low-boundary, or missing evidence.
- Actuator overreach: executor mutates outside approved scope or ownership.
- Coupled control: parallel changes hit shared generated outputs or submodules.
- Disturbance denial: dirty state, tool gaps, or changing specs are treated as irrelevant.
- Comparator bypass: `loop` claims final completion without `verify`.

## Minimal intervention rule

Route to the smallest skill that can reduce the current error. Do not run a full modeling or synthesis phase for a localized low-risk task with clear acceptance and direct evidence.
