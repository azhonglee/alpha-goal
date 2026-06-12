# Completion Review Rubric

用于 readiness-to-merge、readiness-to-ship 或 final-delivery 判断。这里的 review 是 verify 内部的验收检查，不等同于 `goal-review` 阶段。

## Positive verdict floor

返回 `PASS_TO_FINAL` 前确认：

- Goal Contract current，含 Testable acceptance criteria，且 claim boundary 可从 Desired Outcome、In-Scope、Out-of-Scope / Non-goals 和 Decision Boundaries 推导；
- changed files 匹配 target 和 non-goals；
- Iteration Record 的 dynamic plan、execution、feedback 与当前 diff 一致；
- 最后一处 material change 之后有 fresh checks；
- feedback 已处理或明确 out of scope；
- risk tier 的证据门槛满足；
- bug/root-cause claim 有有效 Debug Receipt；
- final claim 不超过 tested boundary。

## Return NEXT_ITERATION

以下情况回 `goal-iterate`：

- acceptance 部分覆盖；
- 需要补测试、probe、diff cleanup、edge case 或 feedback action；
- 实现方向正确但证据不到 final state；
- narrowed claim 不符合用户实际需要。

## Return REFRAME

以下情况回 `alpha-goal`：

- target/scope、acceptance、non-goals 或 claim boundary 错误/不完整；
- existing work 关系改变任务身份；
- feedback 表明当前 contract 不是用户真实目标；
- evidence 指向不同 entity、API/RPC、submodule 或 repo。

## Return BLOCKED

以下情况 block：

- 缺 credential、permission、service、data、tooling 或环境；
- 必须由用户决定风险接受或 scope；
- 测试无法运行且没有 substitute evidence；
- 工作区状态无法安全判断。

## Narrowed claim

当本地目标已满足但用户措辞更宽，返回 `NARROW_CLAIM_AND_FINAL`，并写明：

- 已验证的最宽边界；
- 未验证的更高边界；
- 用户最终可收到的窄声明。
