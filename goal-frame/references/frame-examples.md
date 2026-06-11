# Frame Examples

## Example verdict: ASK_USER

```text
Goal Contract:
- Intent: Fix retryable Feishu card request handling.
- Target: Ambiguous: UI reducer and app-server stream event mapper both contain relevant error handling.
- Acceptance:
  1. Retryable request errors must not mark user-visible run status as failed.
  2. Non-retryable errors must still fail.
- Non-goals: No transport retry policy redesign.
- Constraints: Need know whether user expects reducer-only or full stream lifecycle behavior.
- Decision boundaries: User must choose reducer-only versus full stream lifecycle before mutation.
- Assumptions and risks: UI reducer and stream mapper may both affect the final user-visible state.
- Risk tier: medium.
- Claim boundary: Not closed.
- Evidence plan: Reducer tests plus higher-boundary stream event test if product-level claim is intended.
- Artifacts: spec: none; plan need: not yet.
- Existing work: No obvious local duplicate found in read-only search.
- Frame verdict: ASK_USER
- Next: Ask whether to cover full app-server -> UI event path or only reducer behavior.
```

## Example verdict: COMPARISON_ONLY

```text
Goal Contract:
- Intent: Compare local implementation against MR 503.
- Target: Existing MR and current branch diff, read-only.
- Acceptance:
  1. Identify scope overlap.
  2. Identify missing behavior in either version.
  3. Recommend merge/follow-up/abandon path.
- Non-goals: Do not modify code or create a new MR.
- Constraints: Use MR metadata and local diff only; cite uncertainty if MR content is inaccessible.
- Decision boundaries: You may recommend a path, but user chooses whether to implement follow-up work.
- Assumptions and risks: MR content may be incomplete if remote access fails.
- Risk tier: low.
- Claim boundary: Comparison only.
- Evidence plan: MR file list, commit diff, changed behavior map.
- Artifacts: spec: none; plan need: not yet.
- Existing work: MR 503 is primary object.
- Frame verdict: COMPARISON_ONLY
- Next: Perform read-only comparison; verify only if making a completion or readiness claim.
```
