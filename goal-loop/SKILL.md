---
name: goal-loop
description: Route non-trivial coding tasks through goal-frame, goal-iterate, goal-review, and goal-verify. Use for multi-step coding tasks, ambiguous requirements, repository mutation, review feedback inside an active goal, verification, recovery, or completion claims; not for trivial read-only answers.
---

## Read-only bypass

Do not use Goal Loop for ordinary read-only explanation, code review, diff review, comparison, summarization, or advisory audit when no mutation or completion claim is requested.

# Goal Loop Router

Goal Loop is a staged execution protocol, not a long-form ritual.

Use the smallest stage that can safely advance the task.

```text
FRAME -> ITERATE -> REVIEW -> VERIFY -> FINAL
                  -> VERIFY
                  -> ITERATE
                  -> FRAME
                  -> BLOCKED
```

## Stage loading

`goal-loop` is the only skill that should trigger implicitly for implementation work. Before executing a stage, read that stage's sibling `SKILL.md` directly:

- FRAME: `../goal-frame/SKILL.md`
- ITERATE: `../goal-iterate/SKILL.md`
- REVIEW: `../goal-review/SKILL.md`
- VERIFY: `../goal-verify/SKILL.md`

If a referenced stage file is unavailable, stay within this router, use the compact output contracts in `README.md`, and report the missing file as a blocker before mutating.

## Global invariants

- No Goal Contract, no mutation.
- No target boundary, no mutation.
- No isolated edit path, no mutation.
- No unsupported review or verification conclusion without evidence.
- No continuing past review feedback, complexity, scope expansion, uncertainty, or completion-readiness review triggers without a current Review Record.
- No Verification Verdict, no final completion claim.
- No final claim may exceed the verified claim boundary.
- Do not create spec or plan by default; escalate only for risk, complexity, handoff, or user request.
- Read the current version and status before relying on any spec or plan.
- Do not execute from a `superseded` artifact. Do not treat `draft` as approved when approval is required.
- A plan must not redefine Goal Contract or active spec intent, success criteria, non-goals, constraints, or decision boundaries.
- A bug-fix claim needs debug evidence. `NOT_REPRODUCED` and `BLOCKED` support diagnostic claims only, not repair completion.

## Artifact locations

Prefer existing repo conventions. If none exist, use:

- spec: `docs/design/YYYYMMDD-<slug>-spec.md`
- plan: `docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt: `.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence: `.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts: `.goal-loop/tmp/YYYYMMDD-<slug>/`

`<slug>` names the goal boundary. Do not create empty artifact directories. Before writing `.goal-loop/`, confirm it is gitignored; otherwise record the risk in the Goal Contract or Iteration Record.

## Routing

### Start in FRAME

Use `goal-frame` when any of these is true:

- the task is new or non-trivial;
- the user request is ambiguous;
- the target repo, package, service, or path is unclear;
- the workspace may contain multiple repos or submodules;
- the task may duplicate an existing MR/PR/branch/issue/design doc;
- mutation may be needed;
- previous verification returned `REFRAME`.
- durable requirements may be needed before safe iteration.

`goal-frame` exits with one of:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

### Enter ITERATE only after FRAME is closed

Use `goal-iterate` when all are true:

- a Goal Contract exists;
- `Frame verdict` is `READY_FOR_ITERATION`;
- target repo/path is closed;
- mutation is required;
- the isolated edit path is known or can be safely created after preflight.
- any active spec has been read, and any active plan is current or intentionally absent.

`goal-iterate` exits with one of:

- `ITERATION_READY_FOR_VERIFY`
- `BLOCKED`
- `REFRAME_NEEDED`

### Enter REVIEW when direction or diff needs challenge

Use `goal-review` when any of these is true:

- loop evidence contradicts assumptions;
- scope expands or implementation becomes complex;
- review feedback arrives and must be evaluated before action;
- an architecture, scope, code, loop, or goal check is needed before continuing;
- implementation appears complete but review evidence is not yet current.
- an active spec or plan may be stale, over-broad, superseded, or inconsistent with current evidence.

If both REVIEW and VERIFY conditions match, run REVIEW first unless a current Review Record already returns `READY_FOR_VERIFY`.

`goal-review` exits with one of:

- `CONTINUE`
- `NEXT_ITERATION`
- `REFRAME`
- `SIMPLIFY`
- `BLOCKED`
- `READY_FOR_VERIFY`

### Enter VERIFY before any completion claim

Use `goal-verify` when any of these is true:

- implementation appears complete;
- there is a diff, patch, commit, MR/PR, local evidence to assess, delivery, final output, or completion readiness;
- the user asks whether it is done, ready to merge, ready to ship, or whether a final claim is supported;
- final output, MR/PR creation, or completion claim is being prepared;
- previous iteration returned `ITERATION_READY_FOR_VERIFY`.
- review returned `READY_FOR_VERIFY`.
- active spec/plan artifacts, if any, must be checked against final evidence.

`goal-verify` exits with one of:

- `PASS_TO_FINAL`
- `NARROW_CLAIM_AND_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`

## Recovery routing

Before continuing after interruption, resumed context, dirty workspace, or partially completed work, run a recovery check:

- current repo;
- current branch;
- status / changed files;
- previous intended goal if known;
- active spec/plan artifacts if known;
- safest next state: `FRAME`, `ITERATE`, `VERIFY`, or `BLOCKED`.

Use `references/recovery-check.md` when the resumed state is not obvious.

## Router output

When routing is non-obvious, emit this compact route record:

```text
Route:
- state:
- reason:
- required skill:
- blocking missing input:
- next action:
```

Do not emit route records for trivial read-only questions.

## Final output rule

Any final completion claim must be based on the latest Verification Verdict.

If a spec or plan was used, final output must mention the artifact boundary and whether final evidence covered it, superseded it, or left gaps.

No Verification Verdict is required for non-completion exits from FRAME such as `ASK_USER`, `READ_ONLY`, `COMPARISON_ONLY`, or `BLOCKED`. In those cases, final output may report the route, blocker, comparison boundary, or read-only finding without claiming implementation completion.

If the verdict is:

- `PASS_TO_FINAL`: claim completion within the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: explicitly narrow the claim and list the gap.
- `NEXT_ITERATION`: do not claim completion; continue iteration.
- `REFRAME`: return to goal-frame before mutating further.
- `BLOCKED`: explain the blocker and ask for the specific missing input or permission.
