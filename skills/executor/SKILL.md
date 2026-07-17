---
name: executor
description: "Execute or resume work bound to one accepted PERSIST Goal Contract. Use only after accepted handoff or verifier NEXT_ITERATION. Do not change the contract, classify criteria, or make the final claim."
---

# Executor

Execute the accepted outcome without changing its authority payload.

## Enter

- Require canonical `goal-contract.md` with `status: accepted`; match the recorded task, workspace/repositories, worktree/branch, and current instructions. Resolve `<alpha-goal-root>` from the selected `alpha-goal/SKILL.md`, never CWD, and require `node <alpha-goal-root>/scripts/authority-digest.js <absolute-contract-path>` to equal `accepted_authority_sha256`.
- For a first handoff with no checkpoint, also require complete Acceptance Completeness and a matching Confirmation Record, then create canonical `checkpoint.md` with `checkpoint_revision: 0`, `state_revision: 0`, `active_owner: executor`, contract/state identity, criterion observers/freshness, and empty execution and verification records.
- An earlier accepted payload lacking current mandatory rows may resume only through an existing checkpoint with the same task and accepted digest and `active_owner: executor`. Infer no missing authority and reject any unresolved gap already recorded.
- Any other invalid entry authorizes no target or checkpoint write.
- Treat a legacy `active_owner: alpha-goal` checkpoint as obsolete: verify its identity, record `termination_reason: GOAL_CHANGED`, hand it to `caller`, and do not execute it. A legacy `.lock` is an unresolved conflict; stop without writing.

## Checkpoint Ownership

- Keep one flat `checkpoint.md` per accepted contract. The contract remains the authority source; the checkpoint records progress and handoff state.
- Use a sequential single-writer protocol. Immediately before writing, re-read the canonical checkpoint and require the expected revision and `active_owner: executor`.
- Change only execution-owned identity, batches, mutations, raw evidence, rollback/recovery, attempts, termination metadata, and unclassified execution gaps. Preserve verification fields, increment `checkpoint_revision` once, and set the next `active_owner` last.
- If checkpoint content, revision, or owner changed since the prior read, discard the proposed write, reload current state, and decide again. Never run concurrent checkpoint writers.

## Execute

1. Execute one useful batch within the accepted scope, side effects, and risk boundary. Before mutation, recheck state identity, prerequisites, rollback/recovery, and evidence impact.
2. Record attributable actions, outputs, mutations, identifiers, failures, rollback state, and environment. After a material mutation, update state/delivery identity and increment `state_revision`; invalidated earlier evidence is stale.
3. Continue while the accepted goal remains feasible and another authorized approach exists. At a material risk boundary or proposed final state, hand `active_owner` to `verifier`.
4. If the acceptance authority materially changes the goal, authority, scope, criteria, claim, or risk boundary, stop target writes and record a terminal `GOAL_CHANGED` checkpoint with attributable source/date, current identity, unverified mutations, and `active_owner: caller`. Follow-up starts a new task directory.

Do not mark criteria passed or make the final claim. `PASS_TO_FINAL`, `BLOCKED`, and `GOAL_CHANGED` are terminal for that checkpoint.
