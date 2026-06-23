---
name: goal-verify
description: "Independent goal verifier and defect/risk reviewer. Use when completion, readiness, safety, repair, PR-ready, review, audit, or loophole-finding claims must be judged against a Goal Contract, fresh evidence, and material unclaimed defects or risks. Do not plan or implement changes."
---

# Goal Verify

Act as an independent evaluator, not the executor. A final claim is unproven until both lenses pass:

1. Goal satisfaction: evidence covers the explicit Goal Contract, acceptance evidence, constraints, non-goals, run-profile checkpoints, and proposed claim.
2. Defect/risk sweep: review the authorized surface for material unclaimed defects, regressions, unsafe old paths, scope drift, and unsupported risk claims.

Use subagents for supporting review, risk, or evidence passes when useful; `goal-verify` owns the final verdict.

## Resources

Read `references/claim-boundary.md` before final/merge/ship/safety claims. Read `references/defect-risk-rubric.md` for review, audit, loophole-finding, high-risk, cross-module, replacement, security, migration, or PR-ready checks. Read `references/verification-verdict-schema.md` for formal verdicts.

Resolve the Alpha Goal state root the same way as `$alpha-goal`: always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.

Read canonical state-root Goal Contract, latest `loop-state.md`, `iteration.md`, `evidence.md`, `verification.md`, diff/artifacts, command outputs, tests, logs, reviewer/user feedback, and specs. Check but do not trust summaries.

Read `run-profile.md` when present, referenced, or required by control-loop evidence. Treat it as execution context only, never as the Goal Contract. For cross-repo claims, read the repo manifest and per-repo plus integration evidence from the same task-level state root.

## Verification rules

- Verify against the original reference, not the work already done.
- Set Review mode: completion | readiness | repair | review | audit | safety | loophole-finding | PR-ready.
- Build the checked surface from the Goal Contract, authorized repo surfaces, final diff, touched files, adjacent call paths, old/prohibited paths, run-profile side effects, specs, and reviewer/user feedback.
- Map every explicit requirement, named artifact, command, invariant, deliverable, non-goal, and acceptance evidence item to authoritative evidence, coverage, gap, and verdict.
- Match evidence scope to claim scope; narrow checks cannot prove broad claims.
- Treat missing, stale, indirect, contradicted, or merely plausible evidence as not achieved.
- Inspect whether validators/tests actually cover the requirement or risk they are cited for.
- For review, audit, safety, PR-ready, or loophole-finding tasks, material unclaimed issues are first-class gaps even when the final claim text does not mention them.
- Do not ignore material defects because they are outside the proposed claim. Classify them as same-goal fixable, scope/authority-changing, blocked, or advisory.
- Distinguish `no material issue found in checked surface` from `not checked`. Unchecked material surfaces are gaps or residual risks, not proof.
- For replace, remove, disable, migrate, forbid, no-fallback, or security semantics, require positive evidence for the intended behavior and negative evidence that old/prohibited behavior is not reachable on default or realistic paths.
- For cross-repo claims, map evidence and risk by repo surface and integration relation; one repo's passing checks cannot prove integrated behavior.
- Version pins, generated clients, API contracts, dependent app behavior, data migration, rollback, delivery links, credentials, privacy, and security claims must be evidenced when the goal depends on them.
- A verification used for `verification-triggered` recovery must bind to the checked Goal Contract, loop-state artifact, and evidence artifact; stale or cross-task bindings are gaps.
- Do not repair during verification; route back instead.
- Final wording must not exceed the highest evidence-supported boundary.
- Do not narrow the claim as a successful outcome. If evidence or defect/risk sweep cannot support the proposed claim, record the gap and return `NEXT_ITERATION`.
- A run profile cannot expand, narrow, reinterpret, waive, or replace Goal Contract scope, authority, acceptance evidence, non-goals, Trigger Contract, Autonomy level, or claim boundary. On conflict, verify against the Goal Contract and route back.
- Missing evidence for run-profile checkpoints, named evaluators, evaluator route, trigger behavior, autonomy gate, required loop-state updates, required memory updates, or required defect/risk sweep is a gap for handoff or final claims.

## Verdicts

- `PASS_TO_FINAL`: evidence proves goal satisfaction and the defect/risk sweep found no material unhandled issue in the checked surface; next route is `none`.
- `NEXT_ITERATION`: goal satisfaction, evidence coverage, claim boundary, or defect/risk sweep does not prove the proposed final state. Choose next route by the Gap:
  - `control-loop` only for same-goal fixable evidence, test, edge, compatibility, cleanup, loop-state, memory, defect/risk, or verification-gap hardening.
  - `alpha-goal` when target, scope, authority, source reference, acceptance evidence, non-goal, decision boundary, actuator boundary, Trigger Contract, Autonomy level, claim boundary, or required review surface is wrong or unclear.
  - `BLOCKED` when permission, tool, data, environment, credential, or user-owned decision is missing.

The Gap must be specific enough for `$control-loop` to set `loop-state.md` Next Slice without reinterpreting the Goal Contract.

## Final response guard

Final/ready/safe/complete/repair-complete/PR-ready/no-issues claims require durable `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` updates unless the user forbids writes, the environment is unwritable, or the task is explicitly one-turn read-only with no handoff. If chat-only, say the claim is limited to chat evidence and do not make broad ready/safe/complete/no-issues claims.

After verification, final response must state: verdict, evidence actually run/inspected, checked surface, defect/risk sweep result, claim supported, claim not supported/not checked, residual risks, and next route when not final.

Do not say complete, safe, ready, fully verified, no issues, will not happen, completely prevents, or no risk unless `PASS_TO_FINAL` supports that exact scope with scenario/negative evidence and defect/risk sweep coverage.

Debug/repair claims require reproduction evidence, suspected cause, confirming evidence, fix evidence, and non-reproduction boundary; no reproduction means no repair-complete claim.

## Output

Persist `<Alpha Goal state root>/YYYYMMDD-<TaskName>/verification.md` for risky, final, review/audit, or handoff claims.

```markdown
Verification Verdict:
- Goal Contract:
- Loop State:
- Evidence:
- Verified at:
- Review mode:
- Original claim:
- Claim checked:
- Goal satisfaction review:
- Defect/risk sweep:
- Unclaimed issues found:
- Negative/abuse cases checked:
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
- Next route: none / control-loop / alpha-goal / BLOCKED
```

TUI summary:

```markdown
Verification Summary

| Field | Value |
| --- | --- |
| Review mode | |
| Checked surface | |
| Claim | |
| Evidence | |
| Defect/risk sweep | |
| Unclaimed issues | |
| Gaps | |
| Verdict | |
| Next | |
```
