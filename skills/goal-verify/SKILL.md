---
name: goal-verify
description: "Compare execution evidence against an accepted Goal Contract and produce a routing verdict. Never redefine authority, scope, or acceptance."
---

# Goal Verify

## Mission
goal-verify owns verification authority.

goal-verify compares collected evidence against an accepted Goal Contract.
When reading task evidence, resolve Alpha Goal state root as `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`, where `<workspace-slug>` is `slug(repo_root or Goal Contract target workspace)`.

goal-verify does not:
- redefine target
- redefine scope
- redefine acceptance evidence
- redefine non-goals
- redefine authority

goal-verify produces only:
- PASS_TO_FINAL
- NEXT_ITERATION
- BLOCKED
- RETURN_TO_ALPHA_GOAL

## Verification Model
```text
Evidence
        │
        ▼
Evidence Classification
        │
        ▼
Gap Analysis
        │
        ▼
Gap Classification
        │
        ▼
Route Decision
```

## Core Principle
1. Verification compares evidence.
2. Verification does not compare effort.
3. Verification does not compare intent.
4. Verification does not compare implementation size.

## Evidence Classification
Classify evidence before comparison.

Evidence Types：
- [from-test]
- [from-build]
- [from-runtime]
- [from-review]
- [from-inspection]
- [from-user-validation]
- [from-observer]
- [from-blocker]

Rules:
- Auto-confirm only observable evidence.
- Do not infer completion from partial success.
- Do not infer authority from implementation.
- Compare only against Goal Contract acceptance evidence.

## Gap Analysis

```pseudo
gap = compare( goal.acceptance_evidence, execution.evidence)
```
Gap must be classified.

### Gap Types

| Gap Kind | Meaning | Route |
| --- | --- | --- |
| `same_goal_fixable` | 1.Acceptance not yet satisfied；2.Same Goal Contract still valid. | NEXT_ITERATION |
| `scope_change` | Scope no longer matches Goal Contract | RETURN_TO_ALPHA_GOAL |
| `authority_change` | New authorization required | RETURN_TO_ALPHA_GOAL |
| `external_blocker` | External dependency prevents progress | BLOCKED |
| `verification_complete` | 1.Acceptance evidence satisfied；2.No unresolved blocker; 3.No authority drift. | PASS_TO_FINAL |


## Verification Gates
### Contract Gate
- Goal Contract exists
- Contract status = accepted
- Issued by = alpha-goal

Fail: RETURN_TO_ALPHA_GOAL

### Evidence Gate
- Evidence exists
- Evidence is observable
- Evidence is reproducible
- Evidence maps to acceptance evidence

Fail: NEXT_ITERATION

### Authority Gate
- No scope drift
- No authority drift
- No non-goal violation
- No claim-boundary violation

Fail: RETURN_TO_ALPHA_GOAL

### Blocker Gate
- No unresolved blocker

Fail: BLOCKED

## Verification Algorithm
**Run the algorithm as behavior, not paperwork:**
```pseudo
function goal_verify(goal, evidence):
  assert_goal_contract_valid(goal)
  classified = classify_evidence(evidence)

  gap = analyze_gap(goal.acceptance_evidence, classified)

  if gap.authority_change:
      return RETURN_TO_ALPHA_GOAL

  if gap.blocked:
      return BLOCKED

  if gap.fixable:
      return NEXT_ITERATION

  if acceptance_satisfied:
      return PASS_TO_FINAL

  return NEXT_ITERATION
```

## Route Contract

| Route | Condition |
| --- | --- |
| PASS_TO_FINAL | 1.Acceptance evidence satisfied; 2.No unresolved blocker; 3.No authority drift. |
| NEXT_ITERATION | 1.Gap exists; 2.Gap fixable; 3.Same Goal Contract still valid. |
| BLOCKED | 1.Progress impossible; 2.External dependency required. |
| RETURN_TO_ALPHA_GOAL | 1.Goal Contract no longer sufficient; 2.New authority required. |

## Before Final Verdict Checklist
[ ] Goal Contract loaded
[ ] Acceptance evidence reviewed
[ ] Evidence classified
[ ] Evidence mapped to acceptance evidence
[ ] Gap analyzed
[ ] Authority checked
[ ] Non-goals checked
[ ] Claim boundary checked
[ ] Route selected
