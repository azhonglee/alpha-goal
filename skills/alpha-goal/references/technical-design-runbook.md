Read this only after Goal Contract Confirmation Gate selects `run technical design`.
This runbook owns Technical Design clarification, review, confirmation, Native Goal Sync, and executor handoff; do not return to `SKILL.md`.

# Technical Design Runbook

## Entry Contract

- Load the current task's `goal-contract.md`.
- Require `Contract status: design-authorized`.
- Treat the Goal Contract as authority for target, scope, constraints, non-goals, decision boundary, claim boundary, authorization source, and acceptance evidence.
- Do not redefine the Goal Contract from implementation convenience.
- If technical discovery reveals a Goal Contract gap, record it as blocking and ask the user to revise that contract field inside this runbook before continuing.

## Technical Clarification Gate

Do not leave Technical Clarification while any material design gap remains:
- Technical Design coverage is material-first, not fixed-template-first.
- Always cover: acceptance evidence mapping, and Risks or a non-material risk note.
- Cover Architecture, Components, Data Flow, Interfaces/API, Data Models, and Test Plans only when touched or material.
- Cover Persistence, Middleware, Infrastructure, External Dependencies, Scalability, and Rollback only when touched or material.
- Every unresolved unknown is classified as `blocking`, `non-material`, or `deferred non-goal`.
- A design dimension is covered only when it records decision, boundary, implementation impact, acceptance/observer, and status.

Keep a gap `blocking` when a different answer could change code, interfaces, data, dependencies, tests, rollout, rollback, security, privacy, performance, or risk handling.

## Technical Clarification

Best practice you need to follow:
- SOLID, DRY, KISS, YAGNI, SoC

Ask one high-leverage technical question per round.
- Do not ask for discoverable facts.
- Present options conversationally with recommendation and reasoning.
- Use `request_user_input` or equivalent structured input.
- Ask another round for the same dimension when the answer lacks boundary, implementation impact, evidence, or risk treatment.

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

Prompt format:

```text
Technical Design Round {n} | Target: {dimension} | Gap: {blocking|non-material|deferred}
Why this blocks: ...
Decision needed: ...
Recommended option: ...
Question: ...
Coverage cells affected: decision / boundary / implementation impact / acceptance observer
```

## Write Technical Design

Follow `technical-design-book.md` to write `<Alpha Goal state root>/YYYYMMDD-<TaskName>/technical_design.md`.
Link the Goal Contract and Technical Design to each other.
Keep `Design status: draft` until Technical Design Confirmation Gate approves it.
Write only from answered, auto-confirmed, or cited facts. Keep unresolved required fields as `[blocking]`.
Omit untouched dimensions, or record `not touched` only when omission would create ambiguity.

## Technical Review Gate

Self-check before confirmation:
- Goal Contract fields still bound the design; no scope, authority, or claim boundary drift.
- Required, touched, or material design dimensions have no blocking gap.
- Architecture, Components, Interfaces/API, Data Models, Data Flow, and Test Plans are explicit when touched.
- Goal Contract success criteria map to Technical Design acceptance evidence.
- Tests cover touched risk, not only happy path.
- Risks and rollback are either handled or explicitly non-material/deferred non-goal.

Run independent review for non-trivial implementation, repair, refactor, hardening, or cross-file behavior changes:
- Prefer a subagent review when available; if skipped, record the reason.
- Pass raw Goal Contract, Technical Design, and user request.
- Require the reviewer to check missing design detail, missing acceptance mapping, authority drift, and premature implementation risk.
- Fix accepted findings before confirmation.

Present this summary before asking for approval:

```markdown
### Technical Design Summary
**Goal Contract**
...
**Touched design dimensions**
...
**Interfaces/Data changed / not touched**
...
**Test evidence**
...
**Risks/Rollback**
...
```

## Technical Design Confirmation Gate

Use `request_user_input` or equivalent structured input to ask for approve/launch, refine technical design, or reject.
- On approve/launch: semantically confirm the Technical Design still implements the current Goal Contract; if the contract changed materially, return to Technical Clarification. Otherwise set `Contract status: accepted`; set `Design status: accepted`; perform Native Goal Sync; record its target and result in checkpoint; hand off to `executor` skill.
- On refine technical design: keep `Design status: draft`; continue Technical Clarification.
- On reject: keep `Contract status: design-authorized`, set `Design status: rejected`, and do not create or change native goals.

## Native Goal Sync

Native Goal Sync is a lifecycle side effect, not design authority.
- Before approve/launch, do not invoke `create_goal`.
- On approve/launch, call `get_goal` before creating a new native goal.
- If no unfinished active native goal exists, invoke `create_goal` with an objective built from the Goal Contract artifact and Technical Design linked.
- If an unfinished active native goal already represents the same accepted contract and design, continue to `executor` skill.
- If an unfinished active native goal conflicts with the accepted contract or design, do not overwrite, clear, pause, replace, or repurpose it; do not hand off to `executor` as synced. Record a blocking sync conflict for user decision.
- If Native Goal Sync fails, record the gap or blocker in the task artifact or checkpoint; do not treat sync failure as permission to redefine scope, acceptance, authority, design, or hand off as synced.
