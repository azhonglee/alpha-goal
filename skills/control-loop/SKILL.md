---
name: control-loop
description: "Use only after an explicit goal specification authorizes bounded implementation or hardening. Do not use for ambiguous planning or standalone specific read-only probe requests."
---

# Control Loop

Control Loop is authorized execution after `$alpha-goal`, not task discovery or scheduling.

## Resources

Resolve the Alpha Goal state root the same way as `$alpha-goal`: always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

Read `docs/specs/YYYYMMDD-<TaskName>.md` for the goal specification and interview records in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/interview.md`.
If the goal specification is not available, report the issue and route to `alpha-goal` or blocker instead of editing.
Read/create `<Alpha Goal state root>/YYYYMMDD-<TaskName>/run-profile.md` before repo mutation. It controls only how this run attempts the goal, never what counts as completion. If missing, create it only from the goal specification, invocation, or verification route; otherwise route to `alpha-goal` or blocker.
If from `$evidence-verify`, read `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` and continue to harden the implementation or evidence until the verification gap closes.
For cross-repo goals, use the single task-level state root and the repo manifest from the goal specification or task records; do not create separate task states per repo unless a repo policy explicitly requires it.

`run-profile.md` must keep this minimal shape:

```markdown
# Loop Run Profile

Goal spec:
Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the goal spec.

Run mode: manual | automation | from-verification
Discovery source: goal-spec-only | named source authorized by goal spec/task records
External side effects allowed: none | explicit list outside approved worktree and Alpha Goal state root
Human checkpoint: none | explicit checkpoint before listed side effects or claims
Evaluator route: $evidence-verify before final claim | named evaluator plus $evidence-verify
```

## Gates before mutation

All must be true:

- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Unrelated user changes are identified and preserved.
- Alpha Goal state root is resolved before writing process artifacts.
- `run-profile.md` exists, references the current goal specification, and does not expand, narrow, reinterpret, waive, or replace the goal specification's scope, authority, acceptance evidence, non-goals, or claim boundary.
- Run mode, discovery source, allowed external side effects, human checkpoint, and evaluator route are explicit; implicit/unknown fails the gate.
- Discovery source is `goal-spec-only` or a named source already authorized by the goal specification or task records.
- Evaluator route includes `$evidence-verify` before final/ready/safe/complete claims; other evaluators add evidence only.
- For cross-repo goals, every repo has an approved change surface, worktree/branch plan, validation observer, integration evidence boundary, and delivery boundary.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

## Preflight

Run `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts` from repo root when an existing `tsx` runner is available, or record equivalent git/environment facts: root, branch/worktree, status, applicable rule files, ignored `.worktrees/`, Alpha Goal state root, submodules, strongest evidence floor. Also record run profile path, run mode, discovery source, side effects, checkpoint, and evaluator route.
For multi-repo preflight, run the same command with repo paths such as `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts <repo-a> <repo-b>`, or record the equivalent facts per repo.

## Iteration

Iterate until the goal specification is evidence-covered within the active run profile, or route when profile, authority, evidence, or blocker prevents that claim.

```text
Plan slice -> Act/probe -> Sense -> Compare -> Record -> Route
```

### 1. Plan slice

Dynamic planning answers only the current iteration:
- stay inside the approved target, scope, non-goals, constraints, authorization, and claim boundary.
- stay inside the active run profile: run mode, discovery source, allowed external side effects, human checkpoint, and evaluator route.
- use discovery source only to select already-authorized work, not to discover new tasks.
- the most useful coherent acceptance-relevant slice that can be completed and verified now;
- fresh evidence needed after the slice and how it will be collected;
- files, modules, repos, generated outputs, and ownership surfaces allowed to change;
- for cross-repo work, the repo manifest slice: per-repo action, dependency/integration order, validation observer, commit/PR/MR boundary, and shared rollback or containment needs;
- assumptions to check and stop conditions for reframe, blocked, or unsafe execution;
- expected artifacts, side effects, cleanup, and rollback/containment needs;
- strongest material risk and evidence floor;
- success, failure, feedback, and reframe routes;
- whether a durable plan is necessary.

Create a durable plan when:
- work spans multiple iterations
- more than one ownership surface
- external side effects exist
- recovery may be required

### 2. Act or probe
- Stay inside the planned slice and the goal specification you read.
- Enforce the active run profile. Do not change discovery source, add side effects, skip checkpoints, or change evaluator route; needed profile changes are route events.
- Check planned assumptions and stop conditions while executing; adjust within the approved context when safe, and stop rather than patch around material contradictions.
- For an implementation slice, make one coherent targeted change unless the approved slice explicitly requires multiple coordinated edits.
- For a read-only/probe slice, do not write; produce evidence, diagnosis, or route decisions only.
- Preserve and interpret failing outputs; do not hide, rerun away, or summarize them as success.
- Record produced artifacts, generated outputs, side effects, cleanup, and rollback/containment actions as they occur.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- Do not let edits leak outside the approved repo surface, and do not use one repo's commit, push, or PR as proof that another repo or the integrated behavior is verified.
- Prefer targeted edits; defer unrelated improvements unless they are necessary for the approved slice and their risk is recorded.
- For debug work, identify and record the root cause before repair actions. If root cause is not confirmed, limit changes to diagnostic probes, reversible instrumentation, or explicitly hypothesis-testing slices that do not alter the intended fix surface; record uncertainty and do not present them as repairs.
- Use subagents for safely isolated independent work, including separate ownership surfaces, read-only review, evidence audit, test/log analysis, or risk assessment; do not let subagents write overlapping files without coordination, and inspect their files, evidence, and concerns before accepting results.
- For high-risk, subjective-quality, cross-module, external-side-effect, or automation-triggered work, `ITERATION_READY_FOR_VERIFY` requires `$evidence-verify`; named evaluators review quality, loopholes, regressions, side effects, and claim overreach as supporting evidence. Prefer behavior evidence over code reading alone.

### 3. Sense and compare

When risk, scope, or uncertainty warrants it, dispatch subagents to review and check the work from multiple perspectives: completion, accuracy, validity, relevance, risk.

Collect fresh evidence after the action: tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection. Classify it as gate / advisory / exploration / blocked evidence.
For cross-repo work, collect per-repo evidence and integration evidence that exercises the declared dependency/order boundary.

Compare observed feedback to the goal specification you read. If the expected effect or threshold is not met, harden, fallback, reframe, or block. If feedback contradicts a reusable assumption, record an Adaptive Learning Record: trigger, mismatch, adjustment, reuse condition, invalidation condition.

### 4. Record and route

Persist `<Alpha Goal state root>/YYYYMMDD-<TaskName>/iteration.md` for automation-triggered, multi-turn, risky, or handoff work; otherwise summarize in chat. Before `ITERATION_READY_FOR_VERIFY`, always persist or update `<Alpha Goal state root>/YYYYMMDD-<TaskName>/iteration.md` and `<Alpha Goal state root>/YYYYMMDD-<TaskName>/evidence.md` with references to the goal specification and active run profile, acceptance-to-evidence mapping, command/output references, residual risks, and unsupported or not-run checks. For cross-repo work, group the mapping by repo surface and by integration relation.

`iteration.md` records facts only. It may reference but must not redefine the goal specification or run profile.

```markdown
Iteration Summary

