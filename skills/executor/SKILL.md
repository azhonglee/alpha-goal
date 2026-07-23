---
name: executor
description: "Execute or resume all authorized work bound to one accepted PERSIST Goal Contract. Use after accepted handoff or final-audit NEXT_ITERATION; retain ownership through intermediate batches and hand off only for a terminal audit. Do not change the contract, classify criteria, or make the final claim."
---

# Executor

Execute the accepted outcome without changing the Goal Contract.

## Enter

- Require canonical `goal-contract.md` with `status: accepted`, workspace and attributable source references, non-empty Objective/Boundaries/Acceptance Criteria/Verification, desired-behavior authority and executor autonomy, total criterion-to-observer mapping, and no blocking gap. Require attributable authority for material side effects and treatment plus rollback/recovery for material or irreversible risk, or a compact non-material basis. Match its task directory, path, workspace, and current instructions. Derive repository/worktree/branch state before mutation and require it to fit Boundaries and Permitted side effects.
- For a first handoff with no checkpoint, create canonical `checkpoint.md` with `checkpoint_revision: 0`, `phase: executing`, canonical task/checkpoint/contract paths, workspace, repository set, worktree/branch, target/delivery identity, criterion observers/freshness, and an empty execution record.
- An earlier accepted contract may resume only through a matching checkpoint. For the preceding schema, match task directory, contract path, repository set, and Confirmation Record source/date; infer nothing missing. Normalize legacy ownership by atomically replacing `active_owner` and ownership-only fields with `phase` in one executor write before further work: map `executor` to `executing`, `verifier` to `ready_for_verification`, and terminal or caller ownership to `terminal`. Re-read and require no legacy ownership fields before verification.
- Any other invalid entry authorizes no target or checkpoint write.
- Treat referenced `technical_design.md` only as optional proposal context. Require its absolute path, `Design status: ready`, and matching workspace before reading it; it cannot add scope, acceptance conditions, checklist items, or implementation obligations unless the accepted Goal Contract adopted them explicitly.
- Treat a legacy `active_owner: alpha-goal` checkpoint as obsolete: verify its identity, then record `termination_reason: GOAL_CHANGED` with `phase: terminal` in one write and stop. A legacy `.lock` is an unresolved conflict; stop without writing.

## Checkpoint Writing

- Keep one flat `checkpoint.md` per accepted contract. The contract remains authority; only `executor` writes the checkpoint.
- Immediately before writing, re-read the canonical checkpoint and require the expected `checkpoint_revision`. If it changed, discard the proposed write and reload. Never run concurrent executor writers.
- Write contract/state identity, `phase`, batches, mutations, raw evidence, rollback/recovery, attempts, termination metadata, and execution gaps. Increment `checkpoint_revision` once per write.
- Use `phase: executing`, `ready_for_verification`, or `terminal`. Verifier returns a read-only verdict packet; executor is the only component that persists its outcome.

## Execute

1. Execute useful batches within the accepted scope, side effects, and risk boundary. Before mutation, recheck state identity, prerequisites, rollback/recovery, and evidence impact.
2. Record attributable actions, outputs, mutations, identifiers, failures, rollback state, environment, and current state/delivery identity. Mark invalidated evidence stale directly against that identity.
3. Keep `phase: executing` through intermediate batches. Set `phase: ready_for_verification` only when implementation and authorized delivery are complete, or no authorized approach remains and a terminal blocked assessment is required.
4. Accept a verifier packet only when the checkpoint remains `phase: ready_for_verification` and its canonical task/checkpoint/contract paths, workspace, repository set, worktree/branch, `checkpoint_revision`, and current state/delivery identity match the packet. Persist the packet's route, criterion results, observations, freshness, gaps, identities, and based-on revision without reclassifying them. In one checkpoint write:
   - `NEXT_ITERATION`: record gaps, set `phase: executing`, and begin the authorized rework batch.
   - `PASS_TO_FINAL` or `BLOCKED`: record verdict and evidence summary, then set `phase: terminal`.
   - `GOAL_CHANGED`: record attributable termination metadata and set `phase: terminal`; follow-up starts a new task directory.
5. If executor itself detects a material goal or authority change, stop target writes and record terminal `GOAL_CHANGED` metadata with source/date, current identity, and unverified mutations.

Do not independently classify criteria or make the final claim. Persist verifier results only from a matching verdict packet. `PASS_TO_FINAL`, `BLOCKED`, and `GOAL_CHANGED` are terminal.
