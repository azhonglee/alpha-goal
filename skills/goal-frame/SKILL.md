---
name: goal-frame
description: Frame a goal with discovery and Socratic clarification, then produce a Goal Contract with an inline Spec. Use when explicitly named or selected by goal-loop for ambiguous requirements, unclear target repo/path, multi-repo workspaces, existing-work discovery, acceptance criteria, claim boundaries, and spec escalation.
---

# Goal Frame

Turn the request into an executable, verifiable Goal Contract. Do not edit implementation files, create branches/worktrees, commit, push, or open PRs/MRs.

FRAME has two steps:

1. `Discovery`: read-only evidence gathering for target, context, constraints, and existing work.
2. `Socratic interview`: ask one high-leverage question only when a material decision cannot be safely inferred.

The output is a Goal Contract. It must contain `Spec`, and the Spec carries acceptance, scope, constraints, claim boundary, and evidence. Small tasks use an inline compact spec. Create or update a durable spec only when escalation criteria are met and artifact writing is allowed.

## Entry

Use this skill when:

- the task is new, non-trivial, or may require mutation;
- target repo/path/service/module is unclear;
- the workspace has multiple candidate repos, submodules, or packages;
- the user's term may name a page, space, workspace, container, or umbrella concept;
- existing MR/PR/branch/issue/design work may overlap;
- acceptance, non-goals, constraints, or claim boundary are unclear;
- verification returns `REFRAME`.

`Loop type` must be one atomic value from `goal-loop`. Do not invent composite loop types. Do not encode stage state into loop type. A read-only frame for future implementation is still `NEW_GOAL`; a read-only frame for a bug fix is still `DEBUG_GOAL`; use `READ_ONLY_DISCOVERY` only when the user's final goal is audit, diagnosis, comparison, or directional judgment.

## Discovery

Gather only evidence needed to decide whether execution is safe:

- user intent and expected outcome;
- target repo/path/service/module, plus rejected candidates and why;
- container submodules, data entities, source APIs/RPCs, logs, and code symbols;
- local rules such as `AGENTS.md`, `CLAUDE.md`, or `code_review.md`;
- existing branches, MR/PRs, issues, design docs, or local changes that alter task identity;
- scope, non-goals, constraints, and decision boundaries;
- isolation requirement: owning repo/subrepo, ignored worktree root, allowed edit path;
- risk tier, evidence plan, and claim boundary;
- spec need: inline compact spec or durable spec.

For bug/debug/root-cause work, stay compact. Record symptom, expected vs actual behavior, reproduction boundary or blocker, problem-space decomposition, initial competing hypotheses, and evidence needed to distinguish them. For low-risk single-function failures with a focused failing test and direct branch evidence, one sentence may cover these fields.

Load references only as needed:

- `references/target-discovery.md`: unclear target, multi-repo, existing-work, container, or entity boundary.
- `references/clarification-policy.md`: whether to ask, assume, run Socratic interview, or return `ASK_USER`.
- `references/goal-contract-schema.md`: precise field semantics or higher-risk output boundaries.
- `references/spec-template.md`: durable spec creation.
- `references/frame-examples.md`: uncertain routing or output shape.

Examples show shape only; do not copy their facts.

## Socratic interview

Read discoverable evidence before asking. Ask at most one question per round.

Ask only when the answer changes target, ownership, acceptance, non-goals, constraints, destructive/remote/production/credential risk, product-level claim boundary, mutually exclusive implementation direction, or a conflict with repo rules.

If a safe inference exists, proceed and record the bounded assumption. If the missing decision affects mutation safety, scope, acceptance, or final claim, return `ASK_USER`.

## Spec policy

`Spec` is the requirement carrier inside the Goal Contract.

For small tasks, write a 3-8 line inline compact spec covering outcome, scope/non-goals, acceptance, constraints/decision boundary, claim boundary, and evidence.

For complex tasks, the `Spec` field references a durable spec path/status and includes a compact summary with the same dimensions.

Create or update a durable spec only when:

- clarification spans multiple rounds and requirements may be lost in chat;
- work crosses independent phases, modules, repos, ownership boundaries, or handoff;
- acceptance, non-goals, constraints, or decision boundaries are long;
- risk tier is high, or medium with real scope-drift risk;
- the user asks for a spec, design artifact, durable requirements, or handoff document.

Default path:

```text
docs/design/YYYYMMDD-<slug>-spec.md
```

Before writing a spec file, close target repo/path and applicable rules. For read-only work or no-write instructions, draft the spec in chat only.

## Goal Contract

Output a compact contract:

```text
Goal Contract:
- Intent:
- Loop type:
- Target:
- Discovery:
- Socratic state:
- Spec:
- Risk tier:
- Risks and assumptions:
- Artifacts:
- Existing work:
- Frame verdict:
- Next:
```

When `Spec` needs multiple lines, use:

```text
Spec:
- Outcome:
- Scope:
- Acceptance:
- Constraints:
- Claim boundary:
- Evidence:
```

`Scope` includes both in-scope and out-of-scope. `Constraints` includes decision boundaries. `Artifacts` only names loop/process artifacts such as durable specs, plans, reviews, evidence, or scratch files. Do not list product objects, UI sections, database records, or business outputs under `Artifacts`.

Allowed `Frame verdict` values:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

## Exit

Return `READY_FOR_ITERATION` only when target boundary is closed, `Spec.Acceptance` is verifiable, `Spec.Claim boundary` is explicit, `Spec.Scope`, `Spec.Constraints`, and `Spec.Evidence` are recorded, risk and assumptions are recorded, Spec content or durable spec path/status/summary is present, container terms are decomposed or risk is explicit, existing-work scan was run when triggered, and no user decision blocks mutation safety.

Return `READ_ONLY` for audit-style findings. After the Goal Contract, give findings, evidence, recommendations, and residual uncertainty.

Return `COMPARISON_ONLY` when only existing work should be compared.

Return `ASK_USER` with the Goal Contract and one precise question in `Next`.

Return `BLOCKED` with the missing data, permission, environment, or tool.
