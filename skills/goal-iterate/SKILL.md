---
name: goal-iterate
description: 在已有 Goal Contract 下执行一轮有边界的 implementation iteration。用于 goal-frame READY_FOR_ITERATION 之后，执行 mutation preflight、隔离 worktree、最小 patch 和 evidence-producing changes。
---

# Goal Iterate

你的职责是在 Goal Contract 约束下完成一轮最小有效变更，并产生可供 `goal-verify` 裁决的证据。不要重定义目标；如果合同错误或不完整，返回 `REFRAME_NEEDED`。

## 资源加载

- 修改任何目标文件前运行 `scripts/mutation-preflight.sh`。
- 输出前读取 `references/iteration-record-schema.md`。
- 只有执行需要跨多轮、跨模块、跨 agent 或高风险路线时读取 `references/plan-template.md`。

## Entry Requirements

必须满足：

- Goal Contract 存在。
- `Frame verdict` 是 `READY_FOR_ITERATION`。
- 目标仓库、路径和 ownership boundary 已闭合。
- 项目 `AGENTS.md` 和更近目录规则已识别。
- mutation preflight 已记录。
- 隔离修改路径已知，或能在目标闭合后安全建立。

缺少任一项时不要修改目标文件。

## Mutation Preflight

修改前记录：

- git root、当前分支、dirty state。
- worktree list、primary checkout、当前 checkout 是否 linked worktree。
- 当前 checkout 是否 primary `main`/`master`。
- `.worktrees/` 是否被 ignore。
- nested repo/submodule 和适用 `AGENTS.md`。
- `mutation_allowed` 结论。

默认禁止：

- 在 primary `main`/`master` checkout 编辑目标文件。
- 在 primary `main`/`master` checkout 直接创建任务分支后编辑。
- 目标仓库未闭环前创建 branch/worktree。
- Goal Contract 不存在时 mutation。

建立隔离 worktree 只允许在目标仓库闭环后进行。若仓库规则要求 repository-local worktree，优先使用 `<repo>/.worktrees/codex/<task-slug>/`，并确保 `.worktrees/` 已被 ignore；若技术上不可用，记录替代路径和原因。

## Iteration Rules

- 只做能推进一个或多个 acceptance item 的最小变更。
- 优先添加或运行能产出验证证据的测试、检查或探针。
- 不要声明完成。
- 不要扩大 scope；需要扩大时返回 `REFRAME_NEEDED`。
- 如果发现已有工作改变任务性质，停止并返回 `REFRAME_NEEDED`。
- 失败尝试要记录假设和证据；同一失败线程三次无效后停止 patch，回到 frame 或 verify。

## 输出

每轮只输出一个 Iteration Record。`Iterate verdict` 只能是：

- `ITERATION_READY_FOR_VERIFY`
- `BLOCKED`
- `REFRAME_NEEDED`
