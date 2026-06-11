---
name: goal-iterate
description: Perform one bounded implementation iteration under an existing Goal Contract, and create or update a durable plan artifact only when risk or complexity requires it. Use after goal-frame is READY_FOR_ITERATION. Enforces mutation preflight, isolated edit path, minimal patching, evidence-producing changes, and plan escalation.
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
- 已读取 Goal Contract 引用的 active spec。
- 已读取当前工作引用的 active plan。

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
- active spec:
- active plan:
- risk tier:
- evidence floor:
- mutation allowed:
```

You may use `scripts/mutation-preflight.sh` to collect read-only git state.

Use `references/worktree-safety.md` when creating or validating an isolated edit path, especially if the current checkout may be the primary branch. Use `references/iteration-record-schema.md` for field definitions when the output contract is unclear. 仅当需要持久化执行路线时使用 `references/plan-template.md`。

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

## Plan escalation

默认不要创建 plan。只有当单靠对话中的下一步已经不可靠时，才需要 plan。

当 loop evidence 表明至少满足一个条件时，使用 `references/plan-template.md` 创建或更新 plan：

- 工作跨多个 loop、模块、仓库、worktree、submodule 或 ownership surface；
- 执行需要多个依赖 slice，且后续 agent 必须在没有聊天历史的情况下理解当前状态；
- 多个 agent 或并行 workstream 需要协调；
- 迁移、架构、回滚、兼容性或 evidence sequencing 决策有风险，需要保留；
- 之前的 loop evidence 推翻了路线，新路线需要可追溯；
- 用户明确要求 plan、执行 artifact、交接路线或状态 artifact。

优先使用仓库已有 plan 路径约定。没有约定时默认使用：

```text
docs/plans/YYYYMMDD-<slug>-plan.md
```

`<slug>` 描述目标边界，不描述具体实现方法。

A plan is Loop-owned:

- 它预测 upcoming loops、evidence gates、review gates 和当前执行状态；
- 它不得重写 Goal Contract 或 active spec 中的 intent、success criteria、non-goals、constraints 或 decision boundaries；
- 当 evidence 改变执行路线时，它可以被更新；
- 当整体路线不再有效时，应标记为 `superseded`，不要静默改写。

将 plan 维护为“当前视图 + 追加式历史”：

- 更新 `Current Strategy`、`Execution Slices` 和当前状态，让下一轮 loop 能直接接上；
- 将 decisions、evidence、blockers 和 route changes 追加到 `Change Log`；
- 过期 slice 标记为 `superseded` 并写明原因，不要删除；
- 如果 plan 状态是 `draft`，只把它当作工作路线，不要描述成 reviewed 或 approved。

每次 iteration 前，如果 active plan 存在，必须读取它。每次 material iteration 后，先更新 plan 的状态、slice state、evidence link 或 change log，再让后续阶段依赖它。如果不允许写 artifact，在 Iteration Record 里记录 plan，并说明没有写文件。

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
- Active artifacts:
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
