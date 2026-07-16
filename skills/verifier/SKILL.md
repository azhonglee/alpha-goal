---
name: verifier
description: "Verify a persistent Goal Contract checkpoint at a material risk boundary or final state. Use after exclusive executor handoff to collect current evidence, classify criteria, and return one verification route. Do not implement fixes, verify direct work, or change authority."
---

# Verifier

Decide whether bound state satisfies the accepted contract.

## Validate Entry and Evidence

- Require the accepted contract, its attributable acceptance-time Completeness snapshot, current accepted digest, bound checkpoint epoch, and `active_owner: verifier`. Current authority-retained material-design and touched-risk observer/recovery completeness is required for contracts entering through a new checkpoint. An earlier accepted payload lacking current rows may continue only when the current checkpoint records the same task and accepted digest; infer no new authority and reject unresolved gaps already present. New attributable post-acceptance invalidation is classified below, not treated as an entry defect.
- Resolve `<alpha-goal-root>` and `<executor-root>` from their selected `SKILL.md` locations, never CWD. Recompute with `node <alpha-goal-root>/scripts/authority-digest.js <absolute-contract-path>`; reject an invalid binding without a verification verdict.
- Inspect actual target, delivery, and dependencies.
- Re-observe evidence; claim separate-agent independence only when an isolated verifier performed it.

For every criterion record source, observer, attributable result/status, state identity, `as_of`, freshness/invalidation, and `passed|failed|pending|blocked`. Criterion-specific identity covers applicable repository/worktree, HEAD, dirty/untracked digest, artifact/delivery/remote identity, dependency version, and observation time. A contract containing an unidentified required surface at acceptance is invalid at entry; attributable post-acceptance loss or newly discovered invalidation of accepted completeness may be blocked. Verifier never narrows the accepted claim.

Accept only observable attributable evidence. Effort, confidence, absence of failure, native lifecycle state, unrelated tests, and stale results prove nothing. Prefer non-mutating observers; if one changes declared target/delivery state, return `NEXT_ITERATION` so executor records the mutation before re-verification.

## Classify Then Route

| Cause | Required finding | Route / owner |
| --- | --- | --- |
| `same_goal_fixable` | A materially different authorized batch can close the gap. | `NEXT_ITERATION` / `executor` |
| `blocked` | New attributable facts later invalidate accepted feasibility, a prerequisite/dependency, authority boundary, material-design coverage, touched-risk/recovery mapping, observer, or identified claim surface, and no currently authorized path remains. | `BLOCKED` / `caller` |
| none | Every criterion passes against current identified state and fresh evidence. | `PASS_TO_FINAL` / `caller` |

For empty/partial/suspicious results, continue safe non-mutating observation while useful. `incomplete` is not a route: map unavailable facts to an authorized batch or blocker. Never return unchanged state without a blocker, changed condition, or materially different batch. If the acceptance authority explicitly changes the goal while verifier owns the checkpoint, stop observation; run `reframe <checkpoint> <expected-revision>` through the checkpoint helper, commit owner `alpha-goal`, and return no verification verdict.

## Verify and Write

1. Re-read recorded contract/checkpoint identity, accepted digest, checkpoint revision/owner, and actual drift.
2. Collect required observers after the latest relevant mutation and within freshness.
3. Classify every criterion/gap; entry integrity failures produce no verdict, otherwise post-acceptance blocker outranks fixable work.
4. Resolve `<executor-root>` from selected `executor/SKILL.md`, then open the chosen route:

```text
node <executor-root>/scripts/checkpoint-lock.js verify <absolute-checkpoint-path> <expected-revision> <PASS_TO_FINAL|NEXT_ITERATION|BLOCKED>
```

5. Parse the returned JSON `token` and `pendingPath`; never construct the pending path. Re-read the pre-write checkpoint. On mismatch or abandonment, run `abort <checkpoint> <token>` and reload. Otherwise write the complete next checkpoint to `pendingPath`, updating only verifier fields, incrementing `checkpoint_revision` once, recording identity/evidence/gap/route, and setting `active_owner` last.
6. Run `commit <checkpoint> <token>`. Success publishes and closes the lock; do not release.

Before recovery, run `status <checkpoint>` and parse its JSON `phase` and `recoverableBy`. After proving the writer stopped, recover only when the verifier is listed, using the held token with `recover <checkpoint> <token> verifier`; otherwise wait/report. Pending records never block.

## Final Gate

Return `PASS_TO_FINAL` only when every criterion is passed by current final-state evidence; contract/digest/checkpoint/execution/dependencies have not drifted; identity covers the claim; volatile evidence is fresh; and the verdict follows the latest target/delivery mutation.

Any invalidating binding, identity, dependency, or freshness change requires re-verification. Only untracked, unpublished verdict metadata that changes no claimed surface is exempt. The caller owns final reporting and capability-conditional native lifecycle updates.
