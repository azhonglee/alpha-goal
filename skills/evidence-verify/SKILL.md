---
name: evidence-verify
description: "Judge whether fresh evidence satisfies a Goal Contract and supports completion, correctness, merge-readiness, ship-readiness, safety, or a narrowed final claim. Use for final comparator/error-boundary decisions, not implementation."
---

# Evidence Verify

Act as comparator. Completion is unproven until evidence covers every explicit requirement and claim boundary.

## Resources

Load only when useful: `references/verification-verdict-schema.md`, `references/completion-review-rubric.md`, `references/claim-boundary-check.md`.

## Inputs

Read the Goal Contract/equivalent, latest route/iteration state, diff/artifacts, command outputs, tests, logs, reviewer/user feedback, and relevant specs. Use `npx --yes tsx skills/evidence-verify/scripts/evidence-summary.ts` from repo root, or equivalent manual checks, for git evidence.

## Verification rules

- Verify against the original reference, not the work already done.
- Map every explicit requirement, named artifact, command, invariant, and deliverable to authoritative evidence.
- Match evidence scope to claim scope; narrow checks cannot prove broad claims.
- Treat missing, stale, indirect, contradicted, or merely plausible evidence as not achieved.
- Inspect whether validators/tests actually cover the requirement they are cited for.
- Do not repair during verification; route back instead.
- Final wording must not exceed the highest practical evidence-supported boundary.

## Verdicts

- `PASS_TO_FINAL`: evidence proves all requirements and the proposed claim.
- `NARROW_CLAIM_AND_FINAL`: work is useful, but only a narrower claim is proven.
- `NEXT_ITERATION`: gaps are actionable by another bounded slice.
- `REFRAME`: reference/scope/acceptance/authority changed or is unclear.
- `BLOCKED`: required evidence needs missing permission, tool, data, environment, or user-owned decision.

## Output

Persist `.alpha-goal/verification/YYYYMMDD-<slug>.md` for risky, final, or handoff claims.

```markdown
Verification Verdict:
- Claim checked:
- Indicator handoff review:
- Adaptive learning review:
- Evidence coverage:
- Gap:
- Gaps:
- Highest practical evidence-supported boundary:
- Final claim allowed: yes/no
- Verdict:
- Next route:
```

TUI summary:

```markdown
Verification Summary

| Field | Value |
| --- | --- |
| Claim | |
| Evidence | |
| Gaps | |
| Verdict | |
| Next | |
```
