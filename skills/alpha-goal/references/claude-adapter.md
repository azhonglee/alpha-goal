# Claude Adapter

Read this reference only when Alpha Goal runs in Claude runtime or a Claude-installed skill context.

## Principle

- Treat this as a tool-name adapter, not a new source of authority.
- Keep Goal Contract, checkpoint, skip-gate, and evidence semantics unchanged.
- Prefer Claude-native tools when available; otherwise record the adapter gap instead of pretending a Codex tool ran.

## Tool Mapping

| Skill term | Claude mapping | Boundary |
| --- | --- | --- |
| `request_user_input` | `AskUserQuestion` or equivalent structured question UI | Use only for short decision gates. Plain text is acceptable only when no structured input tool exists. |
| `get_goal` | `/goal` with no argument | Treat only explicitly active/current output as an unfinished native goal; achieved history is not active. |
| `create_goal` | `/goal <generated Native Goal Input>` | Pass the Alpha Goal-generated objective without changing its Outcome, completion conditions, Constraints, Evidence, or Contract path. `TaskCreate` is not equivalent. |
| `update_goal` | No direct Claude tool equivalent | Completion is evaluator-driven; use `/goal clear` only to cancel, not to claim success. |
| `update_plan` | `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`; legacy fallback `TodoWrite` only when task tools are disabled | Tracks work items, not completion-goal evaluation. |
| `exec_command` | `Bash` | Preserve repository safety gates and validation evidence. |
| `apply_patch` | Claude file edit tools | Use the narrowest edit tool available; avoid unrelated formatting churn. |
| subagent review | Claude `Agent`, agent teams, or workflow tools when available | If unavailable, record why the independent review was skipped. |
| worktree isolation | `EnterWorktree` or `git worktree` | Do not edit `main` or `master` directly. |

## Native Goal Sync In Claude

When Alpha Goal says to perform Native Goal Sync in Claude:
- Do not call Codex-named `create_goal`, `get_goal`, or `update_goal`.
- If `/goal` is available, pass the generated Native Goal Input to it.
- If `/goal` is not callable from the current Claude surface, return Native Goal Sync as unavailable in the alpha-goal handoff; do not create or write `checkpoint.md`.
- Do not treat `TaskCreate` or `TaskUpdate` as proof that a native goal was created.
- Do not hand off as synced when the adapter gap changes execution authority; ask the user whether to continue without native goal sync.

Do not add generic requirements such as changed files, a commit, or clean git status unless the accepted Goal Contract requires them.
