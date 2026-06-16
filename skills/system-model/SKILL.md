---
name: system-model
description: "Build a minimal control-system model before engineering action: plant boundary, state variables, observability, controllability, actuators, disturbances, coupling, controller hierarchy, and evidence sensors."
---

# System Model

Model only what changes the next safe action. The model is not architecture theater; it is a control surface map.

## Resources

Load only when useful: `references/control-model-schema.md`, `references/observability-controllability-check.md`, `references/disturbance-register.md`, `references/controller-hierarchy.md`.

## Process

1. Set system boundary: repo/subrepo/service/document/workflow included and excluded.
2. Name state variables that matter to the reference state.
3. Map sensors: tests, logs, diffs, metrics, static checks, manual probes; mark latency and blind spots.
4. Map actuators: files, commands, configs, scripts, docs, agents, external systems; mark authority limits.
5. Rate observability and controllability as enough / weak / missing.
6. Map authority / ownership: owner or source of truth, writable by agent yes/no/unknown, approval needed, generated/external-managed boundary.
7. Register material disturbances with likelihood, impact, sensor, containment, route trigger.
8. If multiple local controllers affect one global objective, create Controller Hierarchy: global objective, local controller, coupling variable, arbitration rule, escalation trigger.
9. Propose candidate Control Laws for `control-loop`: target error, control variable, expected effect, sensor threshold, fallback.

Use `npx --yes tsx skills/system-model/scripts/repo-sensor-snapshot.ts` from repo root, or equivalent manual checks, when repository facts are needed.

## Output

Persist to `.alpha-goal/models/YYYYMMDD-<slug>.md` for risky, multi-stage, or handoff work.

```markdown
Control Model:
- System boundary:
- State variables:
- Observability:
- Controllability:
- Actuators:
- Sensors:
- Authority / ownership:
- Unresolved user-owned decisions: none / ...
- Blocked downstream action: none / ...
- Controller Hierarchy: none material / ...
- Disturbance Register: none material / ...
- Candidate control laws:
- Route:
```

TUI summary:

```markdown
Model Summary

| Field | Value |
| --- | --- |
| Boundary | |
| Sensors | |
| Actuators | |
| Risks | |
| Next | |
```

If unresolved user-owned decisions or blocked downstream action is not none, next route is ask/blocker, not control-loop. Local controllers must not replace the global objective; unclear coupling/arbitration routes to synthesis or user decision. Route to `goal-contract` if the reference needs revision; to `control-loop` when a bounded law is ready; to `decision-synthesis` when arbitration is value-laden; to blocker/user when sensors or authority are missing.
