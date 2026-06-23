---
name: evidence-verify
description: "Independent evidence comparator. Use only when artifacts, commands, logs, tests, or other fresh evidence must be judged against an explicit Goal Contract or claim boundary for completion, correctness, readiness, or safety. Do not use to plan or implement changes."
---

# Evidence Verify

Act as comparator. Completion is unproven until evidence covers every explicit requirement and claim boundary.

Use subagents for supporting evidence review; evidence-verify owns the final verdict.

## Resources

Read `references/claim-boundary.md` before final/merge/ship/safety claims. Read `references/verification-verdict-schema.md` for formal verdicts.

Resolve the Alpha Goal state root the same way as `$alpha-goal`: always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

Read the Goal Contract/equivalent, latest `loop-state.md`, `iteration.md`, `evidence.md`, diff/artifacts, command outputs, tests, logs, reviewer/user feedback, and relevant specs. Check but do not trust summaries.

Read `run-profile.md` when present, referenced, or required by control-loop evidence. Treat it as execution context only, never as the Goal Contract. For cross-repo claims, read the repo manifest and per-repo plus integration evidence from the same task-level state root.

## Verification rules

- Verify against the original reference, not the work already done.
- Map every explicit requirement, named artifact, command, invariant, and deliverable to authoritative evidence.
- Match evidence scope to claim scope; narrow checks cannot prove broad claims.
- Treat missing, stale, indirect, contradicted, or merely plausible evidence as not achieved.
- Inspect whether validators/tests actually cover the requirement they are cited for.
- For cross-repo claims, map evidence by repo surface and integration relation; one repo's passing checks cannot prove integrated behavior.
- Version pins, generated clients, API contracts, dependent app behavior, and delivery links must be evidenced when the claim depends on them.
- Do not repair during verification; route back instead.
- Final wording must not exceed the highest evidence-supported boundary.
- Do not narrow the claim as a successful outcome. If evidence cannot support the proposed claim, record the gap and return `NEXT_ITERATION`.
- A run profile cannot expand, narrow, reinterpret, waive, or replace Goal Contract scope, authority, acceptance evidence, non-goals, Trigger Contract, Autonomy level, or claim boundary. On conflict, verify against the Goal Contract and route back.
- Missing evidence for run-profile checkpoints, named evaluators, evaluator route, trigger behavior, autonomy gate, required loop-state updates, or required memory updates is a gap for handoff or final claims.

## Verdicts

- `PASS_TO_FINAL`: evidence proves all requirements and the proposed claim.
- `NEXT_ITERATION`: evidence does not prove the proposed claim. Choose next route by the Gap:
  - `control-loop` only for fixable evidence, test, edge, compatibility, cleanup, loop-state, memory, or verification-gap hardening inside the same goal.
  - `alpha-goal` when target, scope, authority, source reference, Trigger Contract, Autonomy level, or claim boundary is wrong or unclear.
  - `BLOCKED` when permission, tool, data, environment, credential, or user-owned decision is missing.

The Gap must be specific enough for `$control-loop` to set `loop-state.md` Next Slice without reinterpreting the Goal Contract.

## Final response guard

Final/ready/safe/complete/repair-complete claims require durable `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` updates unless the user forbids writes, the environment is unwritable, or the task is explicitly one-turn read-only with no handoff.

After verification, final response must state: verdict, evidence actually run/inspected, claim supported, claim not supported/not checked, residual risks, and next route when not final.

Do not say complete, safe, ready, fully verified, no issues, will not happen, completely prevents, or no risk unless `PASS_TO_FINAL` supports that exact scope with scenario/negative evidence.

Debug/repair claims require reproduction evidence, suspected cause, confirming evidence, fix evidence, and non-reproduction boundary; no reproduction means no repair-complete claim.

## Output

Persist `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` for risky, final, or handoff claims.

```markdown
Verification Verdict:
- Original claim:
- Claim checked:
- Indicator handoff review:
- Adaptive learning review:
- Loop state review:
- Memory review:
- Repo surface coverage:
- Evidence coverage:
- Unresolved user-owned decisions:
- Gap:
- Highest practical evidence-supported boundary:
- Highest supported claim:
- Unsupported portions:
- Final wording allowed:
- Final claim allowed: yes/no
- Verdict: PASS_TO_FINAL / NEXT_ITERATION
- Next route: control-loop / alpha-goal / BLOCKED
```

TUI summary:

```markdown
Verification Summary

| Field | Value |
| --- | --- |
| Claim | |
| Evidence | |
| Gaps | |
| Verdict | |
| Next | |
```
