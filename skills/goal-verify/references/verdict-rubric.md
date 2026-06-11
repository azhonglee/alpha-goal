# Verdict Rubric

## PASS_TO_FINAL

使用条件：

- 每个 acceptance item 都有新鲜、相关、边界匹配的证据。
- diff/scope review 未发现阻塞问题。
- claim boundary 不超过测试或 artifact 证据。
- 项目风险等级对应的 evidence floor 已满足。

下一步：进入 `DELIVER`。

## NEXT_ITERATION

使用条件：

- 方向正确，但 acceptance 未完全覆盖。
- 测试失败、缺少关键检查或发现需要补实现的问题。
- 可以在当前 Goal Contract 内继续推进。

下一步：回 `goal-iterate`。

## REFRAME

使用条件：

- 目标理解、目标仓库、已有工作关系或验收边界错误。
- 发现任务其实是 follow-up、duplicate、comparison-only 或替代实现。
- 继续 patch 会扩大 scope 或解决错误问题。

下一步：回 `goal-frame`。

## BLOCKED

使用条件：

- 缺少权限、认证、环境、外部服务、用户决策或安全许可。
- 验证命令无法在当前环境可靠运行，且没有足够替代证据。
- 存在冲突规则，不能安全继续。

下一步：报告 blocker 和最小解阻条件。

## NARROW_CLAIM_AND_FINAL

使用条件：

- 局部目标已被证明。
- 证据不足以支撑更宽声明。
- 继续实现不是必要或不在当前决策边界内。

下一步：进入 `DELIVER`，最终输出必须收窄 claim 并列出未证明范围。
