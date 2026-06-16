# Meta-Synthesis Hall

Use the Meta-Synthesis Hall when a complex or complex-giant-like task needs human-machine synthesis before the next Goal Contract, system model, or user decision.

## Roles

- Human role: choose values, priorities, risk acceptance, scope tradeoffs, and final decision boundaries.
- Machine role: gather evidence, compare models, surface contradictions, generate scenarios, test hypotheses, and convert accepted qualitative objectives into indicators.
- Expert role: provide domain judgment, constraints, failure modes, and confidence labels when available.
- Controller role: keep the round bounded, record dissent, and stop when the smallest safe next route is clear.

## Working memory

```text
Meta-Synthesis Hall:
- Core question:
- Human role:
- Machine role:
- Expert inputs:
- Hypothesis bank:
  - Hypothesis:
  - Evidence for:
  - Evidence against:
  - Missing sensor:
- Model registry:
  - Model or perspective:
  - Boundary:
  - Confidence:
  - Failure mode:
- Scenario set:
- Dissent:
- Candidate indicators:
- Convergence condition:
- Decision boundary:
- Route:
```

## Rules

- Move from qualitative to quantitative only where a metric or proxy can observe a material objective without false precision.
- Preserve dissent when stakeholders, models, or evidence disagree; do not average away conflicts.
- Keep a Hypothesis bank for unresolved explanations and route to `system-model` when the missing fact is plant, sensor, actuator, disturbance, or coupling.
- Keep a Model registry for competing mental models, empirical models, simulations, or stakeholder perspectives.
- Name a Convergence condition before leaving synthesis: stable Goal Contract candidate, system-model question, user-owned decision, bounded validation hypothesis, or blocker.
- Route to user when priority, budget, schedule, risk acceptance, production impact, or final claim ownership is the active uncertainty.
