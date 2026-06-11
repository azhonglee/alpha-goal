---
name: goal-frame
description: Build a compact Goal Contract before coding. Use for ambiguous requirements, unclear target repo/path, multi-repo workspaces, existing MR/PR/branch discovery, acceptance criteria, claim boundary, and clarification. Must not mutate files.
---

# Goal Frame

Your job is to turn the user's request into a compact Goal Contract.

Do not edit files, create branches, create worktrees, generate artifacts, commit, push, or open an MR/PR.

## Entry

Use this skill when:

- the task is new or non-trivial;
- the target repo/path is unclear;
- the workspace has multiple candidate repos;
- the request may overlap an existing MR/PR/branch/issue/design doc;
- acceptance criteria or claim boundary are unclear;
- verification returned `REFRAME`.

## Discovery scope

Collect only the information needed to decide whether the task is safe to execute.

Check:

- user intent;
- target repo/path/service/module;
- applicable local rules such as `AGENTS.md` or `CLAUDE.md`;
- candidate repos when cwd is a workspace or aggregator;
- existing work when likely;
- acceptance criteria;
- non-goals;
- constraints;
- decision boundaries;
- assumptions and risks;
- risk tier;
- evidence plan;
- claim boundary.

Use `references/goal-contract-schema.md` for field definitions and `references/frame-examples.md` for compact examples. Examples are illustrative only; do not copy their repo names, paths, or facts as evidence for the current task.

## Clarification policy

Ask the user only when the answer changes the implementation or safety boundary.

Ask when:

- target repo/path is ambiguous and a wrong choice could mutate the wrong place;
- different interpretations imply different code changes;
- existing work may turn the task into follow-up, duplicate, or comparison-only work;
- a destructive or irreversible operation might be needed;
- user request conflicts with project rules;
- credentials, environment, or permissions are required.

Otherwise, record a bounded assumption and continue read-only discovery.

Use `references/clarification-policy.md` for edge cases.

## Multi-repo Target Gate

If cwd is a workspace, aggregator, monorepo, or contains multiple candidate repos:

- do not mutate anything;
- list the candidate repos or paths found by lightweight read-only checks;
- inspect candidate repos only as needed;
- record positive evidence for the selected repo;
- record exclusion or deferral reasons for non-selected repos;
- record applicable local rules for the selected repo.

Target selection is closed only when the selected repo/path has stronger evidence than alternatives.

Minimum read-only checks:

- identify the git root and current directory role;
- look one level down for candidate `.git` directories, worktrees, or package roots;
- search task keywords in candidate names, local branches, recent commits, and docs when cheap;
- read only the local rule files needed to decide target ownership.

If the user describes a multi-repo workspace but cwd is not enough to find candidates, return `ASK_USER` with the missing workspace or repo path. Return `BLOCKED` only when the needed data, permission, or tooling is unavailable after the target source is known.

## Existing Work Scan

Required when:

- user mentions MR/PR/issue/branch;
- the task sounds like follow-up, bugfix,补充,修复,实现,对比;
- internal collaboration tooling is available;
- final output may create MR/PR;
- feature keywords appear in local branches, commits, docs, or open work.

Record whether the task is:

- `new work`
- `follow-up`
- `duplicate`
- `alternative implementation`
- `comparison-only`
- `unknown`

Use `../adapters/bytedance-codebase.md` when working in ByteDance Codebase-like repos.

## Goal Contract

Produce this exact compact contract:

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
- Existing work:
- Frame verdict:
- Next:
```

Allowed `Frame verdict` values:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

## Exit rules

Return `READY_FOR_ITERATION` only when:

- target boundary is closed;
- acceptance is testable or otherwise verifiable;
- claim boundary is explicit;
- constraints, non-goals, and decision boundaries are recorded;
- assumptions, risks, and risk tier are recorded;
- existing work has been checked when triggered;
- no required user decision is missing.

Return `ASK_USER` when a clarification is necessary before safe progress.

Return `READ_ONLY` when the task is purely explanatory/audit and does not need mutation.

Return `COMPARISON_ONLY` when the right next step is comparing existing work rather than implementation.

Return `BLOCKED` when required data, permission, or environment is unavailable.
