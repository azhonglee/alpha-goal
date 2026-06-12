---
name: verify
description: Judge whether fresh evidence satisfies an active Goal Contract and supports completion, readiness, correctness/safety, MR/PR-ready, or narrowed claims. Use only when explicitly named or selected by alpha-goal or loop; not for standalone read-only code review or advisory audits without a completion claim.
---

# Verify

Judge whether current evidence supports the proposed claim. Do not continue implementation, and do not treat "tests were run" as completion.

## Entry

Use this skill when there is an active or recoverable approved context and the user, `alpha-goal`, or `loop` asks whether work is done, correct, safe, ready to merge/ship, or ready for a narrowed final claim.

Do not use it for ordinary standalone review, security scan, loophole scan, or advisory audit without a completion/readiness/correctness claim.

A positive verdict needs proportional semantic evidence for:

- desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, acceptance/evidence expectations, and claim boundary;
- current durable spec/plan if referenced;
- Iteration Record or equivalent diff/evidence bundle;
- Debug Receipt when the claim is a bug/root-cause fix;
- strongest material risk or enough context to infer the evidence floor;
- fresh final-target repo status and applicable project rules;
- exact commands/probes/checks and outcomes, or an explicit blocker;
- feedback handling for user/reviewer/test feedback.

Load references only when needed:

- `references/verification-verdict-schema.md`: field semantics for a full verdict.
- `references/completion-review-rubric.md`: final delivery, readiness-to-merge, or readiness-to-ship floor.
- `references/claim-boundary-check.md`: user wording may be broader than evidence.
- `scripts/evidence-summary.sh`: read-only diff/status evidence.

## Process

```text
Map acceptance -> Check artifacts -> Check claim boundary -> Judge -> Route
```

### 1. Map acceptance

For each acceptance or evidence expectation, identify fresh final-state evidence, its boundary, and status:

- `covered`
- `partially covered`
- `not covered`
- `blocked`
- `not applicable`

Evidence must match the scope of the claim. A lower-boundary test cannot prove a higher-boundary user-visible or production claim.

### 2. Check artifacts and risk

Confirm:

- approved context and durable specs/plans are current or explicitly superseded;
- Iteration Record goal type, dynamic plan, execution, feedback, and learning match the final diff and claim;
- changed files match target and non-goals;
- an empty diff supports deliverability only when the approved context expects no file changes and the evidence bundle covers that no-change claim; otherwise return `BLOCKED`, `REFRAME`, or `NEXT_ITERATION`, not `PASS_TO_FINAL`;
- mutation evidence comes from an isolated edit path, not a primary `main`/`master` checkout;
- `.worktrees/` or `.alpha-goal/` paths, if used, are gitignored or approved;
- fresh checks ran after the last material change, or missing checks have a stated blocker/substitute evidence;
- failing output is understood and not hidden by broad claims;
- user/reviewer/test feedback is handled or explicitly out of scope.

Bug/root-cause claims need `ROOT_CAUSE_CONFIRMED`. Low-risk local bug fixes without a formal RCA claim may rely on focused failure-path evidence, direct code-branch evidence, and post-fix tests. `NOT_REPRODUCED` or `BLOCKED` does not support a repair-complete claim.

### 3. Check claim boundary

Compare:

- user wording;
- implemented boundary;
- tested boundary;
- highest practical boundary supported by fresh evidence;
- gap;
- final claim allowed.

If user wording is product-level but evidence is only helper-level, choose either `NEXT_ITERATION` for broader evidence or `NARROW_CLAIM_AND_FINAL` with an explicit narrowed claim.

### 4. Judge

Return exactly one verdict:

- `PASS_TO_FINAL`: evidence covers acceptance and claim boundary.
- `NARROW_CLAIM_AND_FINAL`: local target is satisfied, but final wording must be narrower than the user request.
- `NEXT_ITERATION`: direction is valid, but implementation or evidence is still needed.
- `REFRAME`: Goal Contract, target/scope, non-goals, acceptance, existing-work relationship, or claim boundary is wrong or incomplete.
- `BLOCKED`: environment, data, permission, credential, tooling, or user-owned risk/scope decision is missing.

### 5. Output

Produce a Verification Verdict proportional to risk. Include these semantics, merging irrelevant fields when concise:

- verdict;
- acceptance evidence matrix;
- contract/artifact review;
- claim boundary;
- risk and evidence review, including strongest material risk when relevant;
- fresh checks run;
- diff/scope review;
- feedback review;
- judgment;
- unresolved gaps;
- required next step;
- final claim allowed.

Routing:

- `PASS_TO_FINAL`: final answer may claim completion inside the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: final answer must state the narrowed claim and remaining higher-boundary gap.
- `NEXT_ITERATION`: return to `loop`; do not claim completion.
- `REFRAME`: return to `alpha-goal`; do not continue mutation.
- `BLOCKED`: report blocker and the smallest missing input or permission.
