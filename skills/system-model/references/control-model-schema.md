# 控制模型 Schema

Persist the full model at `.alpha-goal/YYYYMMDD-<slug>/system-model.md` by default. When machine validation or resume safety matters, write a schema sidecar at `.alpha-goal/YYYYMMDD-<slug>/schema/system-model.json`. The TUI should show a Markdown-table `模型摘要` with boundary, observability, controllability, artifact path, and recommended route unless full chat output is required.

```text
控制模型:
- 标题:
- 日期 / slug:
- 系统边界:
  - 被控对象:
  - 环境:
  - 外部参与方:
  - 所有权边界:
  - 时间边界:
- 状态变量:
  - 变量:
  - 当前值 / 证据:
  - 期望或相关区间:
  - 置信度:
- 输入:
- 输出:
- 传感器:
  - 信号:
  - 新鲜度:
  - 已跨越边界:
  - 失效模式:
- 执行器:
  - 动作:
  - 权限:
  - 可逆性:
  - 风险:
- 指标到传感器的交接:
  - 指标:
  - 传感器:
  - 时机:
  - 阈值 / 容差:
  - 证据边界:
- 候选控制律:
  - 目标误差:
  - 控制变量:
  - 候选动作或探测:
  - 传感器:
  - 阈值 / 容差:
  - 反馈延迟:
  - 信号噪声:
  - 置信度:
  - 阻尼 / 防振荡:
  - 影响范围上限:
  - 风险 / 失败处理:
- 扰动记录:
  - 扰动:
  - 来源:
  - 可能性:
  - 影响:
  - 受影响状态 / 控制变量:
  - 传感器:
  - 约束措施:
  - 路由触发条件:
  - 负责人或决策边界:
- 耦合图:
- 控制器层级:
  - 全局控制器:
  - 局部控制器:
  - 耦合变量:
  - 仲裁规则:
  - 升级触发条件:
- 可观测性评级:
- 可控性评级:
- 稳定性条件:
- 缺失传感器或权限:
- 模型充分性:
- 台账更新:
  - 控制状态路径:
  - 产物路径:
  - 结构化索引路径:
  - 模型变更:
  - 残余模型不确定性:
  - 下一路由:
- 推荐路由:
```

Use this only when the compact model is insufficient for handoff or recovery.
