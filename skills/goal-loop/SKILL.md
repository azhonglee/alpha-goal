---
name: goal-loop
description: Frame and route non-trivial read-only, design, implementation, debugging, feedback, recovery, and verification work. Use when target/evidence-boundary discovery, Socratic clarification, Goal Contract creation, mutation routing, active-goal continuation, completion claims, or recovery is in scope. Do not use for trivial explanations, summaries, ordinary standalone reviews, simple diff reviews, or advisory answers without discovery, mutation, active goal, or completion claim.
---

# Goal Loop

`goal-loop` owns triage, frame, Goal Contract creation, and routing. It must not mutate implementation files or make final completion claims.

Default path:

```text
INTENT -> GOAL-LOOP(triage + frame + contract) -> ITERATE(dynamic plan -> execution -> feedback) -> VERIFY -> FINAL
                                                    ^--------------------------------------------|
```

`goal-review` is optional. Load it only when the user names it, repo rules require it, or feedback carries architecture, scope, ownership, complexity, or claim-boundary risk. Ordinary feedback stays in the `goal-iterate` feedback phase.

## Triage

Choose one atomic Goal type. Goal type names the user's final outcome, not the current stage, permission level, or execution mode. Do not invent composite goal types.

- `EXPLORE`: understand, audit, compare, map boundaries, diagnose direction, or produce findings without committing to implementation.
- `DESIGN`: produce a design, spec, architecture choice, tradeoff analysis, or decision rationale.
- `IMPLEMENT`: create, change, refactor, migrate, configure, document, or otherwise deliver a repository change.
- `DEBUG`: reproduce, isolate, explain, or fix a failure, bug, incident, or root-cause claim.
- `VERIFY`: judge whether work is done, ready, correct, safe, shippable, or claim-supported.
- `RECOVER`: recover from interrupted context, dirty state, existing task branch, partial artifacts, or unfinished changes.
- `CLARIFY`: temporary type when the final outcome cannot be classified safely.

`CLARIFY` cannot enter execution. The frame phase must resolve it to `EXPLORE`, `DESIGN`, `IMPLEMENT`, `DEBUG`, `VERIFY`, or `RECOVER`, or return `ASK_USER`/`BLOCKED`.

Bypass Goal Loop for trivial explanations, summaries, ordinary standalone review, simple diff review, or advisory answers with no discovery, mutation path, active goal, or completion claim.

## Frame Phase

Frame the goal before any implementation mutation. FRAME has two steps:

1. `Discovery`: read-only evidence gathering for target, context, constraints, and existing work.
2. `Socratic interview`: ask one high-leverage question only when a material decision cannot be safely inferred.

Discovery gathers only evidence needed to decide whether execution is safe: user intent, target repo/path/service/module, candidate exclusions, container/submodule/entity/API/log boundaries, local rules, existing work, scope, non-goals, constraints, isolation requirements, risk tier, evidence plan, claim boundary, and spec need.

For bug/debug/root-cause work, record symptom, expected vs actual behavior, reproduction boundary or blocker, problem-space decomposition, initial competing hypotheses, and evidence needed to distinguish them. For low-risk single-function failures with focused failing-test and direct branch evidence, one sentence may cover these fields.

Ask at most one question per round. Ask only when the answer changes target, ownership, acceptance, non-goals, constraints, destructive/remote/production/credential risk, product-level claim boundary, mutually exclusive implementation direction, or a conflict with repo rules. If a safe inference exists, proceed and record the bounded assumption.

Load references only as needed:

- `references/target-discovery.md`: unclear target, multi-repo, existing-work, container, or entity boundary.
- `references/clarification-policy.md`: whether to ask, assume, run Socratic interview, or return `ASK_USER`.
- `references/goal-contract-schema.md`: precise field semantics or higher-risk output boundaries.
- `references/spec-template.md`: durable spec creation.
- `references/frame-examples.md`: uncertain routing or output shape.
- `references/recovery-check.md`: interrupted state, dirty worktree, or partial artifacts.

## Goal Contract

Produce a compact contract:

