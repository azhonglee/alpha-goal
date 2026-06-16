# 闭环台账

## 默认行为

台账是事实来源，不是日志。`inline` 可不写文件；`persisted` / `audited` 写 `.alpha-goal/YYYYMMDD-<slug>/control-state.md`。首次写 `.alpha-goal/` 前确认 `.gitignore`；加入 `.alpha-goal/` 属于流程产物初始化变更。

字段：产物登记、最新控制路由、参考状态、当前状态、最近误差信号、控制律、传感器反馈、路由决策、下一状态、自适应学习。产物路径包括 `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md`、`.alpha-goal/YYYYMMDD-<slug>/system-model.md`、`.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md`、`.alpha-goal/YYYYMMDD-<slug>/iterations`、`.alpha-goal/YYYYMMDD-<slug>/evidence`、`.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md`。

```markdown
路由摘要

| 字段 | 内容 |
| --- | --- |
| 路由 | |
| 原因 | |
| 边界 | |
| 下一步 | |
```

阶段摘要和 `执行检查` 默认使用带中文标题的紧凑双列表格；不展示多语言模板。只有用户要求、持久化受阻或风险需复核时，才打印完整产物或原始内部控制律块。
