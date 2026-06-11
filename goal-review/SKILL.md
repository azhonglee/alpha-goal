---
name: goal-review
description: Challenge an active Goal Contract, iteration, diff, architecture, scope, or review feedback before verification. Use explicitly or from goal-loop when direction, complexity, review feedback, or completion readiness needs review; not for ordinary standalone code review outside a goal-loop workflow.
---

# Goal Review

Your job is to challenge the current direction before verification or further mutation.

Do not mutate files. Do not approve completion. Route completion claims to `goal-verify`.

## Entry

Use this skill when:

- loop evidence contradicts assumptions;
- scope expands or implementation becomes complex;
- review feedback arrives and must be classified before action;
- direction feels uncertain;
- success appears complete but no current review exists;
- `goal-verify` returned `NEXT_ITERATION`, `REFRAME`, or an evidence gap that needs diagnosis.
- an active spec or plan may be stale, over-broad, superseded, or inconsistent with current evidence.

For ordinary standalone code review with no active Goal Contract or completion claim, do not force Goal Loop. Use the normal review style requested by the user.

Use `references/review-record-schema.md` for field definitions when the output contract is unclear.

## Review modes

Choose exactly one mode:

- `goal`: validate intent, acceptance, constraints, non-goals, and decision boundaries.
- `loop`: validate iteration quality, evidence quality, and next decision.
- `code`: inspect correctness, maintainability, tests, and regressions.
- `architecture`: inspect ownership boundaries, coupling, scalability, and fit to goal.
- `scope`: detect scope creep, hidden requirements, and accidental complexity.
- `feedback`: classify incoming reviewer/user feedback before action.
- `completion`: challenge readiness before `goal-verify`.

## Challenge checks

Ask:

- What assumption could be false?
- What evidence is missing or too indirect?
- Does evidence match the current Goal Contract, diff, risk tier, and claim boundary?
- Has any material change invalidated earlier evidence?
- What simpler solution satisfies the same acceptance?
- Has scope crossed repo, worktree, submodule, or ownership boundaries?
- Has feedback been classified instead of blindly applied?
- If an active spec exists, do Goal Contract, diff, evidence, and non-goals still align with it?
- If an active plan exists, is it current, incrementally updated, and still the smallest credible route?
- Is any stage relying on a `draft` or `superseded` artifact as if it were approved/current?
- Does the Iteration Record choose the right loop mode and provide hypothesis, evidence type, learning, and decision?
- For debug work, does the Debug Receipt prove `ROOT_CAUSE_CONFIRMED` before any fix, or correctly limit `NOT_REPRODUCED`/`BLOCKED` to diagnostic claims?

## Feedback handling

When feedback exists, classify each item:

- `accepted`: technically correct and inside goal scope.
- `rejected`: incorrect, unsafe, or out of scope; explain why.
- `needs_clarification`: cannot be implemented safely without a specific decision.
- `blocked`: cannot proceed because data, credentials, permissions, or environment are missing.

Only accepted feedback may route to `goal-iterate`.

## Output

Produce exactly one Review Record:

```text
Review Record:
- Mode:
- Target:
- Evidence basis:
- Findings:
- Feedback classification:
- Artifact review:
- Scope/architecture notes:
- Risk tier:
- Required evidence:
- Review verdict:
- Next:
```

Allowed `Review verdict` values:

- `CONTINUE`: current direction remains valid.
- `NEXT_ITERATION`: more implementation or evidence is needed.
- `REFRAME`: Goal Contract, target, acceptance, or existing-work relation is wrong or incomplete.
- `SIMPLIFY`: solution is broader or more complex than acceptance requires.
- `BLOCKED`: missing decision, data, environment, or permissions prevent safe progress.
- `READY_FOR_VERIFY`: review found no blocker and completion evidence can be checked by `goal-verify`.

Route `READY_FOR_VERIFY` to `goal-verify`. Route `NEXT_ITERATION` or `SIMPLIFY` to `goal-iterate`. Route `REFRAME` to `goal-frame`.
