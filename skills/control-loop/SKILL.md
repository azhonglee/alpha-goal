---
name: control-loop
description: "Native-goal-driven bounded executor and hardener. Use after an accepted Goal Contract authorizes implementation, or when an explicit or active Codex Native Goal must be run, resumed, finished, or reported through create_goal/update_goal gates. Do not use for ambiguous planning."
---

# Control Loop

Control Loop is the native-goal-driven bounded executor and hardener after `$alpha-goal`, not task discovery or scheduling. Optimize for useful target-state movement: choose a small slice, act, collect evidence, compare, and either harden or finish.

State artifacts support execution and recovery; writing them is never the objective. A slice is complete only when action evidence changes or confirms target state. Use `checkpoint.md` only when it protects recovery, trigger handling, evidence handoff, or verification.

## Execution Loop

Run the loop as behavior, not paperwork. Treat the execution as control flow:

```pseudo
function control_loop(trigger):
  # Inspect Native Goal
  native_goal = inspect_native_goal_if_available()
  if native_goal.absent and !trigger.explicit_native_goal_start:
    do_not_call(create_goal)

  # Resolve Task, Read Goal, Read Checkpoint
  task = resolve_task(trigger, latest_index = "control-state/latest.md")
  goal = read_accepted_goal_contract(task)
  checkpoint = read_checkpoint_when_present_or_required(task)
  assert_authorized_boundary(goal, checkpoint, native_goal)

  while true:
    # Plan Slice
    slice = plan_smallest_deliverable_slice(goal, checkpoint)

    # Act, Evidence, Verify Gap
    outcome = act(slice)
    evidence = collect_raw_evidence(outcome)
    gap = compare_to_goal(evidence, goal.acceptance_evidence, goal.claim_boundary)

    if gap.changed_contract_or_authority:
      return RETURN_TO_ALPHA_GOAL
    if gap.blocked:
      update_native_goal_lifecycle_if_allowed(native_goal, update_goal blocked)
      return BLOCKED
    if gap.fixable:
      checkpoint_only_if_needed(gap)
      continue

    verification = goal_verify_if_required(evidence, goal, trigger)
    if verification.pass:
      finish_delivery_boundary()
      update_native_goal_lifecycle_if_allowed(native_goal, update_goal complete)
      return PASS_TO_FINAL

    if verification.gap.fixable:
      checkpoint_only_if_needed(verification.gap)
      continue
    return route_verification_result(verification)
```

Helper meanings:
- `inspect_native_goal_if_available`: use `get_goal` when available; without active native goal or explicit start request, do not call `create_goal`.
- `resolve_task`: when identity is ambiguous, use `<state-root>/control-state/latest.md` only as a global recovery index.
- `read_accepted_goal_contract`: bind to the accepted `goal-contract.md`, approved target, acceptance evidence, non-goals, claim boundary, Trigger Contract, and Autonomy Level.
- `read_checkpoint_when_present_or_required`: read `checkpoint.md` only when present or required; do not memorize its fields here.
- `act`: make the targeted change or gather the missing observer.
- `collect_raw_evidence`: collect proof from tests, commands, diffs, logs, screenshots, probes, or inspection.
- `goal_verify_if_required`: send final/ready/safe/PR-ready, review/audit, high-risk, or verification-triggered work through `$goal-verify`.

## Execution Invariants

- The accepted Goal Contract is canonical; repo specs may mirror it only. If no explicit goal specification exists, route to `alpha-goal` or blocker; `control-loop` never creates or derives it.
- Stay inside approved target, scope, non-goals, constraints, authorization, actuator boundary, claim boundary, run profile when present, and Autonomy level.
- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Preserve unrelated user changes; never stash, revert, move, or overwrite.
- A native goal objective may seed intent, progress, and budget awareness, but cannot expand, narrow, waive, or replace Goal Contract authority.
- Do not hide failed outputs, rerun failures away, or summarize intentions as success.
- Final wording must not exceed the strongest direct evidence and checked surface.

## Gates

