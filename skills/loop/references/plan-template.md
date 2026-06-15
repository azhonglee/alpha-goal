# Plan Template

Use only when `loop` needs a durable dynamic plan. A plan is the current execution view and incremental history; it is not an approval gate and must not rewrite the Goal Contract.

Default path:

```text
docs/plans/YYYYMMDD-<slug>-plan.md
```

Create or update a plan when:

- multiple independent loops, modules, repos, submodules, or ownership surfaces need sequencing;
- recovery or handoff must survive chat history loss;
- migration, architecture, rollback, compatibility, or evidence sequencing decisions need persistence;
- loop evidence changes the route materially;
- user requests a plan, execution artifact, handoff route, or status artifact.

```text
# Plan

## Metadata
- Title:
- Status: draft | reviewed | approved | superseded
- Related Goal Contract:
- Related system model:
- Owner:
- Strongest material risk:
- Approval basis:
- Supersedes:
- Last updated:

## Current Strategy

2-5 sentences explaining the current route, key tradeoff, and why this is the smallest viable route.

## Active Boundary

- Included:
- Excluded:
- Claim boundary supported:
- Control law:
- Control variables:
- Variables held constant:

## Triggering Evidence

- Loop or event:
- Evidence:
- Decision:

## Execution Slices

| ID | Goal | Control law | Status | Dependencies | Evidence gate | Feedback route |
| --- | --- | --- | --- | --- | --- |
| S1 |  |  | pending | none |  |  |

Status values: pending, in_progress, done, blocked, superseded.

## Decisions

- Decision:
  - Reason:
  - Evidence:

## Risks and Watchpoints

- Strongest material risk:
  - Mitigation:
  - Evidence needed:

## Verification Route

- Target-final-state checks:
- Commands or manual probes:
- Evidence fresh after final material change:
- Checks intentionally out of scope:

## Change Log

- Time/version:
  - Changed:
  - Reason:
  - Evidence:

## Open Questions

-
```
