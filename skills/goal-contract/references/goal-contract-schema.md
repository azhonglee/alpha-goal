# 目标契约 Schema

Use this reference when a durable or handoff-ready contract is needed.

Persist the full contract at `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md` by default. When machine validation or resume safety matters, write a schema sidecar at `.alpha-goal/YYYYMMDD-<slug>/schema/goal-contract.json`. The TUI should show a Markdown-table `契约摘要` with reference, scope boundary, evidence, artifact path, and next action unless full chat output is required.

```text
目标契约:
- 标题:
- 负责人 / 请求方:
- 日期 / slug:
- 配置档: quick | standard | deep
- 参考状态:
  - 期望结果:
  - 最终声明边界:
  - 误差条件:
- 当前状态:
  - 已观察事实:
  - 推断:
  - 未知项:
- 范围:
  - 范围内:
  - 范围外 / 非目标:
- 控制模型:
  - 被控对象:
  - 允许的控制变量:
  - 可观测信号:
  - 扰动:
  - 耦合:
  - 稳定性条件:
- 指标交接:
  - 定性目标:
  - 指标或代理:
  - 操作化定义:
  - 传感器 / 证据来源:
  - 测量时机:
  - 阈值 / 容差:
  - 证据边界:
  - 负责人或决策边界:
- 决策边界:
  - 代理可决策:
  - 用户自有:
- 约束:
- 已解决假设:
- 验收标准与证据:
- 诊断闸门（如适用）:
  - 症状:
  - 竞争假设:
  - 所需原因证据:
  - 修复授权:
- 压力测试发现:
- 交接:
  - 首轮循环模式:
  - 证据下限:
  - 停止或重构触发条件:
- 台账更新:
  - 控制状态路径:
  - 产物路径:
  - 结构化索引路径:
  - 最新误差信号:
  - 下一路由:
```

A contract can be compact when risk is low, but it must preserve reference state, scope, non-goals, decision boundary, acceptance evidence, and claim boundary.
