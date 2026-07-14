# Goal Contract Book

Use only for a `PERSIST` task or an authority return. Write the canonical contract to the resolved Alpha Goal task directory as `goal-contract.md`. `alpha-goal` is its only writer.

## Lifecycle

- `draft`: clarification or confirmation is incomplete; target mutation is unauthorized.
- `accepted`: the recorded confirmation authorizes execution within the contract boundaries.
- Increment `contract_revision` for every material authority change. Reopen as `draft`, invalidate prior verdicts, and confirm again.
- Repository specs may link to the contract, but do not silently replace its authority.

## Minimum Contract

```md
# Goal Contract

status: draft
contract_revision: 1
persistence_trigger: <material ambiguity | risky side effect | recovery | audit requirement>

## Authorization Source
- Who defines desired behavior and which source wins on conflict.

## Intent and Observable Outcome
- Why the work matters and the final state an observer can see.

## Scope / Non-goals / Material Constraints
- Included behavior, explicit exclusions, and invariants.

## Execution and Side-effect Boundary
- Allowed files, commands, systems, credentials, environments, and side effects; crossings that require confirmation.

## Decision Boundary
- Mechanical choices the executor may make and product/risk choices reserved for authority.

## Claim Boundary
- Claims the available observers support and claims that remain caveated.

## Success Criteria and Acceptance Evidence
| ID | Falsifiable criterion | Observer / pass condition |
| --- | --- | --- |

## Confirmation Record
- Decision, source, date, accepted revision, and any explicit conditions.
```

Add only when material: current technical context, design decisions, dependencies, rollout/rollback, recovery requirements, discovery notes, or a cross-repository manifest.

## Authority Rules

- Record explicit user decisions, authoritative specs/issues, and source precedence under Authorization Source.
- Treat code, tests, docs, and repository history as descriptive unless an authority source makes them normative.
- Inspect current facts before asking; label unavailable material context as blocking.
- Never promote a proposed answer, implementation convenience, or subagent suggestion into authority.

## Boundary Rules

- Outcome describes an observable end state, not an implementation technique.
- Scope describes included behavior; non-goals require explicit exclusion.
- Constraints distinguish an acceptable solution from a symptom-only fix.
- The execution boundary identifies allowed mutations and side effects.
- The decision boundary separates authorized mechanics from behavior, data, interface, migration, rollout, acceptance, and risk choices.
- The claim boundary keeps proxy evidence from becoming an absolute safety, performance, compatibility, or deployment claim.

## Acceptance Rules

- Give every success criterion a stable ID and a falsifiable pass condition.
- Map each criterion to a direct observer: command, test, runtime observation, artifact, diff, benchmark, or explicit review.
- Name proxy evidence and residual uncertainty when direct proof is unavailable.
- Do not use confidence, effort, question count, or “looks correct” as evidence.

## Confirmation Readiness

Before requesting acceptance, ensure:

- no blocking material decision remains;
- source conflicts and authorization are explicit;
- executor actions, forbidden work, and confirmation crossings are clear;
- every criterion maps to an observer;
- the final claim cannot exceed the defined evidence.
