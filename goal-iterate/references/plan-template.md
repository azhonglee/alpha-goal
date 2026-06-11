# Plan Template

仅在 `goal-iterate` 判断需要持久化执行路线时使用。Plan 不是每个任务的前置审批，也不是瀑布流程；它是复杂任务里的当前执行视图和增量历史。

Plan 负责回答“现在怎么推进、下一步是什么、证据和风险在哪里”。它不得重写 Goal Contract 或 active spec 中的目标、成功标准、非目标和决策边界。

## Metadata

- Title:
- Status: draft | reviewed | approved | superseded
- Related Goal Contract:
- Related spec:
- Owner:
- Risk tier: low | medium | high
- Supersedes:
- Last updated:

Status 语义：

- `draft`: 正在形成的工作路线；只能作为当前工作草案。
- `reviewed`: 已经过 readiness 或方向检查，但不等于用户批准。
- `approved`: 用户已接受，或在记录的 decision boundaries 内足够明确，可以执行。
- `superseded`: 仅保留历史；不得继续作为当前执行依据。

## Current Strategy

用 2-5 句话说明当前路线、关键取舍、为什么这是满足目标的最小可行路线。

## Active Boundary

- Included:
- Excluded:
- Claim boundary supported:

## Triggering Evidence

什么证据说明这个任务需要持久化 plan？

- Loop or event:
- Evidence:
- Decision:

## Execution Slices

| ID | Goal | Status | Dependencies | Evidence gate | Review gate |
| --- | --- | --- | --- | --- | --- |
| S1 |  | pending | none |  |  |

Status 可用：`pending`、`in_progress`、`done`、`blocked`、`superseded`。

## Decisions

追加记录已经影响执行路线的决策。

- Decision:
  - Reason:
  - Evidence:

## Risks And Watchpoints

- Risk:
  - Mitigation:
  - Evidence needed:

## Verification Route

- Target-final-state checks:
- Commands or manual probes:
- Evidence that must be fresh after final material change:
- Checks intentionally out of scope:

## Change Log

追加记录路线变化；不要删除旧记录。当前视图可以更新，历史原因必须保留。

- Version or time:
  - Changed:
  - Reason:
  - Evidence:

## Open Questions

-
