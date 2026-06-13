---
name: loop
description: Run one bounded goal iteration under an existing user-reviewed Goal Contract. Dynamic planning, execution, and feedback.
---

# Loop

Advance one bounded iteration under an approved Goal Contract or equivalent context. Do not redefine the goal. If new evidence breaks the target, scope, acceptance, non-goals, decision boundaries, or claim boundary, stop and return to `alpha-goal`.

## Entry requirements before mutation

All must be true before editing implementation files:

- approved context semantically identifies desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, and acceptance/evidence expectations;
- target/scope boundary and final claim boundary are clear enough to decide changed files and final wording;
- applicable local rules and active durable specs/plans have been read;
- repo, worktree, submodule, ownership, dirty-state, and user-change boundaries are understood;
- isolated edit path is ready, or creating it is the first setup mutation;
- `.worktrees/`, `.alpha-goal/`, or alternative process-artifact paths are gitignored or explicitly approved;
- strongest material risk, loop mode, evidence floor, and mutation preflight are recorded.

Before mutation, cite the contract source you actually read: file path, chat excerpt, or explicit equivalent context. If it is not locally available or included in the prompt, do not infer it from phrases like "existing Goal Contract".

If these semantics are missing, ambiguous, unavailable, or contradicted, do not mutate. Return to `alpha-goal`. Do not reject valid context merely because it uses different headings.

Load bundled resources only when needed:

- `references/worktree-safety.md`: isolated edit paths and primary-checkout safety.
- `references/execution-boundaries.md`: delegation, ownership, submodules, generated output, or user-owned changes.
- `references/loop-modes.md`: mode choice, evidence type, debug receipt, and decisions.
- `references/plan-template.md`: durable dynamic plans for multi-slice or handoff-heavy work.
- `references/iteration-record-schema.md`: compact Iteration Record semantics.
- `scripts/mutation-preflight.sh`: read-only git/path preflight.

## Process

```text
Plan this slice -> Execute -> Interpret feedback -> Record -> Route next
```

### 1. Plan this slice

Dynamic planning answers only the current iteration:

- the smallest acceptance-relevant progress to make now;
- fresh evidence needed after the slice;
- files, modules, repos, generated outputs, and ownership surfaces allowed to change;
- strongest material risk and evidence floor;
- success, failure, feedback, and reframe routes;
- whether a durable plan is necessary.

Create or update a durable plan only for multiple independent loops, modules, repos, handoff/recovery needs, rollback/compatibility decisions, contested ownership, or user request. Small patches can record the plan in the Iteration Record.

If persistent goal tooling is already active, align the slice with that objective. Do not create a new persistent goal unless the user explicitly requested that runtime behavior.

### 2. Execute

- Run or manually record mutation preflight before edits.
- For a mutation slice, make one coherent change and collect the evidence needed for that change.
- For a read-only/probe slice, do not mutate; produce evidence, diagnosis, or route decisions only.
- Stay inside the approved target, scope, non-goals, and claim boundary.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- For debug work, identify and record the root cause before patching; if root cause is not confirmed, do not fix—return a bounded diagnostic, gather more evidence, or block.
- Use subagents only for independent ownership surfaces and inspect their files, evidence, and concerns before accepting results.
- Stop and return to `alpha-goal` when evidence points to a different target/entity/API/repo or changes the user-owned decision boundary.

Forbidden unless explicitly requested and risk is recorded:

- editing or deleting files in a primary `main`/`master` checkout;
- creating a branch in a primary checkout when an isolated worktree should be used;
- creating a branch/worktree before the target is closed;
- mutating a candidate repo not selected by the approved context;
- crossing repo, worktree, submodule, or ownership boundaries;
- unrelated cleanup, broad formatting, or opportunistic refactor;
- final completion claims from `loop`.

### 3. Interpret feedback

Consider test/build/lint/probe output, user or reviewer feedback, runtime evidence, stale specs/plans, implementation risk, and claim-boundary gaps.

Choose one decision:

- `continue`: route works; another iteration should proceed.
- `pivot`: evidence breaks the current route; change plan or return to `alpha-goal`.
- `expand`: goal remains valid but scope grew; usually return to `alpha-goal` or request review.
- `harden`: behavior is mostly in place but evidence, edge cases, compatibility, or cleanup are insufficient.
- `finish`: acceptance appears met; enter `verify`.

If the same failure thread repeats three times without new evidence, stop patching and make a feedback judgment; consider independent review if available.

### 4. Record

Produce an Iteration Record proportional to risk. Keep low-risk records short, but preserve the core semantics: contract/context used, dynamic plan, preflight, execution, local evidence, feedback, acceptance delta, risks, decision, and next route. Use `references/iteration-record-schema.md` when exact field meanings are needed.

Do not make final completion claims in an Iteration Record. Completion judgment belongs to `verify`.

### 5. Route next

- `ITERATION_CONTINUES`: run another loop slice.
- `ITERATION_READY_FOR_VERIFY`: enter `verify` with the current claim and evidence.
- `RETURN_TO_ALPHA_GOAL`: clarify or reframe before more mutation.
- `BLOCKED`: report the blocker and smallest missing input, permission, tool, data, or environment.