Before any mutation, side effect, or final claim:
- Resolve the Alpha Goal state root and accepted Goal Contract.
- If a native goal is explicit or active, bind it to the same Goal Contract, checkpoint/evidence when present, and verification boundary.
- Call `create_goal` only when explicitly requested; set token budget only when explicitly requested.
- If an unfinished native goal already exists, do not create/replace it; resume, route conflict to `$alpha-goal`, or stop for user decision.
- Use `checkpoint.md` only when required by triggers, actions above L3, side effects, recovery, evidence handoff, or verification. For exact fields, read `references/state-artifacts.md`.
- Ensure the planned action is within target, scope, authorization, non-goals, actuator boundary, claim boundary, and Autonomy level.
- Keep `$goal-verify` before final/ready/safe/complete claims.
- `update_goal complete` requires achieved objective, supported claim, no remaining work, and final token usage for budgeted native goals.
- `update_goal blocked` requires the same blocker for at least three consecutive goal turns with no meaningful progress path.

If any gate is missing, route to `alpha-goal` or blocker instead of editing.

## Preflight

Prefer quick observed facts over document ceremony. When available, `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts --task YYYYMMDD-TaskName` can print git/path/state facts; pass action/run-mode/side-effect flags for work above plain L1-L3 manual execution. The gate is observed facts, not the helper.

## Reference Routing

Resolve the Alpha Goal state root as `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path.

State writes are checkpoints, not progress. Normalize state only when missing/stale state blocks delivery, recovery, trigger handling, evidence handoff, or verification.

Read references only when their condition applies:
- `references/state-artifacts.md`: exact checkpoint/latest-pointer fields are needed.
- `references/trigger-autonomy.md`: non-plain `manual`, action above L3, unclear trigger, native goal lifecycle, or action authorization.
- `references/completion-gates.md`: final/ready/safe/complete/MR-ready, replacement/prohibition, broad evidence boundary.

## Iteration

Iterate until verification gap is closed, a stop condition fires, or the goal must be reframed.

### 1. Plan slice

Read the Goal Contract, then any needed checkpoint. Plan only the current slice:
- pick the highest-value small action that can be verified now;
- define evidence before acting;
- name key risks, assumptions, side effects, cleanup, and stop conditions.

### 2. Act

- Stay inside the planned slice and Goal Contract.
- Stop on material contradictions.
- For implementation, make one targeted change unless coordinated edits are required.
- Preserve failing outputs and unrelated user changes.
- For active native goals, align visible progress with the native goal objective, but do not update status from intentions, partial work, or unevaluated evidence.
- For debug work, identify root cause before repair; without confirmed root cause, limit changes to diagnostics or hypothesis-testing slices.

### 3. Sense and compare

Collect fresh evidence and compare it to acceptance evidence, claim boundary, and material defect/risk surface.

If feedback fails, harden, use an authorized acceptance-equivalent fallback, reframe, or block. For reusable mismatches, update checkpoint `Memory` only with evidence-backed learning.

For high-risk, subjective-quality, cross-module, external-side-effect, scheduled, webhook, verification-triggered, PR-ready, or final-claim work, `ITERATION_READY_FOR_VERIFY` requires `$goal-verify`.

### 4. Record and route

Persist only state needed for recovery, evidence, or the next route:
- update `checkpoint.md` only for needed Run Profile, Loop State, Memory, Iteration, Evidence, or Verification sections;
- update `<state-root>/control-state/latest.md` only as a global recovery index.

Routes:
- `ITERATION_CONTINUES`: next safe slice remains; continue with `Act` or re-plan.
- `ITERATION_HARDEN`: direction is valid but evidence, edge, compatibility, cleanup, or verification gap is weak.
- `ITERATION_READY_FOR_VERIFY`: evidence appears to cover acceptance, claim boundary, and material defect/risk sweep. Handoff to `$goal-verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, authority, acceptance evidence, non-goal, decision boundary, actuator boundary, Trigger Contract, Autonomy level, or claim boundary changed or became unclear.
- `BLOCKED`: permission, tool, data, environment, credential, or user-owned decision is missing.

After `$goal-verify`:
- `PASS_TO_FINAL`: finish delivery-boundary work, then final response; if a native goal is active, call `update_goal complete` only after the same boundary is satisfied.
- `NEXT_ITERATION` with fixable `Gap`: harden inside the same goal; write checkpoint Loop State only if recovery must continue across turns.
- Changed target/scope/authority/claim routes to `RETURN_TO_ALPHA_GOAL`; missing permission/tool/data/environment/credential/user decision routes to `BLOCKED`.

Stop/re-route when authority, actuator boundary, acceptance evidence, claim boundary, native goal binding, run profile, risk, assumption, stop condition, or user-owned decision changes.
