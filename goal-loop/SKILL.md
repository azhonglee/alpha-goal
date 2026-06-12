---
name: goal-loop
description: Route non-trivial coding and evidence-bound engineering tasks through goal-frame, goal-iterate, goal-review, and goal-verify. Use for multi-step coding tasks that may require mutation, staged implementation, recovery, review feedback inside an active goal, verification of changed work, completion claims, or non-trivial read-only audits/comparisons that require target, local-rule, existing-work, or evidence-boundary discovery. Do not use for trivial read-only explanation, ordinary standalone code review, simple diff review, summarization, or advisory answers when no target/rule/evidence discovery, active goal, mutation path, or completion claim is in scope.
---

## Read-only routing

- Bypass Goal Loop for trivial explanation, summarization, or ordinary standalone review with a clear target and no mutation path, active goal, or completion claim.
- Run FRAME only and exit `READ_ONLY` for non-trivial read-only audits that need target, local-rule, existing-work, or evidence-boundary discovery but no mutation or completion claim. When the user requested findings, do not stop at the Goal Contract; after discovery, perform the bounded read-only audit and return findings, evidence, recommendations, and residual uncertainty.
- Run FRAME only and exit `COMPARISON_ONLY` for read-only comparison of existing work when target or evidence-boundary discovery is needed and no mutation is requested.
- Use REVIEW or VERIFY only for read-only checks inside an active Goal Contract, review feedback path, or implementation completion/readiness claim.

# Goal Loop Router

Goal Loop is a staged execution protocol, not a long-form ritual.

Use the smallest stage that can safely advance the task.

```text
FRAME -> ITERATE -> REVIEW -> VERIFY -> FINAL
                  -> VERIFY
                  -> ITERATE
                  -> FRAME
                  -> BLOCKED
```

## Stage loading

When the user explicitly asks to audit, compare, or validate this skill package, SKILL.md files, references, docs, installer, or validator behavior, treat those files as the target evidence bundle. Read all directly relevant `SKILL.md` files and the referenced files requested by the user, even if a stage would normally load references lazily.


`goal-loop` is the only skill that should trigger implicitly for implementation work. Stage skills should run only when explicitly named by the user or selected by this router. This is a multi-skill package; install all stage skills together. Before executing a stage, read that stage's sibling `SKILL.md` directly:

- FRAME: `../goal-frame/SKILL.md`
- ITERATE: `../goal-iterate/SKILL.md`
- REVIEW: `../goal-review/SKILL.md`
- VERIFY: `../goal-verify/SKILL.md`

If a referenced stage file is unavailable, report the missing stage file as a blocker before mutating. Do not infer missing stage rules from memory.

## Domain skill coexistence

When another explicitly named or repository-required skill applies, use Goal Loop for routing, isolation, mutation safety, evidence, and final completion claims. Use the domain skill for task-specific design, editing, and validation constraints. Load the domain skill during FRAME when it affects acceptance, constraints, non-goals, or evidence plan; apply its editing rules during ITERATE within the closed target boundary; treat its validation or forward-testing requirements as REVIEW/VERIFY evidence.

## Global invariants

- No Goal Contract, no implementation mutation.
- No target boundary, no implementation mutation.
- No isolated edit path or approved first-step isolation setup, no implementation mutation.
- No unsupported review or verification conclusion without evidence.
- No continuing past review feedback, complexity, scope expansion, architecture/ownership risk, or evidence uncertainty without a current Review Record.
- No Verification Verdict, no final completion claim.
- No final claim may exceed the verified claim boundary.
- Do not create spec or plan by default; escalate only for risk, complexity, handoff, or user request.
- Durable artifact writes are allowed only by their owning stage rules; they do not authorize implementation mutation.
- In Goal Loop, `Artifacts` means loop-owned process artifacts such as specs, plans, reviews, evidence, or scratch files; do not use it to enumerate product-domain objects.
- Read the current version and status before relying on any spec or plan.
- Do not execute from a `superseded` artifact. Do not treat `draft` as approved when approval is required.
- A plan must not redefine Goal Contract or active spec intent, success criteria, non-goals, constraints, or decision boundaries.
- A bug-fix or root-cause claim needs debug evidence that validates the root-cause statement, not just a plausible patch location. `NOT_REPRODUCED` and `BLOCKED` support diagnostic claims only, not repair completion.

## Artifact locations

Prefer existing repo conventions. If none exist, use:

