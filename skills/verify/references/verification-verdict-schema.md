# Verification Verdict Schema

Use this full schema for formal acceptance records, merge-ready or ship-ready judgments, high-risk claims, contested evidence, or handoff. For low-risk checks, a compact verdict is enough if it preserves the semantics.

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
- System model review:
- Artifact review:
- Control law review:
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

For each acceptance expectation:

- evidence;
- boundary;
- freshness;
- status: `covered`, `partially covered`, `not covered`, `blocked`, or `not applicable`.

Root-cause claims should record symptom, first divergence point, narrowed component, excluded alternatives, and remaining uncertainty.

## Control law review

For each material control action or diagnostic probe:

- target error;
- expected effect;
- sensor and threshold;
- observed feedback;
- threshold status: `met`, `partially met`, `not met`, `blocked`, or `not applicable`;
- fallback or residual error.

## Final claim allowed

Write the widest final statement that fresh evidence supports. It must not imply broader product, integration, production, tenant, security, or safety validation than evidence shows.
