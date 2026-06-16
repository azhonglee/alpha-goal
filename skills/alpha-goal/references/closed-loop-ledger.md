# 闭环台账

Use this reference when a task spans multiple skills, may resume across turns, or needs durable state to prevent the loop from losing reference, error, action, route decision, or feedback history.

## Purpose

The ledger is a control-state memory and artifact index, not a work diary. Keep only information that changes routing, safety, evidence, or final claim judgment. The full `控制路由` belongs here by default; other full stage artifacts belong under the same task run directory, `.alpha-goal/YYYYMMDD-<slug>/`. The TUI should show compact summaries unless the user asks for full details, file persistence is blocked, or a user-owned decision needs review.

默认持久化路径:

```text
.alpha-goal/YYYYMMDD-<slug>/control-state.md
```

可选追加式机器日志:

```text
.alpha-goal/YYYYMMDD-<slug>/iterations/cycles.jsonl
```

默认完整产物路径:

```text
.alpha-goal/YYYYMMDD-<slug>/goal-contract.md
.alpha-goal/YYYYMMDD-<slug>/system-model.md
.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md
.alpha-goal/YYYYMMDD-<slug>/plan.md
.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md
.alpha-goal/YYYYMMDD-<slug>/evidence/
.alpha-goal/YYYYMMDD-<slug>/schema/
.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md
.alpha-goal/YYYYMMDD-<slug>/conformance-report.md
.alpha-goal/YYYYMMDD-<slug>/interviews.md
```

Default behavior is to write the ledger under `.alpha-goal/`. Before the first write in a repository, check whether `.alpha-goal/` is ignored. If it is not ignored and the repo root `.gitignore` is writable, add this line before writing ledger artifacts:

```gitignore
.alpha-goal/
```

Treat adding `.alpha-goal/` to `.gitignore` as a process-artifact setup mutation, not an implementation mutation. Use chat-only ledger state only when the user explicitly forbids file writes, no repository path exists, or `.gitignore` cannot be updated safely; state that reason in the `台账路径` field.

## 台账结构

```text
闭环台账:
- 任务 slug:
- 最后更新:
- 台账路径:
- 产物登记:
  - 目标契约:
  - 控制模型:
  - 决策综合:
  - 计划:
  - 迭代记录:
  - 证据:
  - Schema 辅助索引:
  - 验证结论:
  - 一致性报告:
  - 访谈记录:
- 最新控制路由:
  控制路由:
  - 台账路径:
  - 活跃状态:
  - 主导不确定性:
  - 误差信号:
  - 控制律:
  - 指标交接:
  - 自适应学习:
  - 控制器层级:
  - 扰动登记:
  - 选定技能:
  - 选择理由:
  - 需加载或询问的上下文:
  - 安全边界:
  - 下一步:
- 参考状态:
  - 期望结果:
  - 验收证据:
  - 声明边界:
  - 指标交接:
    - 定性目标:
    - 指标 / 代理:
    - 传感器:
    - 阈值 / 容差:
    - 证据边界:
- 当前状态:
  - 已观察事实:
  - 推断:
  - 未知项:
  - 活跃风险 / 扰动:
  - 扰动登记:
    - 扰动:
    - 可能性 / 影响:
    - 传感器:
    - 约束措施:
    - 路由触发条件:
  - 控制器层级:
    - 全局控制器:
    - 局部控制器:
    - 耦合变量:
    - 仲裁 / 升级:
- 控制状态:
  - 活跃路由:
  - 主导不确定性:
  - 最近误差信号:
  - 最近控制律:
  - 最近控制动作:
  - 最近传感器反馈:
  - 残余误差:
  - 自适应学习:
    - 学习触发条件:
    - 已观察偏差:
    - 调整:
    - 复用条件:
    - 失效条件:
  - 下一路由:
- 循环日志:
  - 循环:
    - 输入状态:
    - 选定技能:
    - 误差信号:
    - 控制律:
      - 目标误差:
      - 控制变量:
      - 预期效果:
      - 传感器阈值:
      - 反馈延迟:
      - 信号噪声:
      - 置信度:
      - 阻尼 / 防振荡:
      - 饱和 / 影响范围约束:
      - 失败处理:
    - 控制动作或探测:
    - 已改变变量:
    - 保持不变的变量:
    - 扰动登记更新:
    - 自适应学习记录:
    - 传感器反馈:
    - 证据边界:
    - 残余误差:
    - 路由决策:
    - 下一状态:
```

