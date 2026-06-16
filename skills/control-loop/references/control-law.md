# 控制律

Use this reference when planning or reviewing a `control-loop` slice that changes implementation, configuration, tests, documents, prompts, generated artifacts, or diagnostic probes. A control law explains why the selected action should reduce the target error and how feedback will decide the next route.

## 界面投影

TUI 默认展示简短的 `执行检查` 表。除非用户明确要求其他语言，否则使用中文标题和中文字段名：

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

把表格作为内部 控制律 的可读投影。TUI 值保持短小、易扫读；较长推理、精确阈值和稳定性保护放入持久化 控制律。只有在用户要求、持久化受阻，或高风险切片需要变更前逐项复核字段时，才在聊天中打印原始 `控制律:` 块。

字段映射如下:

| TUI 字段 | 内部来源 |
| --- | --- |
| 问题 | 目标误差 |
| 本轮动作 | 控制变量加控制动作或探测 |
| 保持不变 | 保持不变的变量加影响范围上限 |
| 验收证据 | 传感器加阈值 / 容差 |
| 主要风险 | 信号噪声、阻尼 / 防振荡、影响范围上限，或最强实质风险 |
| 失败处理 | 失败处理加停止 / 重新界定触发条件 |

## 内部结构

当控制律影响恢复、审计或验证时，把完整结构持久化到 迭代记录 或 闭环台账。它只是内部产物语法，不是默认 TUI 形态。结构化索引是机器可读的摘要与索引；除非结构化索引格式明确扩展，否则不要把结构化索引文件当成完整 控制律。

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
- 影响范围上限:
- 反馈时机:
- 失败处理:
- 停止 / 重新界定触发条件:
```

## 规则

- `目标误差` must be stated as a mismatch between reference state and current state, not as effort already spent.
- `控制变量` must be inside the approved actuator boundary.
- `预期效果` must name the state change the action should cause.
- `传感器` must be fresh enough and cross the boundary needed by the claim.
- `阈值 / 容差` may be qualitative, but it must be explicit enough to decide continue, harden, verify, reframe, or block.
- `反馈延迟` states when the expected signal should change and when waiting is safer than another control action.
- `信号噪声` states known flakiness, stale evidence risk, or ambiguous sensor interpretation.
- `置信度` is low | medium | high and reflects causal certainty, not optimism.
- `阻尼 / 防振荡` names the guard that prevents repeated broad rewrites, route flapping, or over-correction.
- `影响范围上限` 命名本切片允许的最大影响范围，以及不得跨越的边界。
- `失败处理` must not silently expand scope, authority, or risk.
- If no sensor can observe the expected effect, route to `system-model` or return `BLOCKED`.

## 内部产物示例

此示例用于持久化产物，不是默认 TUI 投影。不要把它作为默认执行前展示直接贴到聊天中。

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
- 影响范围上限: 不重命名技能，不改写 description 语义。
- 反馈时机: after the quoting change.
- 失败处理: inspect remaining frontmatter syntax and tighten validator.
- 停止 / 重新界定触发条件: parser 仍失败，或 description 语义必须改变。
```
