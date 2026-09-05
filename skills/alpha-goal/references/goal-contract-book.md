# Goal Contract Book

Read this reference for non-`SKIP` artifact resolution, Goal Input Gap reporting, canonical schema, and field-level acceptance rules. Alpha Goal owns the structure; callers do not need to provide a prebuilt schema.

## Draft Resolution and Recovery

Before full inspection or the first question, resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` from the stable workspace basename. Use an exact task directory supplied by attributable context; otherwise create a new directory.

Create or recover the matching canonical `goal-contract.md` as `draft`. Reuse a matching draft; if the name contains an accepted, terminal, or unrelated task, use the first unused numeric suffix. Write only known facts, their sources, and the current highest-impact gap. Do not mutate the target.

## Goal Input Gap Report

When a material authority-owned decision cannot be discovered or derived, return one highest-impact report:

```text
Gap id:
Affected goal field:
Known facts and sources:
Why the gap changes execution, risk, or evidence:
Decision owner:
Smallest next decision variable:
Recommendation, if useful:
```

Use the report to frame the next question; do not require the user to fill it out or reproduce the workflow. Ask one decision variable, then pressure-test the answer. Before pausing or asking again, update applicable contract fields and the next highest-impact gap. Stop only when no unresolved answer could materially change objective, scope, non-goals, side effects, design, acceptance, risk treatment, or evidence.

## Authoring Principles

1. State one observable objective before implementation detail.
2. Name material files, behaviors, artifacts, integrations, or external results.
3. Separate scope, non-goals, constraints, and permitted side effects.
4. Make every acceptance criterion falsifiable.
5. Name the command, observer, artifact, or inspection path for every criterion.
6. Define completion as all required criteria passed, no blocking gap or authority drift, and final verification on the delivered state.
7. Derive facts only when attributable sources entail them; unknown authority-owned decisions keep the contract `draft`.

## Lifecycle

- `status: draft`: required execution information or authority is incomplete; target mutation is unauthorized.
- `status: accepted`: the contract is complete, executable, and ready for handoff.
- `status` is the sole lifecycle field.
- Never return an accepted contract to `draft` or replace its accepted contents. A material objective or authority change starts a new task directory and Goal Contract.
- A draft may contain `Unresolved Gaps` only as a recovery cursor: keep the current highest-impact gap, known sources, and next decision variable; never store a transcript.
- Before acceptance, adopt every material gap conclusion into standard fields and remove `Unresolved Gaps`.

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

<!-- Draft only; remove before acceptance. -->
## Unresolved Gaps
- <current highest-impact gap, known sources, and next decision variable>
```

## Field and Acceptance Rules

- Required content is `workspace`, at least one attributable `source_references` entry, Objective, Boundaries, Acceptance Criteria, Verification, desired-behavior authority, and executor autonomy. Include Deliverables only when material.
- `source_references` identifies attributable inputs without requiring a producer or filename. Do not copy interview transcripts, discovery notes, or rejected alternatives into the contract.
- Retain the attributable source and authority boundary for every material field, and resolve source conflicts by precedence.
- Record a validated design source as `technical-design: <absolute path>`. Each adopted design constraint belongs in Deliverables, Boundaries, Acceptance Criteria, Verification, or Risks and Recovery; a reference alone imposes no obligation.
- Every acceptance criterion maps to an available observer. Proxy evidence is not proof, and every observer must support a criterion or material risk.
- Identify every claim surface and prerequisite. Record evidence freshness and invalidation for changeable surfaces.
- Material permitted side effects require attributable side-effect authority.
- Material or irreversible risk requires treatment and rollback/recovery; otherwise record a compact non-material basis.
- Complete authority-retained decisions and their risk/observer treatment before acceptance.
- Keep `draft` while any known infeasibility, unavailable observer, unidentified claim surface, unmet prerequisite, incomplete authority coverage, source conflict, or material finding remains.
- No blocking gap may reach acceptance, handoff, or target mutation.
- Set `status: accepted` last, only after all checks pass.
