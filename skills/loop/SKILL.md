---
name: loop
description: Run bounded goal iterations under an existing user-reviewed Goal Contract. Dynamic planning, execution, feedback, and route decisions.
---

# Loop

Advance bounded iterations under an approved Goal Contract or equivalent context. Do not redefine the goal. Implementation details may evolve inside the approved context; if new evidence breaks the target, scope, acceptance, non-goals, constraints, authorization, decision boundaries, or claim boundary, stop and return to `alpha-goal`.

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

## Iteration Process

Each pass completes one bounded iteration: plan one slice, execute it, review fresh feedback, record the decision, and route. A single `loop` run may continue through multiple bounded passes when the approved context remains valid, risk does not materially increase, no user-owned decision is open, and each pass is recorded proportionally.

```text
Plan this slice -> Execute -> Review and collect feedback -> Decide next route -> Record -> Route next
```

### 1. Plan this slice

Dynamic planning answers only the current iteration:

- the most useful coherent acceptance-relevant slice that can be completed and verified now;
- fresh evidence needed after the slice and how it will be collected;
- files, modules, repos, generated outputs, and ownership surfaces allowed to change;
- assumptions to check and stop conditions for reframe, blocked, or unsafe execution;
- expected artifacts, side effects, cleanup, and rollback/containment needs;
- strongest material risk and evidence floor;
- success, failure, feedback, and reframe routes;
- whether a durable plan is necessary.

Create or update a durable plan only for multiple independent loops, modules, repos, handoff/recovery needs, external side effects, irreversible/high-risk changes, rollback/compatibility decisions, contested ownership, or user request. Small patches can record the plan in the Iteration Record.

If persistent goal tooling is already active, align the slice with that objective. Do not create a new persistent goal unless the user explicitly requested that runtime behavior.

### 2. Execute

- Run mutation preflight, or record an equivalent manual preflight before edits; low-risk slices may use compact manual evidence, while dirty state, generated output, submodules, cross-file behavior, or user changes require fuller preflight.
- Check planned assumptions and stop conditions while executing; adjust within the approved context when safe, and stop rather than patch around material contradictions.
- For a mutation slice, make one coherent targeted change unless the approved slice explicitly requires multiple coordinated edits.
- For a read-only/probe slice, do not mutate; produce evidence, diagnosis, or route decisions only.
- Preserve and interpret failing outputs; do not hide, rerun away, or summarize them as success.
- Record produced artifacts, generated outputs, side effects, cleanup, and rollback/containment actions as they occur.
- Stay inside the approved target, scope, non-goals, constraints, authorization, and claim boundary.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- Prefer targeted edits; defer unrelated improvements unless they are necessary for the approved slice and their risk is recorded.
- For debug work, identify and record the root cause before repair actions. If root cause is not confirmed, limit changes to diagnostic probes, reversible instrumentation, or explicitly hypothesis-testing slices that do not alter the intended fix surface; record uncertainty and do not present them as repairs.
- Use subagents for safely isolated independent work, including separate ownership surfaces, read-only review, evidence audit, test/log analysis, or risk assessment; do not let subagents mutate overlapping files without coordination, and inspect their files, evidence, and concerns before accepting results.
- Stop and return to `alpha-goal` when evidence materially points to a different target/entity/API/repo, or changes scope, acceptance, constraints, non-goals, authorization, user-owned decisions, or final claim boundary.

Forbidden unless explicitly requested and risk is recorded:

- editing or deleting files in a primary `main`/`master` checkout;
- creating a branch in a primary checkout when an isolated worktree should be used;
- creating a mutation branch/worktree for an unselected target repo or scope; isolated read-only or setup worktrees are allowed when they reduce risk and are recorded;
- mutating a candidate repo not selected by the approved context;
- crossing repo, worktree, submodule, or ownership boundaries;
- unrelated cleanup, broad formatting, or opportunistic refactor; localized cleanup/refactor is allowed when it directly enables the approved slice, reduces risk, and is recorded;
- final completion claims from `loop`.

### 3. Review and collect feedback

Review the current iteration before choosing the next route.

