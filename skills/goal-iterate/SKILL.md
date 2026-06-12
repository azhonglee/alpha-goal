---
name: goal-iterate
description: Stage skill for the goal-loop package. 在已有 Goal Contract 下执行一轮 bounded loop：dynamic planning、execution、feedback，并按 loop type 选择 debug、implementation、read-only discovery、hardening 或 feedback handling 的证据形状。Use only when explicitly named by the user or selected by goal-loop after goal-frame is READY_FOR_ITERATION.
---

# Goal Iterate

你的职责是在现有 Goal Contract 下推进一轮有限循环。不要重定义 goal；如果 contract、target、spec 或 claim boundary 被新证据推翻，停止并返回 `REFRAME_NEEDED`。

每轮固定三段：

1. `Dynamic planning`：选择本轮最小切片、证据门槛、隔离路径和 loop mode。
2. `Execution`：按切片执行 mutation、只读探索、debug probe、测试或补证据。
3. `Feedback`：解释结果，吸收用户/reviewer/测试反馈，决定继续、pivot、reframe 或 verify。

## Entry requirements

mutation 前必须满足：

- Goal Contract 存在，且 `Frame verdict: READY_FOR_ITERATION`；
- `Loop type`、`Target`、`Spec`、`Acceptance`、`Claim boundary` 清楚；
- applicable local rules 已读取；
- mutation preflight 已记录；
- isolated edit path 已知，或可作为第一步 setup mutation 创建；
- risk tier 和 evidence floor 已知；
- repo、worktree、submodule、ownership boundary 已理解；
- `.worktrees/`、`.goal-loop/` 或替代路径已 gitignored 或显式批准；
- active durable spec/plan 如存在已读取。

缺任一项，不要 mutation。

## Mutation Preflight Gate

任何会改变文件、分支、worktree、commit、remote、dependency、generated artifact 或 runtime state 的命令前，记录：

```text
Mutation Preflight:
- git root:
- current branch:
- status:
- worktree list:
- primary checkout:
- isolated edit path or setup target:
- applicable rule files:
- nested repos/submodules:
- active spec:
- active plan:
- loop type:
- risk tier:
- evidence floor:
- baseline health:
- mutation allowed:
```

可用 `scripts/mutation-preflight.sh` 收集只读 git 状态；再补最小 baseline health check。若 baseline 失败，记录命令和 scope 判断，不要把后续失败自动归因于本轮。

若当前在 primary checkout 且没有 isolated edit path，ITERATE 只能在 contract target 闭合、规则允许、worktree root 已忽略或批准时，把创建 `.worktrees/codex/<task-slug>/` 作为第一步 setup mutation。进入隔离 worktree 后，再更新 preflight 才能改实现文件。

按需加载引用：

- `references/worktree-safety.md`：创建或验证隔离编辑路径。
- `references/execution-boundaries.md`：subagents、ownership、submodule、generated output 或用户未提交改动相关。
- `references/loop-modes.md`：按 loop type 选择 mode、debug/TDD/spike/hardening 证据。
- `references/plan-template.md`：需要 durable dynamic plan。
- `references/iteration-record-schema.md`：输出字段不清时。

## Loop type to mode

- `NEW_GOAL`：通常用 `implementation` 或 `tdd`；先做最小 acceptance slice。
- `DEBUG_GOAL`：先用 `debug`，未 `ROOT_CAUSE_CONFIRMED` 不做修复声明。
- `CONTINUE_GOAL`：根据反馈用 `implementation`、`hardening`、`refactor` 或 `discovery`。
- `READ_ONLY_DISCOVERY`：只用 `discovery` 或 `spike`，不 mutation，产出 bounded findings。
- `VERIFY_CLAIM` 返回补证据时：用 `hardening` 或 `evidence_audit` 型 loop 补最后缺口。

允许的 loop mode：

- `discovery`
- `debug`
- `tdd`
- `implementation`
- `refactor`
- `spike`
- `hardening`

每轮都记录 hypothesis、evidence type、learning、decision。

## Dynamic planning

动态规划不是 waterfall plan。它只回答本轮：

- 最小可推进 acceptance 是什么；
- 需要什么 fresh evidence；
- 哪些文件/模块/ownership boundary 可碰；
- 成功、失败、用户反馈分别如何路由；
- 是否需要 durable plan。

只有跨多个独立 loop、模块、repo、handoff、恢复、rollback/compatibility 决策或用户要求时，才读取 `references/plan-template.md` 并创建/更新 plan。普通小 patch 不需要 durable plan。

## Execution

- 做最小 coherent change；
- 优先产生证据：测试、断言、lint/typecheck/build、runtime/manual probe、diff review；
- 保持在 claim boundary 内；
- 保留无关用户改动；
- 发现 target/entity/API/log 与 contract 不符时停止并返回 `REFRAME_NEEDED`；
- debug 不从猜测根因直接 patch；先收集可证伪证据；
- 三次同一 failure thread 没有新证据时，进入 feedback 判断，必要时用显式 `goal-review`。

禁用，除非用户明确要求且风险已记录：

- 在 primary `main`/`master` checkout 编辑或删文件；
- 在 primary `main`/`master` checkout 内 `git checkout -b` 或 `git switch -c`；
- target 未闭合前创建 branch/worktree；
- 修改未被 Goal Contract 选中的 candidate repo；
- 未授权跨 repo/worktree/submodule/ownership boundary mutation；
- unrelated cleanup/refactor；
- 从 ITERATE 直接声明最终完成。

## Feedback

反馈阶段统一处理：

- test/build/lint/probe 输出；
- reviewer/user feedback；
- 新发现的 target、scope、entity、API/log 证据；
- implementation risk、missing evidence、claim-boundary gap；
- active spec/plan 是否过时。

反馈决策：

- `continue`：本路线有效，下一轮继续。
- `pivot`：证据推翻路线，返回 `REFRAME_NEEDED` 或改 dynamic plan。
- `expand`：goal 仍有效但 scope 扩大；通常需要 frame/review。
- `harden`：核心行为完成但风险/证据不足。
- `finish`：acceptance 看似满足，进入 verify。

当反馈涉及复杂架构、scope、ownership、review 争议或 claim-boundary 风险，可加载 `goal-review` 做独立挑战；否则在 Iteration Record 内完成反馈处理。

## Debug receipt

`debug` mode 必须关闭诊断路径后才能修复声明：

- `ROOT_CAUSE_CONFIRMED`
- `NOT_REPRODUCED`
- `BLOCKED`

只有 `ROOT_CAUSE_CONFIRMED` 授权修复 action。低风险纯函数/单分支 bug 可用紧凑 receipt；非平凡 RCA 要包含 problem-space decomposition、competing hypotheses、entity/interface/log alignment、root-cause validation 和最小 fix surface。

## Output

产出一个 Iteration Record：

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

Allowed `Iterate verdict` values:

- `ITERATION_READY_FOR_VERIFY`
- `ITERATION_CONTINUES`
- `ITERATION_READY_FOR_REVIEW`
- `BLOCKED`
- `REFRAME_NEEDED`

不要在 Iteration Record 中做 final completion claim；完成判断交给 `goal-verify`。
