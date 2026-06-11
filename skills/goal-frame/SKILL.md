---
name: goal-frame
description: 在编码前构建紧凑 Goal Contract。用于 ambiguous requirements、unclear target repo/path、多仓库、已有 MR/PR/branch discovery、acceptance criteria、claim boundary 和 clarification。不得修改文件。
---

# Goal Frame

你的职责是把用户请求转成可执行的 Goal Contract。不要编辑文件、创建分支、创建 worktree、生成持久化 artifact 或提交代码。

## 资源加载

- 准备输出前读取 `references/goal-contract-schema.md`。
- 存在澄清风险时读取 `references/clarification-policy.md`。
- 只有需要草拟需求规格格式，或用户明确要求持久化 spec 时读取 `references/spec-template.md`；本阶段默认不写文件。

## Discovery

只收集安全确定目标边界所需的信息：

- 用户意图、期望结果和成功信号。
- 目标仓库、目标路径、子仓库和 worktree 边界。
- 适用的 `AGENTS.md`、项目规则、测试约定和交付规则。
- 相关已有 MR/PR/分支/设计文档/计划。
- acceptance、non-goals、constraints、decision boundaries。
- risk tier、claim boundary、evidence plan。

## 多仓库目标门禁

如果当前目录像 workspace、聚合仓库、monorepo，或存在多个候选仓库：

- 不要修改任何文件。
- 检查候选仓库的正向证据。
- 记录非选中仓库的排除或延后理由。
- 目标仓库没有闭环前，不得进入 mutation。

## Existing Work Scan

以下情况必须扫描已有工作：

- 用户提到 MR、PR、issue、branch、设计文档或已有实现。
- 请求像跟进、补充、修复、实现、对比或审查。
- 可用内部协作工具，且任务可能已经有协作产物。
- 最终输出可能创建 MR/PR。

记录任务性质：`new_work`、`follow_up`、`duplicate`、`alternative_implementation` 或 `comparison_only`。

## 澄清策略

不要遇到一点不确定就问用户。只有以下情况必须问：

- 目标仓库或目标路径不确定，且错误选择会改错地方。
- 验收语义不确定，且不同解释会导致不同实现。
- 操作可能破坏数据、历史、配置、权限或主分支。
- 用户要求和项目规则冲突。
- 需要用户在已有 MR、新实现、对比评审之间做选择。

其他可从代码、`AGENTS.md`、脚本或只读 discovery 推断的细节，记录为 assumptions 或 risks。

## 输出

每次退出只输出一个 Goal Contract。`Frame verdict` 只能是：

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

若 verdict 是 `READY_FOR_ITERATION`，`Next` 必须给出进入 `goal-iterate` 的最小目标。若 verdict 是 `COMPARISON_ONLY`，`Next` 必须进入 `goal-verify`。
