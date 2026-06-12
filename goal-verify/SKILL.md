---
name: goal-verify
description: Stage skill for the goal-loop package. Produce a Verification Verdict for an active Goal Contract before implementation completion, MR/PR, merge-readiness, correctness/safety, or final delivery claims. Use only when explicitly named by the user or selected by goal-loop; not for standalone read-only code review or advisory audits without a completion claim.
---

# Goal Verify

Your job is to decide whether current evidence supports the requested claim.

Verification is not just running tests. It is a verdict on whether the evidence proves the Goal Contract within the allowed claim boundary.

## Entry

Use this skill when:

- implementation appears complete;
- there is a diff, patch, commit, MR/PR, test result, or runtime observation to assess;
- the user asks whether changed work under an active or recoverable Goal Contract is done, correct, safe, or free of loopholes;
- final output that includes or implies implementation completion, delivery readiness, merge readiness, correctness/safety of completed work, MR/PR creation, or another completion claim is being prepared;
- `goal-iterate` returned `ITERATION_READY_FOR_VERIFY`.
- `goal-review` returned `READY_FOR_VERIFY`.

Do not use this skill for standalone read-only code review, safety review, loophole scan, findings, comparison, or advisory audit when there is no active Goal Contract and no implementation completion, readiness, merge/ship, or correctness claim. For standalone safety or loophole scans without completion/readiness intent, use ordinary read-only review, or route through FRAME only if target/rule/evidence-boundary discovery is needed.

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

If the Goal Contract is missing or target boundary is unclear, return `REFRAME` rather than guessing. For bare readiness claims, first try to recover or identify the local Goal Contract, target boundary, diff/MR, and evidence bundle from current context; if they are not available or discoverable, `REFRAME` with the exact missing inputs.

Minimal evidence bundle for a positive readiness verdict:

- Goal Contract or equivalent target/acceptance/claim boundary;
- current diff, commit, or MR/PR scope;
- fresh repo state after the last material change;
- exact test/check commands and outcomes, or documented blockers;
- acceptance-to-evidence mapping;
- Debug Receipt for bug-fix or root-cause claims;
- current Review Record when review was triggered.

If a required Review Record is missing, do not produce a positive completion verdict. Route to `goal-review` first. If VERIFY was explicitly invoked and cannot route, return `BLOCKED` with `Required next step: goal-review`.

Optional context:

- older logs, previous failed attempts, reviewer comments already classified elsewhere, and user-facing release notes.

## Verification checks

Check:

- every acceptance item has fresh, relevant evidence;
- every active spec success criterion that is inside the claim boundary is covered or explicitly excluded;
- any active plan verification route and evidence gate is satisfied, superseded with reason, or explicitly blocked;
- loop mode, hypothesis, evidence type, learning, and decision are consistent with the final claim;
- any required Review Record covers the latest material change boundary;
- bug-fix and root-cause claims have `ROOT_CAUSE_CONFIRMED`; for non-trivial RCA, evidence validates the root-cause statement by explaining the symptom, identifying the first divergence, aligning affected entities/interfaces/logs when available, excluding or bounding competing hypotheses, and proving the claimed boundary. For low-risk local bug fixes without a formal RCA claim, focused failure-path evidence plus direct code divergence and post-fix tests may satisfy this check;
- `NOT_REPRODUCED` or `BLOCKED` Debug Receipts are not treated as repair completion;
- risk-tier evidence requirements are met or explicitly blocked;
- evidence is at the right boundary for the user's wording, including diagnosis-only claims such as root cause narrowed to a component but not yet fixed internally;
- changed files match intended target and non-goals;
- tests/checks are appropriate for the touched code and, for bug fixes, exercise the confirmed failure path rather than only a neighboring helper or mocked path;
- verification runs against the target final state and does not depend on paths or artifacts that will be removed, self-matching greps, pre-change layout checks, or mock-only checks that miss the claim;
- failure output is understood, not hand-waved;
- review feedback has been classified and accepted items were verified;
- no obvious regression, loophole, race, persistence, stream lifecycle, or UI dispatch gap exists;
- final claim does not exceed evidence.

You may use `scripts/evidence-summary.sh` for read-only diff/status evidence.
Use references only when their detail is needed:

- `references/verification-verdict-schema.md` for field definitions when the output contract is unclear.
- `references/completion-review-rubric.md` for every readiness-to-merge, readiness-to-ship, or final-delivery check.
- `references/claim-boundary-check.md` when user wording is broader than local evidence or when considering `NARROW_CLAIM_AND_FINAL`.

## Evidence matrix

Map acceptance to evidence explicitly. If the claim is diagnostic or root-cause oriented, include the symptom, observed chain, narrowed component, excluded alternatives, and remaining uncertainty inside the relevant evidence rows. If a current spec exists, use it to expand or clarify acceptance without letting it override the Goal Contract's decision boundaries:

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

If the user phrase is product-level but evidence is only local helper/reducer-level, or if the claim says `root cause` while evidence only shows correlation without call-chain closure and alternative exclusion, do not return `PASS_TO_FINAL`.

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
