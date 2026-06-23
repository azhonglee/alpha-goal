---
name: control-loop
description: "Use only after an explicit goal specification authorizes bounded implementation or hardening. Do not use for ambiguous planning or standalone specific read-only probe requests."
---

# Control Loop

Control Loop is the bounded executor and hardener after `$alpha-goal`, not task discovery or scheduling. Its primary job is to move the authorized target state forward through small verified slices.

State artifacts support execution and recovery; writing them is never the objective. A slice is not complete because documents were updated. It is complete only when action/probe evidence changes or confirms the target state within the Goal Contract.

## Execution Loop

```text
Trigger -> Read Goal -> Read Loop State -> Read Memory -> Plan Slice -> Act/Probe -> Evidence -> $goal-verify -> Gap?
Gap yes -> update state -> harden/continue
Gap no -> final claim within verified boundary
```

Run the loop as behavior, not paperwork:
- Read Goal: bind to the canonical Goal Contract and approved target.
- Read Loop State: resume current phase, pending work, last verification gap, next slice, and stop condition.
- Read Memory: use compressed learned facts as hints only.
- Plan Slice: choose one coherent acceptance- and risk-relevant action/probe.
- Act/Probe: make the smallest useful authorized change or gather the missing observer.
- Evidence: collect raw proof from tests, commands, diffs, logs, screenshots, runtime probes, or manual inspection.
- Verify Gap: send final/ready/safe/PR-ready, review/audit, high-risk, or verification-triggered work through `$goal-verify`.

## Execution Invariants

- The state-root `goal-contract.md` is canonical. `docs/specs/YYYYMMDD-<TaskName>.md` may mirror or reference it only; conflicts route to `alpha-goal`.
- If no explicit goal specification exists, route to `alpha-goal` or blocker instead of editing.
- Stay inside approved target, scope, non-goals, constraints, authorization, actuator boundary, claim boundary, active run profile, and Autonomy level.
- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- A run profile controls execution only; it must not expand, narrow, reinterpret, waive, or replace the Goal Contract.
- Memory is non-authoritative. Conflicts with the Goal Contract route to `alpha-goal`.
- Do not hide failed outputs, rerun failures away, or summarize intentions as success.
- Final wording must not exceed the strongest direct evidence and checked surface.
- For cross-repo goals, one repo's commit, push, or PR is not integrated evidence for another repo.

## Gates

Before any act/probe, durable write, mutation, side effect, or final claim, all must be true:
- Alpha Goal state root is resolved before writing process artifacts.
- Goal Contract, `run-profile.md`, `loop-state.md`, and `memory.md` exist or can be initialized only from authorized task records.
- Goal Contract path/version is exact and run-profile values are identical to or stricter than Goal Contract.
- `loop-state.md` has non-empty objective, legal phase, and actionable Next Slice or Stop Condition; empty memory says `None yet`.
- Run mode, Trigger event, Requested action, Trigger Contract, Discovery source, External side effects allowed, Human checkpoint, Evaluator route, and Autonomy level are explicit; implicit/unknown fails the gate.
- For `scheduled` and `webhook`, the canonical Trigger Contract names event source/id, replay or dedupe rule, and payload-to-existing-state mapping; run-profile `Trigger event` can only instantiate that contract.
- Discovery source is `goal-spec-only` or a named source already authorized by the goal specification or task records.
- Evaluator route includes `$goal-verify` before final/ready/safe/complete claims.
- The requested/planned action is within the active run profile, approved target, scope, authorization, non-goals, actuator boundary, claim boundary, and Autonomy level.
- For cross-repo goals, every repo has approved change surface, worktree/branch plan, validation observer, integration evidence boundary, and delivery boundary.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

## Trigger Contract

- `manual`: resume from matching `loop-state.md` unless the user overrides in the current turn.
- `scheduled`: resume latest matching state only; the Trigger Contract must name schedule source/id, replay/staleness rule, and existing state mapping; reject stale/replayed events; do not introduce a new discovery source, scope, authority, side effect, or public claim.
- `webhook`: bind event id/dedupe key to the Trigger Contract and authorized payload-to-state mapping; unmatched, stale, replayed, or authority-changing events route to `alpha-goal`.
- `verification-triggered`: consume only the latest verdict whose `Goal Contract`, `Loop State`, and `Evidence` bindings match the current task files, with `Next route: control-loop` and a same-goal fixable Gap.

