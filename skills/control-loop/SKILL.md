---
name: control-loop
description: "Use only after an explicit goal specification authorizes bounded implementation or hardening. Do not use for ambiguous planning or standalone specific read-only probe requests."
---

# Control Loop

Exert your utmost effort to achieve the goal you are assigned.

## Resources

Resolve the Alpha Goal state root the same way as `$alpha-goal`: `ALPHA_GOAL_STATE_ROOT` when set; otherwise `${CODEX_HOME:-$HOME/.codex}/state/alpha-goal/<workspace-slug>/`. Derive `<workspace-slug>` from the absolute git root when available, otherwise the absolute working directory or task context; strip leading slashes, replace characters outside `[A-Za-z0-9_.-]` with `-`, keep the last 80 characters, and fallback to `workspace`. It must not require a repo root. Use repo-local `.alpha-goal/` only when user/project policy explicitly requires that override.

Read `docs/specs/YYYYMMDD-<TaskName>.md` for the goal specification and interview records in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/interview.md`.
If the goal specification is not available, report the issue and route to `alpha-goal` or blocker instead of editing.
If from `$evidence-verify`, read `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` and continue to harden the implementation or evidence until the verification gap closes.

## Gates before mutation

All must be true:

- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Unrelated user changes are identified and preserved.
- Alpha Goal state root is resolved before writing process artifacts; if repo-local `.alpha-goal/` is selected, it is ignored first.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

## Preflight

Run `npx --yes tsx skills/control-loop/scripts/mutation-preflight.ts` from repo root, or record equivalent facts: root, branch/worktree, status, applicable rule files, ignored `.worktrees/`, Alpha Goal state root, repo-local `.alpha-goal/` ignore status only when used, submodules, strongest evidence floor.

## Iteration

Iterate until you have 100% confidence in the goal completion.

```text
Plan slice -> Act/probe -> Sense -> Compare -> Record -> Route
```

### 1. Plan slice

Dynamic planning answers only the current iteration:
- stay inside the approved target, scope, non-goals, constraints, authorization, and claim boundary.
- the most useful coherent acceptance-relevant slice that can be completed and verified now;
- fresh evidence needed after the slice and how it will be collected;
- files, modules, repos, generated outputs, and ownership surfaces allowed to change;
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
- Check planned assumptions and stop conditions while executing; adjust within the approved context when safe, and stop rather than patch around material contradictions.
- For an implementation slice, make one coherent targeted change unless the approved slice explicitly requires multiple coordinated edits.
- For a read-only/probe slice, do not write; produce evidence, diagnosis, or route decisions only.
- Preserve and interpret failing outputs; do not hide, rerun away, or summarize them as success.
- Record produced artifacts, generated outputs, side effects, cleanup, and rollback/containment actions as they occur.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- Prefer targeted edits; defer unrelated improvements unless they are necessary for the approved slice and their risk is recorded.
- For debug work, identify and record the root cause before repair actions. If root cause is not confirmed, limit changes to diagnostic probes, reversible instrumentation, or explicitly hypothesis-testing slices that do not alter the intended fix surface; record uncertainty and do not present them as repairs.
- Use subagents for safely isolated independent work, including separate ownership surfaces, read-only review, evidence audit, test/log analysis, or risk assessment; do not let subagents write overlapping files without coordination, and inspect their files, evidence, and concerns before accepting results.

### 3. Sense and compare

Collect fresh evidence after the action: tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection. Classify it as gate / advisory / exploration / blocked evidence.

Compare observed feedback to the goal specification you read. If the expected effect or threshold is not met, harden, fallback, reframe, or block. If feedback contradicts a reusable assumption, record an Adaptive Learning Record: trigger, mismatch, adjustment, reuse condition, invalidation condition.

### 4. Record and route

Persist `<Alpha Goal state root>/YYYYMMDD-<TaskName>/iteration.md` for multi-turn/risky/handoff work; otherwise summarize in chat. Before `ITERATION_READY_FOR_VERIFY`, always persist or update `<Alpha Goal state root>/YYYYMMDD-<TaskName>/iteration.md` and `<Alpha Goal state root>/YYYYMMDD-<TaskName>/evidence.md` with acceptance-to-evidence mapping, command/output references, residual risks, and unsupported or not-run checks.

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

Continue automatically only while the same explicit authority, actuator boundary, acceptance evidence, claim boundary, modeled disturbances, and user-owned decisions remain stable. Stop/re-route on new subsystem/skill, boundary or evidence change, unmodeled disturbance, user-owned choice, or cumulative edits beyond the approved boundary.
