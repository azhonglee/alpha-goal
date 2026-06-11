# Spec Template

仅在 `goal-frame` 判断需要持久化需求 artifact 时使用。小任务继续只用 Goal Contract。

Spec 负责回答“做什么、为什么做、边界是什么、怎么算完成”。它不负责拆执行步骤，也不替代后续的 plan、Iteration Record、Review Record 或 Verification Verdict。

## Metadata

- Title:
- Status: draft | reviewed | approved | superseded
- Owner:
- Source request:
- Goal Contract:
- Risk tier: low | medium | high
- Claim boundary:
- Supersedes:
- Last updated:

Status 语义：

- `draft`: 需求还在形成中；需要用户批准时不能作为已批准执行依据。
- `reviewed`: 已检查清晰度和证据，但不等于用户批准。
- `approved`: 用户已接受，或在记录的 decision boundaries 内足够明确，可以执行。
- `superseded`: 仅保留历史；不得继续作为当前执行依据。

## Intent

为什么要做这个目标？

## Desired Outcome

完成后应出现什么用户可见或系统可见结果？

## Scope

In scope:

-

Out of scope:

-

## Success Criteria

-

## Acceptance Evidence

每条 success criterion 需要什么证据证明？

-

## Decision Boundaries

Codex 可以自行决定：

-

Codex 必须先询问用户：

-

## Constraints

-

## Assumptions And Risks

- Assumption:
  - Basis:
  - Risk if wrong:
- Risk:
  - Mitigation:

## Open Questions

-

## Brownfield Evidence

仅当现有代码、文档、测试、运行结果影响了需求判断时填写。

- Source:
  - Finding:
  - Impact:

## Change Log

追加记录已经影响执行的需求变化、澄清、边界调整或审批信息。不要删除旧记录；过期内容用 `superseded` 标记。

- Version:
  - Changed:
  - Reason:
  - Evidence:
