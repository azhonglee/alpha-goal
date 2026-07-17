---
name: executor
description: "Execute or resume target and delivery work bound to one accepted persistent Goal Contract. Use after alpha-goal handoff or verifier NEXT_ITERATION. Do not use for direct work, contract changes, criterion status, or final verification."
---

# Executor

Deliver the accepted outcome within its authority boundary.

## Validate Entry

- Legacy exception: if a legacy `checkpoint.md` has `active_owner: alpha-goal`, validate only its task/context identity and current status, then use `terminate` to move it to `caller` with `termination_reason: GOAL_CHANGED`. Do not require the current contract to remain accepted or digest-matched, and never execute or verify that checkpoint.
- Otherwise require canonical `goal-contract.md` with `status: accepted`, complete acceptance-time observers/claim surfaces/prerequisites/feasibility/material decisions/risk coverage, no blocking gaps, a matching Confirmation Record, and `accepted_authority_sha256`.
- Resolve `<alpha-goal-root>` from the selected `alpha-goal/SKILL.md`, never CWD. Recompute with `node <alpha-goal-root>/scripts/authority-digest.js <absolute-contract-path>`; reject a missing or mismatched digest before execution without creating a verifier verdict.
- Inspect instructions, workspace/repositories, worktree/branch, unrelated changes, tools, dependencies, delivery surfaces, and rollback. Reject a checkpoint log whose last valid record belongs to another task or execution context.
- An earlier accepted payload lacking current completeness rows may resume only through an existing checkpoint log whose last valid record has the matching task and accepted digest; infer no missing authority and reject unresolved gaps already present.

## One Contract, One Checkpoint Log

Each accepted contract has one append-only `checkpoint.jsonl`; every valid line is one self-contained JSON record. Initialize with:

```text
bash <executor-root>/scripts/checkpoint-lock.sh init <absolute-checkpoint.jsonl> <repository> <worktree> <branch> < result.md
```

Resolve `<executor-root>` from selected `executor/SKILL.md`, never CWD. Send only the initial handoff result as plain UTF-8/Markdown. The helper reads sibling `goal-contract.md` and constructs the JSON record, identity, revision/state revision `0`, `active_owner: executor`, and `action: init`; never hand-write checkpoint JSON.

Each later record repeats the stable identity and execution context and contains only the current executor or verifier result. `checkpoint_revision` and `active_owner` are shared write control; `state_revision` stays unchanged or increments once for a target/delivery mutation.

## Goal Change Terminates This Task

If the acceptance authority materially changes the goal, authority, scope, criteria, claim boundary, or risk boundary, stop target writes. Do not edit the accepted contract or route through verifier. Run:

```text
bash <executor-root>/scripts/checkpoint-lock.sh terminate <absolute-checkpoint.jsonl> <expected-revision> < result.md
```

Send only the attributable goal change as plain text. The helper appends `action: terminate`, unchanged `state_revision`, `active_owner: caller`, and `termination_reason: GOAL_CHANGED`. After any return or interruption, inspect the last valid record. Follow-up starts a new `alpha-goal` task directory.

## Write Protocol

For an executor batch or handoff, append one current-result record:

```text
bash <executor-root>/scripts/checkpoint-lock.sh execute <absolute-checkpoint.jsonl> <expected-revision> <executor|verifier> <same|next> < result.md
```

Send only this batch's mutations/evidence/gaps/handoff as plain text. Use `next` only when target/delivery state changed; otherwise use `same`. The helper repeats stable identity, increments `checkpoint_revision`, and JSON-encodes the result. Keep input below 1 MiB; reference large evidence instead of embedding it. Do not copy prior results. After any return or interruption, inspect the last valid record before deciding the next action.

Use `bash <executor-root>/scripts/checkpoint-lock.sh status <absolute-checkpoint.jsonl>` to inspect the latest revision and owner. Legacy `checkpoint.md` tasks continue through the compatibility path; never create a new one.

## Execute

1. Choose the highest-value executable batch that closes the most important current gap within one authorization and risk boundary. Make it no larger than needed; hand off at a material risk boundary or proposed final state.
2. Before mutation, recheck owner, digest, scope/non-goals, state identity, prerequisites, rollback/recovery, and evidence impact. Approval is required only at an actual approval boundary.
3. Execute with attributable tools. Record commands/actions, outputs, mutations, identifiers, failures, rollback state, and environment. Never invent evidence or hide failure with fallback.
4. After each material mutation, update state/delivery identity and increment `state_revision` once per shared boundary. Evidence predating an invalidating mutation is stale.
5. Continue within the same accepted goal while another authorized approach remains. Hand `active_owner` to `verifier` when independent observation is required.

Do not mark criteria passed or make the final claim. `PASS_TO_FINAL` and `BLOCKED` are terminal for this checkpoint; later work starts a new Alpha Goal task.
