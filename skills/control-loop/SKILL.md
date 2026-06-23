---
name: control-loop
description: "Use only after an explicit goal specification authorizes bounded implementation or hardening. Do not use for ambiguous planning or standalone specific read-only probe requests."
---

# Control Loop

Control Loop is authorized execution after `$alpha-goal`, not task discovery or scheduling. It runs the persistent goal loop:

```text
Trigger -> Read Goal -> Read Loop State -> Read Memory -> Plan Slice -> Act/Probe -> Evidence -> $evidence-verify -> Gap?
Gap yes -> update state -> harden/continue
Gap no -> final claim within verified boundary
```

## Resources

Resolve the Alpha Goal state root the same way as `$alpha-goal`: always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

Read `docs/specs/YYYYMMDD-<TaskName>.md` or `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`. If no explicit goal specification exists, route to `alpha-goal` or blocker instead of editing.

Read/create these task files before repo mutation:
- `run-profile.md`: execution context only; must not expand, narrow, reinterpret, waive, or replace the goal spec.
- `loop-state.md`: durable current objective, phase, completed/pending work, risks, next slice, stop condition.
- `memory.md`: compressed confirmed facts, causes, constraints, working strategies, failed strategies.

If from `$evidence-verify`, read `verification.md` and continue from its `Gap` and `Next route`. For cross-repo goals, use the single task-level state root and repo manifest from the Goal Contract.

`run-profile.md` must keep this minimal shape:

```markdown
# Loop Run Profile

Goal spec:
Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the goal spec.

Run mode: manual | scheduled | webhook | verification-triggered
Discovery source: goal-spec-only | named source authorized by goal spec/task records
External side effects allowed: none | explicit list outside approved worktree and Alpha Goal state root
Human checkpoint: none | explicit checkpoint before listed side effects or claims
Evaluator route: $evidence-verify before final claim | named evaluator plus $evidence-verify
Autonomy level: L1 Suggest only | L2 Draft changes | L3 Modify worktree | L4 Open PR | L5 Merge automatically
```

## Trigger Contract

- `manual`: resume from `loop-state.md` unless the user overrides in the current turn.
- `scheduled`: resume from `loop-state.md`; no new discovery source, scope, authority, side effects, or public claims.
- `webhook`: bind the event to an existing authorized goal/state. If unmatched or authority changed, route to `alpha-goal`.
- `verification-triggered`: read `verification.md`, set Current Phase to `HARDENING` for fixable gaps, and plan the next slice from `Gap`.

## Autonomy Ladder

Requested action must be at or below current level:
- `L1`: Suggest only.
- `L2`: Draft changes without applying.
- `L3`: Modify worktree.
- `L4`: Open PR/MR.
- `L5`: Merge automatically.

If requested action exceeds the level, deny the action and route to user confirmation or `BLOCKED`.

## Gates before mutation

All must be true:
- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Unrelated user changes are identified and preserved.
- Alpha Goal state root is resolved before writing process artifacts.
- Goal Contract, `run-profile.md`, `loop-state.md`, and `memory.md` exist or can be initialized only from authorized task records.
- Run mode, Trigger Contract, Discovery source, External side effects allowed, Human checkpoint, Evaluator route, and Autonomy level are explicit; implicit/unknown fails the gate.
- Discovery source is `goal-spec-only` or a named source already authorized by the goal specification or task records.
- Evaluator route includes `$evidence-verify` before final/ready/safe/complete claims.
- The planned action is within the active run profile, approved target, scope, authorization, non-goals, actuator boundary, claim boundary, and Autonomy level.
- For cross-repo goals, every repo has approved change surface, worktree/branch plan, validation observer, integration evidence boundary, and delivery boundary.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

## Preflight

Run `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts` from repo root when an existing `tsx` runner is available, or record equivalent facts: root, branch/worktree, status, applicable rule files, ignored `.worktrees/`, Alpha Goal state root, submodules, strongest evidence floor, run profile, trigger, autonomy level, loop-state path, memory path, and evaluator route.

For multi-repo preflight, pass repo paths to the same command or record equivalent facts per repo.

## Iteration

Iterate until verification gap is closed, a stop condition fires, or the goal specification must be reframed.

### 1. Plan slice

Read Goal Contract, active run profile, `loop-state.md`, `memory.md`, latest `iteration.md`, latest `evidence.md`, and `verification.md` when present.

