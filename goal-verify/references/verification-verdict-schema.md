# Verification Verdict Schema

The Verification Verdict is the only valid basis for a final completion claim.

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

## Field definitions

### Verdict

One of:

- `PASS_TO_FINAL`
- `NARROW_CLAIM_AND_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`

### Acceptance evidence matrix

For every acceptance item from the Goal Contract, record:

- evidence;
- boundary;
- status.

Evidence may be a test, build, typecheck, lint, runtime probe, diff review, MR comparison, manual inspection, or documented blocker.

### Claim boundary

Compare user wording, implemented boundary, tested boundary, highest practical boundary, gap, and final claim allowed.

### Risk/evidence review

Record the risk tier, expected evidence floor, whether a Review Record was required, and whether the evidence was collected after the last material change.

### Fresh checks run

Commands or read-only checks run during this verification pass. Include failures and reasons.

### Diff/scope review

Whether changed files match target and non-goals. Mention unexpected files, unrelated changes, generated artifacts, or broad refactors.

### Unresolved gaps

Anything not proven, not tested, environment-limited, or explicitly outside scope.

### Required next step

One concrete next action: final response, continue iteration, reframe, ask user, or stop.

### Final claim allowed

The exact claim that may be made to the user.
