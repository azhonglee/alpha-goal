---
name: goal-review
description: Optionally challenge an active Goal Contract, dynamic plan, iteration feedback, diff, architecture, scope, or readiness risk. Use only when explicitly named, required by repo rules, or selected because feedback risk needs independent review; not for ordinary standalone code review outside an alpha-goal workflow.
---

# Goal Review

`goal-review` is not a default main stage. Normal execution feedback belongs in the `goal-iterate` feedback phase. Use this skill only when an independent challenge is needed.

Do not mutate. Do not approve completion. Completion judgment belongs to `goal-verify`.

## Entry

Use this skill when:

- the user explicitly names `$goal-review`;
- repo rules require a review record;
- `goal-iterate` feedback detects architecture, scope, ownership, complexity, or claim-boundary risk;
- reviewer/user feedback must be classified before action;
- the active spec/plan may be stale, too broad, superseded, or inconsistent with evidence;
- readiness for completion needs independent challenge, while final verdict still belongs to `goal-verify`.

For ordinary standalone code review with no Goal Contract or completion claim, do a normal review without forcing Alpha Goal.

Read `references/review-record-schema.md` if fields are unclear.

## Review modes

Choose one mode:

- `goal`
- `loop`
- `code`
- `architecture`
- `scope`
- `feedback`
- `completion`

## Checks

Challenge first:

- which assumption may be wrong;
- whether evidence is fresh, direct, and within the claim boundary;
- whether user-facing term, UI module, data entity, API/RPC, log, and code symbol name the same object;
- whether the dynamic plan is still the smallest credible route;
- whether feedback is classified instead of blindly implemented;
- whether scope crosses repo, worktree, submodule, or ownership boundaries;
- whether spec/plan is current, and not treating `draft` or `superseded` as approved/current;
- whether debug receipt proves `ROOT_CAUSE_CONFIRMED` for the relevant risk;
- whether a simpler path satisfies acceptance.

## Feedback classification

Classify each item:

- `accepted`: technically correct and inside goal scope.
- `rejected`: wrong, unsafe, or out of scope; explain why.
- `needs_clarification`: needs a user decision before safe action.
- `blocked`: missing data, credentials, permission, or environment.

If feedback changes target, acceptance, constraints, non-goals, or claim boundary, return `REFRAME`; do not implement directly.

## Output

Produce a Review Record:

```text
Review Record:
- Mode:
- Target:
- Evidence basis:
- Freshness boundary:
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

- `CONTINUE`
- `NEXT_ITERATION`
- `REFRAME`
- `SIMPLIFY`
- `BLOCKED`
- `READY_FOR_VERIFY`

`READY_FOR_VERIFY` only means the work may go to `goal-verify`; it is not a completion verdict.
