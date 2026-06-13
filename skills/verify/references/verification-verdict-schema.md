# Verification Verdict Schema

Use this full schema for formal acceptance records, MR/PR-ready or ship-ready judgments, high-risk claims, contested evidence, or handoff. For ordinary low-risk checks, a compact verdict is enough if it preserves the same semantics.

## Compact verdict

```text
Verification Verdict:
- Verdict:
- Evidence coverage:
- Claim allowed:
- Gaps:
- Next step:
```

## Full verdict

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Contract review:
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

## Verdict

Exactly one:

- `PASS_TO_FINAL`
- `NARROW_CLAIM_AND_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`

## Acceptance evidence matrix

For each acceptance expectation from the approved context:

- evidence;
- boundary;
- status: `covered`, `partially covered`, `not covered`, `blocked`, or `not applicable`.

Root-cause claims should record symptom, first divergence point, narrowed component, excluded material alternatives, and remaining uncertainty.

## Contract review

State whether the Goal Contract or equivalent approved context is current and whether success criteria are verified. If a durable spec is draft, superseded, broader than evidence, or contradicted, narrow the claim or return `REFRAME`.

## Artifact review

Record active plan/review/evidence artifacts only when they are referenced or materially affect judgment: read, current, covered, superseded, or blocked.

## Claim boundary

Compare user wording, implemented boundary, tested boundary, highest practical evidence-supported boundary, gap, and final claim allowed.

## Risk/evidence review

Name the strongest material risk and the evidence floor it requires. Record Debug Receipt status, root-cause validation, feedback handling, project-rule evidence, and final-state freshness only when relevant.

## Fresh checks run

List commands or manual probes after the last material change. If none ran, state blocker or substitute evidence and adjust verdict accordingly.

## Diff/scope review

Confirm changed files match target/non-goals and no unrelated or unsafe mutation affects the claim. Check isolation/ignore evidence only when repository rules, the approved context, or the final claim depends on it.

## Feedback review

State whether test/user/reviewer feedback has been handled, is out of scope, changes the contract, or still requires loop work.

## Judgment

Use 1-3 sentences explaining why the verdict follows from evidence and whether the final claim must be narrowed.

## Unresolved gaps

Name gaps that block a broader claim.

## Required next step

`final`, `loop`, `alpha-goal`, or a concrete blocker.

## Final claim allowed

Write the widest final statement that fresh evidence supports.
