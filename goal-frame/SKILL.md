---
name: goal-frame
description: Stage skill for the goal-loop package. Build a compact Goal Contract before coding, and create or update a durable spec artifact only when risk or complexity requires it. Use only when explicitly named by the user or selected by goal-loop for ambiguous requirements, unclear target repo/path, multi-repo workspaces, existing MR/PR/branch discovery, acceptance criteria, claim boundary, clarification, and spec escalation.
---

# Goal Frame

Your job is to turn the user's request into a compact Goal Contract.

Do not edit implementation files, create branches, create worktrees, commit, push, or open an MR/PR.

Create or update a durable spec only when escalation rules require it and artifact writes are allowed. If the user requested read-only work or said not to modify files, draft any needed spec content in the conversation only.

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
- problem-space decomposition when a user-facing page, space, container, or umbrella term may contain multiple submodules, data entities, or source APIs;
- applicable local rules such as `AGENTS.md` or `CLAUDE.md`;
- candidate repos when cwd is a workspace or aggregator;
- existing work when likely;
- desired outcome and scope boundary;
- acceptance criteria;
- non-goals;
- constraints;
- isolation requirements, including the owning repo or subrepo, ignored worktree root, and allowed edit path;
- decision boundaries;
- assumptions and risks;
- risk tier;
- evidence plan;
- claim boundary;
- durable spec need.

For bug, debug, or root-cause tasks, keep the frame compact. Record symptom, expected-vs-actual behavior, reproduction boundary or blocker, problem-space decomposition, initial competing hypotheses or why only one is credible, and evidence that will distinguish hypotheses before proving a patch. For low-risk single-function failures with focused failing-test and direct branch evidence, one concise sentence across the existing fields is enough.

Use references only when their detail is needed:

- `references/goal-contract-schema.md` when field definitions are unclear, the contract is high-risk, or the output boundary needs precision.
- `references/target-discovery.md` when target ownership is ambiguous, multiple repos/paths may qualify, existing work could change the task identity, or a user-facing container/umbrella term must be separated from submodules, data entities, and source APIs.
- `references/clarification-policy.md` when deciding whether to ask, assume, run a Socratic interview, or return `ASK_USER`.
- `references/frame-examples.md` only when routing or output shape is uncertain.
- `references/spec-template.md` only when a durable spec is needed.

Examples are illustrative only; do not copy their repo names, paths, or facts as evidence for the current task.

## Spec escalation

Do not create a spec by default. Small, local, low-risk work only needs a Goal Contract.

Create or update a spec from `references/spec-template.md` when any condition holds. Ordinary use of Goal Loop stages or an isolated worktree does not by itself require a spec:

- requirements were clarified across turns and may be lost in chat;
- requirements span multiple independent implementation phases, modules, repos, ownership boundaries, or handoff contexts;
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

## Discovery details

Keep FRAME lightweight. Load detail only for the condition that needs it:

- Clarification and Socratic interview rules: `references/clarification-policy.md`. Ask only when the answer changes implementation or safety; otherwise record a bounded assumption.
- Multi-repo target selection and existing-work scan: `references/target-discovery.md`. Do not mutate until target selection and duplicate/follow-up risk are closed.
- Spec escalation: use the rules above, then load `references/spec-template.md` only when a durable requirements artifact is actually needed.

Return `ASK_USER` when missing information blocks safe progress; return `READY_FOR_ITERATION` only when execution-critical fields are clear or safely bounded.

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

For `ASK_USER`, still produce the Goal Contract with `Frame verdict: ASK_USER` unless the request is outside Goal Loop and only needs a trivial read-only answer. Keep the contract compact; put the missing decision and the exact requested input in `Target`, `Decision boundaries`, and `Next`.

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
- aggregate/container terms have been decomposed or explicitly recorded as unresolved assumptions when they can change the implementation or diagnosis path;
- existing work has been checked when triggered;
- durable spec need is recorded, and any referenced spec has current path/status;
- no required user decision is missing.

Return `ASK_USER` when a clarification is necessary before safe progress.

Return `READ_ONLY` when the task is purely explanatory/audit and does not need mutation. If the user asked for audit findings, include findings, evidence, recommendations, and residual uncertainty after the Goal Contract boundary is clear.

Return `COMPARISON_ONLY` when the right next step is comparing existing work rather than implementation.

Return `BLOCKED` when required data, permission, or environment is unavailable.
