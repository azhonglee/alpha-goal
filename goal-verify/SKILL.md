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

## Required inputs

Prefer to have:

- Goal Contract;
- Iteration Record or current diff/evidence;
- Review Record when review was triggered by feedback, complexity, scope expansion, uncertainty, or completion readiness;
- fresh repo state;
- applicable project rules;
- commands/tests already run, or an explicit reason they cannot run.

If the Goal Contract is missing or target boundary is unclear, return `REFRAME` rather than guessing.

## Verification checks

Check:

- every acceptance item has fresh, relevant evidence;
- risk-tier evidence requirements are met or explicitly blocked;
- evidence is at the right boundary for the user's wording;
- changed files match intended target and non-goals;
- tests/checks are appropriate for the touched code;
- failure output is understood, not hand-waved;
- review feedback has been classified and accepted items were verified;
- no obvious regression, loophole, race, persistence, stream lifecycle, or UI dispatch gap exists;
- final claim does not exceed evidence.

You may use `scripts/evidence-summary.sh` for read-only diff/status evidence.

## Evidence matrix

Map acceptance to evidence explicitly:

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

Use `references/claim-boundary-check.md` for examples.

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
