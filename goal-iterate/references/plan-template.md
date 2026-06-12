# Plan Template

Use only when `goal-iterate` decides a durable route is needed. A plan is not a required approval step or waterfall phase; it is the current execution view plus incremental history.

A plan states how to proceed now, the next step, evidence, and risks. It must not rewrite Goal Contract or active spec goals, success criteria, non-goals, or decision boundaries.

Prefer existing repo plan conventions. If none exist, use `docs/plans/YYYYMMDD-<slug>-plan.md`; `<slug>` names the goal boundary, not the implementation method.

A plan is Loop-owned: forecast upcoming loops, evidence gates, review gates, and current state; update when evidence changes the route; mark invalid routes as `superseded` instead of silently rewriting them. Before each iteration, read any active plan. After each material iteration, update plan status, slice state, evidence link, or change log before later stages rely on it.

Create or update a plan when loop evidence shows any condition holds:

- independent loops, modules, repos, submodules, or ownership surfaces need durable sequencing, coordination, or later resumption;
- execution needs dependent slices and later work must resume without chat history;
- multiple workstreams or contested ownership surfaces need coordination;
- migration, architecture, rollback, compatibility, or evidence sequencing decisions must persist;
- earlier loop evidence invalidated the route and the new route must be traceable;
- the user asks for a plan, execution artifact, handoff route, or status artifact.

If artifact writes are not allowed, record the plan in the Iteration Record and state that no file was written.

## Metadata

- Title:
- Status: draft | reviewed | approved | superseded
- Related Goal Contract:
- Related spec:
- Owner:
- Risk tier: low | medium | high
- Approval basis:
- Supersedes:
- Last updated:

Status:

- `draft`: route is still forming; use only as a working draft.
- `reviewed`: readiness or direction was checked; not automatically approved.
- `approved`: user accepted, or clear enough within recorded decision boundaries; record approval basis.
- `superseded`: history only; do not execute against it.

## Current Strategy

State the current route, key tradeoffs, and why it is the smallest viable route in 2-5 sentences.

## Active Boundary

- Included:
- Excluded:
- Claim boundary supported:

## Triggering Evidence

What evidence made a durable plan necessary?

- Loop or event:
- Evidence:
- Decision:

## Execution Slices

| ID | Goal | Status | Dependencies | Evidence gate | Review gate |
| --- | --- | --- | --- | --- | --- |
| S1 |  | pending | none |  |  |

Allowed status: `pending`, `in_progress`, `done`, `blocked`, `superseded`.

## Decisions

Append decisions that affected the route.

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

Append route changes. The current view may change, but historical reasons must remain.

- Version or time:
  - Changed:
  - Reason:
  - Evidence:

## Open Questions

-
