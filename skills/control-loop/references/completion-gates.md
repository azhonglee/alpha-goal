# Completion Gates

Load this reference before any FINAL_RESPONSE_READY, READY, DONE, SAFE, COMPLETE, shipped, fixed, hardened, MR-ready, replacement/prohibition, or broad evidence-boundary claim.

## Universal Completion Gates

1. Scope Gate:
   The final diff must be a subset of authorized repo surfaces in the Goal Contract.
   Evidence must include raw changed-file observation and classification.
   Any unclassified or unauthorized change blocks completion.

2. Assertion Gate:
   Every outcome, constraint, non-goal, and acceptance evidence item in the Goal Contract
   must be converted into a falsifiable assertion with recorded evidence and verdict.

3. Replacement/Prohibition Gate:
   For goals involving replace, remove, disable, migrate, forbid, or no-fallback semantics,
   evidence must include both positive evidence for the new behavior and negative evidence
   that the old/prohibited behavior is not reachable on default paths.

4. Evidence Boundary Gate:
   The final claim must not exceed the strongest direct evidence level.
   CI evidence may support build/test claims only; it cannot by itself prove runtime,
   staging, production, data migration, security, or availability claims.

5. Raw Evidence Gate:
   Verification must cite raw observers, commands, artifacts, logs, or diffs.
   Summaries, intentions, plans, and assumptions are not evidence.

6. Delivery Boundary Gate:
   The final response, PR/MR handoff, or delivery marker is allowed only when the supported
   claim matches the accepted Goal Contract, raw evidence, verification verdict, and delivery
   boundary. Missing required work, blocked external state, or unsupported claim breadth prevents
   completion routing.

If any gate fails:
- Same-goal fixable gap -> `HARDENING`
- Scope/authority/decision change -> `RETURN_TO_ALPHA_GOAL`
- Missing permission/data/environment -> `BLOCKED`
