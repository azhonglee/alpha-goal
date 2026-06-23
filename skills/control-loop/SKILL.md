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
- `goal-contract.md` already exists, was issued by `$alpha-goal`, and its Goal Contract path/version is exact. Missing, stale, or conflicting Goal Contract routes to `alpha-goal` or `BLOCKED`; `control-loop` never creates or derives it.
- `run-profile.md`, `loop-state.md`, and `memory.md` exist or can be initialized only from the canonical Goal Contract and matching task records; run-profile values are identical to or stricter than Goal Contract.
- `loop-state.md` has non-empty objective, legal phase, and actionable Next Slice or Stop Condition; empty memory says `None yet`.
- Run mode, Trigger event, Requested action, Trigger Contract, Discovery source, External side effects allowed, Human checkpoint, Evaluator route, and Autonomy level are explicit; implicit/unknown fails the gate.
- For `scheduled` and `webhook`, the canonical Trigger Contract names event source/id, replay or dedupe rule, and payload-to-existing-state mapping; run-profile `Trigger event` can only instantiate that contract.
- Discovery source is `goal-spec-only` or a named source already authorized by the goal specification or task records.
- Evaluator route includes `$goal-verify` before final/ready/safe/complete claims.
- The requested/planned action is within the active run profile, approved target, scope, authorization, non-goals, actuator boundary, claim boundary, and Autonomy level.
- For cross-repo goals, every repo has approved change surface, worktree/branch plan, validation observer, integration evidence boundary, and delivery boundary.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

## Preflight

When an existing `tsx` runner and task state are available, `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts --task YYYYMMDD-TaskName` can print preflight facts. Otherwise record equivalent facts directly: root, branch/worktree, status, applicable rule files, ignored `.worktrees/`, Alpha Goal state root, submodules, strongest evidence floor, run profile, trigger event, requested action, autonomy level, loop-state path, memory path, and evaluator route. The gate is the observed facts, not the helper script.

For multi-repo preflight, pass repo paths to the same command or record equivalent facts per repo.

## Reference Routing

Resolve the Alpha Goal state root the same way as `$alpha-goal`: always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

State writes are checkpoints, not progress. Never spend a slice only normalizing state unless missing or stale state blocks authorized execution, recovery, or verification.

If from `$goal-verify`, read `verification.md` and continue from its `Gap` and `Next route`. For cross-repo goals, use the single task-level state root and repo manifest from the Goal Contract.

Read references only when their condition applies:
- `references/state-artifacts.md`: initializing, repairing, or validating state artifacts, or exact field names are required for handoff, recovery, or verification.
- `references/trigger-autonomy.md`: run mode is not plain `manual`, requested action may exceed L3, trigger binding is unclear, or action authorization must be checked.
- `references/completion-gates.md`: before final/ready/safe/complete/MR-ready claims, replacement/prohibition semantics, or broad evidence-boundary claims.

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
- Record produced artifacts, generated outputs, external side effects, cleanup, and rollback/containment actions as they occur.
- For debug work, identify and record root cause before repair. Without confirmed root cause, limit changes to diagnostics or hypothesis-testing slices and do not claim repair.
- Use subagents for isolated review, evidence audit, test/log analysis, or risk assessment; inspect their artifacts before accepting results.

### 3. Sense and compare

Collect fresh evidence: tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection. Classify as gate, advisory, exploration, or blocked evidence.

Compare feedback to the Goal Contract, active run profile, `loop-state.md`, and claim boundary. If expected effect or threshold is not met, harden, use only an authorized acceptance-equivalent fallback, reframe, or block.

For reusable mismatches, update `memory.md` with an Adaptive Learning Record: trigger, mismatch, adjustment, reuse condition, invalidation condition.

For high-risk, subjective-quality, cross-module, external-side-effect, scheduled, webhook, verification-triggered, PR-ready, or final-claim work, `ITERATION_READY_FOR_VERIFY` requires `$goal-verify`. When review/audit/loophole-finding appears inside an authorized implementation or hardening slice, `control-loop` may collect evidence and apply same-goal fixes only; standalone judgment belongs to `$goal-verify` or read-only review. Named evaluators add supporting evidence only.

### 4. Record and route

Before `ITERATION_READY_FOR_VERIFY`, persist only the state needed for evidence, recovery, and the next route:
- `iteration.md`: append facts of this run, or write `iteration-YYYYMMDD-HHMMSS.md`; reference failed outputs and never redefine goal spec, run profile, or loop state.
- `evidence.md`: update acceptance-to-evidence mapping, command/output references, defect/risk sweep surface, residual risks, unsupported or not-run checks.
- `loop-state.md`: update only when objective, phase, completed/pending work, known risks, last verification gap, next slice, or stop condition changed.
- `memory.md`: update only for reusable evidence-backed facts, causes, constraints, working strategies, or failed strategies; each durable entry includes Evidence, Confidence, and Invalidation.
- `<state-root>/control-state/latest.md`: update only when the current task becomes the latest valid recovery target, when binding changes, when `loop-state.md` phase changes, or when verification changes the next route.

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
