# Goal Contract Book

For `PERSIST`, `alpha-goal` alone writes canonical `goal-contract.md` in the resolved task directory. Same-day name collisions use the first unused numeric suffix; accepted or terminal directories are never reused. Once accepted, it is the canonical authority artifact for subsequent work. Optional `deep-interview` and `technical-design` handoffs remain non-authoritative inputs even when stored on disk. Their source paths alone impose no obligation; only material content deliberately adopted into the contract and explicitly accepted can constrain execution.

## Lifecycle and Integrity

- `draft`: clarification or confirmation is incomplete; target mutation is unauthorized.
- `accepted`: the recorded acceptance authority has explicitly confirmed the complete contract with no known infeasibility, unavailable required observer, unidentified claim surface, unmet prerequisite, or blocking gap.
- Never return an accepted contract to `draft` or edit it in place. A material goal or authority change terminates that task; start a new task directory and Goal Contract.
- Every adopted handoff statement that can affect outcome, scope, constraints, design, risk, evidence, or execution must be represented explicitly in the contract before acceptance; a link or path outside the contract is context, not incorporation.
- Contract identity means the canonical task directory, absolute `goal-contract.md` path, workspace/repository set, and Confirmation Record source/date. It identifies the accepted task but does not detect in-place content tampering; immutability is a protocol requirement.
- A first handoff or new checkpoint requires all current mandatory rows. Earlier accepted contracts may resume only through an existing checkpoint that records that same identity; infer no missing authority from legacy metadata.

## Minimum Contract

```md
# Goal Contract

status: draft
persistence_trigger:
- <observed condition that requires persistence>
workspace_identity: <canonical workspace identity>

## Authorization Source
- Desired behavior authority: <who/source>
- Side-effect authority: <who may authorize which effects>
- Acceptance authority: <who may accept this contract>
- Source precedence: <task-level conflicts only; never override higher-priority instructions or tool policy>

## Intent and Observable Outcome
- <why the work matters and the final state an observer can see>

## Scope / Non-goals / Material Constraints
- Scope: <included behavior and surfaces>
- Non-goals: <explicit exclusions>
- Constraints: <invariants that distinguish an acceptable solution>

## Execution and Side-effect Boundary
- <allowed files, commands, systems, credentials, environments, and side effects>
- <crossings that require confirmation>

## Prerequisites and Feasibility Basis
- Required dependencies/conditions: <current attributable availability evidence>
- Plausible authorized path: <basis, not an implementation prescription>
- Known blockers: <none or keep draft>

## Decision Boundary
- Authority retains: <behavior, data, interface, migration, rollout, acceptance, and risk choices with authority source; none if no material design is retained>

## Material Design Decisions
| Authority-retained dimension | Authorized decision / boundary / source | Execution / observer consequence | Risk / rollback / recovery | Status |
| --- | --- | --- | --- | --- |

## Claim Boundary
- Supported claims: <what available observers can prove>
- Unsupported claims: <what remains caveated>

## Success Criteria and Acceptance Evidence
| ID | Falsifiable criterion | Observer / pass condition | Freshness / invalidation |
| --- | --- | --- | --- |

## Acceptance Completeness
- Required observers available as_of: <attributable evidence>
- Claim surfaces identified: <identity coverage>
- Prerequisites satisfied: <attributable evidence>
- Feasibility basis current: <attributable evidence>
- Authority-retained material design coverage as_of: <complete or no retained material decisions; attributable basis>
- Touched-risk observer/test-plan and rollback/recovery mapping as_of: <covered or non-material; attributable basis>
- Blocking gaps: none

## Confirmation Record
- Decision: <accepted | refined | rejected>
- Source and date: <explicit acceptance authority decision>
- Conditions: <explicit conditions or none>
```

Add only material sections. Do not edit an accepted contract; material changes start a new task.

## Authority Rules

- Treat code, tests, docs, issues, history, interview handoffs, and technical proposals as descriptive unless an authorized source makes them normative.
- A filename, directory, URL, attachment, or handoff instruction identifies a source; it does not adopt that source or create an execution obligation.
- For each optional handoff, reconcile provenance and conflicts, then copy adopted material into the applicable contract fields. Do not use an external reference as a substitute for explicit contract content.
- Never promote a proposal, convenience, silence, historical behavior, or agent suggestion into authorization.

## Material Design Rules

- Include only authority-retained decisions that can change behavior, interfaces/APIs, data contracts/models, migration/rollout, security/privacy, externally visible performance/SLOs, or risk/recovery boundaries.
- Cite the relevant authority decision source and date for every covered or deferred row.
- Use `covered`, `non-material`, or authority-deferred `non-goal`; any unresolved row keeps the contract `draft`.

## Boundary and Evidence Rules

- Describe observable outcomes rather than prescribing implementation steps unless the process is itself required.
- Give every criterion a stable ID, direct observer, pass condition, and any freshness or invalidation rule. Map each touched risk to an observer or test plan beyond an unrelated or happy-path-only check; execution evidence is collected after acceptance.
- State identity must cover every mutable surface relevant to the criterion. Examples include workspace/repository, HEAD, index/dirty/untracked content, remote ref or PR revision, and external observation time.
- For migration, external/destructive effects, or irreversible state, record rollback, roll-forward, or recovery authority and its observer; otherwise record why recovery is non-material.
- If a required surface cannot be identified or refreshed, keep `draft` until the acceptance authority narrows the claim or authorizes an observer; an accepted claim cannot be narrowed during verification.
