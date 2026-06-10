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
  risk_tier:
  evidence_type:
  evidence:
  learning:
  decision:
  claim_boundary:
  blocker:
  goal_update:
```

## Modes

Use one mode per loop:

- `discovery`: inspect the repository, worktree/subrepo boundaries, applicable `AGENTS.md` files, dirty worktree state, current behavior, logs, or requirements
- `interview`: run a Socratic one-question-at-a-time clarification loop to resolve Goal ambiguity
- `debug`: reproduce, isolate, and explain a failure
- `tdd`: write or adjust a failing test before implementation
- `implementation`: make the smallest code change that advances a validated goal
- `refactor`: simplify structure while preserving behavior with evidence
- `spike`: test feasibility with throwaway or clearly bounded code
- `hardening`: add edge cases, coverage, performance checks, docs, or cleanup

Respect explicit user constraints. If the user asks for read-only analysis or says not to modify files, treat `tdd`, `implementation`, `refactor`, and `hardening` loops as dry-run analysis only.

Read-only loops may produce `advisory_audit` or `exploration_only` evidence. These outputs can inform Goal, Plan, or Review, but they are non-gate evidence and cannot by themselves prove implementation readiness or completion.

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

Evidence types:

- `gate_evidence`: evidence intended to satisfy a Goal, plan, review, or completion gate
- `advisory_audit`: bounded observations, critique, or risk scan; non-gate
- `exploration_only`: discovery map or source inventory; non-gate
- `delta_review`: narrow follow-up on a reviewed finding; only valid when the original same-boundary gate evidence remains current
- `evidence_audit`: independent audit of existing evidence; supports judgment but does not replace controller judgment

Gate evidence must match the exact task, batch, diff, artifact, or claim boundary. Re-run affected checks after code, test, requirement, behavior, artifact, or material evidence changes.

Unacceptable evidence:

- intuition
- preference
- unverified assumptions
- code changes without validation
- stale evidence from before the last material change
- review approval without fresh verification when claiming completion

## Risk-Tiered Evidence

Set or update `risk_tier` before mutating work and before claiming readiness:

| Tier | Work | Evidence floor |
| --- | --- | --- |
| `low` | No behavior or public contract impact; bounded docs, wording, prompt, or mechanical local edits | self-check, ownership/scope evidence, focused artifact or command evidence |
| `medium` | Bounded behavior, integration, CLI, UI, migration-free data handling, or maintainability change without high-risk triggers | requirement-compliance evidence, focused tests/checks, and code or architecture review when integration, maintainability, or merge-readiness risk exists |
| `high` | Security, destructive or remote state, production/compliance/PII, public API or external contract, persisted schema/metadata, billing, permissions, tenant isolation, or irreversible/high-blast-radius behavior | strict requirement-compliance evidence, broad enough integration or whole-diff verification, explicit review, and rollback/recovery evidence or a reported blocker |

Risk tiers change the evidence floor only. They do not bypass Goal clarity, repository ownership boundaries, destructive confirmation, or completion review.

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
- For bugs, capture the smallest reproducible symptom or explain why reproduction is infeasible before fixing.
- If reproduction is infeasible, record why, cite source-level evidence, and do not choose `finish` until runtime or test evidence exists.
- Do not patch from a plausible but unconfirmed root cause. A fix requires root-cause evidence or an explicit diagnostic/no-fix claim.
- Track failed fix attempts and assumptions for the same failure thread. After three failed attempts on the same thread, stop patching and run `architecture`, `scope`, or `goal` review before further fixes.
- For behavior changes, prefer tests or executable validation around the changed behavior.
- Update the goal when loop evidence changes assumptions, risks, constraints, success criteria, or acceptance.

Iterate until completion review can cite direct evidence for the relevant success criteria and acceptance items.

## Debug Receipt

Close a `debug` loop with one diagnostic status:

- `ROOT_CAUSE_CONFIRMED`: concrete evidence identifies the first divergence point and the smallest credible fix surface
- `NOT_REPRODUCED`: reproduction was attempted and not observed; do not treat the issue as fixed
- `BLOCKED`: missing logs, commands, files, environment, or scope prevent a defensible diagnosis

Only `ROOT_CAUSE_CONFIRMED` authorizes a fix loop. `NOT_REPRODUCED` may support a bounded diagnostic/no-fix claim only when the scope boundary, no-fix rationale, risk or acceptance impact, and expected fresh evidence are recorded.

## Plan Artifact

Use `plan-template.md` only when loop evidence shows execution needs a durable route across multiple loops, modules, agents, risky migrations, architecture decisions, or repository/worktree/submodule boundaries.

A plan is a forecast for upcoming loops, not a Goal component. Goal and spec define what must be true; the plan describes how the next loops are expected to get there.

Rules:

- Create a plan from discovery, interview, debug, spike, or architecture evidence, not from preference.
- Keep the plan tied to a Goal or spec, but do not let it redefine intent, success criteria, non-goals, decision boundaries, or acceptance.
- Treat the plan as versioned and provisional. Update it when evidence changes loop order, strategy, repository boundaries, risks, verification, rollback, or review gates.
- Supersede the plan when its route no longer matches the evidence. Record the loop evidence that caused the supersession.
- Treat substantive plan changes as invalidating previous plan review or readiness evidence until the changed boundary is reviewed again.
- If a loop completes without changing the route, record that the plan remains valid rather than rewriting it.
- If no durable route is needed, keep the next loop decision in the loop record and do not create a plan artifact.

Plan readiness checks:

- repository-grounded source alignment
- explicit file ownership and task boundaries
- task dependencies and parallel-safety when multiple loops or agents are expected
- risk tier, evidence floor, and high-risk trigger scan
- target-final-state verification that can run after the change exists
- placeholder scan for vague tasks such as `add validation`, `handle errors`, `update tests`, `implement logic`, `TBD`, or `TODO`

## Worktree And Subrepo Boundaries

Before modifying files, identify:

- repository root
- current branch
- whether the current directory is a linked worktree
- dirty worktree state
- owning git root for every touched path, compared with the primary repository root
- nested git repositories or submodules under touched paths
- applicable `AGENTS.md` files for every touched path
- for each affected nested repo or submodule: root, branch or detached HEAD, dirty state, and applicable `AGENTS.md` files

Rules:

- Do not assume parent repository rules apply inside a nested repository.
- Do not modify files across repository or worktree boundaries unless the user explicitly requested or confirmed that cross-boundary change after the boundaries were identified.
- Treat submodules, nested `.git` directories, and vendored checkouts as separate ownership boundaries.
- If a required change crosses into a subrepo, run a separate Goal/Loop check for that boundary.
- Before mutating work, capture baseline evidence for the active repository: branch, dirty state, linked worktree state, and the smallest relevant existing health check when available.
- If baseline health fails, report the failing command and decide whether it is in scope before treating later failures as regressions.
- Mention cross-boundary edits in the final output.

## Delegation Boundary

When using another agent or thread for a bounded loop, provide a self-contained packet: task id, exact scope, working directory, ownership surface, current Goal/spec/plan evidence, constraints, expected evidence, verification command or test shape, and return contract.

Parallel work is allowed only when ownership is independent, shared files or generated outputs are not contested, and no task depends on another task's unreviewed output.

Handle delegated receipts before using them:

- `DONE`: inspect changed files, ownership compliance, verification, and self-review before accepting
- `DONE_WITH_CONCERNS`: classify and resolve correctness, scope, ownership, or verification concerns before review
- `NEEDS_CONTEXT`: provide bounded context only if still inside Goal scope; otherwise adjust Goal or plan
- `BLOCKED`: classify the blocker before retrying; add evidence, split scope, report conflict, or change capability only when that can plausibly help

Subagent or delegated output never bypasses Goal, Loop, Review, risk-tiered evidence, or fresh completion evidence.

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
  risk_tier: medium
  evidence_type: exploration_only
  evidence:
    - source: src/export/csv_exporter.ts
      finding: output formatting is hard-coded to comma-separated rows
  learning: xlsx support needs a separate formatter or abstraction.
  decision: pivot
  claim_boundary: xlsx export feasibility only
  blocker: none
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
