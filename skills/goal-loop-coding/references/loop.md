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
- `interview`: run a Socratic one-question-at-a-time clarification loop to resolve Goal ambiguity
- `debug`: reproduce, isolate, and explain a failure
- `tdd`: write or adjust a failing test before implementation
- `implementation`: make the smallest code change that advances a validated goal
- `refactor`: simplify structure while preserving behavior with evidence
- `spike`: test feasibility with throwaway or clearly bounded code
- `hardening`: add edge cases, coverage, performance checks, docs, or cleanup

Respect explicit user constraints. If the user asks for read-only analysis or says not to modify files, treat `tdd`, `implementation`, `refactor`, and `hardening` loops as dry-run analysis only.

For `interview` loops:

- ask exactly one high-leverage question per round
- target the weakest Goal field first, with priority: intent, outcome, scope, non-goals, decision boundaries, constraints, success criteria
- use follow-up pressure on the latest answer before changing topics when the answer is still vague
- prefer evidence-backed confirmation questions after brownfield discovery
- record each round as evidence: target field, question, answer, learning, and remaining ambiguity
- use structured user-input tooling when available; otherwise use a concise one-question turn
- close the loop only when the missing Goal fields are filled or residual ambiguity is recorded as risk

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

If no decision fits, gather stronger evidence before closing the loop.

## Execution Rules

- Run one loop at a time.
- Prefer the smallest action that can change what is known.
- Do not start broad implementation before enough discovery exists.
- For bugs, reproduce or explain the failure before fixing when feasible.
- If reproduction is infeasible, record why, cite source-level evidence, and do not choose `finish` until runtime or test evidence exists.
- For behavior changes, prefer tests or executable validation around the changed behavior.
- Update the goal when loop evidence changes assumptions, risks, constraints, success criteria, or acceptance.

Iterate the loop until you 100% confident in these artifacts.

## Loop Quality Checklist

Before closing a loop, verify:

- objective is clear
- mode fits the objective
- hypothesis is specific
- action is minimal but sufficient
- evidence is recorded, not inferred
- learning connects evidence back to the hypothesis
- exactly one decision is selected

## Compact Example

```yaml
loop:
  id: 1
  mode: discovery
  objective: Determine whether the existing exporter can support xlsx output.
  hypothesis: The current csv exporter has reusable extension points.
  action: Inspect exporter code and related tests.
  evidence:
    - source: src/export/csv_exporter.ts
      finding: output formatting is hard-coded to comma-separated rows
  learning: xlsx support needs a separate formatter or abstraction.
  decision: pivot
  goal_update:
    changed: risks
    reason: existing exporter is less reusable than assumed
    evidence: loop 1 source finding
```

## Exit Criteria

A loop is complete only when:

- evidence exists
- learning is stated
- one decision is selected
- the next loop, review trigger, or finish path is clear

No evidence means the loop is not closed.
