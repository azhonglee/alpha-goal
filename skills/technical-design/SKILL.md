---
name: technical-design
description: "Manual-only technical design workflow. Use only when the user explicitly invokes $technical-design, explicitly asks to run Technical Design, or an already active technical_design.md exact path is preserved in current context for resume. Create and review technical_design.md, preserve authority boundaries, map proposals to evidence, and return DESIGN_READY, DESIGN_INPUT_GAP, or DESIGN_BLOCKED. Do not auto-trigger from complexity, cross-file scope, interfaces, data, rollout, or risk."
---

# Technical Design

Run only after explicit user invocation, or resume an exact current-context `technical_design.md` with `Design status: draft` in an active design stage. Other artifacts are references, not triggers. Never infer a trigger from complexity or risk. Own the pre-goal technical design stage. Start from the user's request, instructions, optional attributable clarification results, and discoverable technical facts. Produce a canonical `technical_design.md`, review it, and return a ready handoff to the caller for a later `alpha-goal` stage as non-authoritative structured context.

The design proposes how the work can be implemented and verified. It does not authorize desired behavior, scope, side effects, execution, or completion claims.

In a Claude-installed skill context, read `references/claude-adapter.md` before writing or reviewing the design.

## Resolve the Design Artifact

Use an explicitly supplied artifact directory when present. Otherwise resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/`, where `<workspace-slug>` is derived from the stable workspace basename. Reuse only a matching `draft`; use the first unused numeric suffix for ready, blocked, or unrelated artifacts. Preserve the exact absolute artifact directory for recovery; never guess among directories under the workspace root.

Write the canonical `technical_design.md` in that directory and record `artifact_directory` plus a stable `task_id` in the artifact. Preserve the exact path in current task context across compaction. If the exact path is unavailable or conflicts with the request, return `DESIGN_BLOCKED` instead of selecting the newest or most similar directory. On recovery, require the current-context path to match the artifact directory, task id, and workspace; an existing but stale or wrong exact path is still blocked.

## Frame Design Input

Build the smallest design frame needed from:

- the user's requested outcome and stated boundaries;
- higher-priority instructions and policies;
- optional attributable decisions or clarification artifacts;
- repository structure, current behavior, interfaces, data, dependencies, tests, runtime, and delivery constraints;
- candidate acceptance observers and recovery surfaces.

Separate these classes:

- **authority facts** — explicit user or higher-priority decisions that may constrain the proposal;
- **discovered facts** — current-state evidence that informs design but grants no authority;
- **design decisions** — technical proposals owned by this skill;
- **unresolved input** — product, scope, side-effect, or risk decisions this skill cannot make.

Never turn current implementation, convention, recommendation, or design preference into product or side-effect authority.

## Technical Clarification Gate

Resolve discoverable technical facts directly. Keep an unknown `blocking` when a different answer could change code, interfaces, data, dependencies, tests, rollout, rollback, security, privacy, performance, or risk handling.

Classify every unresolved unknown as:

- `blocking` — design cannot be trusted without a decision or missing fact;
- `non-material` — the answer cannot change implementation or evidence materially;
- `deferred-non-goal` — explicitly outside the supplied request.

If an authority-owned input is missing, do not guess. Return one highest-impact `DESIGN_INPUT_GAP`:

```text
Route: DESIGN_INPUT_GAP
Gap id:
Affected design dimension:
Known facts and sources:
Why the gap changes implementation, risk, or evidence:
Decision owner:
Smallest next decision variable:
Invalidated design sections:
Recommendation, if useful:
```

The current caller may resolve the gap directly or use any independent clarification workflow, then rerun this skill.

## Design Coverage

Use material-first coverage rather than a fixed questionnaire.

Always cover:

- proposed outcome-to-evidence mapping;
- material risks, recovery, or an explicit non-material risk basis.

Cover when touched or material:

1. Architecture, Components, Data Flow, Interfaces/API, Data Models.
2. Persistence, Middleware, Infrastructure, External Dependencies.
3. Test Plans, Scalability, Rollout, Risks, Rollback.

A dimension is covered only when it records the proposal, boundary, implementation impact, evidence observer, and status.

Use these probes:

- Architecture: what structure changes, stays stable, or becomes an integration boundary?
- Components: which modules own the change and which remain untouched?
- Interfaces/API: which signatures, commands, events, prompts, or contracts change?
- Data Models: which schema, artifact, or state shape is created, changed, or preserved?
- Data Flow: what input, transformation, output, and recovery path must hold?
- Persistence/Middleware/Infrastructure: what storage, runtime, dependency, credential, or deployment assumption matters?
- Test Plans: what evidence proves each proposed outcome and touched risk?
- Risks/Rollback: which failure mode, migration risk, compatibility issue, or rollback path matters?

## Write technical_design.md

Read `references/technical-design-book.md` and write the canonical artifact.

- Keep `Design status: draft` while writing and reviewing.
- Record source references and distinguish authority facts, discovered facts, and design decisions.
- Write only attributable facts and explicit technical deductions.
- Keep unresolved required content marked `[blocking]`.
- Omit untouched dimensions unless recording `not touched` prevents ambiguity.
- Keep the artifact technical and proposal-oriented; do not claim execution authorization.

## Technical Review Gate

Before returning `DESIGN_READY`:

- the design remains inside the supplied request and explicit authority facts;
- required, touched, or material dimensions have no blocking gap;
- architecture, components, interfaces, data models, data flow, and tests are explicit when touched;
- every proposed outcome maps to a test, observer, or artifact;
- evidence covers touched risks, not only the happy path;
- rollout and rollback are handled or explicitly non-material/deferred-non-goal;
- prerequisites and external dependencies are observable and available or represented as blockers;
- unsupported product, safety, performance, or completion claims are listed rather than implied.

For non-trivial implementation, repair, refactor, hardening, cross-file behavior, interface/data change, or material risk, request independent read-only review when available. Pass the raw request, source references, and design artifact. Require no unresolved Critical or High finding before `DESIGN_READY`.

## Return Ready Design to Caller

Only after the Technical Review Gate passes:

1. set `Design status: ready`;
2. persist the final `technical_design.md`;
3. return the artifact and handoff packet to the caller as structured, non-authoritative input for a later `alpha-goal` stage.

Return:

```text
Route: DESIGN_READY
Suggested next stage: alpha-goal
Task id: <stable task identifier>
Artifact directory: <absolute artifact directory>
Workspace: <stable workspace identity>
Design status: ready
Design: <absolute technical_design.md path>
Original request source: <reference>
Source references: <compact attributable list>
Authority facts: <compact attributable list>
Proposed outcome: <observable technical outcome>
Proposed deliverables: <compact list>
Proposed boundaries and constraints: <compact list>
Proposed acceptance evidence: <compact list>
Unresolved non-blocking limits: <compact list or none>
```

The ready packet is returned to the caller as input to goal engineering, not as an accepted goal or execution authority.

## Other Return Routes

- `DESIGN_INPUT_GAP`: an authority-owned input is required. Keep `Design status: draft`.
- `DESIGN_BLOCKED`: design is infeasible or a non-authority dependency prevents review completion. Return the blocker, evidence, affected dimensions, and smallest recovery condition; keep `Design status: draft`.

## Hard Boundaries

- Write only `technical_design.md` and return one design route.
- Do not create Goal Contracts or goal/task lifecycle state.
- Do not infer authority from discovered facts or design preference.
- Do not implement, mutate the target, deploy, purchase, or verify final delivery.
- Do not treat `technical_design.md` as execution authority.
