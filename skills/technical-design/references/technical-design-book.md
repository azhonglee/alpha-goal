# Technical Design Book

Read this reference when creating, recovering, reviewing, or returning the canonical `technical_design.md`. It is a reviewed technical proposal and handoff source, not execution authority.

## Artifact Resolution and Recovery

Use an explicitly supplied artifact directory when present. Otherwise resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/`, where `<workspace-slug>` comes from the stable workspace basename.

Reuse only a matching `draft`; use the first unused numeric suffix for ready, blocked, or unrelated artifacts. Write `technical_design.md` in that directory and record `artifact_directory` plus a stable `task_id`. Preserve the exact absolute path in current task context across compaction; never guess among directories under the workspace root.

If the exact path is unavailable or conflicts with the request, return `DESIGN_BLOCKED`. On recovery, require the current-context path to match artifact directory, task id, and workspace. An existing but stale or wrong exact path is still blocked.

## Lifecycle

- `Design status: draft`: writing, input resolution, or review is incomplete.
- `Design status: ready`: the Technical Review Gate passed and the final artifact was returned to the caller.
- A material input or design change after readiness creates a new revision.
- Design status never changes Goal Contract, execution, or verification lifecycle.

## Canonical Schema

```md
# Technical Design

Design status: draft | ready
task_id: <stable task identifier>
artifact_directory: <absolute directory containing this file>
workspace: <stable workspace identity>
source_references:
- <user request, instruction, artifact, decision, code, test, or documentation source>

## Input Classification
### Authority facts
- <explicit attributable product, scope, or side-effect decision>

### Discovered facts
- <current-state fact and freshness/limitation>

### Design decisions
- <technical proposal and rationale>

## Proposed Technical Outcome
- <observable technical end state proposed for goal framing>

## Proposed Deliverables
- <behavior, file, component, interface, migration, or operational artifact>

## Proposed Boundaries and Constraints
### In scope
- <proposal>

### Out of scope
- <proposal or explicit authority fact>

### Constraints
- <compatibility, security, privacy, dependency, performance, style, rollout, or recovery constraint>

## Proposed Acceptance Evidence
| Outcome / deliverable | Design decision / component | Observer or test | Pass condition | Status |
| --- | --- | --- | --- | --- |

## Architecture
- <when touched or material>

## Components
- <ownership, changed modules, stable boundaries>

## Data Flow
- <input, transformation, output, failure and recovery path>

## Interfaces
- <API, command, event, prompt, artifact, or protocol changes>

## Data Models
- <schema/state changes, compatibility, migration>

## Persistence
- <when touched or material>

## Middleware
- <when touched or material>

## Infrastructure
- <when touched or material>

## External Dependencies
- <availability, versions, credentials, failure modes>

## Test Plan
- <outcome and risk coverage, including negative paths>

## Scalability and Performance
- <when touched or material>

## Rollout and Rollback
- <when touched or material; otherwise non-material basis>

## Risks and Unsupported Claims
- <risk, prevention, observer, recovery>
- <claim the available evidence cannot support>

## Open Design Gaps
| Gap id | Classification | Affected dimension | Owner | Next condition |
| --- | --- | --- | --- | --- |

## Review Record
- Result: draft | passed | failed
- Reviewed by: <self-review and independent reviewer when required>
- Reviewed at: <timestamp>
- Findings: <none or unresolved findings>
```

## Coverage Rules

Always include task identity, artifact directory, source references, Input Classification, Proposed Technical Outcome, Proposed Deliverables, Proposed Boundaries and Constraints, Proposed Acceptance Evidence, Risks and Unsupported Claims, Open Design Gaps, and Review Record.

Include architecture, components, data flow, interfaces, data models, persistence, middleware, infrastructure, external dependencies, test plan, scalability/performance, rollout/rollback, and cross-repository manifest only when touched or material. Include any dimension whose answer can change implementation, interfaces, data, dependencies, tests, rollout, rollback, security, privacy, performance, or risk handling. Do not create placeholder sections solely to satisfy a fixed template. Omit untouched dimensions unless recording `not touched` prevents ambiguity.

Write only attributable facts and explicit technical deductions. Keep unresolved required content marked `[blocking]`. A covered dimension records its proposal, boundary, implementation impact, evidence observer, and status. Useful probes include:

- architecture: changed structure, stable boundaries, and integration boundaries;
- components: owning modules and intentionally untouched modules;
- interfaces/data models: signature, command, event, prompt, protocol, schema, state, compatibility, and migration changes;
- data flow: input, transformation, output, failure, and recovery paths;
- persistence/middleware/infrastructure/dependencies: storage, runtime, versions, credentials, availability, and failure modes;
- tests: evidence for each proposed outcome and touched risk, including negative paths;
- scalability/rollout/rollback: material performance assumptions, release sequence, failure containment, and recovery.

Set `Design status: ready` only after Review Record is `passed`. A ready artifact remains a proposal until `alpha-goal` adopts its contents into an accepted Goal Contract. A supplied `DESIGN_READY` handoff can be consumed only when the Skip Gate does not return `SKIP`; validate its source, ready status, workspace, and absolute path, then adopt proposals explicitly.

## Route Packets

### DESIGN_INPUT_GAP

Return only the highest-impact authority-owned missing input:

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

### DESIGN_READY

Return this only after the Technical Review Gate passes:

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

The packet is input to goal engineering, not an accepted goal or execution authority.

### DESIGN_BLOCKED

Return the blocker, attributable evidence, affected dimensions, and smallest recovery condition. Keep `Design status: draft`.
