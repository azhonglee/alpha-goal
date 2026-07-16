---
name: executor
description: "Execute or resume target and delivery work bound to one accepted persistent Goal Contract. Use after alpha-goal handoff or verifier NEXT_ITERATION. Do not use for direct work, contract changes, criterion status, or final verification."
---

# Executor

Deliver the accepted outcome within its authority boundary.

## Validate Entry

- Legacy exception: if the checkpoint itself has `active_owner: alpha-goal`, validate only its task/context identity and lock state, then use `terminate` to move it to `caller` with `termination_reason: GOAL_CHANGED`. Do not require the current contract to remain accepted or digest-matched, and never execute or verify that checkpoint.
- Otherwise require canonical `goal-contract.md` with `status: accepted`, complete acceptance-time observers/claim surfaces/prerequisites/feasibility/material decisions/risk coverage, no blocking gaps, a matching Confirmation Record, and `accepted_authority_sha256`.
- Resolve `<alpha-goal-root>` from the selected `alpha-goal/SKILL.md`, never CWD. Recompute with `node <alpha-goal-root>/scripts/authority-digest.js <absolute-contract-path>`; reject a missing or mismatched digest before execution without creating a verifier verdict.
- Inspect instructions, workspace/repositories, worktree/branch, unrelated changes, tools, dependencies, delivery surfaces, and rollback. Reject a checkpoint for another task or execution context.
- An earlier accepted payload lacking current completeness rows may resume only through an existing checkpoint whose recorded task and accepted digest match; infer no missing authority and reject unresolved gaps already present.

## One Contract, One Checkpoint

Each accepted contract has one flat `checkpoint.md`; never reopen or replace its authority payload. Initialize with:

```text
node <executor-root>/scripts/checkpoint-lock.js init <absolute-checkpoint-path>
```

Resolve `<executor-root>` from selected `executor/SKILL.md`, never CWD. Use returned JSON `token`/`pendingPath`; never derive the path. Write the initial checkpoint with `checkpoint_revision: 0`, `state_revision: 0`, `active_owner: executor`, contract/workspace/repository/worktree identity, criterion observers/freshness/invalidation, and empty execution/verification records; then `commit <checkpoint> <token>`.

- `executor` owns recorded contract/execution identity, state revision, batches, mutations, raw evidence, rollback/recovery, attempts, and unclassified execution gaps.
- `verifier` owns verification observations, evidence classification, criterion status, observed identity, freshness, and route.
- `checkpoint_revision` and `active_owner` are shared write control; only the current owner writes its fields.

## Goal Change Terminates This Task

If the acceptance authority materially changes the goal, authority, scope, criteria, claim boundary, or risk boundary, stop target writes. Do not edit the accepted contract or route through verifier. Open:

```text
node <executor-root>/scripts/checkpoint-lock.js terminate <absolute-checkpoint-path> <expected-revision>
```

Write the successor to `pendingPath` with `termination_reason: GOAL_CHANGED`, attributable source/date, change summary, current state identity, unverified mutations, incremented `checkpoint_revision`, and `active_owner: caller`; then commit. Any follow-up starts `alpha-goal` as a new task directory with a new Goal Contract and checkpoint. Never reuse the terminated artifacts.

## Write Protocol

For an executor batch or handoff, open:

```text
node <executor-root>/scripts/checkpoint-lock.js execute <absolute-checkpoint-path> <expected-revision> <executor|verifier>
```

Use JSON `token`/`pendingPath`. Re-read the checkpoint; on mismatch or abandonment run `abort <checkpoint> <token>` and reload. Otherwise write the complete successor, changing only executor fields, incrementing `checkpoint_revision` once, and setting `active_owner` last. `commit <checkpoint> <token>` publishes and unlocks.

Before recovery, run `status <checkpoint>` and parse `phase`/`recoverableBy`. After proving the writer stopped, recover only when `executor` is listed, using `recover <checkpoint> <token> executor`; otherwise wait/report. Pending records never block.

## Execute

1. Choose the smallest useful batch inside scope and authorized side effects. Batch low-risk same-boundary work; hand off at a material risk boundary or proposed final state.
2. Before mutation, recheck owner, digest, scope/non-goals, state identity, prerequisites, rollback/recovery, and evidence impact. Approval is required only at an actual approval boundary.
3. Execute with attributable tools. Record commands/actions, outputs, mutations, identifiers, failures, rollback state, and environment. Never invent evidence or hide failure with fallback.
4. After each material mutation, update state/delivery identity and increment `state_revision` once per shared boundary. Evidence predating an invalidating mutation is stale.
5. Continue within the same accepted goal while another authorized approach remains. Hand `active_owner` to `verifier` when independent observation is required.

Do not mark criteria passed or make the final claim. `PASS_TO_FINAL` and `BLOCKED` are terminal for this checkpoint; later work starts a new Alpha Goal task.
