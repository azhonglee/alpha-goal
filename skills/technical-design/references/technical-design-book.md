# Technical Design Book

Write the canonical `technical_design.md` before goal framing. It is a reviewed technical proposal and handoff source, not execution authority.

## Lifecycle

- `Design status: draft`: writing, input resolution, or review is incomplete.
- `Design status: ready`: the Technical Review Gate passed and the final artifact was returned to the caller.
- A material input or design change after readiness creates a new revision.
- Design status never changes Goal Contract, native goal, execution, or verification lifecycle.

## Canonical Shape

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

Include architecture, components, data flow, interfaces, data models, persistence, middleware, infrastructure, external dependencies, test plan, scalability/performance, rollout/rollback, and cross-repository manifest only when touched or material.

Include any dimension whose answer can change implementation, interfaces, data, dependencies, tests, rollout, rollback, security, privacy, performance, or risk handling. Do not create placeholder sections solely to satisfy a fixed template.

Set `Design status: ready` only after Review Record is `passed`. The ready artifact remains a proposal until `alpha-goal` adopts its contents into an accepted Goal Contract. A supplied DESIGN_READY handoff forces PERSIST if any proposal is consumed; DIRECT must ignore the design completely.
