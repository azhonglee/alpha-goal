---
name: technical-design
description: "Explicit-only pre-goal technical design for work whose implementation shape, interfaces, data, dependencies, rollout, rollback, or material technical risk needs review. Produce technical_design.md and one DESIGN_* route; do not clarify product authority, accept goals, implement, or verify delivery."
---

# Technical Design

Own the pre-goal technical design stage. Convert the user's request, explicit authority facts, optional clarification results, and discoverable technical facts into a reviewed `technical_design.md` proposal for a later `alpha-goal` stage.

The design proposes how work can be implemented and observed. It does not authorize desired behavior, scope, side effects, execution, or completion claims.

## Read References When Needed

- Read `references/technical-design-book.md` before resolving or recovering the artifact, writing its schema, classifying detailed coverage, or returning a route packet.
- In a Claude-installed skill context, also read `references/claude-adapter.md` before writing or reviewing the design.

## Classify Inputs

Before detailed analysis or returning any route, resolve or recover the canonical `technical_design.md` as `draft` using the reference rules. Record the task identity, sources, known facts, and current highest-impact gap before asking for authority input.

Build the smallest design frame needed from the request, instructions, attributable clarification, repository facts, candidate observers, and recovery surfaces. Keep these classes distinct:

- **authority facts**: explicit user or higher-priority product, scope, risk, or side-effect decisions that constrain the proposal;
- **discovered facts**: current-state evidence that informs design but grants no authority;
- **design decisions**: technical proposals owned by this skill;
- **unresolved input**: product, scope, side-effect, or risk decisions this skill cannot make.

Never turn implementation, convention, recommendation, or design preference into authority.

## Technical Clarification Gate

Resolve discoverable technical facts directly. Classify each unresolved unknown as `blocking`, `non-material`, or `deferred-non-goal` according to whether it can change implementation or evidence materially.

If an authority-owned input is missing, keep `Design status: draft` and return the highest-impact `DESIGN_INPUT_GAP` packet defined in the reference. Do not guess. The caller may resolve the gap directly or through an independent clarification workflow, then rerun this skill.

## Design and Review

Use material-first coverage rather than a fixed questionnaire. Always map proposed outcomes to evidence and cover material risks plus recovery, or record an explicit non-material basis. Cover architecture, components, data flow, interfaces, data models, persistence, middleware, infrastructure, dependencies, tests, scalability, rollout, and rollback only when touched or material.

Write the canonical artifact using the reference schema. Keep it `draft` while writing or reviewing, distinguish input classes, mark unresolved required content `[blocking]`, and do not claim execution authority.

Before readiness, require:

- the design remains within the request and authority facts;
- every required, touched, or material dimension has no blocking gap;
- every proposed outcome and touched risk maps to an observer, test, or artifact;
- prerequisites and dependencies are available or represented as blockers;
- unsupported product, safety, performance, or completion claims are explicit;
- the Review Record is `passed` with no unresolved Critical or High finding.

For non-trivial implementation, repair, refactor, hardening, cross-file behavior, interface/data change, or material risk, request independent read-only review when available using the raw request, source references, and design artifact.

## Routes

Return exactly one route using the packet in the reference:

- `DESIGN_READY`: the review gate passed; set `Design status: ready`, persist the final artifact, and return it as non-authoritative input for a later `alpha-goal` stage.
- `DESIGN_INPUT_GAP`: an authority-owned input is required; keep `Design status: draft`.
- `DESIGN_BLOCKED`: design is infeasible or a non-authority dependency prevents review completion; keep `Design status: draft` and return the blocker, evidence, affected dimensions, and smallest recovery condition.

## Hard Boundaries

- Write only `technical_design.md` and return one design route.
- Do not create Goal Contracts or goal/task lifecycle state.
- Do not infer authority from discovered facts or design preference.
- Do not implement, mutate the target, deploy, purchase, or verify final delivery.
- Do not treat `technical_design.md` or `DESIGN_READY` as execution authority.
