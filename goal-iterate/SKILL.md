---
name: goal-iterate
description: Stage skill for the goal-loop package. Perform one bounded implementation iteration under an existing Goal Contract, using loop modes, evidence records, debug receipts, mutation preflight, isolated edit paths, minimal patching, and plan escalation when risk or complexity requires it. Use only when explicitly named by the user or selected by goal-loop after goal-frame is READY_FOR_ITERATION.
---

# Goal Iterate

Your job is to perform one bounded implementation iteration under an existing Goal Contract.

Do not redefine the goal. If the contract is wrong, incomplete, or invalidated by new evidence, stop and return `REFRAME_NEEDED`.

## Entry requirements

Required before mutation:

- Goal Contract exists.
- `Frame verdict` is `READY_FOR_ITERATION`.
- Target repo/path is closed.
- Applicable local rules have been read.
- Mutation preflight is recorded.
- Isolated edit path is known, or can be created as the first setup action after preflight.
- Risk tier and evidence floor are known.
- Repo, worktree, submodule, and ownership boundaries are understood.
- Any active spec referenced by the Goal Contract has been read.
- Any active plan referenced by current work has been read.

If any requirement is missing, do not mutate.

## Mutation Preflight Gate

Before any command that can change files, branches, worktrees, commits, remotes, dependencies, generated artifacts, or runtime state, record:

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
- risk tier:
- evidence floor:
- baseline health:
- mutation allowed:
```

You may use `scripts/mutation-preflight.sh` to collect read-only git state. Add the smallest relevant baseline health check when it is cheap and available, such as an existing focused test, build, typecheck, lint, or documented reason no baseline can run. If baseline health fails, record the failing command and decide whether it is in scope before treating later failures as regressions.

If the task starts from a primary checkout and no isolated edit path exists yet, ITERATE may create the isolated worktree as its first setup mutation after preflight only when the Goal Contract target is closed, project rules allow the chosen worktree root, `.worktrees/` or the chosen root is ignored or explicitly approved, and no implementation file is edited before entering the isolated worktree. Record the setup command and then rerun or update preflight from inside the isolated edit path before implementation mutation.

Use `references/worktree-safety.md` when creating or validating an isolated edit path, especially if the current checkout may be the primary branch. Use `references/iteration-record-schema.md` for field definitions when the output contract is unclear. Use `references/loop-modes.md` when selecting a loop mode, debugging, TDD, spike, refactor, or hardening path. Use `references/plan-template.md` only when a durable route is needed.

## Forbidden by default

Do not do these unless the user explicitly asks and the risk is documented:

- edit files in the primary `main`/`master` checkout;
- run `git checkout -b` or `git switch -c` inside the primary `main`/`master` checkout;
- create a branch or worktree before target selection is closed;
- mutate a candidate repo that was not selected in the Goal Contract;
- mutate across repository, worktree, submodule, or ownership boundaries without explicit user request, confirmation, or recorded decision boundary;
- include unrelated cleanup/refactors not tied to acceptance;
- claim final completion from inside iteration.

## Risk-tiered evidence

Before mutating, classify risk from the Goal Contract:

- `low`: no behavior or public contract impact; focused self-check and artifact evidence may be enough.
- `medium`: bounded behavior, integration, CLI, UI, or maintainability change; run focused tests/checks and review changed behavior.
- `high`: security, destructive/remote state, production/compliance/PII, public API, persisted schema, billing, permissions, tenant isolation, or irreversible behavior; require broad verification and rollback/blocker evidence.

Evidence must be fresh and collected after the last material change.

## Loop mode

Choose one loop mode before acting:

- `discovery`
- `debug`
- `tdd`
- `implementation`
- `refactor`
- `spike`
- `hardening`

Record hypothesis, evidence type, learning, and decision for every iteration. Use `references/loop-modes.md` for mode-specific evidence rules.

For `debug`, do not patch from a guessed cause. Close the diagnostic path with a Debug Receipt status before any fix claim:

- `ROOT_CAUSE_CONFIRMED`
- `NOT_REPRODUCED`
- `BLOCKED`

Only `ROOT_CAUSE_CONFIRMED` authorizes a fix iteration. `NOT_REPRODUCED` and `BLOCKED` may support only a bounded diagnostic or no-fix claim.

## Plan escalation

Do not create a plan by default. Use one only when the next step is no longer safe to hold in chat.

Create or update a plan from `references/plan-template.md` when loop evidence shows any condition holds:

- work crosses loops, modules, repos, worktrees, submodules, or ownership surfaces;
- execution needs dependent slices and later work must resume without chat history;
- multiple workstreams need coordination;
- migration, architecture, rollback, compatibility, or evidence sequencing decisions must persist;
- earlier loop evidence invalidated the route and the new route must be traceable;
- the user asks for a plan, execution artifact, handoff route, or status artifact.

Prefer existing repo plan conventions. If none exist, use:

```text
docs/plans/YYYYMMDD-<slug>-plan.md
```

`<slug>` names the goal boundary, not the implementation method.

A plan is Loop-owned:

- forecast upcoming loops, evidence gates, review gates, and current state;
- never redefine Goal Contract or active spec intent, success criteria, non-goals, constraints, or decision boundaries;
- update when evidence changes the route;
- mark as `superseded`, not silently rewritten, when the route is no longer valid.

Maintain the plan as current view plus append-only history:

- update `Current Strategy`, `Execution Slices`, and current status for the next loop;
- append decisions, evidence, blockers, and route changes to `Change Log`;
- mark obsolete slices `superseded` with reason; do not delete them;
- treat `draft` as working route only, not reviewed or approved.

Before each iteration, read the active plan if it exists. After each material iteration, update plan status, slice state, evidence link, or change log before later stages rely on it. If artifact writes are not allowed, record the plan in the Iteration Record and state no file was written.

## Delegation boundary

Use subagents only for bounded, self-contained work.

- Provide task id, exact scope, working directory, ownership surface, current Goal/spec/plan evidence, constraints, expected evidence, and return contract.
- Parallelize only when ownership is independent and shared files or generated outputs are not contested.
- Require a receipt: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`.
- Inspect delegated files, ownership, evidence, and concerns before accepting the result.
- Delegated output never bypasses Goal Contract, Iteration Record, Review Record, Verification Verdict, risk-tier evidence, or fresh final checks.

