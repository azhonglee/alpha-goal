---
name: alpha-goal
description: "Turn raw requests and attributable context into a Goal Contract and native goal input. Use for goal framing, execution boundaries, acceptance criteria, verification, and native goal synchronization."
---

# Alpha Goal

Transform the user's raw request and attributable inputs into execution-ready goal artifacts. Treat upstream artifacts as reference context and preserve their provenance.

Produce:

- a canonical Goal Contract that authorizes execution;
- a compact structured objective for the native goal runtime.

The native goal is lifecycle metadata. It points to the contract and summarizes the finish line; it never replaces contract authority.

## Inspect Inputs and Choose Route

Read the user's request, higher-priority instructions, attributable inputs, and relevant current-state evidence. Resolve discoverable facts before asking for decisions.

Derive details only when they are entailed by an attributable source. Never turn a recommendation, current implementation, convention, or model preference into authority.

If a material authority-owned decision remains, return one **Goal Input Gap Report**:

```text
Gap id:
Affected goal field:
Known facts and sources:
Why the gap changes execution, risk, or evidence:
Decision owner:
Smallest next decision variable:
Recommendation, if useful:
```

Do not require the user to fill a schema or prescribe a clarification workflow.

Choose `DIRECT` only for authorized read-only work without material disclosure/session/privacy effects or recovery/audit needs, or a clear reversible in-scope local change with direct final-state observation and no unresolved material decision, external/destructive/cross-repository effect, or recovery need.

Choose `PERSIST` when any condition holds:

- behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout/rollback, or risk treatment requires an authority decision;
- work includes an external write, purchase, destructive/cross-repository action, material disclosure, credential/session change, or privacy/security impact;
- completion requires recovery across pause, compaction, handoff, or material risk checkpoints;
- the user or repository requires a Goal Contract or persistent audit evidence.

Ambiguity, confidence, size, duration, or approval alone does not choose persistence. A supplied `DESIGN_READY` handoff selects `PERSIST` whenever any design proposal will be consumed. `DIRECT` may proceed only by ignoring that handoff. On `DIRECT`, create no Goal Contract or native goal; return the relevant outcome, boundaries, completion conditions, and verification context for proportionate execution. Reroute if a persistent condition appears.

## Compile the Goal Contract

For `PERSIST`, resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` from the stable workspace basename. Use an exact task directory supplied by an attributable upstream handoff; otherwise create a new directory. Reuse only a matching `draft`; if the name holds an accepted, terminal, or unrelated task, use the first unused numeric suffix.

Read `references/goal-contract-book.md` and compile canonical `goal-contract.md` as `draft` directly from the user's request, higher-priority instructions, attributable inputs, discovered facts, and explicit authority decisions.

For every material contract field:

- retain its attributable source;
- preserve its authority boundary;
- resolve conflicts through source precedence;
- treat reference artifacts as context rather than automatic authority;
- keep the contract `draft` while a material authority gap remains.

No blocking gap may reach self-review acceptance, handoff, target mutation, or Native Goal Sync. Keep only decisions, constraints, risks, and observers that affect execution or claims.

Before using a `DESIGN_READY` proposal, require the original request source, verify `Design status: ready`, verify the handoff workspace matches the current target workspace, and verify that its absolute `technical_design.md` path exists. A missing or failed check blocks the design handoff. Record a valid source as `technical-design: <absolute path>`.

Adopt only proposal content compatible with authority. Express every adopted constraint inside Deliverables, Boundaries, Acceptance Criteria, Verification, or Risks and Recovery; a source reference alone creates no execution obligation. If design is absent but materially required for safe compilation, report the missing prerequisite.

## Self-Review and Accept

Do not ask the user to confirm, accept, refine, or reject the compiled Goal Contract. User input is required only for a material authority-owned decision that cannot be derived or discovered; request that decision through one Goal Input Gap Report before Self-Review.

Run the Self-Review Gate against the draft:

- verify Objective, Deliverables, Boundaries, Acceptance Criteria, Verification, Authority, Risks and Recovery, and source provenance are internally consistent and attributable;
- map every required criterion to a currently available observer and identify every claim surface and prerequisite;
- complete authority-retained decisions and their risk/observer treatment;
- check source conflicts, side-effect authority, freshness, and the highest-impact assumption with a counterexample or failure case;
- keep `draft` while any known infeasibility, unavailable observer, unidentified claim surface, unmet prerequisite, incomplete authority-retained decision coverage, or material finding remains;
- for cross-cutting or high-risk work, request independent read-only review from raw artifacts and require no unresolved Critical or High finding.

Handle the result without a contract-confirmation round trip:

- if a discoverable or derivable defect exists, keep `draft`, repair the contract, and rerun Self-Review;
- if a material authority gap exists, keep `draft` and return the single highest-impact Goal Input Gap Report;
- if work is infeasible or blocked, keep `draft`, record the blocker, and do not mutate the target or native goal;
- when every gate passes, complete the Readiness Gate and Self-Review Record, set `status: accepted` last, generate Native Goal Input, perform Native Goal Sync, and hand off the contract;
- after self-review acceptance, a material objective or authority change starts a new task. Do not edit or reuse the accepted contract or checkpoint.

## Derive Native Goal Objective

Derive a compact native goal objective from the accepted Goal Contract. Include the observable outcome, required completion conditions, critical constraints, primary evidence surface, and canonical contract path.

The derived objective summarizes the finish line for the native goal runtime. The accepted Goal Contract remains the source of truth.

Use this shape:

```text
Outcome: <one observable final state>
Complete when:
- <required acceptance condition>
- <required acceptance condition>
Constraints:
- <highest-impact boundary or non-goal>
- <approval/recovery invariant>
Evidence:
- <primary verification observer or command>
Contract: <absolute canonical goal-contract.md path>
```

Rules:

- Include all required finish-line conditions, but reference the contract instead of duplicating its full contents.
- Include only constraints whose omission could cause scope, authority, safety, or acceptance drift.
- Name an evidence surface that the thread can observe; do not use model confidence or effort as completion evidence.
- Preserve unsupported claims by omission or explicit constraint; never broaden the contract's claim boundary.
- Set `token_budget` only when the user explicitly supplied one.

## Native Goal Sync

After acceptance, call `get_goal`.

- Reuse an unfinished native goal only when it represents the same accepted contract and generated Native Goal Input.
- If none exists, call `create_goal` with the generated Native Goal Input as `objective` and the explicit user token budget only when supplied.
- If an unfinished native goal conflicts, do not overwrite or repurpose it. Report a blocking sync conflict and do not hand off as synchronized.
- If sync fails, record the blocker; do not redefine the Goal Contract or generated input.

## Capability-Conditional Aids

- Delegate independent read-heavy investigation, Goal Contract review, or evidence reruns.
- Investigation agents never write shared authority artifacts.
