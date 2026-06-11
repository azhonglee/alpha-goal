---
name: goal-loop
description: Route non-trivial coding tasks through goal-frame, goal-iterate, and goal-verify. Use for multi-step coding tasks, ambiguous requirements, repository mutation, review, verification, recovery, or completion claims; not for trivial read-only answers.
---

# Goal Loop Router

Goal Loop is a staged execution protocol, not a long-form ritual.

Use the smallest stage that can safely advance the task.

```text
FRAME -> ITERATE -> VERIFY -> FINAL
                  -> ITERATE
                  -> FRAME
                  -> BLOCKED
```

## Global invariants

- No Goal Contract, no mutation.
- No target boundary, no mutation.
- No isolated edit path, no mutation.
- No evidence, no Verification Verdict.
- No Verification Verdict, no final completion claim.
- No final claim may exceed the verified claim boundary.

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

`goal-iterate` exits with one of:

- `ITERATION_READY_FOR_VERIFY`
- `BLOCKED`
- `REFRAME_NEEDED`

### Enter VERIFY before any completion claim

Use `goal-verify` when any of these is true:

- implementation appears complete;
- there is a diff, patch, commit, MR/PR, or local evidence to assess;
- the user asks whether it is done, correct, safe, or has loopholes;
- final output, MR/PR creation, or completion claim is being prepared;
- previous iteration returned `ITERATION_READY_FOR_VERIFY`.

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

The final answer must be based on the latest Verification Verdict.

If the verdict is:

- `PASS_TO_FINAL`: claim completion within the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: explicitly narrow the claim and list the gap.
- `NEXT_ITERATION`: do not claim completion; continue iteration.
- `REFRAME`: return to goal-frame before mutating further.
- `BLOCKED`: explain the blocker and ask for the specific missing input or permission.
