# Review Record Schema

The Review Record challenges a goal-loop workflow without making a final completion claim.

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

## Field definitions

### Mode

One of `goal`, `loop`, `code`, `architecture`, `scope`, `feedback`, or `completion`.

### Target

The Goal Contract, Iteration Record, diff, feedback item, architecture choice, or completion claim being reviewed.

### Evidence basis

Fresh source findings, commands, diffs, tests, logs, screenshots, loop mode evidence, Debug Receipt, or explicit blocker evidence used for the review.

If subagents were used, include their review notes or identifiers and the underlying artifacts the main agent personally checked. A subagent report without artifact evidence is a lead, not evidence by itself.

### Freshness boundary

The contract version, iteration record, changed-file set, diff or commit state, or artifact revision this review covers. A material change outside this boundary makes the review stale.

### Findings

Findings should lead with correctness, regression, missing evidence, scope, or safety concerns. Prefer concrete file/line references when reviewing code.

When findings come from subagents, state whether the main agent confirmed, rejected, or could not verify them. Resolve conflicting subagent findings before choosing a `Review verdict`.

### Feedback classification

Use `accepted`, `rejected`, `needs_clarification`, `blocked`, or `none`.

### Artifact review

State whether any active spec or plan was reviewed. Check freshness, status, alignment with Goal Contract, scope creep, and whether the plan remains incremental. Use `none` when no durable artifact exists.

### Scope/architecture notes

Record ownership boundaries, repo/worktree/submodule crossings, broad refactors, or unnecessary coupling.

### Risk tier

Use `low`, `medium`, or `high` based on blast radius and evidence needs.

### Required evidence

Checks, artifacts, loop evidence, or Debug Receipt updates needed before `goal-verify` can support a final claim.

### Review verdict

One of `CONTINUE`, `NEXT_ITERATION`, `REFRAME`, `SIMPLIFY`, `BLOCKED`, or `READY_FOR_VERIFY`.

### Next

The next stage and why.
