---
name: verifier
description: "Verify one persistent Goal Contract checkpoint at a material risk boundary or final state. Use after exclusive executor handoff to collect current evidence, classify criteria, and return one verification route. Do not implement fixes, verify direct work, or change the goal."
---

# Verifier

Independently determine what current evidence proves.

## Validate Entry and Evidence

- Require the accepted contract, accepted authority digest, acceptance-time completeness, matching task/context checkpoint log whose last valid record has `active_owner: verifier`. Recompute the digest with `authority-digest.js`; an invalid entry produces no verdict.
- An earlier accepted payload lacking current completeness rows may continue only when the checkpoint records the same task and digest; infer no authority and reject gaps already present.
- Inspect actual target, delivery, and dependencies. Re-observe evidence; claim separate-agent independence only when an isolated verifier performed it.

For every criterion record source, observer, attributable result/status, state identity, `as_of`, freshness/invalidation, and `passed|failed|pending|blocked`. Identity covers applicable repository/worktree, HEAD, dirty/untracked digest, artifact/delivery/remote identity, dependency version, and observation time. Verifier never narrows the accepted claim.

Accept only observable attributable evidence. Effort, confidence, absence of failure, native lifecycle state, unrelated tests, and stale results prove nothing. Prefer non-mutating observers; if observation changes target/delivery state, return `NEXT_ITERATION` so executor records the mutation before re-verification.

## Routes

Return exactly one route:

- `PASS_TO_FINAL`: every criterion passes with fresh final-state evidence and no drift or blocker.
- `NEXT_ITERATION`: the accepted goal remains feasible and a concrete authorized executor batch can close the gap.
- `BLOCKED`: attributable post-acceptance facts invalidate accepted feasibility/completeness—including later loss of a required observer, dependency, or prerequisite—and no currently authorized approach remains. A gap known before acceptance invalidates entry instead of producing a verdict.

For empty/partial/suspicious results, continue safe non-mutating observation while useful. `incomplete` is not a route: map unavailable facts to a concrete batch or blocker. Never return unchanged state without a blocker, changed condition, or materially different batch.

If the acceptance authority materially changes the goal while verifier owns the checkpoint, stop observation and do not issue a verdict. Run:

```text
bash <executor-root>/scripts/checkpoint-lock.sh terminate <absolute-checkpoint.jsonl> <expected-revision> < result.md
```

Send only the attributable goal change as plain text. The helper constructs the termination record. After any return or interruption, inspect the last valid record. Follow-up starts a new `alpha-goal` task directory.

## Verify and Write

Resolve the checkpoint helper from the selected `executor/SKILL.md`, never CWD.

1. Read the last valid record and recheck task identity, digest, revision/owner, and drift.
2. Collect required observers after the latest relevant mutation and within freshness.
3. Classify every criterion/gap; entry integrity failures produce no verdict, otherwise a blocker outranks fixable work.
4. Append one current verification-result record:

```text
bash <executor-root>/scripts/checkpoint-lock.sh verify <absolute-checkpoint.jsonl> <expected-revision> <PASS_TO_FINAL|NEXT_ITERATION|BLOCKED> < result.md
```

5. Send only current observations/status/gaps as plain UTF-8/Markdown; the helper constructs and JSON-encodes identity, revision, route, and owner.
6. Do not copy prior records or hand-write JSON. After any return or interruption, inspect the last valid record before deciding the next action.

Use `bash <executor-root>/scripts/checkpoint-lock.sh status <absolute-checkpoint.jsonl>` to inspect the latest revision and owner.

## Final Gate

Return `PASS_TO_FINAL` only when every criterion is passed by current final-state evidence; contract, digest, checkpoint, execution, and dependencies have not drifted; identity covers the claim; volatile evidence is fresh; and the verdict follows the latest target/delivery mutation. The caller owns final reporting.