- spec: `docs/design/YYYYMMDD-<slug>-spec.md`
- plan: `docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt: `.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence: `.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts: `.goal-loop/tmp/YYYYMMDD-<slug>/`

`<slug>` names the goal boundary. Do not create empty artifact directories. Before writing `.goal-loop/`, confirm it is gitignored; otherwise do not write there unless the user explicitly approves a committed durable artifact path and the Goal Contract records that decision.

## Routing

### Start in FRAME

Use `goal-frame` when any of these is true:

- the task is new or non-trivial;
- the user request is ambiguous;
- the target term may be a user-facing container, page, space, or umbrella concept that must be decomposed before selecting a submodule/entity/API;
- the target repo, package, service, or path is unclear;
- the workspace may contain multiple repos or submodules;
- the task may duplicate an existing MR/PR/branch/issue/design doc;
- mutation may be needed;
- previous verification returned `REFRAME`;
- durable requirements may be needed before safe iteration.

`goal-frame` exits with one of:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

### Enter ITERATE only after FRAME is closed

Use `goal-iterate` when all are true:

- a Goal Contract exists;
- `Frame verdict` is `READY_FOR_ITERATION`;
- target repo/path is closed;
- mutation is required;
- the isolated edit path is known or can be safely created as the first ITERATE setup action after preflight;
- any active spec has been read, and any active plan is current or intentionally absent.

`goal-iterate` exits with one of:

- `ITERATION_READY_FOR_VERIFY`
- `ITERATION_READY_FOR_REVIEW`
- `BLOCKED`
- `REFRAME_NEEDED`

### Enter REVIEW when direction or diff needs challenge

Use `goal-review` when any of these is true:

- loop evidence contradicts assumptions;
- logs, API/RPC names, payload fields, or user corrections point to a different entity or submodule than the current Goal Contract;
- scope expands or implementation becomes complex;
- review feedback arrives and must be evaluated before action;
- an architecture, scope, code, loop, or goal check is needed before continuing;
- previous iteration returned `ITERATION_READY_FOR_REVIEW`;
- an active spec or plan may be stale, over-broad, superseded, or inconsistent with current evidence.

If both REVIEW and VERIFY conditions match, run REVIEW first unless a current Review Record already returns `READY_FOR_VERIFY`.

`goal-review` exits with one of:

- `CONTINUE`
- `NEXT_ITERATION`
- `REFRAME`
- `SIMPLIFY`
- `BLOCKED`
- `READY_FOR_VERIFY`

`CONTINUE` means the reviewed current stage may proceed only within its prior route. It must name the next stage in `Next`; use `NEXT_ITERATION` for more implementation/evidence and `READY_FOR_VERIFY` for completion-readiness. `CONTINUE` never authorizes final output.

### Enter VERIFY before any completion claim

Use `goal-verify` when any of these is true:

- implementation appears complete;
- there is a diff, patch, commit, MR/PR, local evidence to assess, delivery, or completion readiness for changed work;
- the user asks whether it is done, ready to merge, ready to ship, or whether a final claim is supported, and a Goal Contract or target boundary is available or discoverable;
- final output that includes or implies implementation completion, delivery readiness, merge readiness, correctness/safety of completed work, MR/PR creation, or another completion claim is being prepared;
- previous iteration returned `ITERATION_READY_FOR_VERIFY`;
- review returned `READY_FOR_VERIFY`;
- active spec/plan artifacts, if any, must be checked against final evidence.

If the user asks for readiness but no Goal Contract, target boundary, diff/MR, or evidence bundle is available or discoverable, route to FRAME/recovery first. If VERIFY is already entered, return `REFRAME`; do not guess from user-reported tests.

`goal-verify` exits with one of:

- `PASS_TO_FINAL`
- `NARROW_CLAIM_AND_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`

## Recovery routing

Before continuing after interruption, resumed context, dirty workspace, or partially completed work, run a recovery check:

- current repo;
- current branch;
- status / changed files;
- previous intended goal if known;
- active spec/plan artifacts if known;
- safest next state: `FRAME`, `ITERATE`, `REVIEW`, `VERIFY`, or `BLOCKED`.

Use `references/recovery-check.md` when the resumed state is not obvious.

## Router output

When routing is non-obvious, emit this compact route record:

```text
Route:
- state:
- reason:
- required skill:
- blocking missing input:
- next action:
```

Do not emit route records for trivial read-only questions.

## Final output rule

Any final completion claim must be based on the latest Verification Verdict.

If a spec or plan was used, final output must mention the artifact boundary and whether final evidence covered it, superseded it, or left gaps.

No Verification Verdict is required for non-completion exits from FRAME such as `ASK_USER`, `READ_ONLY`, `COMPARISON_ONLY`, or `BLOCKED`. In those cases, final output may report the route, blocker, comparison boundary, or read-only finding without claiming implementation completion.

If the verdict is:

- `PASS_TO_FINAL`: claim completion within the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: explicitly narrow the claim and list the gap.
- `NEXT_ITERATION`: do not claim completion; continue iteration.
- `REFRAME`: return to goal-frame before mutating further.
- `BLOCKED`: explain the blocker and ask for the specific missing input or permission.
