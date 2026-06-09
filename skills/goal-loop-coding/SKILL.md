---
name: goal-loop-coding
description: Use for coding tasks that require implementation, debugging, refactoring, testing, behavior changes, complex fixes, requirements clarification, or iterative validation. Use when Codex should define success first, work through evidence-driven loops, and review direction before declaring completion.
---

# Goal Loop Coding

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

Always start with Goal. Read `references/goal.md` before planning or editing.

Then run one or more Loops. Read `references/loop.md` before selecting the first loop and before executing each loop.

Run Review with `references/review.md` when:

- loop evidence contradicts assumptions
- scope expands
- implementation becomes complex
- success appears complete
- direction feels uncertain

Completion always triggers Review. Do not emit the final answer until a `completion` review has verified the acceptance evidence.

## Stage Responsibilities

Goal defines the source of truth:

- What does success mean?
- What constraints, non-goals, and decision boundaries apply?
- What evidence would prove completion?

Loop creates evidence-driven progress:

- What hypothesis is being tested?
- What is the smallest useful action?
- What evidence was produced?

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
- a `completion` review outcome is `finish`
- remaining risks are identified

## Spec And Plan Artifacts

Do not create spec or plan files by default.

Create a spec from `references/spec-template.md` when requirements were clarified through interview, scope is multi-stage, or handoff/review is expected.

Create a plan from `references/plan-template.md` when execution spans multiple modules, agents, risky migrations, or architecture decisions.

For small tasks, keep Goal, Loop, and Review in the conversation and final output only.

## Final Output

Always include:

- Goal status
- Loop evidence
- Review outcome
- Remaining risks
