---
name: evidence-verify
description: "Independent evidence comparator. Use only when artifacts, commands, logs, tests, or other fresh evidence must be judged against an explicit Goal Contract or claim boundary for completion, correctness, readiness, or safety. Do not use to plan or implement changes."
---

# Evidence Verify

Act as comparator. Completion is unproven until evidence covers every explicit requirement and claim boundary.

## Resources

Read `references/claim-boundary.md` before final/merge/ship/safety claims. Read `references/verification-verdict-schema.md` for formal verdicts.

## Inputs

Read the Goal Contract/equivalent, latest route/iteration state, diff/artifacts, command outputs, tests, logs, reviewer/user feedback, and relevant specs.
Resolve the Alpha Goal state root the same way as `$alpha-goal`: `ALPHA_GOAL_STATE_ROOT` when set; otherwise `${CODEX_HOME:-$HOME/.codex}/state/alpha-goal/<workspace-slug>/`. Derive `<workspace-slug>` from the absolute git root when available, otherwise the absolute working directory or task context; strip leading slashes, replace characters outside `[A-Za-z0-9_.-]` with `-`, keep the last 80 characters, and fallback to `workspace`. Do not require a repo root; use repo-local `.alpha-goal/` only when user/project policy explicitly requires that override. Read `<Alpha Goal state root>/YYYYMMDD-<TaskName>/evidence.md` for evidence summary. Its content is the evidence summary of the latest iteration. Check but do not trust it.

## Verification rules

- Verify against the original reference, not the work already done.
- Map every explicit requirement, named artifact, command, invariant, and deliverable to authoritative evidence.
- Match evidence scope to claim scope; narrow checks cannot prove broad claims.
- Treat missing, stale, indirect, contradicted, or merely plausible evidence as not achieved.
- Inspect whether validators/tests actually cover the requirement they are cited for.
- Do not repair during verification; route back instead.
- Final wording must not exceed the highest evidence-supported boundary.
- Do not narrow the claim as a successful outcome. If evidence cannot support the proposed claim, record the gap and return `NEXT_ITERATION`.

## Verdicts

- `PASS_TO_FINAL`: evidence proves all requirements and the proposed claim.
- `NEXT_ITERATION`: evidence does not prove the proposed claim, including when checks are missing, stale, indirect, too narrow, contradicted, unavailable because of environment/permissions/data, or show the reference/scope/claim boundary is wrong. Handoff to `$control-loop` for next iteration.

## Final response guard

Final/ready/safe/complete/repair-complete claims require durable `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` updates unless the user forbids writes, the environment is unwritable, or the task is explicitly one-turn read-only with no handoff. If chat-only, say the claim is limited to this chat evidence and no durable artifact was created. After verification, final response must state: verdict, evidence actually run/inspected, claim supported, claim not supported/not checked, residual risks, and next route when not final. Do not say complete, safe, ready, fully verified, no issues, will not happen, completely prevents, or no risk unless `PASS_TO_FINAL` supports that exact scope with scenario/negative evidence; for agent-behavior claims default to text-level risk reduction, not absolute prevention. Debug/repair claims require reproduction evidence, suspected cause, confirming evidence, fix evidence, and non-reproduction boundary; no reproduction means no repair-complete claim.

## Output

Persist `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` for risky, final, or handoff claims.

```markdown
Verification Verdict:
- Original claim:
- Claim checked:
- Indicator handoff review:
- Adaptive learning review:
- Evidence coverage:
- Unresolved user-owned decisions:
- Gap:
- Highest practical evidence-supported boundary:
- Highest supported claim:
- Unsupported portions:
- Final wording allowed:
- Final claim allowed: yes/no
- Verdict: PASS_TO_FINAL / NEXT_ITERATION
- Next route: control-loop
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
