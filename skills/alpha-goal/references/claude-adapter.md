# Claude Adapter

Read only in a Claude runtime or Claude-installed skill context. This maps exposed capabilities; it does not change routes, authority, artifacts, evidence, or completion rules.

## Capability Mapping

| Skill capability | Claude surface |
| --- | --- |
| Structured decision input | `AskUserQuestion` or the available structured question UI; use concise plain text only when unavailable |
| Shell observation/execution | `Bash` |
| Narrow file mutation | Available file edit tools |
| Worktree isolation | `EnterWorktree` or `git worktree` |
| Independent read/review | `Agent` or agent teams when exposed |
| Work-item tracking | `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`; not Goal Contract authority |
| Native completion condition | `/goal` when callable; `TaskCreate` is not equivalent |

## Native Goal

- Query `/goal` before setting a condition; do not replace an unrelated active goal.
- After contract acceptance, use one verifiable condition only when the user or repository explicitly requires it, the Execution and Side-effect Boundary permits it, and current tool policy allows it.
- If `/goal` or a completion update is unavailable, record that capability gap. Continue unless the accepted contract or repository explicitly requires native-goal evidence.
- Never use `/goal clear` to claim success, or invent a Codex-named goal tool call.

## Adapter Checks

- Detect capability availability instead of assuming parity with Codex.
- Preserve repository safety and artifact paths when mapping tools.
- When independent agents are unavailable, run the work sequentially and record why independence was not obtained when it is acceptance evidence.
