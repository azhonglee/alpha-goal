# 模糊度评分

Scoring is a steering aid. It should reduce unnecessary clarification while preventing unsafe handoff.

## 定性评分

- `low`: remaining uncertainty will not change scope, authority, evidence, or final claim.
- `medium`: uncertainty might change a slice plan or evidence floor; clarify or narrow before mutation.
- `high`: uncertainty can change goal, owner, target, non-goals, safety, or authorization; do not hand off to `control-loop`.

## 数值评分

Use 0.0 to 1.0 clarity scores, then compute ambiguity.

```text
Greenfield ambiguity = 1 - (intent*0.25 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.15)
Brownfield ambiguity = 1 - (intent*0.20 + outcome*0.20 + scope*0.18 + constraints*0.14 + success*0.14 + context*0.14)
Control ambiguity = 1 - (reference*0.25 + actuator_boundary*0.20 + sensor_plan*0.20 + disturbance_bounds*0.15 + claim_boundary*0.20)
```

Thresholds are defaults, not proofs:

- quick: <= 0.30
- standard: <= 0.20
- deep: <= 0.15

Never let a low numeric ambiguity override a missing user-owned decision or unsafe actuator boundary.
