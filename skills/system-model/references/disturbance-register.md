# 扰动记录

当外部变化、隐藏耦合、不可靠工具、归属不清或环境漂移可能改变路由、证据下限或安全边界时，使用 扰动记录。

如果存在实质扰动，输出清晰标记的 `扰动记录:` 块。如果不存在，写明 `扰动记录: 无实质项`。不要用未标记的散文式风险列表替代记录。

```text
扰动记录:
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

## 评级指引

- `low`: unlikely or low blast radius; record only if it affects sequencing.
- `medium`: plausible and could change evidence, slice size, or fallback.
- `high`: 可能发生或影响范围大；变更前需要控制措施。
- `unknown`: treat as material when impact could be medium or high.

## 控制措施模式

- isolate worktree, environment, data copy, or ownership surface;
- reduce slice size and change one control variable at a time;
- add a sensor before changing behavior;
- freeze or record assumptions before acting;
- route to `decision-synthesis` for stakeholder conflict;
- route to user/blocker for authority, credentials, external side effects, or risk acceptance.

当高影响或影响未知的扰动缺少传感器、控制措施和路由触发条件时，不要路由到 `control-loop`。
