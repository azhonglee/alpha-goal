---
name: goal-loop
description: Route non-trivial read-only, coding, debugging, feedback, recovery, and verification work by intent. Use when target/evidence-boundary discovery, mutation, active-goal continuation, feedback handling, completion claims, or recovery is in scope. Do not use for trivial explanations, summaries, ordinary standalone reviews, simple diff reviews, or advisory answers without discovery, mutation, active goal, or completion claim.
---

# Goal Loop Router

`goal-loop` only performs light intent routing. Stage skills do the real work.

Default path:

```text
INTENT -> FRAME -> ITERATE(dynamic plan -> execution -> feedback) -> VERIFY -> FINAL
                    ^--------------------------------------------|
```

`goal-review` is optional. Load it only when the user names it, repo rules require it, or feedback carries architecture, scope, ownership, complexity, or claim-boundary risk. Ordinary feedback stays in the `goal-iterate` feedback phase.

## Intent routing

Choose one atomic loop type, then choose the entry stage. Loop type names the user's end goal, not the current read/write permission. Do not invent composite loop types.

- `NEW_GOAL`: new work, unclear target, possible implementation, or acceptance/boundary framing. Entry: `goal-frame`.
- `DEBUG_GOAL`: bug, failure, root cause, broken behavior, or abnormal signal. Entry: `goal-frame`; later use debug-oriented iteration.
- `CONTINUE_GOAL`: an existing Goal Contract needs more implementation, evidence, failed-check handling, or user/reviewer feedback. Entry: `goal-iterate`; if the contract is missing, return to `goal-frame`.
- `READ_ONLY_DISCOVERY`: the final user goal is audit, diagnosis, comparison, or directional judgment, and target/rule/existing-work/evidence-boundary discovery is needed. Entry: `goal-frame`; return findings, evidence, recommendations, and residual uncertainty inside the read-only boundary.
- `VERIFY_CLAIM`: the user asks whether work is done, ready, correct, safe, or shippable, or the final answer would make a completion claim. Entry: `goal-verify`; if contract or evidence boundary is missing, return to `goal-frame`.
- `RECOVERY`: interrupted context, dirty worktree, existing unfinished changes, or partial stage records. Run recovery, then route to `FRAME`, `ITERATE`, `VERIFY`, `REVIEW`, or `BLOCKED`.

Bypass Goal Loop for trivial explanations, summaries, ordinary standalone review, simple diff review, or advisory answers with no discovery, mutation path, active goal, or completion claim.

## Stage loading

If the user asks to audit, compare, or verify this skillset, SKILL files, references, docs, installer, or validator, treat those files as the target evidence bundle and read all directly relevant files.

`goal-loop` is the only skill that should be implicitly invoked for implementation routing. Before entering a stage, read the sibling stage file:

- FRAME: `../goal-frame/SKILL.md`
- ITERATE: `../goal-iterate/SKILL.md`
- VERIFY: `../goal-verify/SKILL.md`
- REVIEW: `../goal-review/SKILL.md`, only for explicit or risk-triggered review.

If a stage file is missing, report a blocker instead of reconstructing rules from memory.

## Domain skill coexistence

When a named or repo-required domain skill also applies, use Goal Loop for routing, isolation, mutation safety, evidence, and final claims. Use the domain skill for task-specific design, editing, and validation rules. FRAME records how the domain skill changes acceptance, constraints, non-goals, and evidence. ITERATE applies it inside the closed target boundary. VERIFY treats its validation requirements as evidence requirements.

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

## Routing rules

Enter `goal-frame` when the request is a new goal, target or acceptance is unclear, mutation may be needed, or Discovery/Socratic interview is required. Also frame when the target may be a page, space, workspace, container, or umbrella concept; when multiple repos/submodules or existing MR/PR/branch/issue/design artifacts may overlap; when VERIFY returns `REFRAME`; or when recovery finds an unreliable contract, target, or evidence boundary.

Enter `goal-iterate` when a Goal Contract exists, `Frame verdict: READY_FOR_ITERATION`, target repo/path is closed, mutation or evidence work must continue, loop type is recorded, an isolated edit path can be established, and active specs/plans have been read or are explicitly unnecessary.

Enter `goal-verify` when implementation appears complete, the user asks for done/ready/ship/merge/correct/safe judgment, the final response would claim completion/readiness/correctness/safety, or `goal-iterate` returns `ITERATION_READY_FOR_VERIFY`.

Enter `goal-review` when the user names `$goal-review`, repo rules require independent review, or feedback has architecture, scope, ownership, complexity, or claim-boundary risk.

## Recovery routing

For interrupted work, inspect:

- current repo, branch, status, and changed files;
- last Goal Contract, Spec, Plan, Iteration Record, and Verification Verdict;
- user-owned uncommitted changes or cross-repo/submodule boundaries;
- safest next state: `FRAME`, `ITERATE`, `VERIFY`, `REVIEW`, or `BLOCKED`.

If the state is unclear, read `references/recovery-check.md`.

## Router output

When routing is not obvious, output:

```text
Route:
- loop type:
- entry:
- reason:
- blocking missing input:
- next action:
```

Do not emit a route record for trivial read-only answers.

## Final output rule

Any completion claim must rest on the latest Verification Verdict.

Non-completion exits do not need a Verification Verdict: `ASK_USER`, `READ_ONLY`, `COMPARISON_ONLY`, and `BLOCKED` may report only boundaries, findings, comparison results, or blockers. They must not claim implementation completion.
