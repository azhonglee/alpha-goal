# Recovery Check

Use this reference when a task resumes after interruption, tool failure, user correction, context loss, or a dirty worktree.

## Recovery record

```text
Recovery:
- cwd:
- git root:
- branch:
- changed files:
- untracked files:
- active worktree:
- last known Goal Contract:
- last known Iteration Record:
- last known Verification Verdict:
- suspected incomplete actions:
- safest next state:
- next action:
```

## Rules

- Do not continue mutation until the dirty state is understood.
- Do not assume a previous edit was intentional unless it maps to the Goal Contract.
- If changed files belong to a different repo/path than the Goal Contract, return to `goal-frame`.
- If the implementation appears complete but no evidence matrix exists, enter `goal-verify`.
- If the workspace contains unrelated user changes, preserve them and mention the boundary.
