# Claim Boundary

A claim must be no broader than fresh evidence and checked surface. State Original claim, Highest supported claim, Unsupported portions, and Final wording allowed. If evidence is indirect, stale, narrow, or missing risk coverage for a material surface, return `NEXT_ITERATION`; do not narrow the claim as a successful final outcome.

Claim verification is only one part of goal verification. Material unclaimed defects, regressions, unsafe old paths, or scope drift found during the defect/risk sweep can block `PASS_TO_FINAL` even when the proposed final wording is narrow.

## Completion Review Rubric

List every requirement, artifact, command, invariant, non-goal, acceptance evidence item, and deliverable. For each, cite authoritative evidence, coverage, gap, and verdict. Debug/repair claims require reproduction, suspected cause, confirming evidence, fix evidence, and non-reproduction boundary. Missing or weak evidence prevents final completion.
