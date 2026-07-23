# Goal Contract Book

For `PERSIST`, `alpha-goal` compiles canonical `goal-contract.md` from the user's raw request, higher-priority instructions, attributable discovered facts, and explicit authority decisions. It owns structuring; callers do not need to provide a prebuilt schema.

The contract is an execution-facing instruction artifact. Following OpenAI goal and prompting principles, make the desired end state measurable, name the verification surface, state hard constraints explicitly, and define an unambiguous finish line. Prefer concise structured sections over narrative history.

## Authoring Principles

1. **Outcome first.** State one observable objective before implementation detail.
2. **Concrete deliverables.** Name the files, behaviors, artifacts, or external results expected.
3. **Hard boundaries.** Separate scope, non-goals, constraints, and permitted side effects.
4. **Falsifiable acceptance.** Every criterion must be pass/fail, not aspirational.
5. **Explicit verification surface.** Map each criterion to a command, observer, artifact, or inspection path; distinguish proof from proxy evidence.
6. **Clear finish line.** Completion requires all required criteria passed, no blocking gap, no authority drift, and final verification on the delivered state.
7. **Minimal context.** Record compact `source_references` instead of copying discovery transcripts or narrative history. Include only decisions that constrain execution or claims.
8. **No invented detail.** Derive facts and consequences when entailed, but unknown authority-owned decisions keep the contract `draft`; do not fill them with defaults or recommendations.
9. **Native-goal optimized.** The accepted contract must support a compact native goal objective with an observable Outcome, required completion conditions, high-impact Constraints, Evidence, and canonical Contract path.

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
- A preceding design is provenance, not authority. Record a ready design source as `technical-design: <absolute path>` only after status, workspace, and path validation. Binding design constraints must also appear explicitly in the contract.
- Every acceptance criterion must map to an observer. Every observer must support a criterion or material risk.
- Material permitted side effects require attributable side-effect authority. Material or irreversible risk requires treatment and rollback/recovery; otherwise record a compact non-material basis.
- Keep `draft` while required information, authority, observers, prerequisites, feasibility, claim surfaces, or material risk treatment is unresolved. Set `status: accepted` last after these checks pass; do not require a separate confirmation ceremony.
