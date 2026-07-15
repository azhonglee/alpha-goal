---
name: alpha-goal
description: "Clarify and frame read-only/change work as an executable, verifiable goal. Choose DIRECT or PERSIST; create an accepted Goal Contract when authority, recovery, or audit evidence must persist. Do not execute or verify persistent work."
---

# Alpha Goal

Turn request and discovered facts into a clear goal. Own goal framing, entry routing, and Goal Contract authority; do not implement or verify persistent work.

## Frame Before Routing

Read instructions, artifacts, tests, docs, history, and current state. Resolve discoverable facts; descriptive evidence cannot grant desired-behavior, side-effect, or acceptance authority. Higher-priority instructions, tool policy, credentials, and approval gates remain invariant.

For every change task, derive a minimal Goal Frame:

- intent and observable outcome;
- scope, non-goals, and material constraints;
- falsifiable success signals and observers;
- unresolved decisions that could change authority, boundaries, execution/risk, or acceptance evidence.

Use authorized or attributable facts only. Ask the smallest unresolved material decision, preferably one structured prompt with facts, consequences, and recommendation. Questions, rounds, and confidence never close a gap. A complete `DIRECT` frame may remain in context; create no lifecycle artifact.

## Choose the Route

Choose `DIRECT` only for authorized read-only work without material disclosure/session/privacy effects or recovery/audit needs, or a clear reversible in-scope local change with direct final-state observation and no unresolved material decision, external/destructive/cross-repository effect, or recovery need.

Choose `PERSIST` when any condition holds:

- behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout/rollback, or risk treatment requires an authority decision;
- work includes an external write, purchase, destructive/cross-repository action, material disclosure, credential/session change, or privacy/security impact;
- completion requires recovery across pause, compaction, handoff, or material risk checkpoints;
- the user or repository requires a Goal Contract or persistent audit evidence.

Ambiguity, confidence, size, duration, or approval alone does not choose persistence. On `DIRECT`, end this skill and let the current agent execute and validate proportionally; reroute if a persistent condition appears.

## Expand to a Goal Contract

For `PERSIST`, resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` from the stable workspace basename. Reuse only after matching workspace/contract identity; never overwrite unrelated or completed state.

- Read `references/goal-contract-book.md`; create canonical `goal-contract.md` as `draft` and expand the Goal Frame with authority, side-effect, decision, claim, evidence, freshness, and invalidation boundaries.
- Only the relevant authority may defer a goal item. No blocking gap may reach confirmation, handoff, or target mutation.
- Keep material design, rollout, rollback, acceptance, mutable surfaces, and observers in this contract, not a second authority artifact.

## Confirm and Handoff

Before confirmation, map criteria to observers; check source conflicts, side-effect authority, freshness, claim boundary, and test the highest-impact assumption with a counterexample/failure case. Material impact stays blocking. For cross-cutting/high-risk work, request independent read-only review from raw artifacts and await/cancel it; unresolved material findings stay blocking.

Before editing an accepted payload:

- if its checkpoint is owned by `executor` or `verifier`, edit only after an explicit acceptance-authority goal change makes that owner record `REFRAME_REQUESTED` and hand lifecycle ownership directly to `alpha-goal`;
- reopen directly only with no checkpoint, a reframed `alpha-goal` epoch, or terminal `PASS_TO_FINAL`/`BLOCKED` plus an explicit acceptance-authority revision request; record the supersession basis.

Present the Goal Frame, boundaries, criteria, evidence, and residual risk. Accept only an explicit decision from the recorded acceptance authority; silence, history, a spec, or desired-behavior authority does not grant side-effect authority or acceptance.

- On accept, complete the Confirmation Record, compute the authority-payload digest, set `status: accepted` last, and hand the canonical contract to `executor`; this adds no revision.
- On refine/reject, remain `draft` and do not mutate the target.
- Reopening sets `draft`, increments the accepted revision once, invalidates prior verdicts, and requires confirmation again.

## Standard Goal Input

The accepted Goal Contract is canonical input to `executor`, `verifier`, and native Goal projection. When tracking is required, project `objective=<Intent - Observable Outcome>; criteria=<critical IDs>; contract=<path>@<revision>#<digest>`. This is lifecycle metadata, never authority/evidence. Never alter a conflicting active goal; record conflict/failure. Required sync blocks handoff; otherwise mark unsynced.

## Capability-Conditional Aids

- Delegate independent read-heavy investigation, review, or evidence reruns. Parallelize independent reads; sequence dependent decisions; synthesize before acting.
- Investigation agents never write shared artifacts. A verifier agent writes only verifier-owned checkpoint fields after exclusive handoff.

## Reframe a Changed Goal

Only an explicit acceptance-authority goal change re-enters clarification during an active epoch. The current `executor` or `verifier` owner stops work, records `REFRAME_REQUESTED`, the source/change/current identity and unverified mutations, then hands directly to `alpha-goal`; this is not a verification route. Leave that checkpoint immutable, reopen the contract as `draft`, and after explicit acceptance let `executor` supersede the epoch. Infeasible, invalid, or unverifiable accepted goals are `BLOCKED` to the caller, not automatic reframes.
