---
name: goal-verify
description: Judge whether fresh evidence satisfies an active Goal Contract and supports completion, readiness, correctness/safety, MR/PR-ready, or narrowed claims. Use only when explicitly named or selected by goal-loop; not for standalone read-only code review or advisory audits without a completion claim.
---

# Goal Verify

Judge whether current evidence supports the claim. VERIFY does not continue implementation, and it does not treat "tests were run" as completion.

## Entry

Use this skill when:

- implementation appears complete;
- there is a diff, patch, commit, MR/PR, test result, runtime observation, or Iteration Record to judge;
- the user asks whether work is done, ready, correct, safe, ready to merge, or ready to ship;
- the final answer would claim completion, delivery, correctness, safety, MR/PR-readiness, or similar;
- `goal-iterate` returns `ITERATION_READY_FOR_VERIFY`.

Do not use it for ordinary standalone review, security scan, loophole scan, or advisory audit without an active/recoverable Goal Contract and a completion/readiness/correctness claim.

## Required inputs

A positive verdict needs at least:

- Goal Contract with target, `Spec.Acceptance`, `Spec.Claim boundary`, and risk tier;
- current durable spec/plan if the contract or Iteration Record references it;
- Iteration Record or equivalent diff/evidence bundle;
- Debug Receipt when loop mode is `debug` or the claim mentions a bug/root cause fix;
- fresh repo status for the final target state;
- applicable project rules, or an explicit reason they cannot be read;
- exact test/check/probe commands and outcomes, or an explicit blocker;
- feedback-phase record for user/reviewer/test feedback.

If Goal Contract, target boundary, `Spec.Acceptance`, or evidence bundle is missing, return `REFRAME`; do not guess.

Use `scripts/evidence-summary.sh` for read-only diff/status evidence.

Load references only as needed:

- `references/verification-verdict-schema.md`: exact field semantics.
- `references/completion-review-rubric.md`: readiness-to-merge, readiness-to-ship, or final-delivery judgment.
- `references/claim-boundary-check.md`: user wording is broader than evidence, or a narrowed claim may be needed.

## Acceptance and judgment

VERIFY does two things:

1. `Acceptance`: map each Goal Contract and Spec acceptance item to fresh evidence.
2. `Judgment`: decide whether evidence supports the user's claim, or whether to narrow the claim, iterate, reframe, or block.

Check:

- each `Spec.Acceptance` item has fresh, relevant, final-state evidence;
- inline/durable Spec success criteria are covered inside the claim boundary or explicitly excluded;
- active plan evidence gates are satisfied, superseded, or blocked;
- Iteration Record goal type, dynamic plan, execution, feedback, and learning match the final claim;
- bug/root-cause claims have `ROOT_CAUSE_CONFIRMED`; low-risk local bug fixes without a formal RCA claim may rely on focused failure-path evidence, direct code-branch evidence, and post-fix tests;
- `NOT_REPRODUCED` or `BLOCKED` Debug Receipt is not treated as repair completion;
- changed files match target and non-goals;
- mutation evidence comes from an isolated edit path, not a primary `main`/`master` checkout;
- `.worktrees/` or `.goal-loop/` paths, if used, are gitignored or approved;
- tests/checks cover the claimed boundary, not only nearby helpers, mock-only paths, or temporary paths that will be deleted;
- failing output is understood;
- user/reviewer/test feedback is handled;
- final claim does not exceed evidence.

## Evidence matrix

Map acceptance explicitly:

```text
Acceptance evidence matrix:
- Acceptance:
  Evidence:
  Boundary:
  Status:
```

Allowed status:

- `covered`
- `partially covered`
- `not covered`
- `blocked`
- `not applicable`

## Claim boundary check

Before final claims, compare:

```text
Claim boundary:
- User wording:
- Implemented boundary:
- Tested boundary:
- Highest practical boundary:
- Gap:
- Final claim allowed:
```

If user wording is product-level but evidence is only helper/reducer-level, do not return `PASS_TO_FINAL`. Choose `NEXT_ITERATION` for higher-boundary evidence, or `NARROW_CLAIM_AND_FINAL` with an explicit narrowed claim.

## Verdicts

Return one verdict:

- `PASS_TO_FINAL`: evidence covers acceptance and claim boundary.
- `NARROW_CLAIM_AND_FINAL`: local target is satisfied, but final claim must be narrower than user wording.
- `NEXT_ITERATION`: direction is valid, but implementation or evidence is still needed.
- `REFRAME`: Goal Contract, target, `Spec.Acceptance`, `Spec.Claim boundary`, or existing-work relationship is wrong or incomplete.
- `BLOCKED`: environment, data, permission, credential, or user decision is missing.

## Output

Produce a Verification Verdict:

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Spec review:
- Artifact review:
- Claim boundary:
- Risk/evidence review:
- Fresh checks run:
- Diff/scope review:
- Feedback review:
- Judgment:
- Unresolved gaps:
- Required next step:
- Final claim allowed:
```

## Routing

- `PASS_TO_FINAL`: final answer may claim completion inside the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: final answer must state the narrowed claim and remaining higher-boundary gap.
- `NEXT_ITERATION`: return to `goal-iterate`; do not claim completion.
- `REFRAME`: return to `goal-loop` frame phase; do not continue mutation.
- `BLOCKED`: report blocker and the smallest missing input or permission.
