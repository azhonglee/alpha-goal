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
- last known spec artifact:
- last known plan artifact:
- last known Iteration Record:
- last known Review Record:
- last known Verification Verdict:
- inferred loop type:
- suspected incomplete actions:
- safest next state:
- next action:
```

## Rules

- Do not continue mutation until the dirty state is understood.
- Do not assume a previous edit was intentional unless it maps to the Goal Contract.
- If a spec or plan exists, read its current version and status before relying on remembered context.
- Do not continue from a `superseded` artifact; return to `goal-frame` for spec issues or `goal-iterate` for plan issues.
- If changed files belong to a different repo/path than the Goal Contract, return to `goal-frame`.
- If a Review Record exists but changed files, evidence, or artifact revisions moved past its Freshness boundary, treat it as stale review input, not a completion verdict.
- If review feedback, scope expansion, complexity, architecture/ownership risk, or uncertainty exists, first decide whether `goal-iterate` feedback can handle it; enter `goal-review` only for explicit or material independent challenge.
- If the implementation appears complete but no evidence matrix exists, enter `goal-verify`.
- If the workspace contains unrelated user changes, preserve them and mention the boundary.
