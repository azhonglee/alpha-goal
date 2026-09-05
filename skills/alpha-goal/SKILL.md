---
name: alpha-goal
description: "Explicitly invoke for engineering requests that need the Alpha Goal Skip Gate. Return SKIP for simple eligible work; otherwise compile and accept one executable Goal Contract from attributable inputs. Do not use for standalone clarification or technical design, and do not implement or verify the goal."
---

# Alpha Goal

Apply the Skip Gate to the supplied engineering request. For non-`SKIP` work, compile attributable inputs into the canonical Goal Contract that authorizes later execution.

Alpha Goal owns goal framing and acceptance only. Upstream interview or design artifacts are context, never authority by themselves.

## Read References When Needed

- Read `references/goal-contract-book.md` before creating or recovering a draft, emitting a Goal Input Gap Report, or checking field-level acceptance requirements.
- In a Claude-installed skill context, also read `references/claude-adapter.md` before using runtime-specific tools. Keep this adapter discoverable whenever Alpha Goal may run under Claude.

## Skip Gate

Inspect only gate inputs already available or explicitly referenced: the raw request, higher-priority and repository constraints, attributable handoff metadata and consumption intent, and any supplied exact Alpha Goal task path plus lifecycle state. Do not inspect implementation or create state merely to prove `SKIP`. If a gate fact is unclear, do not skip.

Return `SKIP` only when all are clear:

- the work is concrete read-only analysis or a reversible in-scope local change with direct final-state observation;
- no material behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout/rollback, or risk decision exists;
- no external write, purchase, destructive or cross-repository action, material disclosure, credential/session change, recovery checkpoint, explicit Goal Contract, or audit record is required;
- no handoff will be consumed and no lifecycle state must be created, recovered, or audited.

`SKIP` creates no state and returns ordinary work to the caller. Handoffs remain context, never authority.

If supplied lifecycle state belongs to a current owner and still requires its transition, return control to that owner rather than altering it or creating a competing draft. After a required terminal transition, re-enter Alpha Goal for the new task.

## Non-SKIP Lifecycle

1. **Initialize draft before full inspection or questions.** Resolve or recover the canonical `goal-contract.md` as `draft` using the reference rules. Write only known facts, sources, and the highest-impact gap. Do not mutate the target.
2. **Inspect attributable inputs.** Read the request, instructions, supplied artifacts, and relevant current-state evidence. Resolve discoverable facts before asking. Derive only what sources entail; never convert implementation, convention, recommendation, or model preference into authority.
3. **Clarify material authority gaps.** Use one highest-impact Goal Input Gap Report and ask one decision variable at a time. Pressure-test answers against boundaries, failure cases, implementation consequences, and acceptance observers. Keep `draft` and do not guess while a material gap remains.
4. **Compile the contract.** Express the observable objective, material deliverables, boundaries, permitted side effects, falsifiable criteria, observers, authority, risks, recovery, and provenance in the canonical schema.
5. **Check and accept.** Repair discoverable defects; report authority gaps or blockers; set `status: accepted` last only when the complete contract is attributable, feasible, authorized, and verifiable. Hand the accepted contract to executor without adding a confirmation ceremony.

An accepted contract is immutable. A material objective or authority change starts a new task and contract; do not return the accepted artifact to `draft` or reuse its checkpoint.

## Adopt Optional Inputs

Validate every consumed artifact's source, status, workspace, and exact path. For a `DESIGN_READY` proposal, also require the original request source and an existing absolute `technical_design.md` path. A missing or failed check blocks adoption.

Adopt only proposal content compatible with authority. Copy each binding conclusion into the applicable contract field; a source reference alone creates no execution obligation. If technical design is absent but materially required for safe compilation, report that missing prerequisite.

## Acceptance Gate

Before acceptance:

- required fields, source provenance, and authority are internally consistent and attributable;
- every criterion maps to a currently available observer, with claim surfaces, prerequisites, freshness, and invalidation identified;
- side effects and material risks have authority, treatment, and rollback or recovery;
- authority-retained decisions are complete and the highest-impact assumption survives a counterexample or failure case;
- no known infeasibility, unavailable observer, unidentified claim surface, unmet prerequisite, or material finding remains;
- draft-only gaps have been adopted into standard fields and removed.

If a check fails, keep `draft`, repair it or report the highest-impact gap or blocker, and do not mutate the target.

## Hard Boundaries

- Do not perform standalone requirement exploration; consume attributable clarification when supplied.
- Do not create technical designs; consume and validate them when supplied.
- Do not implement, mutate the target, deliver, or verify completion.
- Do not treat discovered facts, recommendations, or upstream artifacts as authority.
