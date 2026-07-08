Read this only when Technical Design coverage is required: implementation, repair, refactor, hardening, cross-file behavior changes, interface/data-model changes, or material risk.

# Design Clarification Book

## Purpose

Keep `SKILL.md` focused on goal clarification. Use this reference for design-specific question targeting, coverage, and Review Gate checks.

## Design Priority

| Priority | Dimension |
| --- | --- |
| 1 | Architecture, Components, Data Flow, Interfaces/API, Data Models |
| 2 | Persistence, Middleware, Infrastructure, External Dependencies |
| 3 | Test Plans, Scalability, Risks, Rollback |

## Design Probes

- Architecture: what structure changes, stays stable, or becomes the integration boundary?
- Components: which modules own the change and which must remain untouched?
- Interfaces/API: which signatures, commands, events, prompts, or contracts change?
- Data Models: which schema, artifact, or state shape is created, changed, or preserved?
- Data Flow: what input, transformation, output, and recovery path must hold?
- Persistence/Middleware/Infrastructure: what storage, runtime, dependency, credential, or deployment assumption matters?
- Test Plans: what evidence proves each acceptance item and touched risk?
- Risks/Rollback: what failure mode, migration risk, compatibility issue, or rollback path matters?

## Coverage Rule

A design dimension is `covered` only when it records:
- decision
- boundary
- implementation impact
- acceptance/observer
- status

Keep a dimension `blocking` when a different answer could change code, interfaces, data, dependencies, tests, rollout, rollback, security, privacy, performance, or risk handling.

## Review Self-Check

Before approval:
- Required design dimensions have no blocking gap.
- Goal Contract success criteria map to Technical Design acceptance evidence.
- Interfaces, data models, and data flow are explicit when touched.
- Tests cover touched risk, not only happy path.
- Risks and rollback are either handled or explicitly non-material/deferred non-goal.
