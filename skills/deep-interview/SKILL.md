---
name: deep-interview
description: "Manual-only clarification workflow. Use only when the user explicitly invokes $deep-interview, explicitly asks to run Deep Interview, or an already active interview.md exact path is preserved in current context for resume. Record questions, answers, decisions, provenance, and unresolved gaps in interview.md when durable clarification is needed. Do not auto-trigger from ambiguity, impact, or missing requirements; do not route execution, authorize side effects, implement, or verify work."
---

# Deep Interview

Run only after explicit user invocation, or resume an exact current-context `interview.md` with `status: active`. Inactive artifacts are references, not triggers. Never infer a trigger from ambiguity or missing decisions. Own the canonical interview record without assuming downstream workflow.

## Resolve the Interview Artifact

Use an explicitly supplied task directory when present. Otherwise, when durable clarification is needed, create `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` and write `interview.md` there. Return its absolute path. If no persistent artifact is needed, return the clarification result in context and state that no file was written.

In a Claude-installed skill context, read `references/claude-adapter.md` before selecting or asking a question.

`interview.md` is evidence and provenance, not authority to perform side effects.

## Discover Before Asking

Read relevant instructions, artifacts, tests, docs, history, and current state. Resolve discoverable facts directly. Descriptive evidence cannot grant desired-behavior, side-effect, or acceptance authority.

Maintain the smallest clarification frame needed for the request:

- intent and observable desired outcome;
- scope, exclusions, and material constraints;
- decision owners and side-effect boundaries;
- candidate success signals and observers;
- unresolved decisions that could materially change behavior, interfaces, data, execution, risk, or evidence.

Record facts with attributable sources and decisions with their authority. Never convert a recommendation, convention, or current implementation into authority.

## Interview Loop

Repeat only while the allowed dimensions contain a blocking gap:

1. **Select one gap.** Prefer the highest-impact unresolved decision by ownership, blast radius, irreversibility, interface/data impact, evidence ambiguity, and rollback risk.
2. **Record the question before asking.** Append a numbered pending turn under its stable gap id with why it matters, known facts, options/recommendation when useful, and one decision variable.
3. **Ask one decision variable.** Never ask for discoverable facts.
4. **Record the answer before continuing.** Complete the pending turn with the answer and source, then record the pressure-test result. If a follow-up needs authority input, append the next numbered pending turn under the same gap id before asking it.
5. **Close or retain the gap.** If another reasonable reading changes the outcome or evidence materially, keep it blocking and ask the smallest follow-up on the same gap.
6. **Reprioritize.** A new higher-impact gap supersedes lower-impact questions.

Do not expand into derivative questions while the governing tradeoff remains unresolved. Do not use a fixed questionnaire, confidence score, or round count as completion evidence.

For exploratory requests, derive the smallest useful allowed dimensions from the user's purpose. If action is not authorized, stop when the requested preference, problem, or direction is clear; mark action-specific dimensions `not-explored` rather than forcing an execution-ready result.

## interview.md Schema

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

Keep turn history append-only. Update only `Current result` and `Status` as a gap evolves. Never overwrite an answered turn. Mark superseded answers with the superseding turn and authority source. Preserve pending turns on cancellation or conflict.

## Return Contract

Return the absolute `interview.md` path when written, the Handoff status, and unresolved gap ids. Make no assumption about which tool, skill, or human will consume it.

## Hard Boundaries

- Do not select an execution route or lifecycle.
- Do not call goal lifecycle tools.
- Do not authorize, implement, mutate, deploy, purchase, or perform external writes.
- Do not hand off to an implementation or verification workflow unless the user explicitly requests that separate action after clarification.
- Do not treat `interview.md` as acceptance or side-effect authorization.
