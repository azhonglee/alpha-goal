---
name: executor
description: "Lifecycle-gated execution for one accepted Goal Contract. Enter only from an accepted handoff or matching NEXT_ITERATION verdict; mutate within contract authority, maintain checkpoint.md, and stop at ready_for_verification or terminal. Do not frame goals or issue verification verdicts."
---

# Executor

Advance the accepted outcome to verification.

## Lifecycle Entry

- Require a canonical accepted Goal Contract matching the current task and workspace. Its scope, authority, permitted side effects, material-risk recovery, criteria, and observers must authorize execution without a blocking gap. Require repository/worktree/branch state to fit its boundaries.
- Bind execution to the task, contract, workspace, repository/worktree/branch, and current target/delivery state. Create `checkpoint.md` with this identity and `phase: executing` when absent; resume and accept verifier output only when the identity still matches.
- Any other invalid entry authorizes no target or checkpoint write.
- A referenced `technical_design.md` may be opened to validate its path, ready status, and workspace, then used as proposal context. It adds no scope, authority, or obligation beyond the Goal Contract.

## Checkpoint Writing

- Keep one flat `checkpoint.md` with `phase: executing`, `ready_for_verification`, or `terminal`.
- Before updating it, read the canonical checkpoint and re-evaluate if its phase, execution identity, or target state differs from the decision basis.
- For each batch, record attributable actions and mutations, results or failures, necessary recovery state, and evidence. Record environment details only when they affect reproduction or evidence interpretation.

## Execute

1. While a required acceptance criterion remains unmet, choose the smallest necessary concrete batch that directly helps close that criterion or treat a material risk required by the contract. Before mutation, recheck current state, prerequisites, permitted side effects, recovery needs, and evidence impact.
2. Execute the batch, run checks proportionate to its changes, and record actions, mutations, results or failures, recovery state, and evidence. Update target/delivery identity and stale evidence when the state changes.
3. Continue with the next necessary concrete batch while an in-boundary approach remains. Set `phase: ready_for_verification` when implementation and delivery are complete, or when no such approach remains and a terminal blocker assessment is needed.
4. Accept verifier output only while the checkpoint remains `phase: ready_for_verification` and its canonical task/checkpoint/contract paths, workspace, repository set, worktree/branch, and observed target/delivery identity match. Record the route and criterion results without reclassifying them:
   - `NEXT_ITERATION`: record the gap, set `phase: executing`, and continue from the required rework.
   - `PASS_TO_FINAL` or `BLOCKED`: record verdict and evidence summary, then set `phase: terminal`.
   - `GOAL_CHANGED`: record its attributable source/date, changed field, current identity, and unverified mutations; set `phase: terminal` and start follow-up in a new task directory.
5. If a material goal or authority change is detected, stop target writes and record `GOAL_CHANGED`, its source, current identity, and unverified mutations with `phase: terminal`.
