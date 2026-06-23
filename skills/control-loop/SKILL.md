---
name: control-loop
description: "Native-goal-driven bounded executor and hardener. Use after an accepted Goal Contract authorizes implementation, or when an explicit or active Codex Native Goal must be run, resumed, finished, or reported through create_goal/update_goal gates. Do not use for ambiguous planning."
---

# Control Loop

Control Loop is the native-goal-driven bounded executor and hardener after `$alpha-goal`, not task discovery or scheduling. Optimize for useful target-state movement: choose a small slice, act, collect evidence, compare, and either harden or finish.

State artifacts support execution and recovery; writing them is never the objective. Use `checkpoint.md` only when it protects recovery, evidence handoff, or verification.

## Execution Loop

Run the loop as behavior, not paperwork. Treat the execution as control flow:

```pseudo
function control_loop(goal_contract):
  # Inspect Native Goal
  native_goal = inspect_native_goal_if_available()
  if native_goal.absent and !goal_contract.explicit_native_goal_start:
    do_not_call(create_goal)

  # Read Goal, Read Checkpoint
  goal = read_accepted_goal_contract(goal_contract)
  checkpoint = read_checkpoint_when_present_or_required(goal)
  assert_authorized_boundary(goal, checkpoint, native_goal)

  while true:
    slice = plan_smallest_deliverable_slice(goal, checkpoint)
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

    verification = goal_verify_if_required(evidence, goal)
    if verification.pass:
      finish_delivery_boundary()
      update_native_goal_lifecycle_if_allowed(native_goal, update_goal complete)
      return PASS_TO_FINAL

    if verification.gap.fixable:
      checkpoint_only_if_needed(verification.gap)
      continue
    return route_verification_result(verification)
```

## Boundaries

- The accepted Goal Contract is canonical. If no explicit accepted goal exists, route to `alpha-goal` or blocker; `control-loop` never creates or derives it.
- Stay inside approved target, scope, non-goals, constraints, authorization, actuator boundary, claim boundary, and Autonomy level.
- A native goal objective may seed intent, progress, and budget awareness, but cannot expand, narrow, waive, or replace Goal Contract authority.
- Call `create_goal` only when explicitly requested; otherwise do not call `create_goal`. If an unfinished native goal already exists, resume it, route conflict to `$alpha-goal`, or stop for user decision.
- `update_goal complete` requires achieved objective, supported claim, no remaining work, and final token usage for budgeted native goals.
- `update_goal blocked` requires the same blocker for at least three consecutive goal turns with no meaningful progress path.
- Do not mutate primary `main`/`master`/`trunk`; use a repo-local worktree unless repo policy defines a safer equivalent.
- Preserve unrelated user changes; never stash, revert, move, or overwrite.
- Final wording must not exceed the strongest direct evidence and checked surface. Keep `$goal-verify` before final/ready/safe/complete claims.

## Reference Routing

Resolve the Alpha Goal state root as `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path.

State writes are checkpoints, not progress. Normalize state only when missing/stale state blocks delivery, recovery, evidence handoff, or verification.

Read references only when their condition applies:
- `references/state-artifacts.md`: exact `checkpoint.md` or `control-state/latest.md` fields are needed; `control-state/latest.md` is only a global recovery index. Includes Loop State, Memory, Evidence, or Verification.
- `references/completion-gates.md`: final/ready/safe/complete/MR-ready, replacement/prohibition, broad evidence boundary.

Optional helper: `npx --no-install tsx skills/control-loop/scripts/mutation-preflight.ts --task YYYYMMDD-TaskName` prints read-only git/path/state facts. The gate is observed facts, not the helper.

## Routes

- `PASS_TO_FINAL`: finish delivery-boundary work, then final response; if a native goal is active, call `update_goal complete` only after the same boundary is satisfied.
- `NEXT_ITERATION` with fixable `Gap`: harden inside the same goal; write checkpoint Loop State only if recovery must continue across turns.
- `RETURN_TO_ALPHA_GOAL`: target, scope, authority, acceptance evidence, non-goal, decision boundary, actuator boundary, Autonomy level, or claim boundary changed or became unclear.
- `BLOCKED`: permission, tool, data, environment, credential, or user-owned decision is missing.
- Stop/re-route when authority, actuator boundary, acceptance evidence, claim boundary, native goal binding, run profile, risk, assumption, stop condition, or user-owned decision changes.
