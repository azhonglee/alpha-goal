---
name: goal-loop
description: 统一路由 non-trivial read-only、coding、debug、review-feedback、verification 等 evidence-bound engineering tasks。Use when task needs target/evidence-boundary discovery, mutation, active goal continuation, feedback handling, verification, completion claims, or recovery. Do not use for trivial read-only explanation, ordinary standalone review, simple diff review, summarization, or advisory answers when no target/rule/evidence discovery, active goal, mutation path, or completion claim is in scope.
---

# Goal Loop Router

`goal-loop` 只做轻量意图识别和入口选择，不替代阶段技能执行。

默认主路径：

```text
INTENT -> FRAME -> ITERATE(dynamic plan -> execution -> feedback) -> VERIFY -> FINAL
                    ^--------------------------------------------|
```

`goal-review` 是显式辅助审查技能；只有用户点名、仓库规则要求，或反馈/架构风险需要独立挑战时才加载。普通反馈优先进入 `goal-iterate` 的 feedback phase。

## 意图识别

先判断 loop type，再选择入口。Loop type 表示用户最终目标，不表示当前阶段是否允许写文件；不要发明组合值。用户要求“先 frame，不要改文件”的实现型需求仍是 `NEW_GOAL` 或 `DEBUG_GOAL`，只是当前入口停在 FRAME。

- `NEW_GOAL`：新需求、目标不清、可能要改代码、需要澄清验收或边界。入口 `goal-frame`。
- `DEBUG_GOAL`：bug、失败、根因、异常现象。入口 `goal-frame`；后续 `goal-iterate` 使用 debug-oriented loop。
- `CONTINUE_GOAL`：已有 Goal Contract，需要继续实现、补证据、处理失败检查或用户反馈。入口 `goal-iterate`，缺 contract 时回 `goal-frame`。
- `READ_ONLY_DISCOVERY`：最终目标就是只读审计、诊断、比较或方向判断，需要 target、local-rule、existing-work 或 evidence-boundary discovery。入口 `goal-frame`，然后在只读边界内返回 findings, evidence, recommendations, and residual uncertainty。
- `VERIFY_CLAIM`：用户问是否完成、是否 ready、是否可交付，或最终回复将包含完成声明。入口 `goal-verify`；缺 Goal Contract/证据边界时回 `goal-frame`。
- `RECOVERY`：上下文中断、脏工作区、已有未完成改动或阶段记录。先做 recovery check，再进入 `goal-frame`、`goal-iterate`、`goal-verify` 或 `BLOCKED`。

绕过 Goal Loop：

- trivial read-only explanation、总结、普通 standalone review、简单 diff review；
- 没有目标/规则/证据边界发现需求、没有 active goal、没有 mutation path、没有 completion claim 的 advisory answer。

## Stage loading

当用户显式要求审计、比较或验证本技能包、SKILL.md、references、docs、installer 或 validator，把这些文件当成目标 evidence bundle；读取所有直接相关文件，不用懒加载。

`goal-loop` 是唯一适合隐式触发实现工作的技能。进入阶段前读取对应 sibling `SKILL.md`：

- FRAME: `../goal-frame/SKILL.md`
- ITERATE: `../goal-iterate/SKILL.md`
- VERIFY: `../goal-verify/SKILL.md`
- REVIEW: `../goal-review/SKILL.md`，仅在显式辅助审查触发时读取。

如果阶段文件缺失，先报告 blocker，不要凭记忆补规则。

## Domain skill coexistence

当另一个显式点名或仓库要求的 domain skill 适用时，用 Goal Loop 管路由、隔离、mutation safety、证据和最终声明；用 domain skill 管任务特定设计、编辑和验证约束。FRAME 记录 domain skill 对 acceptance、constraints、non-goals、evidence plan 的影响；ITERATE 在闭合 target boundary 内应用它；VERIFY 把它的验证要求当成证据。

## 全局不变量

