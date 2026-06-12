# Frame Examples

示例只展示输出形状，不代表当前仓库事实。

## ASK_USER

```text
Goal Contract:
- Intent: 修复 retryable request error 的可见状态。
- Loop type: DEBUG_GOAL.
- Target: ambiguous; UI reducer 和 stream event mapper 都影响状态。
- Discovery: reducer 有状态分支，stream mapper 有错误事件转换；缺少产品边界选择。
- Socratic state: missing; reducer-only 与 full lifecycle 会改变验收。
- Spec: outcome: retryable error 不应让用户看到 failed；scope 未闭合；success evidence 取决于边界选择。
- Acceptance:
  1. retryable error 不进入 failed 状态。
  2. non-retryable error 仍失败。
- Non-goals: 不重设 transport retry policy。
- Constraints: mutation 前必须选择 reducer-only 或 full lifecycle。
- Decision boundaries: 用户决定产品边界。
- Assumptions and risks: 两个模块都可能影响最终状态。
- Risk tier: medium.
- Claim boundary: not closed.
- Evidence plan: reducer test；若选 full lifecycle 还需 stream event test。
- Artifacts: durable spec: none.
- Existing work: no obvious local duplicate.
- Frame verdict: ASK_USER
- Next: 问用户要 reducer-only 还是 full lifecycle。
```

## COMPARISON_ONLY

```text
Goal Contract:
- Intent: 比较本地实现和 MR 503。
- Loop type: READ_ONLY_DISCOVERY.
- Target: existing MR and current branch diff, read-only.
- Discovery: 当前对象是比较，不是实现。
- Socratic state: clear.
- Spec: outcome: 找出 scope overlap、行为差异和推荐路径；out of scope: 不改代码。
- Acceptance:
  1. 识别范围重叠。
  2. 识别任一版本缺失行为。
  3. 推荐 merge/follow-up/abandon 路径。
- Non-goals: 不修改代码，不创建 MR。
- Constraints: 使用 MR metadata 和 local diff；访问失败时标注不确定性。
- Decision boundaries: 可建议路径，用户决定是否实现。
- Assumptions and risks: MR 内容可能因远程访问失败不完整。
- Risk tier: low.
- Claim boundary: comparison only.
- Evidence plan: MR file list, commit diff, behavior map.
- Artifacts: durable spec: none.
- Existing work: MR 503 is primary object.
- Frame verdict: COMPARISON_ONLY
- Next: 执行只读比较。
```
