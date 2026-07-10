# Goal Contract Book

Write the canonical Goal Contract to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`. Copy it to `docs/specs/` only when useful or required by repository convention. Keep `Contract status: draft` until user confirmation; repository copies are mirrors, and conflicts route back to `alpha-goal`.

## Required Content

- Contract status
- Authorization Source
- Technical Context
- Intent
- Outcome
- Success Criteria
- Acceptance evidence / Verification surface
- Boundaries
  - Scope
  - Non-goals
  - Constraints
  - Execution boundary
  - Decision boundary
  - Claim boundary

Use optional sections only when they improve execution safety or auditability: Root Cause for repairs, Discovery notes, Interview ledger, Repo surfaces, Confirmation route, Technical Design link, resolved assumptions, and dependency/integration order.

## Compact Template

```md
# Goal Contract

Contract status: draft

## Authorization Source
- [from-user/spec/issue] Who or what defines desired behavior and which source wins on conflict.

## Technical Context
- [from-code][auto-confirmed] Relevant current-state facts, files, tests, dependencies, and conflicts.
- [blocking] Material unavailable context, if any.

## Intent
- Why the user wants the work done.

## Outcome
- Observable end state.

## Success Criteria
- Falsifiable completion conditions.

## Acceptance evidence / Verification surface
- Observer, command, artifact, log, benchmark, diff, or explicit review for each criterion.

## Boundaries
### Scope
- Included behavior or problem.

### Non-goals
- Explicitly excluded adjacent work.

### Constraints
- Invariants that must remain true.

### Execution boundary
- Allowed files, commands, tools, systems, credentials, and side effects.

### Decision boundary
- Decisions the executor may make versus decisions requiring authority.

### Claim boundary
- Claims available evidence may support and claims that must remain caveated.
```

## Field Rules

### Authorization Source

Record the current user request, explicit answers, accepted revision, and any authoritative issue or spec. Name the winning source when code, docs, tests, and user instructions conflict. Code state alone cannot authorize desired behavior.

### Technical Context

Record only relevant observed behavior, files/components, tests or commands, dependencies, integration points, source conflicts, and material unavailable context. Inspect discoverable facts before asking the user; keep current-state facts descriptive unless Authorization Source gives them normative authority.

### Intent and Outcome

- Intent states the user's purpose and the tradeoff it protects.
- Outcome states the observable end state, not an implementation technique.
- Mark a material inferred intent as an assumption or ask for confirmation.

### Scope and Non-goals

- Scope identifies the included behavior or problem, not merely files to edit.
- Non-goals protect against adjacent work; `deferred-non-goal` requires explicit user or authoritative exclusion.
- If an excluded item becomes necessary for success, stop and return for authority.

### Constraints

Record applicable behavioral, compatibility, data, security/privacy, performance, dependency, style, rollout, or migration invariants. A constraint must distinguish an acceptable solution from one that solves the symptom but violates the contract.

### Success Criteria and Acceptance Evidence

- Make every criterion provable or falsifiable.
- Map every criterion to inspectable evidence: command output, test, runtime observation, log, benchmark, artifact, diff, or explicit review.
- Do not use confidence or “seems correct” as evidence.
- When exact proof is impossible, name proxy evidence and preserve the remaining uncertainty.

### Execution Boundary

State what may be touched or run: files, commands, services, credentials, environments, external systems, and side effects. Crossing this boundary requires confirmation.

### Decision Boundary

Separate local implementation mechanics from product, architecture, behavior, migration, rollout, and acceptance decisions. The executor may decide mechanics only when they do not alter meaning, risk, or public behavior.

### Claim Boundary

Define what final evidence permits the Agent to claim. Keep production safety, performance, compatibility, or deployment claims caveated unless their required observer is available. Never turn proxy evidence into absolute proof.

## Coverage Test

Before confirmation, verify:

- Every required field is present and has no blocking gap.
- Authorization Source resolves material source conflicts.
- Each covered dimension records its decision, boundary, execution impact, acceptance observer, and status.
- Every success criterion maps to acceptance evidence.
- The executor can identify allowed actions, forbidden work, user-owned decisions, and unsupported claims without reconstructing discovery.
