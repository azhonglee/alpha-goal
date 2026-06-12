# Goal Contract Schema

Goal Contract 是执行边界，不是长设计文档。它必须包含足够的 Spec，让后续 agent 不依赖聊天记忆也能判断目标、验收和声明范围。不要把 Spec 里的需求字段再复制成顶层字段。

```text
Goal Contract:
- Intent:
- Goal type:
- Target:
- Discovery:
- Socratic state:
- Spec:
- Risk tier:
- Risks and assumptions:
- Artifacts:
- Existing work:
- Frame verdict:
- Next:
```

## Field definitions

### Intent

把用户请求重述为执行目标。

### Goal type

由 `goal-loop` 识别的一个原子类型：`EXPLORE`、`DESIGN`、`IMPLEMENT`、`DEBUG`、`VERIFY`、`RECOVER`、`CLARIFY`。不要写组合类型；“先 frame 不改文件”的实现请求仍是 `IMPLEMENT` 或 `DEBUG`，不要把 read-only 当前阶段和 future implementation 目标拼成新标签。`CLARIFY` 只是临时分类，不能进入 iterate；frame phase 必须把它收敛到真实目标类型，或返回 `ASK_USER` / `BLOCKED`。

### Target

选定 repo、package、service、module、path 或只读对象。多 repo 场景写候选项和选择依据。页面/空间/工作区等容器目标要拆出 container、submodule、data entity、source API/RPC、log/code symbols，避免实体漂移。

### Discovery

只读发现摘要：本地规则、候选目标、已有工作、关键证据和仍未验证的事实。

### Socratic state

记录澄清状态：`clear`、`partial` 或 `missing`，以及是否还有一个阻塞问题。

### Spec

稳定需求说明。小任务写 inline compact spec，建议包含：

- `Outcome`：完成后可观察结果；
- `Scope`：in-scope 和 out-of-scope；
- `Acceptance`：可验证完成条件；
- `Constraints`：项目/用户约束和 decision boundaries；
- `Claim boundary`：最终声明最高边界；
- `Evidence`：证明 acceptance 的证据。

复杂任务引用 durable spec 路径和 status，并给 1-3 行摘要。

### Risks and assumptions

区分已观察事实和假设。记录环境、集成、破坏性操作、ownership、blast radius、术语/实体歧义等风险。

### Risk tier

- `low`：文档、prompt、本地措辞或机械编辑，无行为/契约影响。
- `medium`：有界行为、集成、CLI、UI 或可维护性变化。
- `high`：security、destructive/remote state、production/compliance/PII、public API、schema、billing、permission、tenant isolation 或不可逆行为。

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
- Goal type: IMPLEMENT.
- Target: `anyclaw_agent`; 候选 `anyclaw_agent_runtime` 仅有底层 TOS driver，非编排入口。
- Discovery: 已读 repo rules；上传编排在 app service；未发现本地重复分支。
- Socratic state: clear; 日志上下文可按现有风格自主决定。
- Spec:
  - Outcome: upload success/failure 都有 artifact identity 和 TOS destination 上下文。
  - Scope: 只改编排边界日志；不改 retry、credential、config，不做大重构。
  - Acceptance: 成功日志含产物身份和 TOS 目的地；失败日志含错误和调试上下文；上传结果语义不变。
  - Constraints: 使用隔离 worktree；遵守目标 repo `AGENTS.md`；可决定日志字段命名，retry 或 credential 行为需再问。
  - Claim boundary: 选定 repo 的实现级日志行为，不声明生产可观测性已生效。
  - Evidence: unit tests where practical, targeted go test, diff review.
- Risk tier: medium.
- Risks and assumptions: 假设 targeted Go tests 可运行；无法本地证明生产观测链路。
- Artifacts: durable spec: none; plan: none.
- Existing work: new work.
- Frame verdict: READY_FOR_ITERATION
- Next: enter goal-iterate.
```
