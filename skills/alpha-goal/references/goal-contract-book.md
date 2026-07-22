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

- `status: draft`: compilation or Self-Review is incomplete; target mutation is unauthorized.
- `status: accepted`: alpha-goal passed the Self-Review Gate, completed the Self-Review Record, and satisfied the Readiness Gate.
- Never return an accepted contract to `draft` or replace its accepted contents. A material objective or authority change starts a new task directory and Goal Contract.

## Canonical Template

```md
# Goal Contract

status: draft
issued_by: alpha-goal
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
| ID | Required pass/fail condition | Priority |
| --- | --- | --- |
| AC-1 | <falsifiable condition> | required |

## Verification
| Criterion | Observer / command / artifact | Pass condition | Freshness / invalidation |
| --- | --- | --- | --- |
| AC-1 | <exact verification surface> | <observable result> | <when evidence becomes stale> |

## Authority and Approvals
- Desired behavior authority: <who/source>
- Side-effect authority: <who may authorize which effects>
- Self-review owner: alpha-goal
- Executor autonomy: <decisions delegated to executor>
- Reserved decisions: <decisions requiring return to alpha-goal>
- Source precedence: <task-level conflict rule; higher-priority instructions/tool policy remain invariant>

## Risks and Recovery
- Material risks: <risk and treatment, or none>
- Rollback/recovery: <required recovery path, or non-material with basis>
- Unsupported claims: <claims unavailable from the verification surface>

## Readiness Gate
- Prerequisites available: <yes with evidence>
- Required observers available: <yes with evidence>
- All required criteria mapped to verification: yes
- Material risks mapped to prevention/recovery: yes | non-material
- Blocking gaps: none

## Self-Review Record
- Result: <passed | failed>
- Reviewed by: alpha-goal
- Reviewed at: <ISO-8601 timestamp>
- Checks: <criteria mapping; observer availability; authority completeness; source conflicts; risk/recovery; blocker scan; independent review when required>
- Findings: <none, or unresolved findings that keep status draft>
```

## Required Protocol

- `status`, `issued_by`, `workspace`, `source_references`, and every contract section are required for first handoff.
- `issued_by` must equal `alpha-goal`.
- `source_references` must identify attributable inputs without requiring any specific producer or filename; the contract must not include interview logs, question/answer transcripts, discovery notes, or rejected alternatives.
- A preceding design is provenance, not authority. Record a ready design source as `technical-design: <absolute path>` only after status, workspace, and path validation. Any design constraint that binds execution or acceptance must also appear explicitly inside the Goal Contract; source reference alone creates no obligation.
- `status` is the sole contract lifecycle field.
- Acceptance Criteria and Verification must have a total mapping: every required criterion has at least one observer and every observer supports a named criterion or risk.
- Keep `draft` when a required observer is unavailable, a prerequisite is unmet, a claim surface is unidentified, feasibility is unknown, or a material authority decision remains unresolved.
- Complete the Self-Review Record with `Result: passed`, then set `status: accepted` last. Self-review is the only route to `accepted`; never require a separate user confirmation of the compiled contract.
