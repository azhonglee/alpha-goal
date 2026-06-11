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
- Risk tier and evidence floor are known.
- Repo, worktree, submodule, and ownership boundaries are understood.

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
- applicable rule files:
- nested repos/submodules:
- risk tier:
- evidence floor:
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

## Risk-tiered evidence

Before mutating, classify risk from the Goal Contract:

- `low`: no behavior or public contract impact; focused self-check and artifact evidence may be enough.
- `medium`: bounded behavior, integration, CLI, UI, or maintainability change; run focused tests/checks and review changed behavior.
- `high`: security, destructive/remote state, production/compliance/PII, public API, persisted schema, billing, permissions, tenant isolation, or irreversible behavior; require broad verification and rollback/blocker evidence.

Evidence must be fresh and collected after the last material change.

## Ownership boundaries

Before editing, identify:

- repository root and current branch;
- whether the current directory is a linked worktree;
- dirty state and unrelated user changes;
- owning git root for each touched path;
- nested `.git` directories or submodules under touched paths;
- applicable `AGENTS.md`, `AGENTS.override.md`, `CLAUDE.md`, or `code_review.md` files.

Do not modify across repository, worktree, or submodule boundaries unless the Goal Contract explicitly includes that boundary.

## Iteration rules

- Make the smallest coherent change that advances one or more acceptance items.
- Prefer evidence-producing changes: tests, assertions, logging checks, static checks, or targeted probes.
- Preserve unrelated user changes.
- Keep implementation within the claim boundary.
- If discovery reveals existing work that changes task identity, stop and return `REFRAME_NEEDED`.
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
- Review needed:
- Iterate verdict:
- Next:
```

Allowed `Iterate verdict` values:

- `ITERATION_READY_FOR_VERIFY`
- `BLOCKED`
- `REFRAME_NEEDED`

Do not produce a final completion claim. Route to `goal-verify` for completion judgment.
