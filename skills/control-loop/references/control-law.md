# 控制律

Use this reference when planning or reviewing a `control-loop` slice that changes implementation, configuration, tests, documents, prompts, generated artifacts, or diagnostic probes. A control law explains why the selected action should reduce the target error and how feedback will decide the next route.

## 界面投影

Show a concise `执行检查` table in the TUI by default. Use Chinese titles and field labels unless the user explicitly asks for another language:

```markdown
执行检查

| 字段 | 内容 |
| --- | --- |
| 问题 | |
| 本轮动作 | |
| 保持不变 | |
| 验收证据 | |
| 主要风险 | |
| 失败处理 | |
```

Use the table as a human-readable projection of the internal 控制律. Keep the TUI values short enough to scan. Put long reasoning, exact thresholds, and stability guards in the persisted 控制律. Print the raw `控制律:` block in chat only when the user asks, persistence is blocked, or a high-risk slice requires explicit review of every field before mutation.

字段映射如下:

| TUI 字段 | 内部来源 |
| --- | --- |
| 问题 | 目标误差 |
| 本轮动作 | 控制变量加控制动作或探测 |
| 保持不变 | 保持不变的变量加饱和 / 影响范围约束 |
| 验收证据 | 传感器加阈值 / 容差 |
| 主要风险 | 信号噪声、阻尼 / 防振荡、饱和 / 影响范围约束，或最强实质风险 |
| 失败处理 | 失败处理加停止 / 重构触发条件 |

## 内部结构

Persist this full schema in the 迭代记录 or 闭环台账 when it affects recovery, audit, or verification. It is internal artifact syntax only, not the default TUI shape. Schema 辅助索引是机器可读的摘要与索引；do not treat a sidecar as the full 控制律 unless its schema is explicitly extended.

```text
控制律:
- 目标误差:
- 控制变量:
- 控制动作或探测:
- 保持不变的变量:
- 预期效果:
- 传感器:
- 阈值 / 容差:
- 反馈延迟:
- 信号噪声:
- 置信度:
- 阻尼 / 防振荡:
- 饱和 / 影响范围约束:
- 反馈时机:
- 失败处理:
- 停止 / 重构触发条件:
```

## Rules

- `目标误差` must be stated as a mismatch between reference state and current state, not as effort already spent.
- `控制变量` must be inside the approved actuator boundary.
- `预期效果` must name the state change the action should cause.
- `传感器` must be fresh enough and cross the boundary needed by the claim.
- `阈值 / 容差` may be qualitative, but it must be explicit enough to decide continue, harden, verify, reframe, or block.
- `反馈延迟` states when the expected signal should change and when waiting is safer than another control action.
- `信号噪声` states known flakiness, stale evidence risk, or ambiguous sensor interpretation.
- `置信度` is low | medium | high and reflects causal certainty, not optimism.
- `阻尼 / 防振荡` names the guard that prevents repeated broad rewrites, route flapping, or over-correction.
- `饱和 / 影响范围约束` names the maximum allowed blast radius for this slice and the boundary that must not be crossed.
- `失败处理` must not silently expand scope, authority, or risk.
- If no sensor can observe the expected effect, route to `system-model` or return `BLOCKED`.

## 内部产物示例

This example is for the persisted artifact, not the default TUI projection. Do not paste it into chat as the default pre-action display.

```text
控制律:
- 目标误差: SKILL.md frontmatter fails YAML loading.
- 控制变量: description scalar quoting.
- 控制动作或探测: quote description values containing colon-space.
- 保持不变的变量: skill names and description semantics.
- 预期效果: all skill frontmatter blocks parse as YAML.
- 传感器: YAML.safe_load over skills/*/SKILL.md.
- 阈值 / 容差: every SKILL.md has name and description after parsing.
- 反馈延迟: immediately after the quoting change.
- 信号噪声: parser differences between strict YAML and the local frontmatter parser.
- 置信度: high, because parser failure directly names the invalid syntax.
- 阻尼 / 防振荡: change only scalar quoting, then rerun the parser before touching descriptions.
- 饱和 / 影响范围约束: do not rename skills or rewrite description semantics.
- 反馈时机: after the quoting change.
- 失败处理: inspect remaining frontmatter syntax and tighten validator.
- 停止 / 重构触发条件: parser still fails or description semantics must change.
```
