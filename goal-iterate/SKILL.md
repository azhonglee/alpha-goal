---
name: goal-iterate
description: Perform one bounded implementation iteration under an existing Goal Contract. Use after goal-frame is READY_FOR_ITERATION. Enforces mutation preflight, isolated edit path, minimal patching, and evidence-producing changes.
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
- Isolated edit path is known.

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
- isolated edit path:
- mutation allowed:
```

You may use `scripts/mutation-preflight.sh` to collect read-only git state.

## Forbidden by default

Do not do these unless the user explicitly asks and the risk is documented:

- edit files in the primary `main`/`master` checkout;
- run `git checkout -b` or `git switch -c` inside the primary `main`/`master` checkout;
- create a branch or worktree before target selection is closed;
- mutate a candidate repo that was not selected in the Goal Contract;
- include unrelated cleanup/refactors not tied to acceptance;
- claim final completion from inside iteration.

## Iteration rules

- Make the smallest coherent change that advances one or more acceptance items.
- Prefer evidence-producing changes: tests, assertions, logging checks, static checks, or targeted probes.
- Preserve unrelated user changes.
- Keep implementation within the claim boundary.
- If discovery reveals existing work that changes task identity, stop and return `REFRAME_NEEDED`.
- If project rules require a specific worktree, branch, or test flow, follow them.
- If a check fails, diagnose whether it is caused by the iteration, environment, or unrelated baseline.

## No evidence, no progress

Each iteration should produce fresh evidence or a decision to change direction.

Examples of fresh evidence:

- new or updated tests;
- targeted test run output;
- build/typecheck/lint output;
- diff review against acceptance;
- runtime/manual probe output;
- documented blocker with attempted command and failure reason.

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

## Output

Produce exactly one Iteration Record:

```text
Iteration Record:
- Contract version:
- Iteration goal:
- Mutation preflight:
- Action:
- Changed files:
- Local evidence:
- Acceptance delta:
- Risks introduced:
- Iterate verdict:
- Next:
```

Allowed `Iterate verdict` values:

- `ITERATION_READY_FOR_VERIFY`
- `BLOCKED`
- `REFRAME_NEEDED`

Do not produce a final completion claim. Route to `goal-verify` for completion judgment.