| Field | Value |
| --- | --- |
| Action | |
| Feedback | |
| Residual error | |
| Artifact | |
| Next State | |
```

Routes:

- `ITERATION_CONTINUES`: next safe slice remains. Continue with `Act/probe` or re-plan with `Plan slice`.
- `ITERATION_HARDEN`: direction is valid but evidence/edge/compatibility/cleanup is weak. Continue with `Act/probe` to harden.
- `ITERATION_READY_FOR_VERIFY`: persisted evidence totally covers acceptance and claim boundary. Handoff to `$evidence-verify`.
- `RETURN_TO_ALPHA_GOAL`: target/scope/authority/claim changed or became unclear. Stop execution and hand off to `$alpha-goal` for clarification or re-authorization.
- `BLOCKED`: missing permission, tool, data, environment, credential, or user-owned decision. Ask user for help when you cannot deal with it.

If the active run profile blocks the goal, do not lower the claim. Use `ITERATION_HARDEN` only for gaps fixable inside the same profile; otherwise route to `RETURN_TO_ALPHA_GOAL` or `BLOCKED`.

Continue automatically only while the same explicit authority, actuator boundary, acceptance evidence, claim boundary, active run profile, modeled disturbances, and user-owned decisions remain stable. Stop/re-route on new subsystem/skill, boundary or evidence change, run profile change, unmodeled disturbance, user-owned choice, or cumulative edits beyond the approved boundary.