## 阶段职责

- `alpha-goal`: discover or initialize the ledger, classify active control state, write the full `最新控制路由`, keep the artifact registry inside `.alpha-goal/YYYYMMDD-<slug>/`, and show only a Markdown-table `路由摘要` in the TUI by default.
- `decision-synthesis`: read the latest route before synthesis; write the full 决策综合记录 under `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md`, update the artifact registry and route-relevant synthesis state, and show a Markdown-table `综合摘要` in the TUI by default.
- `system-model`: read the latest route before modeling; write the full 控制模型 under `.alpha-goal/YYYYMMDD-<slug>/system-model.md`, update the artifact registry and model-relevant state, and show a Markdown-table `模型摘要` in the TUI by default.
- `goal-contract`: read the latest route before changing the reference; write the full 目标契约 under `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md`, update the artifact registry and reference state, and show a Markdown-table `契约摘要` in the TUI by default.
- `control-loop`: read the latest route before mutation/probe; persist the full 控制律 in the 迭代记录 or ledger, show a Markdown-table `执行检查` before mutation, write full 迭代记录 under `.alpha-goal/YYYYMMDD-<slug>/iterations/`, durable logs under `.alpha-goal/YYYYMMDD-<slug>/evidence/` when needed, update the artifact registry and control state, and show a Markdown-table `迭代摘要` after feedback by default.
- `evidence-verify`: read the latest route before verdict; write the full 验证结论 under `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md`, update the artifact registry and final comparator state, and show a Markdown-table `验证摘要` in the TUI by default.

## 更新规则

- Update the ledger when reference, 指标交接, plant model, 控制器层级, 扰动登记, 自适应学习记录, 控制律, actuator boundary, evidence floor, schema sidecar, conformance report, artifact path, route, selected skill, next action, or residual error changes materially.
- Treat `.alpha-goal/YYYYMMDD-<slug>/control-state.md` as the source of truth for cross-skill route fields. Do not require later skills to reconstruct `控制路由` from the visible TUI summary.
- Treat the artifact registry as the source of truth for locating full stage outputs. Do not duplicate full 目标契约, 控制模型, 决策综合记录, 迭代记录, schema sidecars, 一致性报告, or 验证结论 inside the ledger unless file persistence is blocked.
- TUI output should default to compact Markdown table summaries:

```markdown
路由摘要

| 字段 | 内容 |
| --- | --- |
| 路由 | |
| 原因 | |
| 边界 | |
| 台账 | |
| 下一步 | |
```

- Stage summaries and the control-loop `执行检查` should use compact two-column Markdown table shapes with Chinese titles by default. If the user explicitly asks for another language, translate the same title semantics without showing multiple language templates. Values should be concise and point to artifact paths for long details. If a runtime cannot render Markdown tables, use a compact two-column plain-text table instead of bullet lists. Print full artifacts or raw internal 控制律 blocks in chat only when the user asks, persistence is blocked, or a decision/risk requires explicit user review.
- Do not duplicate full command output; link or summarize evidence and point to `.alpha-goal/YYYYMMDD-<slug>/evidence/` when durable logs are needed.
- Do not store secrets, tokens, credentials, private user data, or production-only sensitive records.
- Label stale or superseded state instead of silently overwriting it.
- If the ledger conflicts with the current 目标契约, system model, diff, or fresh evidence, route to `goal-contract`, `system-model`, or `evidence-verify` before further mutation.
