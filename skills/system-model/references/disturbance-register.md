# 扰动登记

Use a 扰动登记 when external change, hidden coupling, unreliable tooling, unclear ownership, or environmental drift can change the route, evidence floor, or safety boundary.

If material disturbances exist, output a clearly labeled `扰动登记:` block. If none exist, state `扰动登记: none material`. Do not replace the register with an unlabeled prose risk list.

```text
扰动登记:
- 扰动:
  - 来源:
  - 可能性: low | medium | high | unknown
  - 影响: low | medium | high | unknown
  - 受影响状态 / 控制变量:
  - 传感器:
  - 约束措施:
  - 路由触发条件:
  - 负责人或决策边界:
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
- route to `decision-synthesis` for stakeholder conflict;
- route to user/blocker for authority, credentials, external side effects, or risk acceptance.

Do not route to `control-loop` when a high-impact or unknown-impact disturbance lacks a sensor, containment, and route trigger.
