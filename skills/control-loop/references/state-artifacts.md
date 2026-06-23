# State Artifacts

Use this schema only when initializing, repairing, or validating `checkpoint.md` or the global latest pointer. State writes are checkpoints, not progress; do not normalize state unless missing or stale state blocks authorized execution, recovery, durable evidence handoff, or verification.

## Loop I/O

Use the matching task files as loop I/O:
- `goal-contract.md`: canonical accepted goal, contract status, discovery notes, interview ledger, acceptance evidence, non-goals, authority, claim boundary, and Autonomy Level.
- `checkpoint.md`: conditional task checkpoint that may contain run profile, loop state, memory, iteration, evidence, and verification sections.
- `<state-root>/control-state/latest.md`: optional global recovery index used only to find the latest accepted task when task identity is ambiguous.

`checkpoint.md` is required only for external side effects, actions above L3, human checkpoints, multi-iteration recovery, durable evidence handoff, or persisted verification.

## Checkpoint

`checkpoint.md` must keep this minimal shape when any section is required:

```markdown
# Goal Checkpoint

Goal Contract:
Updated at:

## Run Profile
Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the Goal Contract.
Requested action: suggest | draft | modify-worktree | commit | push | open-pr | merge
Discovery source: goal-spec-only | named source authorized by Goal Contract/task records
External side effects allowed: none | explicit list outside approved worktree and Alpha Goal state root
Human checkpoint: none | explicit checkpoint before listed side effects or claims
Evaluator route: $goal-verify before final claim | named evaluator plus $goal-verify
Autonomy level: L1 Suggest only | L2 Draft changes | L3 Modify worktree | L4 Open PR | L5 Merge automatically

## Loop State
Current Objective:
Current Phase: IMPLEMENTATION | HARDENING | VERIFICATION | FINAL_RESPONSE_READY | COMPLETE | BLOCKED
Completed:
Pending:
Known Risks:
Last Verification Gap:
Next Slice:
Stop Condition:

## Memory
Confirmed Facts:
Confirmed Root Causes:
Known Constraints:
Working Strategies:
Failed Strategies:

## Iteration
| Field | Value |
| --- | --- |
| Action | |
| Feedback | |
| Residual error | |
| Artifact | |
| Next State | |

## Evidence
Acceptance-to-evidence:
Command/output references:
Defect/risk sweep surface:
Residual risks:
Unsupported or not-run checks:

## Verification
Use the base `Verification Verdict` schema from `skills/goal-verify/references/verification-verdict-schema.md`. Checkpoint persistence must keep these binding fields:
- Goal Contract:
- Evidence:
- Verified at:
- Review mode:
- Gap:
- Verdict: PASS_TO_FINAL | NEXT_ITERATION
- Next route: none | control-loop | alpha-goal | BLOCKED
```

Omit unused sections. Durable memory entries are only reusable and evidence-backed; each non-empty entry includes Evidence, Confidence, and Invalidation.

## Latest Pointer

`<state-root>/control-state/latest.md` is not stage content. Keep only the recovery index:

```markdown
# Control State Latest
State directory:
Goal Contract:
Checkpoint: none | path
Current Phase:
Next route:
Updated at:
```

If present, it must bind to accepted Goal Contract and checkpoint if any. Stale or cross-task pointers are ignored for discovery and blocked for execution recovery.
