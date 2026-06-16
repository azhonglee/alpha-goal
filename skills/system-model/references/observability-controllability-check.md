# 可观测性与可控性检查

## 可观测性问题

- Can the available signals distinguish success from failure?
- Can the available signals distinguish root cause from correlation?
- Are signals fresh after the last material change?
- Do signals cross the same boundary as the proposed claim?
- Are logs/tests/probes connected to the affected entity and state transition?

## 可控性问题

- Which variables can be changed inside the approved scope?
- Which variables require external authority or user-owned decisions?
- Are control actions reversible or safely containable?
- Does one intended action affect multiple outputs or owners?
- Is a diagnostic probe required before a repair action?

## 扰动问题

- Which disturbance could invalidate the model, route, evidence floor, or final claim?
- What sensor detects the disturbance before or immediately after action?
- 哪些控制措施能阻止扰动扩大影响范围？
- 哪些路由触发条件会把工作送到 `goal-contract`、`system-model`、`decision-synthesis`、用户或 blocker？

## 评级

- `strong`: enough signals/control variables exist for direct bounded action.
- `adequate`: action is possible with explicit limitations or narrowed claim.
- `weak`: a model, sensor, or user decision is needed before mutation.
- `blocked`: missing environment, data, credentials, permission, or evidence prevents meaningful progress.
