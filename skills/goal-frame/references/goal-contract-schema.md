# Goal Contract Schema

Goal Contract 是执行边界，不是长设计文档。它必须包含足够的 Spec，让后续 agent 不依赖聊天记忆也能判断目标、验收和声明范围。

```text
Goal Contract:
- Intent:
- Loop type:
- Target:
- Discovery:
- Socratic state:
- Spec:
- Acceptance:
- Non-goals:
- Constraints:
- Decision boundaries:
- Assumptions and risks:
- Risk tier:
- Claim boundary:
- Evidence plan:
- Artifacts:
- Existing work:
- Frame verdict:
- Next:
```

## Field definitions

### Intent

把用户请求重述为执行目标。

### Loop type

由 `goal-loop` 识别的类型：`NEW_GOAL`、`DEBUG_GOAL`、`CONTINUE_GOAL`、`READ_ONLY_DISCOVERY`、`VERIFY_CLAIM`、`RECOVERY`。若直接调用 `goal-frame`，根据用户意图补齐。

### Target

选定 repo、package、service、module、path 或只读对象。多 repo 场景写候选项和选择依据。页面/空间/工作区等容器目标要拆出 container、submodule、data entity、source API/RPC、log/code symbols，避免实体漂移。

### Discovery

只读发现摘要：本地规则、候选目标、已有工作、关键证据和仍未验证的事实。

### Socratic state

记录澄清状态：`clear`、`partial` 或 `missing`，以及是否还有一个阻塞问题。

### Spec

稳定需求说明。小任务写 inline compact spec，建议包含：

- desired outcome；
- in-scope / out-of-scope；
- success criteria；
- acceptance evidence。

复杂任务引用 durable spec 路径和 status，并给 1-3 行摘要。

### Acceptance

可观察完成条件。bug/debug 任务区分 diagnostic acceptance、root-cause acceptance、repair acceptance。

### Non-goals

明确不改、不迁移、不优化、不声明的内容。

### Constraints

项目规则、worktree 要求、兼容性、环境限制、ownership boundary 和用户约束。

### Decision boundaries

哪些可自主决定，哪些必须问用户。

### Assumptions and risks

区分已观察事实和假设。记录环境、集成、破坏性操作、ownership、blast radius、术语/实体歧义等风险。

### Risk tier

- `low`：文档、prompt、本地措辞或机械编辑，无行为/契约影响。
- `medium`：有界行为、集成、CLI、UI 或可维护性变化。
- `high`：security、destructive/remote state、production/compliance/PII、public API、schema、billing、permission、tenant isolation 或不可逆行为。

### Claim boundary

最终声明能到达的最高边界，例如 reducer-level、API endpoint、full event lifecycle、read-only comparison 或 implementation prepared but not runtime-verified。

### Evidence plan

证明 acceptance 的证据：测试、build、typecheck、lint、manual probe、diff review、MR comparison、call-chain/log evidence，或无法运行的原因。

### Artifacts

只记录 loop/process artifacts：durable spec、plan、review、evidence、scratch。不要列业务对象、UI 区块、数据库行或产品产物。

### Existing work

已有 MR/PR/branch/issue/design 与当前任务关系：`new work`、`follow-up`、`duplicate`、`alternative implementation`、`comparison-only`、`unknown`。

### Frame verdict

`READY_FOR_ITERATION`、`ASK_USER`、`READ_ONLY`、`COMPARISON_ONLY`、`BLOCKED`。

### Next

下一步入口或阻塞问题。

## Example

```text
Goal Contract:
- Intent: 为产物上传到 TOS 增加可诊断日志。
- Loop type: NEW_GOAL.
- Target: `anyclaw_agent`; 候选 `anyclaw_agent_runtime` 仅有底层 TOS driver，非编排入口。
- Discovery: 已读 repo rules；上传编排在 app service；未发现本地重复分支。
- Socratic state: clear; 日志上下文可按现有风格自主决定。
- Spec: outcome: upload success/failure 都有 artifact identity 和 TOS destination 上下文；scope: 编排边界日志；out of scope: retry/credential/config；success: 行为语义不变且测试通过。
- Acceptance:
  1. 成功上传日志包含产物身份和 TOS 目的地。
  2. 失败日志包含错误和调试上下文。
  3. 上传结果语义不变。
- Non-goals: 不改 retry、credential、config，不做大重构。
- Constraints: 使用隔离 worktree；遵守目标 repo `AGENTS.md`。
- Decision boundaries: 可决定日志字段命名；retry 或 credential 行为需再问。
- Assumptions and risks: 假设 targeted Go tests 可运行；无法本地证明生产观测链路。
- Risk tier: medium.
- Claim boundary: 选定 repo 的实现级日志行为，不声明生产可观测性已生效。
- Evidence plan: unit tests where practical, targeted go test, diff review.
- Artifacts: durable spec: none; plan: none.
- Existing work: new work.
- Frame verdict: READY_FOR_ITERATION
- Next: enter goal-iterate.
```
