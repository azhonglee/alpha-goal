# Adaptive Learning Record

Use an Adaptive Learning Record when observed feedback shows that a Control Law, threshold, disturbance assumption, route choice, or evidence floor was wrong enough to affect later cycles.

This is not a retrospective essay. Record only learning that changes a future control action, sensor threshold, routing rule, or reuse boundary.

```text
Adaptive Learning Record:
- Learning trigger:
- Prior assumption or control law:
- Observed mismatch:
- Evidence:
- Adjustment:
  - Control variable:
  - Threshold / tolerance:
  - Sensor:
  - Fallback or route:
- Reuse condition:
- Invalidation condition:
- Owner or decision boundary:
- Ledger update:
```

## Rules

- Learn from residual error, threshold miss, repeated fallback, failed probe, contradicted model, or user/reviewer feedback.
- Do not convert a local observation into a broad rule unless the evidence boundary supports it.
- Name the condition under which the adjustment should be reused and the condition that invalidates it.
- If learning changes reference, scope, authority, risk acceptance, or final claim, route to `goal-contract` or user instead of silently adapting.
- If learning shows plant, sensor, actuator, disturbance, or coupling assumptions were wrong, route to `system-model`.
