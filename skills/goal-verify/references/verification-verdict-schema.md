# Verification Verdict Schema

```markdown
Verification Verdict:
- Goal Contract:
- Evidence:
- Verified at:
- Review mode:
- Original claim:
- Claim checked:
- Goal satisfaction review:
- Defect/risk sweep:
- Unclaimed issues found:
- Repo surface coverage:
- Evidence coverage:
- Unresolved user-owned decisions:
- Gap:
- Highest practical evidence-supported boundary:
- Highest supported claim:
- Unsupported portions:
- Final wording allowed:
- Final claim allowed:
- Verdict: PASS_TO_FINAL / NEXT_ITERATION
- Next route: none / control-loop / alpha-goal / BLOCKED

Conditional sections, include only when applicable:
- Run profile review:
- Loop state review:
- Memory review:
- Negative/abuse cases checked:
- Indicator handoff review:
- Adaptive learning review:
```

`PASS_TO_FINAL` requires `Final claim allowed: yes`, no material `Gap`, no material unhandled `Unclaimed issues found`, and a defect/risk sweep covering the material checked surface. `NEXT_ITERATION` must identify whether the next route is `control-loop`, `alpha-goal`, or `BLOCKED`.
