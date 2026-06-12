# Plan Template

仅当 `loop` 判断需要 durable dynamic plan 时使用。Plan 是当前执行视图和增量历史，不是 approval gate 或 waterfall。

Plan 不得重写 Goal Contract 的 intent、desired outcome、success criteria、non-goals、constraints、decision boundaries，或任何 active durable spec。

默认路径：

```text
docs/plans/YYYYMMDD-<slug>-plan.md
```

`<slug>` 命名 goal boundary，不命名实现方法。

创建或更新 plan 的条件：

- 多个独立 loop、模块、repo、submodule 或 ownership surface 需要 durable sequencing；
- 需要 chat history 之外的恢复或 handoff；
- 多 workstream 或 contested ownership 需要协调；
- migration、architecture、rollback、compatibility、evidence sequencing 决策需要持久化；
- loop evidence 推翻旧路线，新路线需要可追溯；
- 用户要求 plan、execution artifact、handoff route 或 status artifact。

无法写 artifact 时，在 Iteration Record 的 `Dynamic plan` 记录。

## Metadata

- Title:
- Status: draft | reviewed | approved | superseded
- Related Goal Contract:
- Related spec:
- Owner:
- Strongest material risk:
- Approval basis:
- Supersedes:
- Last updated:

## Current Strategy

用 2-5 句说明当前路线、关键 tradeoff，以及为什么这是最小可行路线。

## Active Boundary

- Included:
- Excluded:
- Claim boundary supported:

## Triggering Evidence

- Loop or event:
- Evidence:
- Decision:

## Execution Slices

| ID | Goal | Status | Dependencies | Evidence gate | Feedback route |
| --- | --- | --- | --- | --- | --- |
| S1 |  | pending | none |  |  |

Status: `pending`, `in_progress`, `done`, `blocked`, `superseded`。

## Decisions

- Decision:
  - Reason:
  - Evidence:

## Risks And Watchpoints

- Strongest material risk:
  - Mitigation:
  - Evidence needed:

## Verification Route

- Target-final-state checks:
- Commands or manual probes:
- Evidence that must be fresh after final material change:
- Checks intentionally out of scope:

## Change Log

- Version or time:
  - Changed:
  - Reason:
  - Evidence:

## Open Questions

-
