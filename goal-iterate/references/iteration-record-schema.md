# Iteration Record Schema

The Iteration Record captures one bounded implementation loop. It is not a final review.

```text
Iteration Record:
- Contract version:
- Iteration goal:
- Mutation preflight:
- Action:
- Changed files:
- Local evidence:
- Acceptance delta:
- Risks introduced:
- Review needed:
- Iterate verdict:
- Next:
```

## Field definitions

### Contract version

A short reference to the Goal Contract used for this iteration. If no explicit version exists, use a timestamp or concise summary.

### Iteration goal

The smallest acceptance-relevant change attempted in this loop.

### Mutation preflight

Summarize repo root, branch, status, worktrees, isolated edit path, and whether mutation is allowed.

### Action

What changed and why. Avoid long implementation narratives.

### Changed files

List only files intentionally touched by this iteration.

### Local evidence

Commands run, tests added, probes performed, diff checks, or blocker evidence.

### Acceptance delta

Which acceptance items moved from uncovered to covered, partially covered, or still uncovered.

### Risks introduced

New risk from the patch: behavior changes, compatibility issues, test gaps, concurrency concerns, migration risk, observability gaps.

### Review needed

State `yes` when complexity, scope expansion, feedback, architecture, ownership, or evidence uncertainty should route to `goal-review` before verification. Otherwise state `no` with a short reason.

### Iterate verdict

One of: `ITERATION_READY_FOR_VERIFY`, `BLOCKED`, `REFRAME_NEEDED`.

### Next

Usually `goal-verify`; otherwise explain blocker or reframe reason.
