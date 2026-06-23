# Trigger And Autonomy

Load this reference only when run mode is not plain `manual`, requested action may exceed L3, trigger binding is unclear, or action authorization must be checked.

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
