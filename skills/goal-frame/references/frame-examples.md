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
- Spec:
  - Outcome: retryable error 不应让用户看到 failed。
  - Scope: 不重设 transport retry policy；reducer-only 与 full lifecycle 尚未闭合。
  - Acceptance: retryable error 不进入 failed 状态；non-retryable error 仍失败。
  - Constraints: mutation 前必须选择 reducer-only 或 full lifecycle；用户决定产品边界。
  - Claim boundary: not closed.
  - Evidence: reducer test；若选 full lifecycle 还需 stream event test。
- Risk tier: medium.
- Risks and assumptions: 两个模块都可能影响最终状态。
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
- Spec:
  - Outcome: 找出 scope overlap、行为差异和推荐路径。
  - Scope: 只读比较；不修改代码，不创建 MR。
  - Acceptance: 识别范围重叠；识别任一版本缺失行为；推荐 merge/follow-up/abandon 路径。
  - Constraints: 使用 MR metadata 和 local diff；访问失败时标注不确定性；可建议路径，用户决定是否实现。
  - Claim boundary: comparison only.
  - Evidence: MR file list, commit diff, behavior map.
- Risk tier: low.
- Risks and assumptions: MR 内容可能因远程访问失败不完整。
- Artifacts: durable spec: none.
- Existing work: MR 503 is primary object.
- Frame verdict: COMPARISON_ONLY
- Next: 执行只读比较。
```

## Frame-only implementation request

```text
Goal Contract:
- Intent: 为产物上传到 TOS 增加可诊断日志；本轮只 frame，不改文件。
- Loop type: NEW_GOAL.
- Target: 未闭合；当前仓若只有文档示例命中，不能当作业务实现面。
- Discovery: 当前证据不足以选择目标 repo/path。
- Socratic state: missing; 阻塞点是目标业务 repo/path。
- Spec:
  - Outcome: 在选定业务 repo 中，为产物上传 TOS 的成功/失败路径补充安全、可诊断日志。
  - Scope: 只覆盖上传编排边界日志；不改 retry、credential、TOS config 或上传语义。
  - Acceptance: 成功日志含安全的产物身份和 TOS 目的地；失败日志含错误和必要上下文；不记录 token、secret、PII；上传结果语义不变。
  - Constraints: 当前阶段不改文件；实现前必须闭合目标 repo/path 和本地规则。
  - Claim boundary: 只能声明选定 repo 的代码级日志补充，不声明生产观测链路已生效。
  - Evidence: 后续实现时用 diff review、focused tests/build/lint 或目标仓等价验证。
- Risk tier: medium.
- Risks and assumptions: 目标可能是业务编排层而非底层 TOS driver；当前 evidence 不足以安全选择 repo。
- Artifacts: durable spec: none.
- Existing work: unknown.
- Frame verdict: ASK_USER
- Next: 请提供包含上传逻辑的目标业务 repo/path，或确认允许做更外层只读候选搜索。
```