```text
Goal Contract:
- Intent:
- Goal type:
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

`Spec` is the requirement carrier. For small tasks, write an inline compact spec:

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

Create or update a durable spec only for multi-round clarification, multiple independent phases/modules/repos/ownership boundaries, handoff, long acceptance/constraints, high risk, medium risk with real scope drift, or user request. Default path: `docs/design/YYYYMMDD-<slug>-spec.md`.

Allowed `Frame verdict` values:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `DESIGN_ONLY`
- `COMPARISON_ONLY`
- `READY_FOR_VERIFY`
- `BLOCKED`

Return `READY_FOR_ITERATION` only when target boundary is closed, `Spec.Acceptance` is verifiable, `Spec.Claim boundary` is explicit, `Spec.Scope`, `Spec.Constraints`, and `Spec.Evidence` are recorded, risk and assumptions are recorded, Spec content or durable spec path/status/summary is present, container terms are decomposed or risk is explicit, existing-work scan was run when triggered, and no user decision blocks mutation safety.

## Stage Loading

If the user asks to audit, compare, or verify this skillset, SKILL files, references, docs, installer, or validator, treat those files as the target evidence bundle and read all directly relevant files.

`goal-loop` is the only skill that should be implicitly invoked for goal workflows. Before entering a downstream stage, read the sibling stage file:

- ITERATE: `../goal-iterate/SKILL.md`
- VERIFY: `../goal-verify/SKILL.md`
- REVIEW: `../goal-review/SKILL.md`, only for explicit or risk-triggered review.

If a downstream stage file is missing, report a blocker instead of reconstructing rules from memory.

## Domain skill coexistence

When a named or repo-required domain skill also applies, use Goal Loop for triage, frame, routing, isolation, mutation safety, evidence, and final claims. Use the domain skill for task-specific design, editing, and validation rules. FRAME records how the domain skill changes acceptance, constraints, non-goals, and evidence. ITERATE applies it inside the closed target boundary. VERIFY treats its validation requirements as evidence requirements.

## Global invariants

- No Goal Contract, no implementation mutation.
- No target boundary, no implementation mutation.
- No isolated edit path or approved first-step isolation setup, no implementation mutation.
- No Verification Verdict, no final completion claim.
- No final claim may exceed the verified claim boundary.
- Do not create durable specs or plans by default; escalate only for risk, complexity, handoff, recovery, or user request.
- Goal Contract must contain a `Spec` field. Small tasks use an inline compact spec; complex tasks may reference a durable spec.
- In Goal Loop, `Artifacts` means loop-owned process artifacts such as specs, plans, reviews, evidence, or scratch files; do not use it to enumerate product-domain objects.
- root-cause claim needs debug evidence that validates the root-cause statement, not merely a plausible patch location. `NOT_REPRODUCED` and `BLOCKED` only support diagnostic claims, not repair-complete claims.
- Repository mutation must use an isolated edit path. Default to `.worktrees/codex/<task-slug>/` under the selected repo or subrepo unless project rules are stricter or the path is technically unavailable.
- Before using `.worktrees/` or `.goal-loop/`, confirm the path is gitignored or record explicit approval for the alternative. Never edit directly in a primary `main`/`master` checkout.
- Do not merge the isolated task branch back into `main`/`master`, and do not clean up the worktree before PR/MR or local merge completion.

## Default artifact paths

Prefer repo conventions. If none exist, use:

- spec: `docs/design/YYYYMMDD-<slug>-spec.md`
- plan: `docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt: `.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence: `.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts: `.goal-loop/tmp/YYYYMMDD-<slug>/`

`<slug>` names the goal boundary. Do not create empty artifact directories.

## Route After Frame

- `READ_ONLY`, `DESIGN_ONLY`, and `COMPARISON_ONLY`: answer within the framed boundary; include findings, evidence, recommendations, and residual uncertainty when applicable.
- `READY_FOR_ITERATION`: enter `goal-iterate`.
- `READY_FOR_VERIFY`: enter `goal-verify`.
- `ASK_USER`: ask the single blocking question in `Next`.
- `BLOCKED`: report the blocker and smallest missing input, permission, data, environment, or tool.

Enter `goal-iterate` only when the Goal Contract exists, target repo/path is closed, mutation or evidence work must continue, Goal type is recorded, isolated edit path can be established, and active specs/plans have been read or are explicitly unnecessary.

Enter `goal-verify` when implementation appears complete, the user asks for done/ready/ship/merge/correct/safe judgment, the final response would claim completion/readiness/correctness/safety, or `goal-iterate` returns `ITERATION_READY_FOR_VERIFY`.

Enter `goal-review` only when the user names `$goal-review`, repo rules require independent review, or feedback has architecture, scope, ownership, complexity, or claim-boundary risk.

## Recovery routing

For interrupted work, inspect:

- current repo, branch, status, and changed files;
- last Goal Contract, Spec, Plan, Iteration Record, and Verification Verdict;
- user-owned uncommitted changes or cross-repo/submodule boundaries;
- safest next state: `FRAME`, `ITERATE`, `VERIFY`, `REVIEW`, or `BLOCKED`.

If the state is unclear, read `references/recovery-check.md`.

## Route output

When routing is not obvious, output:

```text
Route:
- goal type:
- frame needed:
- next entry:
- reason:
- blocking missing input:
- next action:
```

Do not emit a route record for trivial read-only answers.

## Final output rule

Any completion claim must rest on the latest Verification Verdict.

Non-completion exits do not need a Verification Verdict: `ASK_USER`, `READ_ONLY`, `DESIGN_ONLY`, `COMPARISON_ONLY`, and `BLOCKED` may report only boundaries, findings, design decisions, comparison results, or blockers. They must not claim implementation completion.
