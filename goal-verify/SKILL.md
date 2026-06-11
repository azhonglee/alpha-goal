---
name: goal-verify
description: Produce a Verification Verdict before final output. Use after implementation, before MR/PR/final claims, when asked if work is done/correct/safe, or when checking loopholes. Maps acceptance to evidence and routes to final, next iteration, reframe, or blocked.
---

# Goal Verify

Your job is to decide whether current evidence supports the requested claim.

Verification is not just running tests. It is a verdict on whether the evidence proves the Goal Contract within the allowed claim boundary.

## Entry

Use this skill when:

- implementation appears complete;
- there is a diff, patch, commit, MR/PR, test result, or runtime observation to assess;
- the user asks whether work is done, correct, safe, or has loopholes;
- final output, MR/PR creation, or completion claim is being prepared;
- `goal-iterate` returned `ITERATION_READY_FOR_VERIFY`.
- `goal-review` returned `READY_FOR_VERIFY`.

## Required inputs

Hard requirements for completion claims:

- Goal Contract with target, acceptance, risk tier, and claim boundary;
- current spec if the Goal Contract references a durable spec;
- current plan if the Iteration Record or Review Record references a durable plan;
- Iteration Record or current diff/evidence;
- Debug Receipt when the work used `debug` mode or claims to fix a bug;
- fresh repo state from after the last material change;
- applicable project rules, or an explicit reason they cannot be read;
- commands/tests already run, or an explicit reason they cannot run;
- Review Record when review was triggered by feedback, complexity, scope expansion, architecture/ownership risk, evidence uncertainty, or explicit completion-readiness review.

If the Goal Contract is missing or target boundary is unclear, return `REFRAME` rather than guessing.

If a required Review Record is missing, do not produce a positive completion verdict. Return `BLOCKED` with `Required next step: goal-review`, or let the router run `goal-review` first.

Optional context:

- older logs, previous failed attempts, reviewer comments already classified elsewhere, and user-facing release notes.

## Verification checks

Check:

- every acceptance item has fresh, relevant evidence;
- every active spec success criterion that is inside the claim boundary is covered or explicitly excluded;
- any active plan verification route and evidence gate is satisfied, superseded with reason, or explicitly blocked;
- loop mode, hypothesis, evidence type, learning, and decision are consistent with the final claim;
- any required Review Record covers the latest material change boundary;
- bug-fix claims have `ROOT_CAUSE_CONFIRMED`, and fresh final evidence proves the fix boundary;
- `NOT_REPRODUCED` or `BLOCKED` Debug Receipts are not treated as repair completion;
- risk-tier evidence requirements are met or explicitly blocked;
- evidence is at the right boundary for the user's wording;
- changed files match intended target and non-goals;
- tests/checks are appropriate for the touched code;
- verification runs against the target final state and does not depend on paths or artifacts that will be removed, self-matching greps, pre-change layout checks, or mock-only checks that miss the claim;
- failure output is understood, not hand-waved;
- review feedback has been classified and accepted items were verified;
- no obvious regression, loophole, race, persistence, stream lifecycle, or UI dispatch gap exists;
- final claim does not exceed evidence.

You may use `scripts/evidence-summary.sh` for read-only diff/status evidence.
Use `references/verification-verdict-schema.md` for field definitions, `references/completion-review-rubric.md` when checking readiness to merge or ship, and `references/claim-boundary-check.md` when user wording is broader than local evidence.

## Evidence matrix

Map acceptance to evidence explicitly. If a current spec exists, use it to expand or clarify acceptance without letting it override the Goal Contract's decision boundaries:

```text
Acceptance evidence matrix:
- Acceptance:
  Evidence:
  Boundary:
  Status:
```

Allowed status values:

- `covered`
- `partially covered`
- `not covered`
- `blocked`
- `not applicable`

## Claim Boundary Check

Before final output, compare user wording with tested boundary:

```text
Claim boundary:
- User wording:
- Implemented boundary:
- Tested boundary:
- Highest practical boundary:
- Gap:
- Final claim allowed:
```

If the user phrase is product-level but evidence is only local helper/reducer-level, do not return `PASS_TO_FINAL`.

Choose either:

- `NEXT_ITERATION` to add higher-boundary evidence; or
- `NARROW_CLAIM_AND_FINAL` to explicitly narrow the final claim.

## Verdicts

Return exactly one:

- `PASS_TO_FINAL`: evidence covers acceptance and claim boundary.
- `NARROW_CLAIM_AND_FINAL`: local goal is satisfied, but final claim must be narrower than the user's broad wording.
- `NEXT_ITERATION`: direction is right, but more implementation or evidence is required.
- `REFRAME`: Goal Contract, target, acceptance, or existing-work relationship is wrong or incomplete.
- `BLOCKED`: required environment, data, permission, or decision is unavailable.

## Output

Produce exactly one Verification Verdict:

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Artifact review:
- Claim boundary:
- Risk/evidence review:
- Fresh checks run:
- Diff/scope review:
- Unresolved gaps:
- Required next step:
- Final claim allowed:
```

## Final output routing

If `PASS_TO_FINAL`, provide final output with evidence summary and any caveats.

If `NARROW_CLAIM_AND_FINAL`, final output must explicitly state the narrowed claim and unresolved higher-boundary gap.

If `NEXT_ITERATION`, do not claim completion; route to `goal-iterate`.

If `REFRAME`, route to `goal-frame` before further mutation.

If `BLOCKED`, explain the blocker and ask for the smallest missing input or permission.
