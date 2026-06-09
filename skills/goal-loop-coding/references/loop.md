# Loop Stage

## Purpose

Move toward the goal through closed, evidence-producing iterations.

Loop answers:

- What hypothesis is being tested?
- What action can validate it with the least useful work?
- What evidence was produced?
- What decision follows from that evidence?

## Loop Model

Every loop must produce:

```yaml
loop:
  id:
  mode:
  objective:
  hypothesis:
  action:
  evidence:
  learning:
  decision:
  goal_update:
```

## Modes

Use one mode per loop:

- `discovery`: inspect the repository, applicable `AGENTS.md` files, dirty worktree state, current behavior, logs, or requirements
- `debug`: reproduce, isolate, and explain a failure
- `tdd`: write or adjust a failing test before implementation
- `implementation`: make the smallest code change that advances a validated goal
- `refactor`: simplify structure while preserving behavior with evidence
- `spike`: test feasibility with throwaway or clearly bounded code
- `hardening`: add edge cases, coverage, performance checks, docs, or cleanup

Respect explicit user constraints. If the user asks for read-only analysis or says not to modify files, treat `tdd`, `implementation`, `refactor`, and `hardening` loops as dry-run analysis only.

## Evidence

Acceptable evidence includes:

- source findings with file references
- failing or passing test output
- runtime behavior
- logs or traces
- benchmark or performance output
- rendered UI or screenshot verification
- static analysis or type-check output

For CLI behavior, capture the command, exit code, stdout, stderr, and relevant side effects. Regression tests should assert exit code and the appropriate output stream.

Unacceptable evidence:

- intuition
- preference
- unverified assumptions
- code changes without validation

## Decisions

Close every loop with exactly one decision:

- `continue`: evidence supports the current direction
- `pivot`: evidence invalidates the current direction
- `expand`: the goal remains valid but required scope grew
- `harden`: core behavior works but risk remains
- `finish`: acceptance appears satisfied and completion review can run

## Execution Rules

- Run one loop at a time.
- Prefer the smallest action that can change what is known.
- Do not start broad implementation before enough discovery exists.
- For bugs, reproduce or explain the failure before fixing when feasible.
- If reproduction is infeasible, record why, cite source-level evidence, and do not choose `finish` until runtime or test evidence exists.
- For behavior changes, prefer tests or executable validation around the changed behavior.
- Update the goal when loop evidence changes assumptions, risks, constraints, success criteria, or acceptance.

## Exit Criteria

A loop is complete only when:

- evidence exists
- learning is stated
- one decision is selected
- the next loop, review trigger, or finish path is clear

No evidence means the loop is not closed.
