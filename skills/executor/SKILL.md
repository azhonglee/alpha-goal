---
name: executor
description: "Execute or resume target and delivery work bound to an accepted persistent Goal Contract. Use after alpha-goal handoff or verifier NEXT_ITERATION. Do not use for direct work, contract authority changes, criterion status, or final verification."
---

# Executor

Deliver the accepted outcome within its authority boundary.

## Validate Entry

- Require canonical `goal-contract.md` with `status: accepted`, a Confirmation Record accepting its current revision, and `accepted_authority_sha256`.
- Resolve `<alpha-goal-root>` from the selected `alpha-goal/SKILL.md`, never CWD. Recompute with `node <alpha-goal-root>/scripts/authority-digest.js <absolute-contract-path>`; return to `alpha-goal` on mismatch.
- Inspect instructions, workspace/repositories, worktree/branch, unrelated changes, tools, dependencies, delivery surfaces, and rollback.
- Reject another task, workspace, worktree, branch, or repository-set checkpoint. Only the guarded same-task prior-revision path below may advance.
- If authority change is requested during an active epoch, stop target writes, record the request, and hand to `verifier`; do not edit the contract.
- Correct only executor-owned clerical metadata when contract identity and execution context already match.

## Checkpoint and Ownership

Each accepted revision is one immutable checkpoint epoch. Resolve `<executor-root>` from selected `executor/SKILL.md`, never CWD. Initialize with:

```text
node <executor-root>/scripts/checkpoint-lock.js init <absolute-checkpoint-path>
```

Use JSON `token`/`pendingPath`; never derive the path. Write the initial checkpoint there, then `commit <checkpoint> <token>` to publish/unlock. Record schema, checkpoint/state revision `0`, epoch `1`, owner `executor`, contract/execution identity, criterion observers/freshness/invalidation, and empty records.

- `executor` owns binding, state revision, batches, mutations, raw evidence, rollback/recovery, attempts, and unclassified execution gaps.
- `verifier` owns verification observations, evidence mapping/classification, criterion status, gap cause, observed identity, and route verdict.
- `checkpoint_revision` and `active_owner` are shared write control; only the exclusive current owner writes them with its own fields.

### Supersede an Epoch

`executor` may append a new current epoch only when task/context match; the prior origin is named `RETURN_TO_ALPHA_GOAL`/`alpha-goal`, or terminal `PASS_TO_FINAL|BLOCKED`/`caller` plus an explicit terminal revision request; and the contract is accepted at exactly the next revision with a valid digest.

Open that transition with `supersede <checkpoint> <expected-revision>`. Read its JSON `token` and `pendingPath`, then use the abort/commit protocol below. Under lock, recheck the guards; keep the old epoch unchanged; append the new binding/criteria without verifier verdict; retain `state_revision`; increment `checkpoint_revision`; set owner `executor`. Prior evidence is stale until re-observed. Any mismatch returns to `alpha-goal`.

### Write Protocol

For an executor write, choose its post-commit owner and run:

```text
node <executor-root>/scripts/checkpoint-lock.js execute <absolute-checkpoint-path> <expected-revision> <executor|verifier>
```

Use JSON `token`/`pendingPath`. Re-read the checkpoint; on mismatch/abandonment, abort and reload. Otherwise write the complete successor there, changing only executor fields, incrementing revision once, and setting owner last. `commit <checkpoint> <token>` publishes/unlocks.

Before recovery, read `phase`/`recoverableBy` from `status`. After proving the writer stopped, recover only as a listed actor; otherwise wait/report. Pending records never block.

## Execute Batches

- Choose authorized work with ready dependencies and missing evidence. Group by atomic outcome, permission, rollback, identity, and acceptance evidence; one batch may serve multiple criteria.
- Necessary investigation and validation need no separate approval. Separate work only when those boundaries change.
- Run an intermediate verifier before material external/destructive/costly/irreversible risk, or when authority, evidence identity/freshness, rollback, or the contract requires it.

For each batch:

1. Recheck authorization, prerequisites, owner, worktree, unrelated changes, and recovery.
2. Mutate only in scope and inspect resulting target/delivery state.
3. Record tracked artifacts, commits, pushes, remote refs, deployments, and PR content as distinct identity/approval/rollback/evidence transitions; increment `state_revision` once per shared boundary.
4. Record outcome, mutations, observers/results, state identity, rollback, gaps, and recovery cursor.
5. Handoff by the write protocol with `active_owner: verifier`, then stop writing.

Untracked/unpublished lifecycle records and ephemeral observer logs are not target/delivery state. Any target/delivery mutation after PASS invalidates it.

## Stagnation and Final Handoff

Key failures by criterion, mode, dependency, and context. Retry only with new evidence, changed state, a smaller gap, or a materially different authorized approach; record failures. When exhausted, hand facts to `verifier` for an external blocker or one authority decision.

After the last mutation, collect final-state acceptance evidence and current delivery identity, record remaining gaps, and hand exclusive ownership to `verifier`. Claim completion only from a current `PASS_TO_FINAL` after the latest mutation.
