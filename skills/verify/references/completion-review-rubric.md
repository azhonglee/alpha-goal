# Completion Review Rubric

Use this reference for readiness-to-merge, readiness-to-ship, final-delivery, or other formal completion judgments. This review is internal to `verify`; it is not an advisory code review.

## Positive verdict floor

Return `PASS_TO_FINAL` only when:

- approved context is current and semantically covers acceptance, included/excluded scope, decision boundaries, and claim boundary;
- changed files and artifacts match target and non-goals;
- implementation/evidence history is consistent with the current diff;
- fresh checks ran after the last material change, or substitute evidence is explicitly sufficient for the narrowed claim;
- feedback is handled, out of scope, or routed elsewhere;
- the strongest material risk has matching evidence;
- bug/root-cause claims have valid root-cause evidence;
- final claim does not exceed tested or observed boundary.

## Evidence floor by risk

Choose evidence by the strongest material risk, not by a ceremonial tier label:

- localized/read-only/low blast radius: diff review plus focused check or direct evidence may be enough;
- behavior, API, data, or user-visible change: relevant automated test, runtime probe, integration evidence, or explicit substitute is needed;
- migration, security, compliance, production, tenant, or irreversible claim: final-state, environment-specific, or independently reviewable evidence is needed;
- missing environment/tool/data: narrow the claim, return `NEXT_ITERATION`, or return `BLOCKED`.

## Return NEXT_ITERATION

Use when acceptance is partially covered, checks/probes/cleanup/edge cases/feedback action remain, implementation direction is valid but evidence is not final-state, or a narrowed claim would not satisfy the user.

## Return REFRAME

Use when target/scope, acceptance, non-goals, existing-work relationship, user intent, or claim boundary is wrong or incomplete; or when evidence points to a different entity, API/RPC, submodule, repo, or user-owned decision.

## Return BLOCKED

Use when credential, permission, service, data, tooling, environment, or required user risk/scope decision is missing and no meaningful loop progress can be made.

## Narrowed claim

When the local target is satisfied but user wording is broader, return `NARROW_CLAIM_AND_FINAL` and state:

- widest verified boundary;
- higher boundary not verified;
- final wording the user may receive.
