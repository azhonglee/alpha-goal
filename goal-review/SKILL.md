---
name: goal-review
description: Stage skill for the goal-loop package. Challenge an active Goal Contract, iteration, diff, architecture, scope, or review feedback before verification. Use only when explicitly named by the user or selected by goal-loop; not for ordinary standalone code review outside a goal-loop workflow.
---

# Goal Review

Your job is to challenge the current direction before verification or further mutation.

Do not mutate files. Do not approve completion. Route completion claims to `goal-verify`.

## Entry

Use this skill when:

- loop evidence contradicts assumptions;
- scope expands or implementation becomes complex;
- review feedback arrives and must be classified before action;
- user feedback corrects the current framing, classification, target, or root-cause interpretation;
- current evidence leaves a material route, scope, target, or claim-boundary decision unresolved;
- debug evidence has multiple plausible root causes, weak reproduction, missing observability alignment, or a broad fix surface;
- an explicit completion-readiness review is requested or required by the router;
- `goal-iterate` returned `ITERATION_READY_FOR_REVIEW`;
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

## Subagent delegation

Do not outsource the review wholesale. Use subagents as independent reviewers when review work is high-risk, spans multiple concerns, or can be usefully checked in parallel.

Good delegation targets:

- code correctness, regressions, and missing tests;
- evidence quality and acceptance-to-evidence alignment;
- architecture, ownership boundaries, and scope creep;
- feedback classification and unresolved decisions;
- documentation or artifact freshness.

Keep each delegated review focused and read-only. Give the subagent only the scope and artifacts needed for its check, and ask for concrete findings with evidence, file/line references when applicable, open questions, and residual risk.

You remain responsible for the Review Record. Treat subagent findings as review input, not final truth: inspect the underlying artifacts, resolve conflicts between reviewers, reject unsupported claims, and make the final `Review verdict` yourself. For low-risk or narrow changes, skip subagents unless the user or repository instructions require them.

## Challenge checks

Ask:

- What assumption could be false?
- What evidence is missing or too indirect?
- Does evidence match the current Goal Contract, diff, risk tier, and claim boundary?
- Do user-facing terms, UI modules, data entities, API/RPC names, logs, and code symbols refer to the same object; if not, should the workflow `REFRAME`?
- Has any material change invalidated earlier evidence?
- What simpler solution satisfies the same acceptance?
- Has scope crossed repo, worktree, submodule, or ownership boundaries?
- Has feedback been classified instead of blindly applied?
- If an active spec exists, do Goal Contract, diff, evidence, and non-goals still align with it?
- If an active plan exists, is it current, incrementally updated, and still the smallest credible route?
- Is any stage relying on a `draft` or `superseded` artifact as if it were approved/current?
- Does the Iteration Record choose the right loop mode and provide hypothesis, evidence type, learning, and decision?
- For debug work, does the Debug Receipt prove `ROOT_CAUSE_CONFIRMED` at the right risk boundary: compact failure-path proof for low-risk local fixes, or problem-space decomposition, entity/API/log alignment, excluded material alternatives, symptom explanation, and smallest credible fix surface for non-trivial RCA? Does it correctly limit `NOT_REPRODUCED`/`BLOCKED` to diagnostic claims?

## Feedback handling

When feedback exists, classify each item:

- `accepted`: technically correct and inside goal scope.
- `rejected`: incorrect, unsafe, or out of scope; explain why.
- `needs_clarification`: cannot be implemented safely without a specific decision.
- `blocked`: cannot proceed because data, credentials, permissions, or environment are missing.

If feedback says the prior framing or root-cause interpretation is wrong, first decide whether it is an entity/target mismatch. Route accepted target corrections to `REFRAME`, not directly to implementation. Only accepted feedback that preserves the Goal Contract may route to `goal-iterate`.

## Output

Produce exactly one Review Record:

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

- `CONTINUE`: current direction remains valid.
- `NEXT_ITERATION`: more implementation or evidence is needed.
- `REFRAME`: Goal Contract, target, acceptance, or existing-work relation is wrong or incomplete.
- `SIMPLIFY`: solution is broader or more complex than acceptance requires.
- `BLOCKED`: missing decision, data, environment, or permissions prevent safe progress.
- `READY_FOR_VERIFY`: review found no blocker and completion evidence can be checked by `goal-verify`.

Route `READY_FOR_VERIFY` to `goal-verify`. Route `NEXT_ITERATION` or `SIMPLIFY` to `goal-iterate`. Route `REFRAME` to `goal-frame`. For `CONTINUE`, state the prior route in `Next`; use it only to continue an in-progress stage, never to authorize final output or completion-readiness.
