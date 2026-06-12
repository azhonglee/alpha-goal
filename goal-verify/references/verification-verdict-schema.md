# Verification Verdict Schema

The Verification Verdict is the only valid basis for a final completion claim.

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

Evidence may be a test, build, typecheck, lint, runtime probe, diff review, MR comparison, manual inspection, call-chain/log alignment, alternative exclusion, or documented blocker. For root-cause claims, record symptom, first divergence point, narrowed component, excluded material alternatives, and residual uncertainty.

### Artifact review

Record whether any active spec or plan was read and whether final evidence covers it. If an artifact is stale, draft-only, superseded, or broader than the verified boundary, return `NEXT_ITERATION`, `REFRAME`, `BLOCKED`, or `NARROW_CLAIM_AND_FINAL` instead of overclaiming.

### Claim boundary

Compare user wording, implemented or diagnosed boundary, tested boundary, highest practical boundary, gap, and final claim allowed. For diagnostic claims, distinguish `root cause narrowed to component X` from `internal defect in X fully identified` or `fix completed`.

### Risk/evidence review

Record the risk tier, expected evidence floor, loop mode fit, Debug Receipt status when relevant, root-cause statement and validation evidence for bug-fix/RCA claims, competing hypotheses rejected or bounded, entity/API/log alignment for diagnostic work, whether final checks exercised the confirmed failure path, whether a Review Record was required and current for its freshness boundary, whether applicable project rules were read or explicitly not independently verified, and whether the evidence was collected after the last material change.

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
