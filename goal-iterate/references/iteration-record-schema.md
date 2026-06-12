# Iteration Record Schema

The Iteration Record captures one bounded implementation loop. It is not a final review.

```text
Iteration Record:
- Contract version:
- Active artifacts:
- Loop mode:
- Hypothesis:
- Evidence type:
- Debug receipt:
- Iteration goal:
- Mutation preflight:
- Action:
- Changed files:
- Local evidence:
- Learning:
- Decision:
- Acceptance delta:
- Risks introduced:
- Review needed:
- Iterate verdict:
- Next:
```

## Field definitions

### Contract version

A short reference to the Goal Contract used for this iteration. If no explicit version exists, use a timestamp or concise summary.

### Active artifacts

Spec and plan artifacts read or updated in this iteration. Use `none` when no durable artifact is active. Include path, status, and whether the iteration read, updated, created, or superseded the artifact.

### Loop mode

One of `discovery`, `debug`, `tdd`, `implementation`, `refactor`, `spike`, or `hardening`. See `references/loop-modes.md`.

### Hypothesis

The specific claim being tested by this iteration. In `debug` mode, use a compact competing-hypothesis set when multiple modules/entities/source APIs could explain the symptom; include the next discriminator or why alternatives are excluded.

### Evidence type

One of `gate_evidence`, `advisory_audit`, `exploration_only`, `delta_review`, or `evidence_audit`.

### Debug receipt

Use `none` unless `Loop mode` is `debug`. For debug, include status `ROOT_CAUSE_CONFIRMED`, `NOT_REPRODUCED`, or `BLOCKED` with symptom, reproduction or blocker, problem-space decomposition, competing hypotheses or reason omitted, probes, evidence, entity/interface/log alignment when available, root-cause statement, validation, fix surface, and decision.

### Iteration goal

The smallest acceptance-relevant change attempted in this loop.

### Mutation preflight

Summarize repo root, branch, status, worktrees, isolated edit path, baseline health, and whether mutation is allowed. If a relevant baseline check failed or could not run, record the command and scope decision.

### Action

What changed and why. Avoid long implementation narratives.

### Changed files

List only files intentionally touched by this iteration.

### Local evidence

Commands run, tests added, probes performed, diff checks, or blocker evidence.

### Learning

What the evidence proved or disproved about the hypothesis.

### Decision

Exactly one of `continue`, `pivot`, `expand`, `harden`, or `finish`.

### Acceptance delta

Which acceptance items moved from uncovered to covered, partially covered, or still uncovered.

### Risks introduced

New risk from the patch: behavior changes, compatibility issues, test gaps, concurrency concerns, migration risk, observability gaps.

### Review needed

State `yes` when complexity, scope expansion, feedback, architecture, ownership, or evidence uncertainty should route to `goal-review` before verification. Otherwise state `no` with a short reason.

### Iterate verdict

One of: `ITERATION_READY_FOR_VERIFY`, `ITERATION_READY_FOR_REVIEW`, `BLOCKED`, `REFRAME_NEEDED`.

### Next

Usually `goal-verify`; otherwise explain blocker or reframe reason.
