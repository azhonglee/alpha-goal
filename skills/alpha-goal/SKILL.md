---
name: alpha-goal
description: "Route read-only or change work to normal execution or a persistent Goal Contract. Use when material decisions, external or destructive effects, explicit recovery or audit needs, or verifier authority returns may require clarification. Do not use to execute accepted persistent work or verify completion."
---

# Alpha Goal

Choose `DIRECT` or `PERSIST`. For `PERSIST`, establish authority and completion evidence before target mutation; do not implement or verify.

## Route from Observed Conditions

First read applicable instructions, artifacts, tests, docs, history, and current state. Resolve discoverable facts; separate desired-behavior, side-effect, and acceptance authority from descriptive evidence. Higher-priority instructions, tool policy, credentials, and approval gates remain invariant.

Choose `DIRECT` only for:

- read-only inspection through already-authorized access that does not expand sensitive-data disclosure, change credentials/sessions, cause material privacy/security impact, or require recovery/persistent audit evidence; an existing session or ordinary access log alone is not such a change;
- a clear, reversible, in-scope local change with direct final-state observation, no unresolved material authority decision, external/destructive/cross-repository effect, or recovery need.

Choose `PERSIST` when any condition holds:

- a target/delivery decision can change behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout, rollback, or risk treatment;
- work includes an external write, purchase, destructive/cross-repository action, new or material sensitive-data disclosure, credential/session change, or material privacy/security impact;
- completion needs recovery across pause, compaction, handoff, or material risk checkpoints;
- the user or repository requires a Goal Contract or persistent audit evidence.

Ambiguity, confidence, size, or duration never decides persistence without one of those conditions. Approval alone does not persist an otherwise direct action; pause before it. On `DIRECT`, create no lifecycle artifact, end this skill, and let the current agent execute and validate proportionally. Reroute if a persistent condition appears.

## Establish the Contract

For `PERSIST`, resolve before writing:

```text
$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/
```

- Derive the workspace slug from its stable basename, not a full path or session directory. Reuse a task directory only after matching recorded workspace/contract identity; never overwrite unrelated or completed state.
- Read `references/goal-contract-book.md`; create canonical `goal-contract.md` as `draft`.
- Ask only the smallest unresolved decision that changes execution or evidence, preferably one structured prompt with facts, consequences, and recommendation.
- Classify unknowns as `blocking`, `non-material`, or `deferred non-goal`; only the relevant authority may defer a goal item.
- Keep material design, rollout, rollback, acceptance, mutable surfaces, and observers in this contract, not a second authority artifact.

## Confirm and Handoff

Before asking, map every criterion to an attributable observer; check source conflicts, the highest-impact assumption, side-effect authority, freshness, and claim boundary. For cross-cutting/high-risk work, request independent read-only reviews, pass raw artifacts, and wait for every requested result or explicitly cancel it.

Before editing an accepted payload:

- if its checkpoint is owned by `executor` or `verifier`, stop target writes and require `verifier` to return `RETURN_TO_ALPHA_GOAL` naming the change;
- reopen directly only with no checkpoint, a returned epoch owned by `alpha-goal`, or a terminal `PASS_TO_FINAL`/`BLOCKED` epoch plus an explicit acceptance-authority revision request; record the supersession basis.

Present outcome, boundaries, criteria, evidence, and residual risk. Accept only an explicit decision from the recorded acceptance authority; silence, history, a spec, or desired-behavior authority does not grant side-effect authority or acceptance.

- On accept, complete the current revision's Confirmation Record, compute its authority-payload digest, set `status: accepted` last, and hand to `executor`; this transaction adds no revision.
- On refine/reject, remain `draft` and do not mutate the target.
- Reopening an accepted payload sets `draft`, increments its revision once, invalidates prior verdicts, and requires confirmation again.

## Capability-Conditional Aids

- Use native goal tracking only when explicitly required, exposed, policy-permitted, and contract-authorized; it is lifecycle metadata, not authority/evidence.
- Delegate independent read-heavy investigation, review, or evidence reruns. Parallelize independent reads; sequence dependent decisions; synthesize before acting.
- Investigation agents never write shared artifacts. A verifier agent writes only verifier-owned checkpoint fields after exclusive handoff.
- In a Claude context, read `references/claude-adapter.md` only for capability names.

## Resolve Authority Returns

On `RETURN_TO_ALPHA_GOAL`, reopen only for changed/missing authority, observer, claim boundary, or an explicit decision after authorized approaches are exhausted. Leave a returned checkpoint unchanged; after accepting the next revision, `executor` performs guarded epoch supersession. Send clerical binding/context mismatches to their field owner and unchanged external blockers to `verifier`. Never return unchanged state without a new decision, corrected binding, or changed condition.
