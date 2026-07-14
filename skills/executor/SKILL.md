---
name: executor
description: "Execute or resume work bound to an accepted persistent Goal Contract. Use after alpha-goal handoff or verifier NEXT_ITERATION to change the target, collect raw execution evidence, and maintain recovery state. Never use for direct-path tasks or to redefine authority or criterion status."
---

# Executor

Execute the accepted Goal Contract. Own target/delivery mutations, raw execution evidence, and recovery records; never change contract authority, criterion status, or verifier route.

## Entry Contract

- Require the canonical `goal-contract.md` with `status: accepted` and a revision.
- Inspect the current workspace, worktree/branch, repository rules, unrelated changes, tools, and rollback path.
- Reject a checkpoint bound to another contract revision, workspace, worktree, branch, or repository set.
- Return to `alpha-goal` if contract status/revision, persistence trigger, Authorization Source, Intent and Observable Outcome, Scope, Non-goals, Material Constraints, Execution and Side-effect Boundary, Decision Boundary, Claim Boundary, Success Criteria and Acceptance Evidence, Confirmation Record, or execution context is missing or materially changed.
- Do not use this skill for a `DIRECT` task.

## Initialize Checkpoint

Create `checkpoint.md` only after contract acceptance. Record:

- Contract path/revision, workspace identity, worktree/branch, and `state_revision: 0`.
- A repository manifest only for cross-repository writes.
- One record per Success Criterion, with its required observer; leave criterion status for verifier to create.
- Empty execution, stagnation, and verdict records.

Checkpoint write ownership is partitioned:

| Owner | May write |
| --- | --- |
| `executor` | Binding, state revision, execution batches, mutations, raw execution evidence, rollback/recovery facts, attempts and unclassified gaps |
| `verifier` | Verification observations, evidence mapping/classification, criterion status, gap cause, observed-state identity, and route verdict |

Use one writer at a time. Investigation subagents return observations and never write the checkpoint. A dedicated verifier agent may take exclusive ownership after executor handoff and write only verifier fields. Re-read after each handoff or unexpected change; do not merge by guesswork.

## Plan an Execution Batch

Choose the highest-value unmet Success Criterion that remains authorized. Combine work only while it shares the same Success Criterion, acceptance observer, rollback boundary, Execution and Side-effect Boundary, and Decision Boundary.

Run an intermediate verifier only before or after a material risk boundary:

- the next action is external, destructive, or irreversible;
- the next stage depends on current evidence already being true;
- the acceptance observer, rollback boundary, Execution and Side-effect Boundary, or Decision Boundary changes;
- uncertainty would materially amplify rework or risk;
- the user requires a stage review.

Do not split work by edit count. Use the repository's own practices and the smallest reliable change that meets the contract; generic methodology slogans are not authority.

## Execute and Record

For each batch:

1. Recheck authorization, worktree safety, dependencies, unrelated changes, and recovery path.
2. Perform only in-scope mutations and review the resulting diff/state.
3. Increment `state_revision` monotonically once for each recorded target/delivery state transition; multiple edits may form one transition only when the batch boundaries remain shared.
4. Record the batch goal, mutations, commands/observers, raw results, rollback boundary, known gaps, and recovery cursor.
5. Preserve raw execution output or an attributable artifact reference; do not write criterion status.
6. At a risk boundary, hand the current state to `verifier`, then reload its checkpoint update before continuing.

Target/delivery mutations are changes to the declared target or delivery state, including code, tracked or delivered generated artifacts, configuration, commits, pushes, and PR content. Ephemeral observer logs, caches, and checkpoint evidence are not target/delivery state unless tracked, published, or themselves required deliverables. Any target/delivery mutation after a verifier PASS invalidates that verdict. Metadata that only records an already observed verdict does not.

## Stagnation

Key a repeated gap by Success Criterion, failure mode, dependency, and relevant context.

- Progress means new evidence, a changed target state, or a smaller gap.
- If the contract permits a materially different approach, record the failed attempt and try that approach.
- Do not repeat the same approach without new evidence.
- If no authorized alternative remains, hand the facts to `verifier`; it routes by external blocker or missing authority.

## Final Handoff

After the last intended target/delivery mutation:

- Collect acceptance evidence against the actual final target and delivery state.
- Record current repository state and all remaining gaps without changing criterion status.
- Run `verifier` even if an earlier risk-boundary verdict passed.
- Claim completion only when the latest verdict is `PASS_TO_FINAL` and no later target/delivery mutation occurred.

Report native goal lifecycle separately when the current surface exposes it. Native goal state cannot substitute for acceptance evidence.
