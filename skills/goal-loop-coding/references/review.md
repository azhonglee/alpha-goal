# Review Stage

## Purpose

Challenge whether the current direction still serves the goal.

Review answers:

- Are we solving the right problem?
- Is the evidence strong enough?
- Has scope drifted?
- Is the solution simpler than the problem requires?
- Is completion actually proven?

## Run Review When

Run Review when:

- loop evidence contradicts assumptions
- scope expands
- implementation becomes complex
- success appears complete
- direction feels uncertain
- repeated loops stop producing new evidence
- plan, spec, or review evidence is stale, mismatched, blocked, or contradicted
- review feedback arrives and must be evaluated before acting

## Review Model

Every review must produce:

```yaml
review:
  mode:
  target:
  observations:
  challenges:
  findings:
  recommendations:
  claim_boundary:
  evidence_basis:
  fresh_evidence:
  unresolved_gaps:
  outcome:
  goal_update:
```

## Modes

Use one mode per review:

- `goal`: validate intent, success criteria, constraints, non-goals, and decision boundaries
- `loop`: validate hypothesis quality, evidence quality, and loop decisions
- `code`: inspect correctness, maintainability, tests, and regressions
- `architecture`: inspect boundaries, coupling, scalability, and fit to goal
- `scope`: detect scope creep, hidden requirements, and accidental complexity
- `completion`: prove or reject that acceptance is satisfied

## Challenge Questions

Ask the relevant questions before deciding:

- What assumption could be false?
- What evidence is missing or too indirect?
- Does the evidence match the current Goal, artifact revision, diff, and claim boundary?
- What alternative explanation fits the evidence?
- What simpler solution satisfies the same goal?
- What risk remains untested?
- What requirement has not been matched to proof?
- Has any material change invalidated earlier evidence?

## Outcomes

End every review with exactly one outcome:

- `continue`: current direction remains valid
- `adjust_goal`: evidence requires goal refinement
- `restart_loop`: current loop path is invalid or exhausted
- `simplify`: current solution is over-engineered
- `redefine_goal`: intent no longer matches the user's real need
- `blocked`: a conflict, missing evidence, unsafe boundary, or unresolved review item prevents progress
- `finish`: acceptance is directly proven

## Mode Focus

Use these focused checks when a mode is selected:

- `goal`: Is intent still valid? Are success criteria, constraints, non-goals, decision boundaries, and assumptions still accurate?
- `loop`: Are loops being closed with objective evidence and justified decisions?
- `code`: Does the implementation satisfy the current goal, follow local patterns, and cover the changed behavior with tests or runtime checks?
- `architecture`: Does the design respect module boundaries and avoid unnecessary dependencies or coupling?
- `scope`: Are we building anything outside the goal or beyond the stated success criteria?
- `completion`: Have constraints and non-goals been honored, and are unresolved risks explicitly reported?

## Evidence Freshness

Review evidence must be current and bound to the exact target:

- source or artifact revision under review
- task, loop, batch, diff, or claim boundary
- risk tier and evidence floor
- command or artifact evidence collected after the last material change
- unresolved concerns, or `none`

Do not use natural-language confidence, stale logs, old test output, advisory audit, delegated output, or review approval as completion evidence unless it is backed by reproducible commands or inspected artifacts with scope match.

## Completion Review

Before `finish`, verify:

- every success criterion has authoritative evidence
- every acceptance item is satisfied
- the claim boundary is explicit and matches the current Goal/spec/plan boundary
- fresh evidence was collected after the last material code, test, artifact, requirement, or behavior change
- verification can run in the target final state and does not depend on deleted paths, self-matching greps, pre-change layout checks, or mock-only checks that miss the claim
- tests or runtime checks cover the changed behavior
- risk-tier evidence requirements are met or explicitly reported as blocked
- known risks are resolved or explicitly reported
- final output can cite goal status, loop evidence, claim boundary, fresh evidence, review outcome, and remaining risks

If any item lacks direct evidence, do not finish. Choose `continue`, `adjust_goal`, `restart_loop`, `simplify`, or `blocked`.

## Review Feedback

When review feedback exists:

- read the complete feedback before reacting
- clarify partially understood or ambiguous feedback before implementation
- classify each item as `accepted`, `rejected`, `needs_clarification`, or `blocked`
- implement only technically correct feedback that remains inside Goal scope
- provide reasoned pushback for wrong, unsafe, or out-of-scope feedback
- verify accepted changes with focused evidence before using them for completion
- keep unresolved or disputed feedback as a blocker or Conflict Report

Do not blindly implement suggestions. Do not treat reviewer approval as verification evidence without fresh verification.

## Conflict Report

When repository rules, user goals, Goal/spec/plan requirements, safety boundaries, review feedback, or actual evidence conflict, stop the affected operation and report the smallest decision needed:

- **Conflict:** two incompatible facts, goals, instructions, or requirements
- **Affected action:** edit, review, verification, delegation, or decision that cannot safely continue
- **Evidence:** file path, command output, artifact revision, or observed behavior proving the conflict
- **Needed decision:** the minimal user or controller decision required to unblock