## Autonomy Ladder

Requested action must be at or below current level:
- `L1`: Suggest only.
- `L2`: Draft changes without applying.
- `L3`: Modify approved worktree and task-state; no commit/push.
- `L4`: Commit, push branch, and open/update PR/MR.
- `L5`: Merge/deploy only when explicitly authorized.

If requested action exceeds the level, deny the action and route to user confirmation or `BLOCKED`.

## Universal Completion Gates

Before any FINAL_RESPONSE_READY, READY, DONE, SAFE, COMPLETE, or MR-ready claim:

1. Scope Gate:
   The final diff must be a subset of authorized repo surfaces in the Goal Contract.
   Evidence must include raw changed-file observation and classification.
   Any unclassified or unauthorized change blocks completion.

2. Assertion Gate:
   Every outcome, constraint, non-goal, and acceptance evidence item in the Goal Contract
   must be converted into a falsifiable assertion with recorded evidence and verdict.

3. Replacement/Prohibition Gate:
   For goals involving replace, remove, disable, migrate, forbid, or no-fallback semantics,
   evidence must include both positive evidence for the new behavior and negative evidence
   that the old/prohibited behavior is not reachable on default paths.

4. Evidence Boundary Gate:
   The final claim must not exceed the strongest direct evidence level.
   CI evidence may support build/test claims only; it cannot by itself prove runtime,
   staging, production, data migration, security, or availability claims.

5. Raw Evidence Gate:
   Verification must cite raw observers, commands, artifacts, logs, or diffs.
   Summaries, intentions, plans, and assumptions are not evidence.

If any gate fails:
- Same-goal fixable gap -> `HARDENING`
- Scope/authority/decision change -> `RETURN_TO_ALPHA_GOAL`
- Missing permission/data/environment -> `BLOCKED`

## Preflight

When an existing `tsx` runner and task state are available, `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts --task YYYYMMDD-TaskName` can print preflight facts. Otherwise record equivalent facts directly: root, branch/worktree, status, applicable rule files, ignored `.worktrees/`, Alpha Goal state root, submodules, strongest evidence floor, run profile, trigger event, requested action, autonomy level, loop-state path, memory path, and evaluator route. The gate is the observed facts, not the helper script.

For multi-repo preflight, pass repo paths to the same command or record equivalent facts per repo.

## State I/O Contract

Resolve the Alpha Goal state root the same way as `$alpha-goal`: always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

Use the matching task files as loop I/O:
- `goal-contract.md`: canonical goal, acceptance evidence, non-goals, authority, claim boundary, Trigger Contract, and Autonomy Level.
- `run-profile.md`: execution context only; must not expand, narrow, reinterpret, waive, or replace the goal spec.
- `loop-state.md`: durable current objective, phase, completed/pending work, risks, last verification gap, next slice, stop condition.
- `memory.md`: compressed confirmed facts, causes, constraints, working strategies, failed strategies, each with evidence, confidence, and invalidation.
- `iteration.md`: append-only run log; records what happened in the current run, not persistent current state.
- `evidence.md`: acceptance-to-evidence mapping, command/output references, defect/risk sweep surface, residual risks, unsupported or not-run checks.
- `verification.md`: latest `$goal-verify` verdict, Gap, evidence boundary, and Next route.
- `<state-root>/control-state/latest.md`: latest matching task pointer for recovery. Read it when task identity is ambiguous, and update it after Goal Contract, loop-state, evidence, or verification route changes.

If from `$goal-verify`, read `verification.md` and continue from its `Gap` and `Next route`. For cross-repo goals, use the single task-level state root and repo manifest from the Goal Contract.

## Artifact Schemas

`run-profile.md` must keep this minimal shape:

```markdown
# Loop Run Profile

Goal spec:
Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the goal spec.

Run mode: manual | scheduled | webhook | verification-triggered
Goal Contract:
Trigger event: none | schedule id | webhook id | verification gap path
Requested action: suggest | draft | modify-worktree | commit | push | open-pr | merge
Discovery source: goal-spec-only | named source authorized by goal spec/task records
External side effects allowed: none | explicit list outside approved worktree and Alpha Goal state root
Human checkpoint: none | explicit checkpoint before listed side effects or claims
Evaluator route: $goal-verify before final claim | named evaluator plus $goal-verify
Autonomy level: L1 Suggest only | L2 Draft changes | L3 Modify worktree | L4 Open PR | L5 Merge automatically
```

