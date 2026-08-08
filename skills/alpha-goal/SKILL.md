---
name: alpha-goal
description: "Apply an early skip gate to engineering requests; for work that is not skipped, inspect, clarify, and frame it as an executable, verifiable goal. Use when the user asks to design, implement, build, modify, fix, debug, refactor, optimize, test, integrate, migrate, deploy, or harden code or systems."
---

# Alpha Goal

Transform the user's raw request and attributable inputs into execution-ready goal artifacts. Treat upstream artifacts as reference context and preserve their provenance.

For work that is not skipped, produce a canonical Goal Contract that authorizes execution.

## Inspect Gate Inputs

Before deciding the Skip Gate, inspect only gate inputs already available or explicitly referenced:

- raw request;
- higher-priority and repository constraints;
- attributable handoff metadata and whether any handoff will be consumed;
- an already-provided exact Alpha Goal task path and its lifecycle state.

Do not inspect implementation or create an artifact to prove `SKIP`. If a gate fact is unclear, do not skip.

## Skip Gate

Return `SKIP` only when the combined gate inputs clearly show all of the following:

- concrete read-only analysis, or a clear reversible in-scope local change with direct final-state observation;
- no material behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout/rollback, or risk decision;
- no external write, purchase, destructive/cross-repository action, material disclosure, credential/session change, recovery checkpoint, explicit Goal Contract, or audit record;
- no intended handoff consumption and no need to create, recover, or audit lifecycle state.

Handoffs remain context, never authority. `SKIP` creates no state and returns ordinary work to the caller.

If supplied lifecycle state is not a matching draft and still authorizes or requires work by its current owner, return control to that owner; do not alter it or initialize a competing draft. After any required terminal transition, re-enter Alpha Goal for the new task. Otherwise continue immediately with `Initialize Draft`.

## Initialize Draft

Before full inspection or the first question, resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` from the stable workspace basename. Use an exact task directory supplied by attributable context; otherwise create a new directory. Read `references/goal-contract-book.md`, then create or recover its matching canonical `goal-contract.md` as `draft`.

Write only known facts, their sources, and the current highest-impact gap. Do not mutate the target. Reuse a matching draft; if the name holds an accepted, terminal, or unrelated task, use the first unused numeric suffix.

## Inspect Inputs

After the draft exists, read the user's request, higher-priority instructions, attributable inputs, and relevant current-state evidence. Resolve discoverable facts before asking for decisions.

Derive details only when they are entailed by an attributable source. Never turn a recommendation, current implementation, convention, or model preference into authority. Update the draft with inspection results and the next highest-impact gap before asking a question.

## Clarify

Use a grill-me loop to remove material uncertainty; do not treat a plausible first answer as complete. If a material authority-owned decision remains, return one **Goal Input Gap Report**:

```text
Gap id:
Affected goal field:
Known facts and sources:
Why the gap changes execution, risk, or evidence:
Decision owner:
Smallest next decision variable:
Recommendation, if useful:
```

Use this report to frame the next question; do not make the user fill it out or reproduce the workflow.

Repeat only while a material gap remains:

1. Select the highest-impact unresolved question by authority ownership, blast radius, irreversibility, behavior/interface/data impact, acceptance ambiguity, and rollback risk.
2. Ask one pointed question containing one decision variable. State the discovered facts, why the answer matters, concrete options or a recommendation when useful, and never ask for discoverable facts.
3. Grill the answer with a concrete example, counterexample, boundary, trade-off, failure case, implementation consequence, or acceptance observer. Ask a follow-up on the same question when another reasonable answer could still change execution or evidence.
4. Before asking again or pausing, record each material answer in its applicable contract fields with its source, boundary, consequence, and observer impact; update the next highest-impact gap. Re-run inspection when an answer exposes a new factual or authority gap.

Stop only when no unresolved answer could materially change the objective, scope, non-goals, side effects, design, acceptance, risk treatment, or evidence. Keep the highest-impact unresolved authority decision in one Gap Report; do not guess or mutate the target.

## Compile the Goal Contract

Complete the initialized canonical `goal-contract.md` from the user's request, higher-priority instructions, attributable inputs, discovered facts, and explicit authority decisions.

For every material contract field:

- retain its attributable source;
- preserve its authority boundary;
- resolve conflicts through source precedence;
- treat reference artifacts as context rather than automatic authority;
- keep the contract `draft` while a material authority gap remains.

No blocking gap may reach acceptance, handoff, or target mutation.

Before using a `DESIGN_READY` proposal, require the original request source, verify `Design status: ready`, verify the handoff workspace matches the current target workspace, and verify that its absolute `technical_design.md` path exists. A missing or failed check blocks the design handoff. Record a valid source as `technical-design: <absolute path>`.

Adopt only proposal content compatible with authority. Express every adopted constraint inside Deliverables, Boundaries, Acceptance Criteria, Verification, or Risks and Recovery; a source reference alone creates no execution obligation. If design is absent but materially required for safe compilation, report the missing prerequisite.

## Check and Accept

Do not add a confirmation ceremony after compiling the Goal Contract. Ask the user only for a material authority-owned decision that cannot be derived or discovered; use one Goal Input Gap Report for that decision.

Before acceptance:

- verify Objective, Deliverables, Boundaries, Acceptance Criteria, Verification, Authority, Risks and Recovery, and source provenance are internally consistent and attributable;
- map every required criterion to a currently available observer and identify every claim surface and prerequisite;
- complete authority-retained decisions and their risk/observer treatment;
- check source conflicts, side-effect authority, freshness, and the highest-impact assumption with a counterexample or failure case;
- adopt every material conclusion from draft-only `Unresolved Gaps` into standard contract fields and remove that temporary section;
- keep `draft` while any known infeasibility, unavailable observer, unidentified claim surface, unmet prerequisite, incomplete authority-retained decision coverage, or material finding remains;

Handle the result:

- if any check fails, keep `draft`, repair or report the highest-impact gap or blocker, and do not mutate the target;
- when all checks pass, set `status: accepted` last and hand off the contract to executor.
