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
- What alternative explanation fits the evidence?
- What simpler solution satisfies the same goal?
- What risk remains untested?
- What requirement has not been matched to proof?

## Outcomes

End every review with exactly one outcome:

- `continue`: current direction remains valid
- `adjust_goal`: evidence requires goal refinement
- `restart_loop`: current loop path is invalid or exhausted
- `simplify`: current solution is over-engineered
- `redefine_goal`: intent no longer matches the user's real need
- `finish`: acceptance is directly proven

## Mode Focus

Use these focused checks when a mode is selected:

- `goal`: Is intent still valid? Are success criteria, constraints, non-goals, decision boundaries, and assumptions still accurate?
- `loop`: Are loops being closed with objective evidence and justified decisions?
- `code`: Does the implementation satisfy the current goal, follow local patterns, and cover the changed behavior with tests or runtime checks?
- `architecture`: Does the design respect module boundaries and avoid unnecessary dependencies or coupling?
- `scope`: Are we building anything outside the goal or beyond the stated success criteria?
- `completion`: Have constraints and non-goals been honored, and are unresolved risks explicitly reported?

## Completion Review

Before `finish`, verify:

- every success criterion has authoritative evidence
- every acceptance item is satisfied
- tests or runtime checks cover the changed behavior
- known risks are resolved or explicitly reported
- final output can cite goal status, loop evidence, review outcome, and remaining risks

If any item lacks direct evidence, do not finish. Choose `continue`, `adjust_goal`, `restart_loop`, or `simplify`.
