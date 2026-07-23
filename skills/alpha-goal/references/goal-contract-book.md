# Goal Contract Book

For `PERSIST`, `alpha-goal` compiles canonical `goal-contract.md` from the user's raw request, higher-priority instructions, attributable discovered facts, and explicit authority decisions. It owns structuring; callers do not need to provide a prebuilt schema.

The contract is an execution-facing instruction artifact. Make the desired end state measurable, name the verification surface, state hard constraints explicitly, and define an unambiguous finish line. Prefer concise structured sections over narrative history.

## Authoring Principles

1. **Outcome first.** State one observable objective before implementation detail.
2. **Concrete deliverables.** Name the files, behaviors, artifacts, or external results expected.
3. **Hard boundaries.** Separate scope, non-goals, constraints, and permitted side effects.
4. **Falsifiable acceptance.** Every criterion must be pass/fail, not aspirational.
5. **Explicit verification surface.** Name the command, observer, artifact, or inspection path for each criterion.
6. **Clear finish line.** Completion requires all required criteria passed, no blocking gap, no authority drift, and final verification on the delivered state.
7. **No invented detail.** Derive facts and consequences when entailed, but unknown authority-owned decisions keep the contract `draft`; do not fill them with defaults or recommendations.

## Lifecycle

- `status: draft`: required execution information or authority is incomplete; target mutation is unauthorized.
- `status: accepted`: the contract is complete, executable, and ready for handoff.
- Never return an accepted contract to `draft` or replace its accepted contents. A material objective or authority change starts a new task directory and Goal Contract.

## Canonical Template

```md
# Goal Contract

status: draft
workspace: <canonical workspace identity>
source_references:
- <attributable source path, URL, user decision, or current-thread reference>

## Objective
- <one measurable, observable final outcome>

## Deliverables
- <required behavior, file, artifact, integration, or external result>

## Boundaries
### In scope
- <included behavior and surfaces>

### Out of scope
- <explicit non-goals>

### Constraints
- <compatibility, security, privacy, dependency, performance, style, rollout, or policy invariants>

### Permitted side effects
- <allowed files, commands, systems, credentials, environments, external writes, and approval crossings>

## Acceptance Criteria
| ID | Required pass/fail condition |
| --- | --- |
| AC-1 | <falsifiable condition> |

## Verification
| Criterion | Observer / command / artifact | Pass condition | Freshness / invalidation |
| --- | --- | --- | --- |
| AC-1 | <exact verification surface> | <observable result> | <when evidence becomes stale> |

## Authority and Approvals
- Desired behavior authority: <who/source>
- Side-effect authority: <who may authorize which effects>
- Executor autonomy: <decisions delegated to executor>
- Reserved decisions: <decisions requiring return to alpha-goal>

## Risks and Recovery
- Material risks: <risk and treatment, or none>
- Rollback/recovery: <required recovery path, or non-material with basis>
- Unsupported claims: <claims unavailable from the verification surface>

```

## Required Protocol

- `status` is the sole lifecycle field. Required content is `workspace`, at least one attributable `source_references` entry, Objective, Boundaries, Acceptance Criteria, Verification, desired-behavior authority, and executor autonomy. Include Deliverables only when material.
- `source_references` identifies attributable inputs without requiring a producer or filename. Do not copy interview transcripts, discovery notes, or rejected alternatives into the contract.
- Every acceptance criterion must map to an observer, and proxy evidence must not be presented as proof. Every observer must support a criterion or material risk.
- Material permitted side effects require attributable side-effect authority. Material or irreversible risk requires treatment and rollback/recovery; otherwise record a compact non-material basis.
