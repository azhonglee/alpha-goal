---
name: goal-frame
description: Build a compact Goal Contract before coding, and create or update a durable spec artifact only when risk or complexity requires it. Use for ambiguous requirements, unclear target repo/path, multi-repo workspaces, existing MR/PR/branch discovery, acceptance criteria, claim boundary, clarification, and spec escalation.
---

# Goal Frame

Your job is to turn the user's request into a compact Goal Contract.

Do not edit implementation files, create branches, create worktrees, commit, push, or open an MR/PR.

只有在下方 spec escalation 规则要求，且本任务允许写入 artifact 时，才创建或更新持久化 spec 文件。否则只在对话里保留 spec 草稿。

## Entry

Use this skill when:

- the task is new or non-trivial;
- the target repo/path is unclear;
- the workspace has multiple candidate repos;
- the request may overlap an existing MR/PR/branch/issue/design doc;
- acceptance criteria or claim boundary are unclear;
- verification returned `REFRAME`.

## Discovery scope

Collect only the information needed to decide whether the task is safe to execute.

Check:

- user intent;
- target repo/path/service/module;
- applicable local rules such as `AGENTS.md` or `CLAUDE.md`;
- candidate repos when cwd is a workspace or aggregator;
- existing work when likely;
- acceptance criteria;
- non-goals;
- constraints;
- decision boundaries;
- assumptions and risks;
- risk tier;
- evidence plan;
- claim boundary.
- 是否需要持久化 spec artifact。

Use `references/goal-contract-schema.md` for field definitions and `references/frame-examples.md` for compact examples. 仅当需要持久化 spec artifact 时使用 `references/spec-template.md`。Examples are illustrative only; do not copy their repo names, paths, or facts as evidence for the current task.

## Spec escalation

默认不要创建 spec。小型、本地、低风险任务只需要 Goal Contract。

当至少满足一个条件时，使用 `references/spec-template.md` 创建或更新 spec：

- 需求经过多轮澄清，继续只放在对话里容易丢失；
- 范围跨多个阶段、模块、仓库、worktree 或 ownership boundary；
- 预期需要外部交接、stakeholder review、PR/MR 讨论或后续恢复；
- acceptance、non-goals、constraints 或 decision boundaries 很细，只放 Goal Contract 会丢信息；
- risk tier 为 high，或 medium 且存在明显 scope drift 风险；
- 用户明确要求 spec、design artifact、持久化需求或交接文档。

优先使用仓库已有 spec/design 路径约定。没有约定时默认使用：

```text
docs/design/YYYYMMDD-<slug>-spec.md
```

`<slug>` 描述目标边界，不描述具体实现方法。

写入 spec 文件前，必须已经确认目标 repo/path 和适用规则；否则只在对话里起草。

当 spec 存在时：

- 生成或修订 Goal Contract 前先读取当前 spec；
- Goal Contract 保持紧凑，并在 `Artifacts` 里记录 spec 路径和状态；
- 后续阶段依赖变更后的需求前，先更新 spec；
- 过期 spec 标记为 `superseded`，不要删除或改写历史；
- 决策和变更历史只追加；只更新当前摘要、状态、open questions 和 acceptance state。

Spec status values:

- `draft`: 工作态需求；需要用户批准时不能视为已批准。
- `reviewed`: 已检查清晰度和证据，但不自动等同批准。
- `approved`: 用户已接受，或在记录的 decision boundaries 内足够明确，可以执行。
- `superseded`: 仅保留历史；不得继续作为当前执行依据。

## Clarification policy

Ask the user only when the answer changes the implementation or safety boundary.

Ask when:

- target repo/path is ambiguous and a wrong choice could mutate the wrong place;
- different interpretations imply different code changes;
- existing work may turn the task into follow-up, duplicate, or comparison-only work;
- a destructive or irreversible operation might be needed;
- user request conflicts with project rules;
- credentials, environment, or permissions are required.

Otherwise, record a bounded assumption and continue read-only discovery.

Use `references/clarification-policy.md` for edge cases.

## Multi-repo Target Gate

If cwd is a workspace, aggregator, monorepo, or contains multiple candidate repos:

- do not mutate anything;
- list the candidate repos or paths found by lightweight read-only checks;
- inspect candidate repos only as needed;
- record positive evidence for the selected repo;
- record exclusion or deferral reasons for non-selected repos;
- record applicable local rules for the selected repo.

Target selection is closed only when the selected repo/path has stronger evidence than alternatives.

Minimum read-only checks:

- identify the git root and current directory role;
- look one level down for candidate `.git` directories, worktrees, or package roots;
- search task keywords in candidate names, local branches, recent commits, and docs when cheap;
- read only the local rule files needed to decide target ownership.

If the user describes a multi-repo workspace but cwd is not enough to find candidates, return `ASK_USER` with the missing workspace or repo path. Return `BLOCKED` only when the needed data, permission, or tooling is unavailable after the target source is known.

## Existing Work Scan

Required when:

- user mentions MR/PR/issue/branch;
- the task sounds like follow-up, bugfix,补充,修复,实现,对比;
- internal collaboration tooling is available;
- final output may create MR/PR;
- feature keywords appear in local branches, commits, docs, or open work.

Record whether the task is:

- `new work`
- `follow-up`
- `duplicate`
- `alternative implementation`
- `comparison-only`
- `unknown`

## Goal Contract

Produce this exact compact contract:

```text
Goal Contract:
- Intent:
- Target:
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

Allowed `Frame verdict` values:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

## Exit rules

Return `READY_FOR_ITERATION` only when:

- target boundary is closed;
- acceptance is testable or otherwise verifiable;
- claim boundary is explicit;
- constraints, non-goals, and decision boundaries are recorded;
- assumptions, risks, and risk tier are recorded;
- existing work has been checked when triggered;
- durable spec need is recorded, and any referenced spec has current path/status;
- no required user decision is missing.

Return `ASK_USER` when a clarification is necessary before safe progress.

Return `READ_ONLY` when the task is purely explanatory/audit and does not need mutation.

Return `COMPARISON_ONLY` when the right next step is comparing existing work rather than implementation.

Return `BLOCKED` when required data, permission, or environment is unavailable.
