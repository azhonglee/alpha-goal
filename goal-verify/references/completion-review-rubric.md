# Completion Review Rubric

Use this reference when a final claim is being prepared.

## Pass conditions

A task can pass to final only when:

- all acceptance items are covered or explicitly out of scope;
- evidence is fresh and relevant;
- tested boundary matches the final claim;
- changed files match the Goal Contract target and non-goals;
- expected checks were run or a clear blocker is documented;
- review feedback was classified when present;
- Review Record exists when complexity, scope, architecture, or uncertainty triggered review;
- risk-tier evidence requirements are met or explicitly blocked;
- unresolved gaps are disclosed;
- final claim is no broader than evidence.

## Red flags

Return `NEXT_ITERATION`, `REFRAME`, or `NARROW_CLAIM_AND_FINAL` when:

- final answer says “done” but evidence only lists generic test commands;
- acceptance items are not individually mapped to evidence;
- user wording is product-level but tests are only helper-level;
- changed files include a different repo/module than framed target;
- existing MR/PR discovered late changes task identity;
- a failed check is dismissed without diagnosis;
- no fresh check was run after the last edit;
- review depends on stale or pre-existing evidence.
- no Review Record exists after review feedback, scope expansion, complexity, or uncertainty.

## Final answer shape

Prefer:

```text
Completed within this boundary: ...
Evidence:
- Acceptance 1 -> ...
- Acceptance 2 -> ...
Checks run: ...
Review/risk evidence: ...
Remaining gaps / not covered: ...
```

Avoid:

```text
Done. Tests passed.
```