- No Goal Contract, no implementation mutation.
- No target boundary, no implementation mutation.
- No isolated edit path or approved first-step isolation setup, no implementation mutation.
- No Verification Verdict, no final completion claim.
- No final claim may exceed the verified claim boundary.
- 不默认创建 durable spec 或 plan；只有风险、复杂度、handoff、恢复需要或用户要求时升级。
- Goal Contract 必须包含 `Spec` 字段；小任务使用内联 compact spec，复杂任务可引用 durable spec。
- In Goal Loop, `Artifacts` means loop-owned process artifacts such as specs, plans, reviews, evidence, or scratch files; do not use it to enumerate product-domain objects.
- root-cause claim needs debug evidence that validates the root-cause statement, not merely a plausible patch location. `NOT_REPRODUCED` 和 `BLOCKED` 只支持诊断声明，不支持修复完成声明。
- 仓库 mutation 必须走隔离编辑路径。默认使用选定 repo 或 subrepo 下 `.worktrees/codex/<task-slug>/`，除非项目规则更严格或技术上不可用。
- Before using `.worktrees/` or `.goal-loop/`, confirm the path is gitignored or record explicit approval for the alternative. Never edit directly in a primary `main`/`master` checkout.
- 不主动把隔离任务分支 merge 回 `main`/`master`，也不在 PR/MR 或本地 merge 完成前清理 worktree。

## 默认 artifact 位置

优先沿用目标仓库约定；没有约定时使用：

- spec: `docs/design/YYYYMMDD-<slug>-spec.md`
- plan: `docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt: `.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence: `.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts: `.goal-loop/tmp/YYYYMMDD-<slug>/`

`<slug>` 命名 goal boundary。不要创建空 artifact 目录。

## 路由规则

进入 `goal-frame`：

- 新 goal、目标或验收不清、可能 mutation、需要 Discovery/Socratic interview；
- target 可能是页面、空间、工作区、容器或 umbrella concept，需要拆分子模块、数据实体和 source API；
- workspace 有多个 repo/submodule，或可能重复已有 MR/PR/branch/issue/design；
- verify 返回 `REFRAME`，或 recovery 发现 contract/target/evidence 不可靠。

进入 `goal-iterate`：

- Goal Contract 存在，`Frame verdict: READY_FOR_ITERATION`；
- target repo/path 已闭合，mutation 或补证据需要继续；
- loop type 已记录，且可建立隔离编辑路径；
- active spec/plan 如存在已读取，或明确不需要。

进入 `goal-verify`：

- implementation 看起来完成；
- 用户问 done/ready/ship/merge/correct/safe；
- 最终回复将包含完成、交付、正确性、安全性或 MR/PR-ready 声明；
- `goal-iterate` 的 feedback phase 给出 `ITERATION_READY_FOR_VERIFY`。

进入 `goal-review`：

- 用户显式点名 `$goal-review`；
- 仓库规则要求独立 review；
- feedback phase 判断有架构、scope、ownership、复杂度或 claim-boundary 风险，需要独立挑战。

## Recovery routing

恢复中断状态时先检查：

- current repo / branch / status / changed files；
- last known Goal Contract、Spec、Plan、Iteration Record、Verification Verdict；
- 是否有用户未提交改动或跨 repo/submodule 边界；
- safest next state: `FRAME`, `ITERATE`, `VERIFY`, `REVIEW`, or `BLOCKED`。

状态不明显时读取 `references/recovery-check.md`。

## Router output

路由不明显时输出：

```text
Route:
- loop type:
- entry:
- reason:
- blocking missing input:
- next action:
```

不要为 trivial read-only 问题输出 route record。

## Final output rule

任何完成声明必须基于最新 Verification Verdict。

非完成出口不需要 Verification Verdict，例如 `ASK_USER`、`READ_ONLY`、`COMPARISON_ONLY`、`BLOCKED`；这类最终输出只能报告边界、发现、比较结论或 blocker，不得声称实现完成。
