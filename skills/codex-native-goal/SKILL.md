---
name: codex-native-goal
description: "Execute an explicit or active Codex Native Goal with a native-goal-driven loop. Use when the user explicitly mentions Codex Native Goal, native goal, create_goal, update_goal, or asks to run, resume, finish, or report on an active native goal. Do not use for ordinary tasks without an explicit or active native goal, and do not bridge execution through control-loop."
---

# Codex Native Goal

`codex-native-goal` is a Native Goal execution controller, not a `$control-loop` bridge. Native Goal owns the app-level objective, budget, and lifecycle status. This skill owns native-goal execution slices: plan, act/probe, collect evidence, record state, and decide the next route. `$alpha-goal` owns requirements framing when intent, scope, acceptance evidence, or authority is unclear. `$goal-verify` owns completion and readiness judgment.

## Workflow

1. Inspect native goal state before acting. Use `get_goal` when available. If no active native goal exists and the user did not explicitly ask to create or start one, do not call `create_goal`; route ordinary engineering work to `$alpha-goal`.
2. Bind or frame the target. Resolve the Alpha Goal state root as `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path. Read `control-state/latest.md` when present, then bind matching `goal-contract.md`, `run-profile.md`, `loop-state.md`, and `memory.md`. If the native goal has no adequate Goal Contract and scope, non-goals, acceptance evidence, authority, or claim boundary are unclear, route to `$alpha-goal`.
3. Reconcile authority. Native goal text may seed intent, progress, or budget awareness, but it cannot by itself waive constraints, non-goals, acceptance evidence, actuator boundary, Autonomy Level, or claim boundary. Conflicts route to `$alpha-goal`.
4. Execute the native-goal slice directly. Plan the smallest acceptance- and risk-relevant action/probe, act inside the authorized boundary, collect raw evidence, and record useful state. Do not route implementation or hardening through `$control-loop`.
5. Verify before lifecycle updates. For final, ready, complete, safe, repair-complete, or PR-ready claims, route to `$goal-verify` before any native goal completion update.
6. Update native goal status only inside the tool contract. Mark `complete` only when the objective is genuinely achieved and no required work remains. Mark `blocked` only when the same blocking condition has repeated for at least three consecutive goal turns and meaningful progress requires user input or an external state change.

## Create Goal Gate

Call `create_goal` only when the user, system, or developer instructions explicitly request a Codex Native Goal. The objective must be concrete enough to execute. Set a token budget only when one was explicitly requested. If an unfinished native goal already exists, do not create or replace it; resume it, reconcile the conflict through `$alpha-goal`, or stop for a user-owned decision. If the request merely describes work to do, frame it through `$alpha-goal` instead of creating a native goal.

## Completion Gate

Before `update_goal complete`, all must be true:
- native goal objective, Goal Contract, loop state, evidence, and verification refer to the same task;
- acceptance evidence covers the Goal Contract and proposed final claim;
- `$goal-verify` returned `PASS_TO_FINAL`, except for an explicitly one-turn read-only task with direct evidence and no required handoff;
- no required commit, push, PR/MR, cleanup, delivery boundary, or final response work remains;
- the final response can state the supported claim without narrowing the objective after the fact.

For budgeted native goals, report the final token usage returned by the native goal update tool.

## Blocked Gate

Do not mark a native goal `blocked` for a first failure, unclear design, failing test, missing polish, slow progress, or a question that would merely improve the result. Record the blocker in Alpha Goal state, continue useful bounded work when possible, and mark `blocked` only after the same blocker recurs for at least three consecutive goal turns with no meaningful path forward.

## Recovery

After compaction or resume, treat remembered skill text and remembered native goal state as stale. Inspect the active native goal and Alpha Goal latest pointer again. If native goal status, Goal Contract, or loop state point to different tasks, route to `$alpha-goal` before acting. If the native goal is already complete or blocked, do not reopen execution unless the user explicitly resumes or changes the objective.
