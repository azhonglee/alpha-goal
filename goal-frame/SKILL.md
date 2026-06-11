---
name: goal-frame
description: Build a compact Goal Contract before coding, and create or update a durable spec artifact only when risk or complexity requires it. Use for ambiguous requirements, unclear target repo/path, multi-repo workspaces, existing MR/PR/branch discovery, acceptance criteria, claim boundary, clarification, and spec escalation.
---

# Goal Frame

Your job is to turn the user's request into a compact Goal Contract.

Do not edit implementation files, create branches, create worktrees, commit, push, or open an MR/PR.

Create or update a durable spec only when escalation rules require it and artifact writes are allowed. Otherwise keep the draft in the conversation.

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
- durable spec need.

Use `references/goal-contract-schema.md` for field definitions and `references/frame-examples.md` for compact examples. Use `references/spec-template.md` only when a durable spec is needed. Examples are illustrative only; do not copy their repo names, paths, or facts as evidence for the current task.

## Spec escalation

Do not create a spec by default. Small, local, low-risk work only needs a Goal Contract.

Create or update a spec from `references/spec-template.md` when any condition holds:

- requirements were clarified across turns and may be lost in chat;
- scope crosses stages, modules, repos, worktrees, or ownership boundaries;
- handoff, stakeholder review, PR/MR discussion, or later resumption is expected;
- acceptance, non-goals, constraints, or decision boundaries are too detailed for the Goal Contract;
- risk tier is high, or medium with real scope-drift risk;
- the user asks for a spec, design artifact, durable requirements, or handoff document.

Prefer existing repo spec/design conventions. If none exist, use:

```text
docs/design/YYYYMMDD-<slug>-spec.md
```

`<slug>` names the goal boundary, not the implementation method.

Before writing a spec file, close the target repo/path and applicable rules. Otherwise draft it in chat.

When a spec exists:

- read it before producing or revising the Goal Contract;
- keep the Goal Contract compact and record spec path/status in `Artifacts`;
- update it before later stages rely on changed requirements;
- mark obsolete specs `superseded`; do not delete or rewrite history;
- append decisions and changes. Update only the current summary, status, open questions, and acceptance state.

Spec status values:

- `draft`: working requirements; not approved when approval is required.
- `reviewed`: checked for clarity and evidence; not automatically approved.
- `approved`: accepted by the user or clear enough within recorded decision boundaries.
- `superseded`: history only; do not execute against it.

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
- the task sounds like follow-up, bugfix, add, repair, implement, or compare;
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

## Interview clarification

Use interview clarification when a missing Goal Contract field affects implementation, safety, or claim boundary. Ask one high-leverage question at a time. Target the weakest field first:

1. intent
2. target
3. acceptance
4. non-goals
5. constraints
6. decision boundaries
7. claim boundary

After the answer, update the Goal Contract. If the answer changes target, acceptance, constraints, non-goals, or claim boundary after iteration started, return through the router before any more mutation.

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
- Artifacts:
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
- durable spec need is recorded, and any referenced spec has current path/status;
- no required user decision is missing.

Return `ASK_USER` when a clarification is necessary before safe progress.

Return `READ_ONLY` when the task is purely explanatory/audit and does not need mutation.

Return `COMPARISON_ONLY` when the right next step is comparing existing work rather than implementation.

Return `BLOCKED` when required data, permission, or environment is unavailable.
