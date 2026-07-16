# Goal Contract Book

For `PERSIST` or an explicit goal reframe, `alpha-goal` alone writes canonical `goal-contract.md` in the resolved task directory. Once accepted, it is structured input to execution, verification, and optional Goal projection.

## Lifecycle and Integrity

- `draft`: clarification or confirmation is incomplete; target mutation is unauthorized.
- `accepted`: the recorded acceptance authority has confirmed a revision with no known infeasibility, unavailable required observer, unidentified claim surface, unmet prerequisite, or blocking gap.
- To change an accepted authority payload, first satisfy the owner handoff in `SKILL.md`; then reopen as `draft`, increment `contract_revision` once, and invalidate prior verdicts. Further edits while that revision remains draft, including its Confirmation Record, do not increment it again.
- Mark the authority payload with the exact boundary comments in the template. Resolve `<alpha-goal-root>` as the directory containing the selected `alpha-goal/SKILL.md`; never resolve from the workspace or process CWD. On acceptance, run `node <alpha-goal-root>/scripts/authority-digest.js <absolute-goal-contract-path>` and record its SHA-256 as `accepted_authority_sha256`.
- `executor` and `verifier` recompute that digest on entry. A mismatch or missing digest invalidates acceptance and blocks use of the contract; only an explicit goal change may start a reframe. New contracts use `contract_format: 2`, for which the two material-design/touched-risk completeness rows are mandatory. Any present unsupported format is invalid. A missing format is legacy-readable only through an existing checkpoint already bound to the same task, revision, and accepted digest; it cannot initialize a new checkpoint or first handoff and gains no inferred authority.

## Minimum Contract

```md
# Goal Contract

status: draft
contract_revision: 1
<!-- authority-payload:start -->
contract_format: 2
persistence_trigger:
- <observed condition that requires persistence>
workspace_identity: <canonical workspace identity>

## Authorization Source
- Desired behavior authority: <who/source>
- Side-effect authority: <who may authorize which effects>
- Acceptance authority: <who may accept this revision>
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
- Executor may decide: <mechanical choices>
- Authority retains: <behavior, data, interface, migration, rollout, acceptance, and risk choices>

## Material Design Decisions
| Authority-retained dimension | Authorized decision / boundary / source | Execution / observer consequence | Risk / rollback / recovery | Status |
| --- | --- | --- | --- | --- |

Include only authority-retained decisions that can change behavior, interfaces/API, data contracts/models, migration/rollout, security/privacy, externally visible performance/SLOs, or risk/recovery boundaries. Architecture, components, dependency selection, and test implementation remain executor-owned mechanics unless the authority explicitly retains them. Each covered/deferred row cites the relevant authority decision source and date. Use `covered`, `non-material`, or authority-deferred `non-goal`; any unresolved row keeps the contract `draft`.

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
- Accepted revision: <revision or none>
- Supersession basis: <initial | explicit reframe | explicit terminal revision request>
- Conditions: <explicit conditions or none>
<!-- authority-payload:end -->

## Integrity Record
- accepted_authority_sha256: <sha256 or none>
```

Add only material sections. Keep authority- or acceptance-changing additions inside the payload.

## Authority Rules

- Treat code, tests, docs, issues, and history as descriptive unless an authorized source makes them normative.
- Never promote a proposal, convenience, silence, historical behavior, or agent suggestion into authorization.

## Boundary and Evidence Rules

- Describe observable outcomes rather than prescribing implementation steps unless the process is itself required.
- Give every criterion a stable ID, direct observer, pass condition, and any freshness or invalidation rule. Map each touched risk to an observer or test plan beyond an unrelated or happy-path-only check; execution evidence is collected later by executor/verifier.
- State identity must cover every mutable surface relevant to the criterion. Examples include workspace/repository, HEAD, index/dirty/untracked content, artifact digest, remote ref or PR revision, and external observation time.
- For migration, external/destructive effects, or irreversible state, record rollback, roll-forward, or recovery authority and its observer; otherwise record why recovery is non-material.
- If a required surface cannot be identified or refreshed, keep `draft` until the acceptance authority narrows the claim or authorizes an observer; verifier never narrows an accepted claim.
