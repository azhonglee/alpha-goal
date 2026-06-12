# Iteration Record Schema

Iteration Record 记录一轮 bounded loop。它不是最终验收，也不重写 Goal Contract。

```text
Iteration Record:
- Contract version:
- Loop type:
- Active artifacts:
- Dynamic plan:
- Loop mode:
- Hypothesis:
- Evidence type:
- Mutation preflight:
- Execution:
- Debug receipt:
- Feedback:
- Changed files:
- Local evidence:
- Learning:
- Decision:
- Acceptance delta:
- Risks introduced:
- Review needed:
- Iterate verdict:
- Next:
```

## Field definitions

### Contract version

本轮使用的 Goal Contract 引用。无显式版本时，用时间或简短摘要。

### Loop type

继承 Goal Contract：`NEW_GOAL`、`DEBUG_GOAL`、`CONTINUE_GOAL`、`READ_ONLY_DISCOVERY`、`VERIFY_CLAIM`、`RECOVERY`。

### Active artifacts

本轮读取或更新的 durable spec/plan/review/evidence。无 durable artifact 时写 `none`。包含 path、status、read/updated/created/superseded。

### Dynamic plan

本轮最小切片、证据门槛、允许触碰的边界、成功/失败/反馈路由。若使用 durable plan，写路径和本轮更新。

### Loop mode

`discovery`、`debug`、`tdd`、`implementation`、`refactor`、`spike`、`hardening`。见 `references/loop-modes.md`。

### Hypothesis

本轮要验证的具体假设。debug mode 下包含 competing hypotheses 或说明为何替代项不可信。

### Evidence type

`gate_evidence`、`advisory_audit`、`exploration_only`、`delta_review`、`evidence_audit`。

### Mutation preflight

概述 repo root、branch、status、worktrees、isolated edit path、baseline health、mutation allowed。相关 baseline 失败或无法运行时，记录命令和 scope decision。

### Execution

本轮实际动作：代码改动、只读探查、probe、测试、补证据或 blocker。避免长叙事。

### Debug receipt

非 debug 写 `none`。debug 写 `ROOT_CAUSE_CONFIRMED`、`NOT_REPRODUCED` 或 `BLOCKED`，并包含 symptom、reproduction/blocker、problem-space decomposition、hypotheses、probes、evidence、entity/interface/log alignment、root-cause statement、validation、fix surface、decision。

### Feedback

解释测试/用户/reviewer/运行结果如何改变路线：继续、pivot、expand、harden、finish、reframe 或 blocked。

### Changed files

只列本轮故意触碰的文件。

### Local evidence

命令、测试、probe、diff check 或 blocker evidence。

### Learning

证据证明或推翻了什么。

### Decision

`continue`、`pivot`、`expand`、`harden`、`finish`。

### Acceptance delta

哪些 acceptance 从 uncovered 变成 covered/partially covered，哪些仍 uncovered。

### Risks introduced

补丁引入的新风险：行为、兼容、测试缺口、并发、迁移、观测性。

### Review needed

普通反馈写 `no` 并说明已在 feedback phase 处理。复杂架构、scope、ownership、争议反馈或 claim-boundary 风险写 `yes`，进入显式 `goal-review`。

### Iterate verdict

`ITERATION_READY_FOR_VERIFY`、`ITERATION_CONTINUES`、`ITERATION_READY_FOR_REVIEW`、`BLOCKED`、`REFRAME_NEEDED`。

### Next

下一入口：通常是下一轮 `goal-iterate` 或 `goal-verify`；否则写 blocker/reframe/review。
