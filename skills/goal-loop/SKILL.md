---
name: goal-loop
description: Use for coding tasks that require implementation, debugging, refactoring, testing, behavior changes, complex fixes, requirements clarification, or iterative validation. 
---

# Goal Loop

## Goal Loop Principles

- Always define success first, work through evidence-driven loops, and review direction before declaring completion.

## Overview

Use one goal-driven workflow for coding work. Goal, Loop, and Review are internal stages, not independent skills. Let this `SKILL.md` control the flow.

## Required Flow

```text
Request
  ↓
Goal
  ↓
Loop
  ↓
Review when triggered
  ↓
Goal Update after loop or review evidence
  ↓
Next Loop or Final Output
```

Always start with Goal. Read `references/goal.md` the first time Goal is entered in the current turn. Re-read it when stage rules are uncertain, context was compacted, or evidence changes the Goal boundary before selecting a loop or editing.

Then run one or more Loops. Read `references/loop.md` before selecting the first loop in the current turn. Re-read it before a later loop when stage rules are uncertain, context was compacted, the loop mode changes into an unfamiliar path, or new evidence changes the execution boundary.

Run Review with `references/review.md` when:

- loop evidence contradicts assumptions
- scope expands
- implementation becomes complex
- success appears complete
- direction feels uncertain

Completion always triggers Review. Read `references/review.md` the first time Review is entered in the current turn, and re-read it when review rules are uncertain, context was compacted, or evidence changes the reviewed boundary. Do not emit the final answer until a `completion` review has verified the acceptance evidence.

Use risk-adaptive ceremony: keep low-risk work conversational when direct evidence is enough; use durable artifacts, stronger checks, and explicit review gates when risk, ambiguity, or ownership breadth increases.

Stay read-only for bounded explanation, extraction, summary, critique, risk scan, or advisory audit requests that do not require choosing behavior, mutating files, authoring durable artifacts, or claiming implementation readiness. A read-only advisory task may be completed from source, artifact, or command evidence within its stated audit boundary. Treat that output as non-gate evidence for any later implementation, readiness, or repair claim, and exit the read-only path when the user asks to implement, persist a spec or plan, repair a defect, or verify readiness.

## Stage Responsibilities

Goal defines the source of truth:

- What does success mean?
- What constraints, non-goals, and decision boundaries apply?
- What evidence would prove completion?

Loop creates evidence-driven progress:

- What hypothesis is being tested?
- What is the smallest useful action?
- What evidence was produced?
- What route should upcoming loops follow when a durable plan is needed?

Review challenges the direction:

- Are we still solving the right problem?
- Is the implementation appropriately simple?
- Is completion actually proven?

## Loop Modes

Use one loop mode at a time:

- `discovery`
- `interview`
- `debug`
- `tdd`
- `implementation`
- `refactor`
- `spike`
- `hardening`

Do not create separate top-level skills for these modes.

## Review Modes

Use one review mode at a time:

- `goal`
- `loop`
- `code`
- `architecture`
- `scope`
- `completion`

Do not create separate top-level skills for these modes.

## Completion Rule

Do not declare completion from intent, partial progress, or plausible code. Completion requires:

- every success criterion has direct evidence
- the last relevant loop is closed with evidence
- the evidence is current, claim-bound, and collected after the last material change
- a `completion` review outcome is `finish`
- remaining risks are identified

## Artifact Rules

Do not create spec or plan files by default.

Create a spec from `references/spec-template.md` when the Goal needs a durable requirements artifact: requirements were clarified through interview, scope is multi-stage, or external handoff or durable stakeholder review is expected. The mandatory completion review does not by itself require a spec file.

Create a plan from `references/plan-template.md` during Loop when execution evidence shows the work needs a durable route across multiple loops, modules, agents, risky migrations, architecture decisions, or repository, linked worktree, or submodule boundaries.

A plan is a Loop-owned execution artifact. It forecasts upcoming loops, evidence gates, and review gates. It may be updated or superseded when loop evidence changes the route. It is not part of the Goal definition and must not redefine intent, success criteria, non-goals, or decision boundaries.

Artifact status matters:

- `draft`: working state only; do not use as approved execution basis
- `reviewed`: checked for quality or readiness; not automatically approved
- `approved`: accepted by the user or clear enough within decision boundaries to execute
- `superseded`: preserved for history; do not execute without a current replacement

If file modification is disallowed, draft any needed spec or plan in the conversation only and state that no artifact file was written.

For small tasks, keep Goal, Loop, and Review in the conversation and final output only.

## Artifact Location

Use `.goal-loop/` as the repository-local runtime artifact root unless a more specific path is defined below. Make sure `.goal-loop/` is ignored in `.gitignore` to prevent accidental commits.
Use these default artifact paths relative to the owning repository root when a durable artifact is needed. If the owning repository has an existing convention for spec or plan location, prefer that convention:

- spec: `docs/design/YYYYMMDD-<slug>-spec.md`
- plan: `docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt: `.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence: `.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts: `.goal-loop/tmp/YYYYMMDD-<slug>/`

`<slug>` is a kebab-case string that describes the goal boundary, not the implementation means. Do not create empty directories before persisting the artifact.

## Final Output

For medium-risk, high-risk, or multi-step work, include:

- Goal status
- Loop evidence
- Review outcome
- Claim boundary and fresh verification evidence when claiming completion
- Remaining risks

For low-risk conversational work, compress the final output to the smallest useful form while still stating the evidence used, the claim boundary, and any meaningful remaining risk.
