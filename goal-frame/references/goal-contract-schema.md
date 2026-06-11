# Goal Contract Schema

The Goal Contract is intentionally compact. It should be short enough to write before everyday coding tasks, but complete enough to prevent unsafe mutation and overclaiming.

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

## Field definitions

### Intent

What the user wants, restated as an implementation goal.

### Target

Repo, package, service, module, path, or read-only object under consideration. In multi-repo work, include candidates checked and why the selected target wins.

### Acceptance

Observable conditions that define completion. Prefer product-facing behavior over internal implementation details when the user phrase is product-facing.

### Non-goals

What should not be changed, migrated, refactored, optimized, or claimed.

### Constraints

Project rules, worktree requirements, compatibility requirements, time/environment limits, ownership boundaries, and user constraints.

### Decision boundaries

What Codex may decide independently and what needs user confirmation before mutation or final claims.

### Assumptions and risks

Separate observed facts from assumptions. Record meaningful risks such as missing environment, unverified integration behavior, destructive operations, ownership uncertainty, or broad blast radius.

### Risk tier

Use one of:

- `low`: bounded docs, prompt, local wording, or mechanical edits with no behavior or contract impact.
- `medium`: bounded behavior, integration, CLI, UI, or maintainability change without high-risk triggers.
- `high`: security, destructive/remote state, production/compliance/PII, public API, persisted schema, billing, permissions, tenant isolation, or irreversible behavior.

### Claim boundary

The maximum final claim that evidence must support. Examples:

- reducer-level behavior only;
- API endpoint behavior;
- full product event stream lifecycle;
- read-only comparison only;
- implementation prepared but not runtime-verified because environment is unavailable.

### Evidence plan

What evidence should prove acceptance. Include tests, builds, static checks, manual probes, diff review, MR comparison, or explicit reason a check cannot run.

### Artifacts

Durable artifacts that later stages must read before relying on them.

Use `spec: none` for small tasks. When a spec exists, record path and status, for example:

```text
spec: `docs/design/20260611-install-flow-spec.md` (approved)
```

If a durable plan is already clearly needed, record the reason without creating it in frame:

```text
plan need: likely, because work crosses two repos and needs staged verification
```

### Existing work

Whether existing MR/PR/branch/issue/design work exists and how it relates to the task.

### Frame verdict

One of: `READY_FOR_ITERATION`, `ASK_USER`, `READ_ONLY`, `COMPARISON_ONLY`, `BLOCKED`.

### Next

The next state/action: enter `goal-iterate`, ask user, perform read-only answer, compare existing work, or stop.

## Example: multi-repo implementation

```text
Goal Contract:
- Intent: Add logs around artifact upload to TOS so upload attempts and failures are diagnosable.
- Target: `anyclaw_agent`; candidates checked: `anyclaw_agent`, `anyclaw_agent_runtime`; selected because artifact app service and upload orchestration live here, runtime only has low-level TOS driver.
- Acceptance:
  1. Successful upload logs include artifact identity and TOS destination at the orchestration boundary.
  2. Failed upload logs include error and enough context to debug.
  3. Existing behavior and upload result semantics are unchanged.
- Non-goals: No retry behavior change; no credential/config changes; no broad refactor.
- Constraints: Must use isolated worktree; must follow selected repo `AGENTS.md`; must check existing MR with similar title before implementation.
- Decision boundaries: Codex may choose exact log wording inside existing style; user confirmation needed for retry or credential behavior changes.
- Assumptions and risks: Assumes test environment can run targeted Go tests; production observability is not available locally.
- Risk tier: medium.
- Claim boundary: Implementation-level logging behavior in selected repo, not production observability confirmation.
- Evidence plan: unit tests where practical, targeted go test, diff review, existing MR scan.
- Artifacts: spec: none; plan need: not yet.
- Existing work: Search required before mutation because feature wording looks like an MR-sized task.
- Frame verdict: READY_FOR_ITERATION
- Next: Run goal-iterate in isolated edit path.
```
