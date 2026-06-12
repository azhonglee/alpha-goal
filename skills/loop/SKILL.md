---
name: loop
description: Run one bounded goal iteration under an existing user-reviewed Goal Contract. Dynamic planning, execution, and feedback.
---

<Purpose>

Advance one bounded iteration under an existing Goal Contract. Do not redefine the goal. If new evidence breaks the contract, target/scope boundary, acceptance, or claim boundary, stop and return to `alpha-goal`.

Each iteration has three phases:

1. `Dynamic planning`: choose the suitable slice, evidence floor, isolation path, and loop mode.
2. `Execution`: run the slice through mutation, read-only exploration, debug probes, tests, or evidence collection.
3. `Feedback`: interpret results, handle user/reviewer/test feedback, then continue, pivot, reframe, review, or verify.
</Purpose>

<EntryRequirements>

Before mutation, all of these must be true:

- a reviewed Goal Contract, interview summary, chat-only contract, or equivalent approved context exists; exact headings are not required;
- enough semantic content exists to identify desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, and acceptance/evidence expectations;
- target/scope boundary and claim boundary are clear enough to decide changed files and final claim wording;
- applicable local rules have been read;
- mutation preflight is recorded;
- isolated edit path is known, or its creation is the first setup mutation;
- risk tier and evidence floor are chosen during dynamic planning before mutation;
- repo, worktree, submodule, and ownership boundaries are understood;
- `.worktrees/`, `.alpha-goal/`, or alternative paths are gitignored or explicitly approved;
- active durable spec/plan, if any, has been read.

If required semantics are missing, ambiguous, or contradicted, do not mutate. Return `alpha-goal`. Do not block merely because the approved context uses different headings or structure.
</EntryRequirements>

Load bundled resources only when needed:

- `references/worktree-safety.md`: create or verify isolated edit paths.
- `references/execution-boundaries.md`: delegated work, ownership, submodules, generated output, or user-owned changes.
- `references/loop-modes.md`: choose mode and evidence shape.
- `references/plan-template.md`: durable dynamic plan.
- `references/iteration-record-schema.md`: Iteration Record fields.
- `scripts/mutation-preflight.sh`: read-only git and path preflight.

<Process>

Iteration can be executed in two modes:
1. `Native`: default mode. If you can use `goals` / equivalent, use this mode.
2. `Custom`: fallback mode like this:

```text
Generate Goal Objective -> Dynamic planning -> Execution -> Feedback -> Next iteration
                                                                     -> Verify
                                                                     
```
## Native mode

1. Call `create_goal` with an objective that restates the Goal Contract.
2. Set `token_budget` only if the user explicitly provides one.
3. Execute the workflow to completion.
4. Validate the final state before claiming success.
5. Call `update_goal` with `complete` only when the objective is actually achieved.
6. Do not create a goal for ordinary task requests that do not explicitly ask for one.

If native mode is not available, use custom mode.

## Custom mode

### Phase 1: Generate Goal Objective

Generate a goal objective with goal contract and interview summary.

### Phase 2: Dynamic planning

Dynamic planning is not a waterfall plan. It answers only this iteration:

- suitable acceptance progress;
- fresh evidence needed;
- files, modules, and ownership boundaries allowed to change;
- route for success, failure, and feedback;
- whether a durable plan is needed.

Create or update a durable plan only for multiple independent loops, modules, repos, handoff, recovery, rollback/compatibility decisions, or user request. For that case, read `references/plan-template.md`. Small patches do not need durable plans.

### Phase 3: Execution

- Make the suitable coherent change.
- Prefer evidence: tests, assertions, lint/typecheck/build, runtime/manual probes, and diff review.
- Stay inside the claim boundary.
- Preserve unrelated user changes.
- Stop with `alpha-goal` if target/entity/API/log evidence contradicts the contract.
- For debug work, collect falsifiable evidence before patching.
- If the same failure thread repeats three times without new evidence, enter feedback judgment and consider independent review.

Forbidden unless the user explicitly requests it and risk is recorded:

- editing or deleting files in a primary `main`/`master` checkout;
- creating a branch inside a primary `main`/`master` checkout;
- creating branch/worktree before target closure;
- mutating a candidate repo not selected by the Goal Contract;
- crossing repo, worktree, submodule, or ownership boundary without authorization;
- unrelated cleanup or refactor;
- final completion claims from ITERATE.

### Phase 4: Feedback

Feedback covers:

- test, build, lint, and probe output;
- reviewer or user feedback;
- new target, scope, entity, API, or log evidence;
- implementation risk, missing evidence, and claim-boundary gaps;
- architecture, scope, ownership, review-dispute, or claim-boundary risk;
- whether active spec/plan is stale.

Decisions:

- `continue`: current route works; run another iteration.
- `pivot`: evidence breaks the route; return `alpha-goal` or change the dynamic plan.
- `expand`: goal remains valid but scope grew; usually return `alpha-goal` or review.
- `harden`: core behavior is done but evidence or risk is insufficient.
- `finish`: acceptance appears met; enter verify.

Patch independent review for architecture, scope, ownership, review-dispute, or claim-boundary risk, etc. Correct any acceptance mistakes before moving on.

### Phase 5: Next iteration

Enter the next iteration if not blocked.

### Phase 6: Verify

Enter `verify` with your claim until you are 100% confident the goal is met.

</Process>

Do not make final completion claims in an Iteration Record. Completion judgment belongs to `verify`. `BLOCKED` routes back to `alpha-goal`.