Plan only the current slice:
- stay inside approved target, scope, non-goals, constraints, authorization, claim boundary, active run profile, and Autonomy level.
- use discovery source only to select already-authorized work, not to discover new tasks.
- choose the most useful coherent acceptance-relevant slice that can be completed and verified now.
- define evidence to collect after the slice and how it maps to acceptance.
- list allowed files, repos, artifacts, side effects, cleanup, rollback/containment needs, assumptions, stop conditions, and strongest material risk.
- for cross-repo work, plan per repo plus integration relation in dependency order.

Create a durable plan when work spans multiple iterations, ownership surfaces, external side effects, or recovery needs.

### 2. Act or probe

- Stay inside the planned slice and Goal Contract.
- Enforce run profile, Trigger Contract, and Autonomy level.
- Check assumptions and stop conditions while executing; stop instead of patching around material contradictions.
- For implementation, make one coherent targeted change unless the slice requires coordinated edits.
- For read-only/probe slices, do not write; produce evidence, diagnosis, or route decisions only.
- Preserve failing outputs; do not hide, rerun away, or summarize them as success.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- Keep edits inside approved repo surfaces. One repo's commit, push, or PR is not integrated evidence for another repo.
- For debug work, identify and record root cause before repair. Without confirmed root cause, limit changes to diagnostics or hypothesis-testing slices and do not claim repair.
- Use subagents for isolated review, evidence audit, test/log analysis, or risk assessment; inspect their artifacts before accepting results.

### 3. Sense and compare

Collect fresh evidence: tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection. Classify as gate, advisory, exploration, or blocked evidence.

Compare feedback to the Goal Contract, active run profile, `loop-state.md`, and claim boundary. If expected effect or threshold is not met, harden, fallback, reframe, or block.

For reusable mismatches, update `memory.md` with an Adaptive Learning Record: trigger, mismatch, adjustment, reuse condition, invalidation condition.

For high-risk, subjective-quality, cross-module, external-side-effect, automation-triggered, or final-claim work, `ITERATION_READY_FOR_VERIFY` requires `$evidence-verify`. Named evaluators add supporting evidence only.

### 4. Record and route

Before `ITERATION_READY_FOR_VERIFY`, update:
- `iteration.md`: facts of this run only; it may reference but must not redefine goal spec, run profile, or loop state.
- `evidence.md`: acceptance-to-evidence mapping, command/output references, residual risks, unsupported or not-run checks.
- `loop-state.md`: current objective, phase, completed, pending, known risks, next slice, stop condition.
- `memory.md`: only evidence-backed confirmed facts, causes, constraints, working strategies, and failed strategies.

`iteration.md` shape:

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
- `ITERATION_CONTINUES`: next safe slice remains. Continue with `Act/probe` or re-plan.
- `ITERATION_HARDEN`: direction is valid but evidence, edge, compatibility, cleanup, or verification gap is weak. Continue hardening inside the same profile.
- `ITERATION_READY_FOR_VERIFY`: evidence appears to cover acceptance and claim boundary. Handoff to `$evidence-verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, authority, source reference, non-goal, Trigger Contract, Autonomy level, or claim boundary changed or became unclear.
- `BLOCKED`: permission, tool, data, environment, credential, or user-owned decision is missing.

After `$evidence-verify`:
- `PASS_TO_FINAL`: update `loop-state.md` Current Phase to `FINAL_RESPONSE_READY` or `COMPLETE` and make only the verified claim.
- `NEXT_ITERATION` with fixable `Gap`: update `loop-state.md` Current Phase to `HARDENING`, set Next Slice from `Gap`, and continue.
- `NEXT_ITERATION` with changed target/scope/authority/claim: route `RETURN_TO_ALPHA_GOAL`.
- `NEXT_ITERATION` with missing permission/tool/data/environment/credential/user decision: route `BLOCKED`.

If the active run profile blocks the goal, do not lower the claim. Use `ITERATION_HARDEN` only for gaps fixable inside the same profile.

Continue automatically only while the same explicit authority, actuator boundary, acceptance evidence, claim boundary, active run profile, modeled disturbances, and user-owned decisions remain stable. Stop/re-route on new subsystem/skill, boundary or evidence change, run profile change, unmodeled disturbance, user-owned choice, or cumulative edits beyond the approved boundary.
