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

If subagents were used, include their review notes or identifiers and the underlying artifacts you personally checked. A subagent report without artifact evidence is a lead, not evidence by itself.

### Freshness boundary

The contract version, iteration record, changed-file set, diff or commit state, or artifact revision this review covers. A material change outside this boundary makes the review stale.

### Findings

Findings should lead with correctness, regression, missing evidence, scope, entity alignment, or safety concerns. Prefer concrete file/line references when reviewing code. For diagnostic work, state whether problem-space decomposition is sufficient, competing hypotheses were addressed, user-facing terms/modules/data entities/APIs/RPCs/logs/code symbols align, and the root-cause statement is validated or overclaimed; if they do not align, prefer `REFRAME` over continuing under the wrong target.

When findings come from subagents, state whether you confirmed, rejected, or could not verify them. Resolve conflicting subagent findings before choosing a `Review verdict`.

### Feedback classification

Use `accepted`, `rejected`, `needs_clarification`, `blocked`, or `none`.

### Artifact review

State whether any active spec or plan was reviewed. Check freshness, status, alignment with Goal Contract, scope creep, and whether the plan remains incremental. Use `none` when no durable artifact exists.

### Scope/architecture notes

Record ownership boundaries, repo/worktree/submodule crossings, broad refactors, unnecessary coupling, or accidental widening from a narrow submodule/entity to a broader container.

### Risk tier

Use `low`, `medium`, or `high` based on blast radius and evidence needs.

### Required evidence

Checks, artifacts, loop evidence, or Debug Receipt updates needed before `goal-verify` can support a final claim. For unresolved root-cause analysis, name the smallest missing probe, log, trace, test, or code inspection needed to distinguish remaining hypotheses.

### Review verdict

One of `CONTINUE`, `NEXT_ITERATION`, `REFRAME`, `SIMPLIFY`, `BLOCKED`, or `READY_FOR_VERIFY`.

### Next

The next stage and why.