## Ownership boundaries

Before editing, identify:

- repository root and current branch;
- whether the current directory is a linked worktree;
- dirty state and unrelated user changes;
- owning git root for each touched path;
- nested `.git` directories or submodules under touched paths;
- applicable `AGENTS.md`, `AGENTS.override.md`, `CLAUDE.md`, or `code_review.md` files.

Do not modify across repository, worktree, submodule, or ownership boundaries unless the Goal Contract explicitly includes that boundary and the user request, confirmation, or recorded decision boundary authorizes it.

## Iteration rules

- Make the smallest coherent change that advances one or more acceptance items.
- Prefer evidence-producing changes: tests, assertions, logging checks, static checks, or targeted probes.
- Preserve unrelated user changes.
- Keep implementation within the claim boundary.
- If discovery reveals existing work that changes task identity, stop and return `REFRAME_NEEDED`.
- If clarification is needed, stop and return `REFRAME_NEEDED` before further mutation.
- If project rules require a specific worktree, branch, or test flow, follow them.
- If a check fails, diagnose whether it is caused by the iteration, environment, or unrelated baseline.
- Do not patch from a plausible but unconfirmed root cause when debugging; first record reproducible evidence or a diagnostic blocker.
- If three attempts on the same failure thread do not produce new evidence, route to `goal-review`.

## No evidence, no progress

Each iteration should produce fresh evidence or a decision to change direction.

Examples of fresh evidence:

- new or updated tests;
- targeted test run output;
- build/typecheck/lint output;
- diff review against acceptance;
- runtime/manual probe output;
- documented blocker with attempted command and failure reason.

Unacceptable evidence:

- intuition or preference;
- stale checks from before the last material change;
- code changes without validation;
- review approval without fresh verification.

## Stop conditions

Stop and return `REFRAME_NEEDED` when:

- target repo/path appears wrong;
- acceptance changes materially;
- user intent appears broader/narrower than the contract;
- existing MR/PR/branch makes this duplicate or follow-up work;
- the safe edit path cannot be established.

Stop and return `BLOCKED` when:

- required credentials, network, services, or permissions are missing;
- tests cannot run and no substitute evidence is available;
- local state is too dirty to safely isolate changes.

Route to `goal-review` when:

- review feedback needs classification;
- implementation becomes complex;
- scope expands;
- architecture or ownership decisions become material.

When routing to review, set `Iterate verdict` to `ITERATION_READY_FOR_REVIEW`.

## Output

Produce exactly one Iteration Record:

```text
Iteration Record:
- Contract version:
- Active artifacts:
- Loop mode:
- Hypothesis:
- Evidence type:
- Debug receipt:
- Iteration goal:
- Mutation preflight:
- Action:
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
- `ITERATION_READY_FOR_REVIEW`
- `BLOCKED`
- `REFRAME_NEEDED`

Do not produce a final completion claim. Route to `goal-verify` for completion judgment.
