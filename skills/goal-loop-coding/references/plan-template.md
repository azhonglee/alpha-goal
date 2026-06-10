# Plan Template

Use this template only when Loop evidence shows execution needs a durable route. Keep it tied to the Goal or spec, but treat it as a Loop-owned artifact.

A plan forecasts upcoming loops. It is provisional, evidence-driven, and supersedable. It must not redefine Goal intent, success criteria, non-goals, decision boundaries, or acceptance.

## Metadata

- Title:
- Version:
- Status: draft | reviewed | approved | superseded
- Related Goal:
- Related spec:
- Source artifact revision:
- Owning loop:
- Supersedes:
- Risk tier: low | medium | high
- Last updated:

Status semantics:

- `draft`: route is being shaped; do not execute as approved plan
- `reviewed`: route passed readiness review for the recorded revision
- `approved`: accepted or clear enough within decision boundaries to execute
- `superseded`: historical route only

## Goal Link

Which Goal or spec does this plan execute, without redefining it?

## Active Boundary

- Included scope:
- Excluded scope:
- Claim boundary this plan supports:

## Triggering Evidence

What loop evidence made a durable plan necessary?

- Loop:
- Evidence:
- Decision:

## Strategy

What is the current route, and why is it the smallest route that can satisfy the Goal?

## Non-Strategy

What tempting approaches are intentionally not being used?

## Revision Policy

What evidence should update or supersede this plan?

- Update when:
- Supersede when:
- Keep unchanged when:

## Repository Boundaries

- Primary repo:
- Repository root:
- Current branch:
- Linked worktree: yes | no | unknown
- Dirty worktree state:
- Nested repos/submodules affected:
  - Path:
  - Root:
  - Branch or detached HEAD:
  - Dirty state:
  - Applicable AGENTS.md files:
- Cross-boundary edits:
- Applicable AGENTS.md files:

## File Ownership Map

| Path or area | Create/modify/test/read-only | Owner loop/task | Rationale |
| --- | --- | --- | --- |
|  |  |  |  |

## Work Loops

| Task ID | Loop | Mode | Ownership surface | Dependencies | Parallel safe | Risk tier | Objective | Evidence gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | 1 | discovery |  | none | yes/no |  |  |  | planned |
| T2 | 2 | tdd |  | T1 | yes/no |  |  |  | planned |
| T3 | 3 | implementation |  | T2 | yes/no |  |  |  | planned |

Split tasks when they touch unrelated ownership surfaces, require different evidence, hide dependencies, or are unsafe to parallelize. Merge steps when splitting would only add ceremony.

## Architecture Notes

- Boundaries affected:
- APIs/contracts affected:
- Dependencies introduced or avoided:
- Compatibility constraints:

## Test And Verification Plan

- Target-final-state verification:
- Commands or artifact checks:
- Expected exit status/output:
- Behavior evidence plan:
- RED/GREEN or substitute contract check:
- Checks that are intentionally out of scope:

Avoid verification that depends on deleted paths, self-matching greps, checks that only validate pre-change layout, or mock-only tests that miss the claim.

## Risk And High-Risk Trigger Scan

- Risk tier:
- Tier rationale:
- High-risk triggers present: yes | no
- Trigger details:
- Evidence floor:
- Additional review required:

## Rollback Or Recovery

-

## Risks And Mitigations

- Risk:
  - Mitigation:
  - Evidence needed:

## Review Gates

- Plan readiness review:
  - Status: not-run | pass | fail | blocked
  - Evidence:
  - Artifact revision:
- Code review:
  - Required: yes | no
  - Evidence:
- Architecture review:
  - Required: yes | no
  - Evidence:
- Scope review:
  - Required: yes | no
  - Evidence:
- Completion review:
  - Required evidence:

Any substantive plan change invalidates previous readiness evidence for the changed boundary until re-reviewed.

## Placeholder Scan

Fail the plan if execution depends on placeholders, hidden chat context, or generic tasks.

- Undefined work:
- Ambiguous task text:
- TODO/TBD markers:
- Generic verbs without concrete scope:
- Hidden context required:

Bad placeholder examples: `add validation`, `handle errors`, `update tests`, `implement logic`, `similar to Task 2`, `TBD`, `TODO`.

## Self-Review

- Source alignment:
- Goal/spec coverage:
- File ownership clarity:
- Task executability:
- Verification credibility:
- Risk tier and high-risk scan:
- Placeholder scan:
- Hidden-context risk:
- Execute handoff notes:

## Receipts And Blockers

- Receipt status: PASS | FAIL | BLOCKED | not-run
- Accepted concerns:
- Unresolved concerns:
- Blocker classification:
- Conflict Report, if needed:

## Plan Changes

- Version:
  - Changed:
  - Reason:
  - Evidence:

## Open Questions

-
