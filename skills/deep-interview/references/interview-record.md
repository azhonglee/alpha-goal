# Interview Record

Read this reference when durable clarification needs `interview.md`, or when an existing interview artifact must be recovered or updated.

## Artifact Resolution and Recovery

Use an explicitly supplied task directory when present. Otherwise, when durable clarification is needed, create `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` and write `interview.md` there. Return its absolute path.

If no persistent artifact is needed, return the clarification result in context and state that no file was written. Preserve any known artifact path in current task context so later updates target the same record rather than a newly guessed location.

## Canonical Schema

```md
# Interview

status: active | explored | ready | blocked-on-authority | cancelled | conflict
mode: standalone | delegated
caller: <caller or user>
return_to: <optional route or none>
artifact_directory: <absolute directory or none>

## Request and Context
- Original request: <verbatim or faithful compact restatement>
- Purpose: <what this interview must clarify>
- Allowed dimensions: <bounded list>
- Protected fields: <caller-owned fields that cannot change>

## Discovered Facts
| Fact | Source | Freshness / limitation |
| --- | --- | --- |

## Interview Log
### <gap-id> — <dimension>
- Why it matters: <material consequence>
- Current result: <decision, boundary, consequence, observer consequence, or pending>
- Status: covered | blocking | non-material | deferred | not-explored

#### Turn 1
- State: pending | answered | superseded | cancelled
- Question: <one decision variable>
- Answer: <authority answer or pending>
- Source: <authority and date/turn, or pending>
- Pressure test result: <boundary/counterexample/failure case and whether another answer is needed>
- Superseded by: <turn number and authority source, or none>

#### Turn 2
- <append follow-up; never overwrite Turn 1>

## Clarification Summary
- Intent and observable desired outcome: <summary>
- Scope: <summary>
- Exclusions: <summary>
- Material constraints: <summary>
- Decision and side-effect boundaries: <summary>
- Candidate success signals and observers: <summary>

## Unresolved Gaps
| Gap id | Owner | Why blocking | Next decision variable |
| --- | --- | --- | --- |

## Handoff
- Status: EXPLORED | READY | BLOCKED_ON_AUTHORITY | CANCELLED | CONFLICT
- Ready dimensions: <list>
- Intentionally unexamined dimensions: <list>
- Conflicts and freshness limits: <list>
```

## Append-Only and Update Rules

- Record a pending turn before asking. Include why it matters, known facts, useful options or recommendation, and one decision variable.
- Complete that same turn with the answer, source, and pressure-test result before continuing.
- Never overwrite or delete an answered turn.
- If an answer changes, mark the old turn `superseded`, set `Superseded by` to the new turn and authority source, and append the replacement turn.
- Update only a gap's `Current result` and `Status` as its accumulated turns change the current conclusion.
- Preserve pending turns on cancellation or conflict; mark their state instead of deleting them.
- Keep discovered facts attributable and record freshness or limitations.
