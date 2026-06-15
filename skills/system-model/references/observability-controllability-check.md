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

## Disturbance questions

- Which disturbance could invalidate the model, route, evidence floor, or final claim?
- What sensor detects the disturbance before or immediately after action?
- What containment keeps the disturbance from expanding blast radius?
- What route trigger sends the work to `alpha-goal`, `system-model`, `meta-synthesis`, user, or blocker?

## Ratings

- `strong`: enough signals/control variables exist for direct bounded action.
- `adequate`: action is possible with explicit limitations or narrowed claim.
- `weak`: a model, sensor, or user decision is needed before mutation.
- `blocked`: missing environment, data, credentials, permission, or evidence prevents meaningful progress.
