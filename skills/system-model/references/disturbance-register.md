# Disturbance Register

Use a Disturbance Register when external change, hidden coupling, unreliable tooling, unclear ownership, or environmental drift can change the route, evidence floor, or safety boundary.

If material disturbances exist, output a clearly labeled `Disturbance Register:` block. If none exist, state `Disturbance register: none material`. Do not replace the register with an unlabeled prose risk list.

```text
Disturbance Register:
- Disturbance:
  - Source:
  - Likelihood: low | medium | high | unknown
  - Impact: low | medium | high | unknown
  - Affected state/control variable:
  - Sensor:
  - Containment:
  - Route trigger:
  - Owner or decision boundary:
```

## Rating guidance

- `low`: unlikely or low blast radius; record only if it affects sequencing.
- `medium`: plausible and could change evidence, slice size, or fallback.
- `high`: likely or high blast radius; requires containment before mutation.
- `unknown`: treat as material when impact could be medium or high.

## Containment patterns

- isolate worktree, environment, data copy, or ownership surface;
- reduce slice size and change one control variable at a time;
- add a sensor before changing behavior;
- freeze or record assumptions before acting;
- route to `meta-synthesis` for stakeholder conflict;
- route to user/blocker for authority, credentials, external side effects, or risk acceptance.

Do not route to `loop` when a high-impact or unknown-impact disturbance lacks a sensor, containment, and route trigger.
