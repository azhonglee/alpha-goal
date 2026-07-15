---
name: verifier
description: "Verify a persistent Goal Contract checkpoint at a material risk boundary or final state. Use after exclusive executor handoff to collect current evidence, classify criteria, and return one verification route. Do not implement fixes, verify direct work, or change authority."
---

# Verifier

Decide whether bound state satisfies the accepted contract.

## Validate Entry and Evidence

- Require the accepted contract, current revision/digest, bound current checkpoint epoch, and `active_owner: verifier`.
- Resolve `<alpha-goal-root>` and `<executor-root>` from their selected `SKILL.md` locations, never CWD. Recompute with `node <alpha-goal-root>/scripts/authority-digest.js <absolute-contract-path>`; reject mismatch.
- Inspect actual target, delivery, and dependencies.
- Re-observe evidence; claim separate-agent independence only when an isolated verifier performed it.

For every criterion record source, observer, attributable result/status, state identity, `as_of`, freshness/invalidation, and `passed|failed|pending|blocked`. Criterion-specific identity covers applicable repository/worktree, HEAD, dirty/untracked digest, artifact/delivery/remote identity, dependency version, and observation time. Narrow the claim if a required surface is unidentified.

Accept only observable attributable evidence. Effort, confidence, absence of failure, native lifecycle state, unrelated tests, and stale results prove nothing. Prefer non-mutating observers; if one changes declared target/delivery state, abort without verdict and return executor ownership to record it.

## Classify Then Route

| Cause | Required finding | Route / owner |
| --- | --- | --- |
| `same_goal_fixable` | A materially different authorized batch can close the gap. | `NEXT_ITERATION` / `executor` |
| `authority_decision_required` | Approaches are exhausted or behavior/scope/observer/claim authority must change; name the smallest decision. | `RETURN_TO_ALPHA_GOAL` / `alpha-goal` |
| `external_blocker` | An outside dependency prevents progress and no authorized alternative exists. | `BLOCKED` / `caller` |
| none | Every criterion passes against current identified state and fresh evidence. | `PASS_TO_FINAL` / `caller` |

For empty/partial/suspicious results, continue safe non-mutating observation while useful. `incomplete` is not a route: map unavailable facts to an authorized batch, external blocker, or observer/claim decision. Never return unchanged state without a new decision, blocker, condition, or materially different batch.

## Verify and Write

1. Re-read contract/checkpoint binding, digest, revision, owner, and actual drift.
2. Collect required observers after the latest relevant mutation and within freshness.
3. Classify every criterion/gap; authority drift outranks blocker, which outranks fixable work.
4. Resolve `<executor-root>` from selected `executor/SKILL.md`, then open the chosen route:

```text
node <executor-root>/scripts/checkpoint-lock.js verify <absolute-checkpoint-path> <expected-revision> <PASS_TO_FINAL|NEXT_ITERATION|BLOCKED|RETURN_TO_ALPHA_GOAL>
```

5. Parse the returned JSON `token` and `pendingPath`; never construct the pending path. Re-read the pre-write checkpoint. On mismatch or abandonment, run `abort <checkpoint> <token>` and reload. Otherwise write the complete next checkpoint to `pendingPath`, updating only verifier fields, incrementing revision once, recording identity/evidence/gap/route, and setting the route owner last.
6. Run `commit <checkpoint> <token>`. Success publishes and closes the lock; do not release.

Before recovery, run `status <checkpoint>` and parse its JSON `phase` and `recoverableBy`. After proving the writer stopped, recover only when the verifier is listed, using the held token with `recover <checkpoint> <token> verifier`; otherwise wait/report. Pending records never block.

## Final Gate

Return `PASS_TO_FINAL` only when every criterion is passed by current final-state evidence; contract/digest/checkpoint/execution/dependencies have not drifted; identity covers the claim; volatile evidence is fresh; and the verdict follows the latest target/delivery mutation.

Any invalidating binding, identity, dependency, or freshness change requires re-verification. Only untracked, unpublished verdict metadata that changes no claimed surface is exempt. The caller owns final reporting and capability-conditional native lifecycle updates.
