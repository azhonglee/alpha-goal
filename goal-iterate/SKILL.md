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
- `.worktrees/`, `.goal-loop/`, or any chosen alternatives are ignored or explicitly approved before use.
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

If the task starts from a primary checkout and no isolated edit path exists yet, ITERATE may create the isolated worktree as its first setup mutation after preflight only when the Goal Contract target is closed, project rules allow the chosen worktree root, `.worktrees/` or the chosen root is ignored or explicitly approved, and no implementation file is edited before entering the isolated worktree. By default, create it under the selected repo's `.worktrees/codex/<task-slug>/`; in monorepos, use the owning subrepo's `.worktrees/codex/<task-slug>/`. Record the setup command and then rerun or update preflight from inside the isolated edit path before implementation mutation.

Use references only when their detail is needed:

- `references/worktree-safety.md` when creating or validating an isolated edit path, especially if the current checkout may be the primary branch.
- `references/execution-boundaries.md` when delegation, ownership, submodules, nested repos, generated outputs, or unrelated user changes matter.
- `references/loop-modes.md` when selecting a loop mode, debugging, TDD, spike, refactor, or hardening path.
- `references/plan-template.md` only when a durable route is needed.
- `references/iteration-record-schema.md` for field definitions when the output contract is unclear.

## Forbidden by default

Do not do these unless the user explicitly asks and the risk is documented:

- edit or delete files in the primary `main`/`master` checkout;
- run `git checkout -b` or `git switch -c` inside the primary `main`/`master` checkout;
- create a branch or worktree before target selection is closed;
- mutate a candidate repo that was not selected in the Goal Contract;
- mutate across repository, worktree, submodule, or ownership boundaries without explicit user request, confirmation, or recorded decision boundary;
- include unrelated cleanup/refactors not tied to acceptance;
- merge an isolated task branch into `main`/`master`, or delete its worktree before PR/MR merge or local merge completes;
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

For `debug`, do not patch from a guessed cause. Before `ROOT_CAUSE_CONFIRMED`:

- include problem-space decomposition, competing hypotheses or an evidence-based reason none are credible, entity/interface/log alignment when available, and root-cause validation;
- use a compact Debug Receipt for low-risk pure-function or single-branch failures with focused failing-test and direct code-divergence evidence; mark entity/log alignment as not applicable;
- when symptoms, logs, API/RPC names, payload fields, or user corrections point to different entities than the current target, keep competing hypotheses until a discriminator excludes them or route to `REFRAME_NEEDED`.

Close the diagnostic path with a Debug Receipt status before any fix claim:

- `ROOT_CAUSE_CONFIRMED`
- `NOT_REPRODUCED`
- `BLOCKED`

Only `ROOT_CAUSE_CONFIRMED` authorizes a fix action, either as the minimal patch in the same bounded debug iteration or as a separate implementation iteration when the fix surface is broader. `NOT_REPRODUCED` and `BLOCKED` may support only a bounded diagnostic or no-fix claim.

## Conditional detail gates

Do not load or write extra process artifacts by default. Use the smallest detail surface that keeps the iteration safe:

- Plan escalation: load `references/plan-template.md` only when independent loops, modules, repos, submodules, ownership surfaces, or dependent workstreams require durable sequencing, coordination, later resumption, route traceability, rollback/compatibility decisions, or a requested handoff/status artifact. Ordinary isolated worktree safety or a bounded multi-file patch does not require a plan. A plan is Loop-owned and must not redefine the Goal Contract or active spec.
- Delegation and ownership: load `references/execution-boundaries.md` when using subagents or when touched paths, generated outputs, nested repos, submodules, or unrelated user changes make ownership non-trivial.

Route to `goal-review` if plan, delegation, ownership, architecture, or scope decisions become material.

## Iteration rules

- Make the smallest coherent change that advances one or more acceptance items.
- Prefer evidence-producing changes: tests, assertions, logging checks, static checks, or targeted probes.
- Preserve unrelated user changes.
- Keep implementation within the claim boundary.
- If discovery reveals existing work, a different submodule, or an API/log entity that changes task identity, stop and return `REFRAME_NEEDED`.
- If clarification is needed, stop and return `REFRAME_NEEDED` before further mutation.
- If project rules require a specific worktree, branch, or test flow, follow them.
- If a check fails, diagnose whether it is caused by the iteration, environment, or unrelated baseline.
- Do not patch from a plausible but unconfirmed root cause when debugging; first record reproducible evidence, entity/API alignment, or a diagnostic blocker.
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
- architecture or ownership decisions become material;
- debug evidence supports multiple plausible root causes, logs and code disagree, or the proposed fix surface is broader than the confirmed divergence.

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