Always perform a lightweight self-review, applying checks only when relevant to the slice:

- context alignment: work, commands, and artifacts still match the approved context;
- scope and ownership: changed files, generated outputs, and user-owned changes stay inside scope and avoid non-goals;
- artifact integrity: produced artifacts, side effects, and cleanup needs are expected, consistent, and recorded;
- evidence and acceptance delta: local evidence matches the strongest material risk, and met/unmet acceptance items are clear;
- rules and assumptions: applicable project rules still hold, and planning assumptions remain valid or are explicitly revised;
- risk and compatibility: regression, compatibility, migration, integration, security, or data risks are understood;
- claim boundary: the likely final claim does not exceed current evidence.

Consider feedback from:

- test, build, lint, probe, runtime, or manual inspection output;
- user input received during the iteration;
- reviewer or subagent comments;
- stale, contradicted, or newly discovered specs/plans/rules;
- dependency, environment, permission, or upstream-state changes;
- regression, compatibility, migration, integration, security, or data-risk signals;
- implementation risk, acceptance gaps, and claim-boundary gaps.

Dispatch a subagent for independent review when risk, scope, repeated failure, or contested judgment justifies it:

- give the subagent a narrow review question;
- avoid overlapping ownership;
- inspect its findings before accepting them.

Classify feedback before deciding:

- implementation feedback: goal remains valid; continue within current scope;
- hardening feedback: behavior is mostly in place, but evidence, edge cases, compatibility, or cleanup are insufficient;
- verification-ready feedback: acceptance appears met and the evidence bundle is ready for independent verification;
- reframe feedback: target, scope, acceptance, non-goals, constraints, decision boundaries, authorization, or final claim changed;
- blocker feedback: missing permission, tool, data, environment, or user-owned decision.

If the same failure thread repeats three times without new evidence, stop patching and make a feedback judgment; consider independent review if available.

### 4. Decide next route

Map the review result to one primary route, recording secondary concerns when they matter:

- `ITERATION_CONTINUES`: goal remains valid and another bounded implementation slice should proceed or be recommended.
- `ITERATION_HARDEN`: implementation direction is valid, but evidence, edge cases, compatibility, or cleanup are insufficient; run or recommend a hardening slice.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears met; enter `verify` with the current claim and evidence.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, constraints, decision boundaries, authorization, or final claim changed or is no longer reliable.
- `BLOCKED`: report the smallest missing input, permission, tool, data, or environment.

Do not choose `ITERATION_READY_FOR_VERIFY` merely because implementation is done; choose it only when the review result indicates acceptance appears met and the evidence bundle is ready for independent verification. Ready for verify is a handoff claim, not a completion claim. `loop` may state that a slice or local implementation is complete, but must not claim final acceptance, merge readiness, or task completion.

### 5. Record

Produce an Iteration Record proportional to risk before handoff, blocking, or materially changing direction. For consecutive low-risk passes in one `loop` run, compact per-pass records are enough if they preserve the core semantics: contract/context used, dynamic plan, preflight, execution, local evidence, feedback, route decision, acceptance delta, risks, and next action. Use `references/iteration-record-schema.md` when exact field meanings are needed.

Do not make final completion claims in an Iteration Record. Completion judgment belongs to `verify`.

### 6. Route next

Follow the selected route:

- for `ITERATION_CONTINUES` or `ITERATION_HARDEN`, either start the next bounded pass in the same `loop` run when context, risk, budget, and user-authorization boundaries remain stable, or record the recommended next pass and pause;
- for `ITERATION_READY_FOR_VERIFY`, hand off to `verify`;
- for `RETURN_TO_ALPHA_GOAL`, hand off to `alpha-goal` before more mutation;
- for `BLOCKED`, stop and report the blocker plus the smallest missing input, permission, tool, data, or environment.

When leaving `loop`, the only exits are handoff to `alpha-goal`, handoff to `verify`, a recommended next bounded `loop` pass, or an iteration-level blocker. `BLOCKED` here does not by itself imply marking any persistent goal as blocked unless the active runtime policy allows it.
