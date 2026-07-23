# Claude Adapter

Read only in a Claude runtime or Claude-installed skill context. Map capabilities without changing the clarification boundary or output contract.

| Skill capability | Claude surface |
| --- | --- |
| Structured decision input | `AskUserQuestion` or the available structured question UI; use concise plain text only when unavailable |
| Shell observation | `Bash` |
| Independent read-only investigation | `Agent` or agent teams when exposed |

Do not change lifecycle state, mutate the target, authorize side effects, or route to execution from this adapter.
