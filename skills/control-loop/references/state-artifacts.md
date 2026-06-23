# State Artifacts

Use these schemas only when initializing, repairing, or validating loop state artifacts. State writes are checkpoints, not progress; do not normalize these files unless missing or stale state blocks authorized execution, recovery, or verification.

## Loop I/O

Use the matching task files as loop I/O:
- `goal-contract.md`: canonical goal, acceptance evidence, non-goals, authority, claim boundary, Trigger Contract, and Autonomy Level.
- `run-profile.md`: execution context only; must not expand, narrow, reinterpret, waive, or replace the goal spec.
- `loop-state.md`: durable current objective, phase, completed/pending work, risks, last verification gap, next slice, stop condition.
- `memory.md`: compressed confirmed facts, causes, constraints, working strategies, failed strategies, each with evidence, confidence, and invalidation.
- `iteration.md`: append-only run log; records what happened in the current run, not persistent current state.
- `evidence.md`: acceptance-to-evidence mapping, command/output references, defect/risk sweep surface, residual risks, unsupported or not-run checks.
- `verification.md`: latest `$goal-verify` verdict, Gap, evidence boundary, and Next route.
- `<state-root>/control-state/latest.md`: latest matching task pointer for recovery. Read it when task identity is ambiguous, and update it after binding to an `$alpha-goal`-issued Goal Contract, or after loop-state, evidence, or verification route changes.

## Run Profile

`run-profile.md` must keep this minimal shape:

```markdown
# Loop Run Profile

Goal spec: same path as Goal Contract, reference only
Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the goal spec.

Run mode: manual | scheduled | webhook | verification-triggered
Goal Contract:
Trigger event: none | schedule id | webhook id | verification gap path
Requested action: suggest | draft | modify-worktree | commit | push | open-pr | merge
Discovery source: goal-spec-only | named source authorized by goal spec/task records
External side effects allowed: none | explicit list outside approved worktree and Alpha Goal state root
Human checkpoint: none | explicit checkpoint before listed side effects or claims
Evaluator route: $goal-verify before final claim | named evaluator plus $goal-verify
Autonomy level: L1 Suggest only | L2 Draft changes | L3 Modify worktree | L4 Open PR | L5 Merge automatically
```

`Goal spec` is a compatibility alias/reference only. Goal Contract remains canonical.

## Loop State

`loop-state.md` must keep this minimal shape:

```markdown
# Loop State
Current Objective:
Current Phase: DISCOVERY | IMPLEMENTATION | HARDENING | VERIFICATION | FINAL_RESPONSE_READY | COMPLETE | BLOCKED
Completed:
Pending:
Known Risks:
Last Verification Gap:
Next Slice:
Stop Condition:
```

## Memory

`memory.md` must keep this minimal shape:

```markdown
# Loop Memory
Confirmed Facts:
Confirmed Root Causes:
Known Constraints:
Working Strategies:
Failed Strategies:
```

Durable memory entries are added only when reusable and evidence-backed; each non-empty entry includes Evidence, Confidence, and Invalidation.

## Latest Pointer

`control-state/latest.md` shape:

```markdown
# Control State Latest
State directory:
Goal Contract:
Run Profile:
Loop State:
Memory:
Evidence:
Verification:
Current Phase:
Next route:
Updated at:
```

## Iteration

`iteration.md` shape:

```markdown
Iteration Summary

| Field | Value |
| --- | --- |
| Action | |
| Feedback | |
| Residual error | |
| Artifact | |
| Next State | |
```
