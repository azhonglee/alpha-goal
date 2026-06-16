# 综合研判工作台

Use the metasynthetic workspace (`综合研判工作台`) when a complex or complex-giant-like task needs human-machine synthesis before the next 目标契约, system model, or user decision. It corresponds to the “综合集成研讨厅” idea in the metasynthetic systems approach, but uses a more direct product-facing label for skill outputs.

## Roles

- Human role: choose values, priorities, risk acceptance, scope tradeoffs, and final decision boundaries.
- Machine role: gather evidence, compare models, surface contradictions, generate scenarios, test hypotheses, and convert accepted qualitative objectives into indicators.
- Expert role: provide domain judgment, constraints, failure modes, and confidence labels when available.
- Controller role: keep the round bounded, record dissent, and stop when the smallest safe next route is clear.

## Working memory

```text
综合研判工作台:
- 核心问题:
- 人类角色:
- 机器角色:
- 专家输入:
- 假设库:
  - 假设:
  - 支持证据:
  - 反对证据:
  - 缺失传感器:
- 模型登记:
  - 模型或视角:
  - 边界:
  - 置信度:
  - 失效模式:
- 场景集:
- 异议:
- 候选指标:
- 收敛条件:
- 决策边界:
- 路由:
```

## Rules

- Move from qualitative to quantitative only where a metric or proxy can observe a material objective without false precision.
- Preserve dissent when stakeholders, models, or evidence disagree; do not average away conflicts.
- Keep a Hypothesis bank for unresolved explanations and route to `system-model` when the missing fact is plant, sensor, actuator, disturbance, or coupling.
- Keep a Model registry for competing mental models, empirical models, simulations, or stakeholder perspectives.
- Name a Convergence condition before leaving synthesis: stable 目标契约 candidate, system-model question, user-owned decision, bounded validation hypothesis, or blocker.
- Route to user when priority, budget, schedule, risk acceptance, production impact, or final claim ownership is the active uncertainty.
