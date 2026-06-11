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
- desired outcome and scope boundary;
- acceptance criteria;
- non-goals;
- constraints;
- decision boundaries;
- assumptions and risks;
- risk tier;
- evidence plan;
- claim boundary;
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
- `approved`: accepted by the user or clear enough within recorded decision boundaries; record approval basis.
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

If the current repo only has examples, docs, tests, or template mentions of the requested feature and no real implementation surface, target selection is not closed. Return `ASK_USER` with the missing repo/path or ask whether to produce a read-only search plan.

For cross-repo, worktree, submodule, or ownership-boundary implementation, record the explicit user request, confirmation, or decision boundary that authorizes that boundary. Otherwise return `ASK_USER`.

Minimum read-only checks:

- identify the git root and current directory role;
- look one level down for candidate `.git` directories, worktrees, or package roots;
- search task keywords in candidate names, local branches, recent commits, and docs when cheap;
- read only the local rule files needed to decide target ownership.

If the user describes a multi-repo workspace but cwd is not enough to find candidates, return `ASK_USER` with the missing workspace or repo path. Return `BLOCKED` only when the needed data, permission, or tooling is unavailable after the target source is known.

## Existing Work Scan

Always do the cheapest local scan needed to avoid duplicate or wrong-target work. Escalate to broader branch, MR/PR, issue, or collaboration-tool scans only when:

- user mentions MR/PR/issue/branch;
- the request sounds like follow-up, duplicate, comparison, or alternative implementation;
- target ownership is ambiguous;
- local keywords, branches, commits, or docs suggest overlapping work;
- final output may create MR/PR and duplicate risk is material.

Record whether the task is:

- `new work`
- `follow-up`
- `duplicate`
- `alternative implementation`
- `comparison-only`
- `unknown`

## Socratic interview

Use a Socratic interview when the request is broad, ambiguous, or missing acceptance, non-goals, decision boundaries, or claim boundary.

Rules:

- ask exactly one high-leverage question per round;
- inspect available code, docs, diffs, or logs first for brownfield facts; ask evidence-backed confirmation questions, not discoverable facts;
- ask about intent, desired outcome, scope, non-goals, and decision boundaries before implementation details;
- target the weakest field first: intent, outcome, scope, acceptance, non-goals, constraints, decision boundaries, brownfield context, claim boundary;
- after each answer, pressure-test the strongest claim with the first useful move: ask for an example/counterexample/evidence signal, probe the hidden assumption, force a boundary/tradeoff, or reframe symptoms toward root cause or desired end state;
- track each field as `clear`, `partial`, or `missing` while deciding whether to ask, assume, or block;
- stop asking when remaining `partial` fields can be recorded as bounded assumptions or risks.

Return `ASK_USER` when a missing or `partial` field blocks safe progress. Return `READY_FOR_ITERATION` only when execution-critical fields are clear or safely bounded.

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

For `ASK_USER`, still produce the Goal Contract with `Frame verdict: ASK_USER` unless the request is outside Goal Loop and only needs a trivial read-only answer.

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
- any `partial` interview fields are recorded as bounded assumptions or risks;
- existing work has been checked when triggered;
- durable spec need is recorded, and any referenced spec has current path/status;
- no required user decision is missing.

Return `ASK_USER` when a clarification is necessary before safe progress.

Return `READ_ONLY` when the task is purely explanatory/audit and does not need mutation.

Return `COMPARISON_ONLY` when the right next step is comparing existing work rather than implementation.

Return `BLOCKED` when required data, permission, or environment is unavailable.
