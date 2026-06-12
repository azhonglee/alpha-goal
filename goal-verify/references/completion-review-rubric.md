# Completion Review Rubric

Use this reference when a final claim is being prepared.

## Pass conditions

A task can pass to final only when:

- all acceptance items are covered or explicitly out of scope;
- evidence is fresh and relevant;
- tested boundary matches the final claim;
- verification can run in the target final state;
- changed files match the Goal Contract target and non-goals;
- applicable project rules were read, or the verdict explicitly narrows itself to a user-provided evidence bundle and records that project-rule compliance was not independently verified;
- expected checks were run or a clear blocker is documented;
- review feedback was classified when present;
- Review Record exists and covers the latest material change when feedback, complexity, scope, architecture, ownership, or uncertainty triggered review;
- risk-tier evidence requirements are met or explicitly blocked;
- unresolved gaps are disclosed;
- final claim is no broader than evidence.

## Red flags

Return `NEXT_ITERATION`, `REFRAME`, or `NARROW_CLAIM_AND_FINAL` when:

- final answer says "done" but evidence only lists generic test commands;
- acceptance items are not individually mapped to evidence;
- user wording is product-level but tests are only helper-level;
- changed files include a different repo/module than framed target;
- evidence depends on deleted paths, self-matching greps, pre-change layout checks, or mock-only checks that miss the claim;
- existing MR/PR discovered late changes task identity;
- a failed check is dismissed without diagnosis;
- no fresh check was run after the last edit;
- review depends on stale or pre-existing evidence;
- no current Review Record exists after review feedback, scope expansion, complexity, ownership, or uncertainty;
- a bug-fix claim says `ROOT_CAUSE_CONFIRMED` but only shows a plausible code location, not first-divergence evidence;
- no competing hypothesis was considered or bounded for a non-trivial failure;
- logs or traces point to a different entity/interface than the patched path;
- final tests prove the changed helper but not the confirmed failure path;
- root-cause wording is broader than evidence, such as claiming a product lifecycle cause from one unit-level observation.

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
