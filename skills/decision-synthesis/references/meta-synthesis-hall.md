# 综合研判工作台

Use the metasynthetic workspace (`综合研判工作台`) when a complex or complex-giant-like task needs human-machine synthesis before the next 目标契约, system model, or user decision. It corresponds to the “综合集成研讨厅” idea in the metasynthetic systems approach, but uses a more direct product-facing label for skill outputs.

## 角色

- 人类角色：选择价值取向、优先级、风险接受、范围取舍和最终决策边界。
- 机器角色：收集证据、比较模型、暴露矛盾、生成场景、测试假设，并把已接受的定性目标转成指标。
- 专家角色：在可用时提供领域判断、约束、失效模式和置信度标签。
- 控制器角色：保持轮次有界，记录异议，并在最小安全下一路由清晰时停止。

## 工作记忆

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

## 规则

- Move from qualitative to quantitative only where a metric or proxy can observe a material objective without false precision.
- Preserve dissent when stakeholders, models, or evidence disagree; do not average away conflicts.
- 保留假设库，用于未解决解释；当缺失事实属于被控对象、传感器、执行器、扰动或耦合时，路由到 `system-model`。
- 保留模型登记，用于竞争性心智模型、经验模型、仿真或利益相关方视角。
- 离开综合前先命名收敛条件：稳定的 目标契约 候选、system-model 问题、用户自有决策、有界验证假设或 blocker。
- Route to user when priority, budget, schedule, risk acceptance, production impact, or final claim ownership is the active uncertainty.
