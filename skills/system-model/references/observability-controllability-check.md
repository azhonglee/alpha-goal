# Observability and Controllability Check

## Observability questions

- Can the available signals distinguish success from failure?
- Can the available signals distinguish root cause from correlation?
- Are signals fresh after the last material change?
- Do signals cross the same boundary as the proposed claim?
- Are logs/tests/probes connected to the affected entity and state transition?

## Controllability questions

- Which variables can be changed inside the approved scope?
- Which variables require external authority or user-owned decisions?
- Are control actions reversible or safely containable?
- Does one intended action affect multiple outputs or owners?
- Is a diagnostic probe required before a repair action?

## Ratings

- `strong`: enough signals/control variables exist for direct bounded action.
- `adequate`: action is possible with explicit limitations or narrowed claim.
- `weak`: a model, sensor, or user decision is needed before mutation.
- `blocked`: missing environment, data, credentials, permission, or evidence prevents meaningful progress.