`control-state/latest.md` shape:

```markdown
# Control State Latest
State directory:
Goal Contract:
Run Profile:
Loop State:
Memory:
Evidence:
Verification:
Current Phase:
Next route:
Updated at:
```

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

## Iteration

Iterate until verification gap is closed, a stop condition fires, or the goal specification must be reframed.

### 1. Plan slice

Read canonical Goal Contract, active run profile, `loop-state.md`, `memory.md`, latest `iteration.md`, latest `evidence.md`, and `verification.md` when present. Memory is a non-authoritative hint; conflicts with Goal Contract route to `alpha-goal`.

Plan only the current slice:
- stay inside approved target, scope, non-goals, constraints, authorization, claim boundary, active run profile, and Autonomy level.
- use discovery source only to select already-authorized work, not to discover new tasks.
- choose the most useful coherent acceptance- and risk-relevant slice that can be completed and verified now.
- define evidence to collect after the slice and how it maps to acceptance, claim boundary, and material defect/risk sweep.
- list allowed files, repos, artifacts, side effects, cleanup, rollback/containment needs, assumptions, stop conditions, unchecked surfaces, and strongest material risk.
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

Compare feedback to the Goal Contract, active run profile, `loop-state.md`, and claim boundary. If expected effect or threshold is not met, harden, use only an authorized acceptance-equivalent fallback, reframe, or block.

For reusable mismatches, update `memory.md` with an Adaptive Learning Record: trigger, mismatch, adjustment, reuse condition, invalidation condition.

For high-risk, subjective-quality, cross-module, external-side-effect, scheduled, webhook, verification-triggered, review/audit, loophole-finding, PR-ready, or final-claim work, `ITERATION_READY_FOR_VERIFY` requires `$goal-verify`. Named evaluators add supporting evidence only.

### 4. Record and route

Before `ITERATION_READY_FOR_VERIFY`, update:
- `iteration.md`: append-only facts of this run, or write `iteration-YYYYMMDD-HHMMSS.md`; reference failed outputs and never redefine goal spec, run profile, or loop state.
- `evidence.md`: acceptance-to-evidence mapping, command/output references, defect/risk sweep surface, residual risks, unsupported or not-run checks.
- `loop-state.md`: current objective, phase, completed, pending, known risks, last verification gap, next slice, stop condition.
- `memory.md`: only evidence-backed confirmed facts, causes, constraints, working strategies, and failed strategies; each durable entry includes Evidence, Confidence, and Invalidation.
- `<state-root>/control-state/latest.md`: update when the current task becomes the latest valid recovery target, when `loop-state.md` phase changes, or when verification changes the next route.

Routes:
- `ITERATION_CONTINUES`: next safe slice remains. Continue with `Act/probe` or re-plan.
- `ITERATION_HARDEN`: direction is valid but evidence, edge, compatibility, cleanup, or verification gap is weak. Continue hardening inside the same profile.
- `ITERATION_READY_FOR_VERIFY`: evidence appears to cover acceptance, claim boundary, and material defect/risk sweep surface. Handoff to `$goal-verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, authority, source reference, acceptance evidence, non-goal, decision boundary, actuator boundary, Trigger Contract, Autonomy level, or claim boundary changed or became unclear.
- `BLOCKED`: permission, tool, data, environment, credential, or user-owned decision is missing.

After `$goal-verify`:
- `PASS_TO_FINAL`: set `FINAL_RESPONSE_READY`; set `COMPLETE` only after final response and delivery boundary evidence are done.
- `NEXT_ITERATION` with fixable `Gap`: update `loop-state.md` Current Phase to `HARDENING`, set Last Verification Gap and Next Slice from `Gap`, and continue.
- `NEXT_ITERATION` with changed target/scope/authority/claim: route `RETURN_TO_ALPHA_GOAL`.
- `NEXT_ITERATION` with missing permission/tool/data/environment/credential/user decision: route `BLOCKED`.

If the active run profile blocks the goal, do not lower the claim. Use `ITERATION_HARDEN` only for gaps fixable inside the same profile.

Continue automatically only while the same explicit authority, actuator boundary, acceptance evidence, claim boundary, active run profile, risks, assumptions, stop conditions, and user-owned decisions remain stable. Stop/re-route on new subsystem/skill, boundary or evidence change, run profile change, unmodeled risk, user-owned choice, or cumulative edits beyond the approved boundary.
