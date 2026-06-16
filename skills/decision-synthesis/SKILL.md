---
name: decision-synthesis
description: "把决策综合用于复杂工程或社会技术系统：在形成目标契约前，整合定性判断、定量证据、利益相关方约束、模型、矛盾和用户自有决策。"
---

# 决策综合

仅用于复杂系统：多方目标冲突、成功标准难量化、战略取舍、高不确定性、宽范围架构 / 迁移 / 安全 / 合规 / 研究 / 策略，或子系统交互失稳。局部低风险任务直接到 `goal-contract`；已批准后才可能到 `control-loop`。

资源：`references/complexity-triage.md`、`references/stakeholder-decision-boundaries.md`、`references/synthesis-round.md`、`references/synthesis-record-schema.md`、`references/meta-synthesis-hall.md`。

## 边界

不改实现，不授权实现，不虚构用户自有决策。有台账时读取 `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 的 `最新控制路由`。

## 流程

判定 `simple`、`complicated`、`complex` 或 `complex-giant-like`；收集视角、目标、证据 / 模型 / 专家判断、定量信号、不确定性、冲突和决策负责人；用综合图连接人类 / 专家判断、机器证据与模型、定量指标、综合研判工作台、冲突或矛盾、用户自有决策、下一个待验证假设和指标转译候选。

识别智能体可建议的决策、用户必须作出的决策、需显式接受的风险、稳定非目标、最小下一契约和不可逆行动前证据。冲突无法解决时，路由到用户。

默认展示 `综合摘要`。跨轮次、需恢复、用户要求或用户自有决策需复核完整取舍时，写 `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md`。

决策综合记录:

```text
决策综合记录:
- 复杂度类型:
- 核心张力:
- 综合研判工作台:
- 综合轮次:
- 指标转译:
- 推荐方向:
- 用户自有决策:
- 路由:
```

TUI 摘要:

```markdown
综合摘要

| 字段 | 内容 |
| --- | --- |
| 核心张力 | |
| 推荐方向 | |
| 用户决策 | |
| 产物 | |
| 下一步 | |
```

完整产物字段:

```text
决策综合记录:
- 综合轮次:
- 指标转译:
- 用户自有决策:
- 台账更新: `.alpha-goal/YYYYMMDD-<slug>/control-state.md`
- 路由:
```

### 7. 路由

- 路由到 `goal-contract`: 方向和指标转译可形成契约。
- 路由到 `system-model`: 子系统边界或反馈不清。
- 路由到用户: 需要用户自有决策、风险接受、预算 / 时间取舍或优先级。
- 路由到 `evidence-verify`: 只比较既有证据和拟声明。
- 不能直接路由到 `control-loop`。

路由词: goal-contract, system-model, evidence-verify, user, blocker.
