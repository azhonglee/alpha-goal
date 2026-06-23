# Trigger And Autonomy

Load this reference only when run mode is not plain `manual`, requested action may exceed L3, trigger binding is unclear, or action authorization must be checked.

## Trigger Contract

- `native-goal`: inspect current native goal state first. Create a native goal only on explicit user/system/developer request; if an unfinished native goal exists, resume it or route conflicting authority to `alpha-goal`.
- `manual`: resume from the accepted Goal Contract and any existing `checkpoint.md`; use `control-state/latest.md` only when task identity is ambiguous. Add checkpoint `Loop State` only for multi-iteration recovery.
- `scheduled`: resume latest matching accepted state via Trigger Contract and `control-state/latest.md` when needed; name schedule source/id, replay/staleness rule, and state mapping; reject stale/replayed events; do not add new discovery source, scope, authority, side effect, or public claim.
- `webhook`: bind event id/dedupe key to the Trigger Contract and authorized payload-to-state mapping; unmatched, stale, replayed, or authority-changing events route to `alpha-goal`.
- `verification-triggered`: consume only the latest verdict whose `Goal Contract` and checkpoint `Verification`/`Evidence` bindings match the current accepted task files, with `Verdict: NEXT_ITERATION`, `Next route: control-loop`, and a same-goal fixable Gap.

## Autonomy Ladder

Requested action must be at or below current level:
- `L1`: Suggest only.
- `L2`: Draft changes without applying.
- `L3`: Modify approved worktree and task-state; no commit/push.
- `L4`: Commit, push branch, and open/update PR/MR.
- `L5`: Merge/deploy only when explicitly authorized.

If requested action exceeds the level, deny the action and route to user confirmation or `BLOCKED`.

Native goal lifecycle actions do not bypass the ladder. `create_goal` needs explicit request, `update_goal complete` needs completed delivery boundary, and `update_goal blocked` needs the repeated-blocker gate.
