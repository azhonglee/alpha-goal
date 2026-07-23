---
name: executor
description: "Execute or resume authorized work for one accepted PERSIST Goal Contract. Use after accepted handoff or a NEXT_ITERATION verdict; execute intermediate batches and prepare the final state for verification without changing the contract or making the final claim."
---

# Executor

Execute the accepted outcome.

## Enter

- Require a canonical accepted Goal Contract matching the current task and workspace. Its scope, authority, permitted side effects, material-risk recovery, criteria, and observers must authorize execution without a blocking gap. Require repository/worktree/branch state to fit its boundaries.
- Bind execution to the task, contract, workspace, repository/worktree/branch, and current target/delivery state. Create `checkpoint.md` with this identity and `phase: executing` when absent; resume and accept verifier output only when the identity still matches.
- Any other invalid entry authorizes no target or checkpoint write.
- A referenced `technical_design.md` may be opened to validate its path, ready status, and workspace, then used as proposal context. It adds no scope, authority, or obligation beyond the Goal Contract.

## Checkpoint Writing

- Keep one flat `checkpoint.md` with `phase: executing`, `ready_for_verification`, or `terminal`.
- Before updating it, read the canonical checkpoint and re-evaluate if its phase, execution identity, or target state differs from the decision basis.
- For each batch, record attributable actions and mutations, results or failures, necessary recovery state, and evidence. Record environment details only when they affect reproduction or evidence interpretation.

## Execute

1. Execute useful batches within the accepted scope, side effects, and risk boundary. Before mutation, recheck state identity, prerequisites, rollback/recovery, and evidence impact.
2. Update target/delivery identity and mark invalidated evidence stale after relevant changes.
3. Keep `phase: executing` through intermediate batches. Set `phase: ready_for_verification` only when implementation and authorized delivery are complete, or no authorized approach remains and a terminal blocked assessment is required.
4. Accept verifier output only while the checkpoint remains `phase: ready_for_verification` and its canonical task/checkpoint/contract paths, workspace, repository set, worktree/branch, and observed target/delivery identity match. Record the route and criterion results without reclassifying them:
   - `NEXT_ITERATION`: record gaps, set `phase: executing`, and begin the authorized rework batch.
   - `PASS_TO_FINAL` or `BLOCKED`: record verdict and evidence summary, then set `phase: terminal`.
   - `GOAL_CHANGED`: record its attributable source/date, changed field, current identity, and unverified mutations; set `phase: terminal` and start follow-up in a new task directory.
5. If a material goal or authority change is detected, stop target writes and record `GOAL_CHANGED`, its source, current identity, and unverified mutations with `phase: terminal`.
