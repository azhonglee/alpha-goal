# 综合轮次

Use a 综合轮次 when qualitative judgment, quantitative evidence, stakeholder priorities, or model assumptions conflict enough to affect the 目标契约 or route.

The round is a human-machine convergence mechanism, not a meeting transcript. Keep only claims, evidence, conflicts, decisions, and next hypotheses that change routing or scope.

```text
综合轮次:
- 轮次:
- 核心问题或假设:
- 人类 / 专家判断:
  - 来源或负责人:
  - 判断:
  - 置信度:
  - 决策权限:
- 机器证据与模型:
  - 信号 / 模型:
  - 已跨越边界:
  - 置信度:
  - 失效模式:
- 综合集成厅状态:
  - 假设库:
  - 模型登记:
  - 异议:
  - 收敛条件:
- 定量指标:
  - 指标 / 代理:
  - 当前值:
  - 目标或阈值:
  - 测量缺口:
- 指标交接候选:
- 冲突或矛盾:
- 综合更新:
- 用户自有决策:
- 下一个待验证假设:
- 路由触发条件: goal-contract | system-model | control-loop | evidence-verify | user | blocker
```

```text
指标交接:
- 定性目标:
- 指标或代理:
- 操作化定义:
- 传感器 / 证据来源:
- 阈值 / 容差:
- 证据边界:
- 路由触发条件:
```

## Rules

- Use qualitative judgment to select objectives, scenarios, and tradeoffs; use quantitative evidence to constrain claims and detect error.
- Do not average away conflicts. Name the owner, evidence basis, and decision boundary.
- If a metric is unavailable, name a proxy or missing sensor instead of inventing precision.
- Pass accepted indicators to `goal-contract` as an 指标交接 with operational definition, sensor, threshold/tolerance, and evidence boundary.
- If user priority, risk acceptance, budget, timeline, or scope changes are required, route to user instead of deciding silently.
- Stop rounds when a stable 目标契约 candidate, system-model question, user decision, or blocker is the smallest next action.
