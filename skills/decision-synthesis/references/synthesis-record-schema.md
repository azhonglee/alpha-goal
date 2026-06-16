# 决策综合记录 Schema

Persist the full record at `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md` by default. When machine validation or resume safety matters, write a schema sidecar at `.alpha-goal/YYYYMMDD-<slug>/schema/decision-synthesis.json`. The TUI should show a Markdown-table `综合摘要` with core tension, recommended direction, user decision, artifact path, and next action unless full chat output is required.

```text
决策综合记录:
- 标题:
- 复杂度类型:
- 系统目的:
- 决策上下文:
- 利益相关方 / 视角:
  - 视角:
  - 目标:
  - 证据 / 模型 / 判断:
  - 置信度:
  - 冲突:
  - 决策负责人:
- 定性判断:
- 定量信号:
- 综合研判工作台:
  - 假设库:
  - 模型登记:
  - 异议:
  - 收敛条件:
- 综合轮次:
  - 轮次:
  - 核心问题或假设:
  - 人类 / 专家判断:
  - 机器证据与模型:
  - 综合研判工作台状态:
  - 定量指标:
  - 冲突或矛盾:
  - 综合更新:
  - 用户自有决策:
  - 下一个待验证假设:
  - 路由触发条件:
- 指标交接:
  - 定性目标:
  - 指标 / 代理:
  - 操作化定义:
  - 传感器:
  - 阈值 / 容差:
  - 证据边界:
- 子系统与交互:
- 状态变量:
- 约束:
- 场景:
- 候选策略:
- 取舍矩阵:
- 推荐方向:
- 非目标:
- 用户自有决策:
- 需接受风险:
- 所需证据:
- 最小可行目标契约候选:
- 台账更新:
  - 控制状态路径:
  - 产物路径:
  - 结构化索引路径:
  - 综合状态变更:
  - 下一路由:
- 路由:
```

Keep the record compact unless broad handoff or recovery is needed.
