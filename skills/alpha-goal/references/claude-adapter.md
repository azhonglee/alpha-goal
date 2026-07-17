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
| Native Goal Sync | Reuse an active `/goal`; otherwise set `/goal <verifiable condition>` when exposed. Completion is evaluator-driven. |

## Adapter Checks

- Detect capability availability instead of assuming parity with Codex.
- Preserve repository safety and artifact paths when mapping tools.
- When independent agents are unavailable, run the work sequentially and record why independence was not obtained when it is acceptance evidence.
