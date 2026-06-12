---
name: goal-iterate
description: Run one bounded goal iteration under an existing Goal Contract: dynamic planning, execution, and feedback. Use when explicitly named or selected by alpha-goal after its contract verification returns CONTRACT_READY for implementation, debugging, hardening, evidence collection, or feedback handling.
---

# Goal Iterate

Advance one bounded iteration under an existing Goal Contract. Do not redefine the goal. If new evidence breaks the contract, target, spec, or claim boundary, stop and return `REFRAME_NEEDED`.

Each iteration has three phases:

1. `Dynamic planning`: choose the smallest slice, evidence floor, isolation path, and loop mode.
2. `Execution`: run the slice through mutation, read-only exploration, debug probes, tests, or evidence collection.
3. `Feedback`: interpret results, handle user/reviewer/test feedback, then continue, pivot, reframe, review, or verify.

## Entry requirements

Before mutation, all of these must be true:

- Goal Contract exists with `Alpha verdict: CONTRACT_READY`;
- `Goal type`, `Target`, `Spec.Acceptance`, and `Spec.Claim boundary` are clear;
- applicable local rules have been read;
- mutation preflight is recorded;
- isolated edit path is known, or its creation is the first setup mutation;
- risk tier and evidence floor are known;
- repo, worktree, submodule, and ownership boundaries are understood;
- `.worktrees/`, `.alpha-goal/`, or alternative paths are gitignored or explicitly approved;
- active durable spec/plan, if any, has been read.

If any item is missing, do not mutate.

## Mutation Preflight Gate

Before any command that changes files, branches, worktrees, commits, remotes, dependencies, generated artifacts, or runtime state, record:

```text
Mutation Preflight:
- git root:
- current branch:
- status:
- worktree list:
- primary checkout:
- isolated edit path or setup target:
- applicable rule files:
- nested repos/submodules:
- active spec:
- active plan:
- goal type:
- risk tier:
- evidence floor:
- baseline health:
- mutation allowed:
```

Use `scripts/mutation-preflight.sh` for read-only git state, then add the smallest useful baseline health check. If baseline is already failing, record the command and scope judgment; do not blame later failures on this iteration by default.

If currently in a primary checkout with no isolated edit path, ITERATE may only create `.worktrees/codex/<task-slug>/` as the first setup mutation when the contract target is closed, rules allow it, and the worktree root is ignored or approved. After entering the isolated worktree, refresh preflight before implementation edits.

Load references only as needed:

- `references/worktree-safety.md`: create or verify isolated edit paths.
- `references/execution-boundaries.md`: subagents, ownership, submodules, generated output, or user-owned changes.
- `references/loop-modes.md`: select mode and debug/TDD/spike/hardening evidence.
- `references/plan-template.md`: durable dynamic plan.
- `references/iteration-record-schema.md`: exact output fields.

## Goal type to mode

- `EXPLORE`: use `discovery` or `spike`; do not mutate unless the contract explicitly requires a process artifact.
- `DESIGN`: use `discovery`, `spike`, or `hardening` for evidence; use `implementation` only to write an approved design artifact.
- `IMPLEMENT`: use `implementation`, `tdd`, `refactor`, or `hardening`; start with the smallest acceptance slice.
- `DEBUG`: start with `debug`; do not claim repair before `ROOT_CAUSE_CONFIRMED`.
- `VERIFY`: use `hardening` with evidence type `evidence_audit` or `gate_evidence` when verify returns evidence gaps.
- `RECOVER`: choose the mode implied by recovered contract state.

Allowed loop modes:

- `discovery`
- `debug`
- `tdd`
- `implementation`
- `refactor`
- `spike`
- `hardening`

Every iteration records hypothesis, evidence type, learning, and decision.

## Dynamic planning

Dynamic planning is not a waterfall plan. It answers only this iteration:

- smallest acceptance progress;
- fresh evidence needed;
- files, modules, and ownership boundaries allowed to change;
- route for success, failure, and feedback;
- whether a durable plan is needed.

Create or update a durable plan only for multiple independent loops, modules, repos, handoff, recovery, rollback/compatibility decisions, or user request. For that case, read `references/plan-template.md`. Small patches do not need durable plans.

## Execution

- Make the smallest coherent change.
- Prefer evidence: tests, assertions, lint/typecheck/build, runtime/manual probes, and diff review.
- Stay inside the claim boundary.
- Preserve unrelated user changes.
- Stop with `REFRAME_NEEDED` if target/entity/API/log evidence contradicts the contract.
- For debug work, collect falsifiable evidence before patching.
- If the same failure thread repeats three times without new evidence, enter feedback judgment and consider explicit `goal-review`.

Forbidden unless the user explicitly requests it and risk is recorded:

- editing or deleting files in a primary `main`/`master` checkout;
- creating a branch inside a primary `main`/`master` checkout;
- creating branch/worktree before target closure;
- mutating a candidate repo not selected by the Goal Contract;
- crossing repo, worktree, submodule, or ownership boundary without authorization;
- unrelated cleanup or refactor;
- final completion claims from ITERATE.

## Feedback

Feedback covers:

- test, build, lint, and probe output;
- reviewer or user feedback;
- new target, scope, entity, API, or log evidence;
- implementation risk, missing evidence, and claim-boundary gaps;
- whether active spec/plan is stale.

Decisions:

- `continue`: current route works; run another iteration.
- `pivot`: evidence breaks the route; return `REFRAME_NEEDED` or change the dynamic plan.
- `expand`: goal remains valid but scope grew; usually return `REFRAME_NEEDED` or review.
- `harden`: core behavior is done but evidence or risk is insufficient.
- `finish`: acceptance appears met; enter verify.

Load `goal-review` only for architecture, scope, ownership, review-dispute, or claim-boundary risk. Otherwise handle feedback inside the Iteration Record.

## Debug receipt

`debug` mode must close the diagnostic path before any repair claim:

- `ROOT_CAUSE_CONFIRMED`
- `NOT_REPRODUCED`
- `BLOCKED`

Only `ROOT_CAUSE_CONFIRMED` authorizes a fix action. Low-risk pure-function or single-branch bugs may use a compact receipt. Non-trivial RCA needs problem-space decomposition, competing hypotheses, entity/interface/log alignment, root-cause validation, and minimal fix surface.

## Output

Produce an Iteration Record:

```text
Iteration Record:
- Contract version:
- Goal type:
- Active artifacts:
- Dynamic plan:
- Loop mode:
- Hypothesis:
- Evidence type:
- Mutation preflight:
- Execution:
- Debug receipt:
- Feedback:
- Changed files:
- Local evidence:
- Learning:
- Decision:
- Acceptance delta:
- Risks introduced:
- Review needed:
- Iterate verdict:
- Next:
```

Allowed `Iterate verdict` values:

- `ITERATION_READY_FOR_VERIFY`
- `ITERATION_CONTINUES`
- `ITERATION_READY_FOR_REVIEW`
- `BLOCKED`
- `REFRAME_NEEDED`

Do not make final completion claims in an Iteration Record. Completion judgment belongs to `goal-verify`. `REFRAME_NEEDED` routes back to `alpha-goal`.
