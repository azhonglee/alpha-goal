---
name: technical-design
description: "Develop an optional bounded technical proposal before alpha-goal when the caller wants architecture options, interface or data consequences, rollout or recovery analysis, and validation mapping. Return reviewed non-authoritative design input; do not accept a goal, choose its route, or execute it."
---

# Technical Design

Develop a technically coherent proposal without converting it into authority. The output is candidate input for `alpha-goal`, not an accepted design or implementation mandate.

## Establish the Boundary

- Confirm the requested design question, source inputs, target surfaces, constraints, and required comparison depth.
- Inspect relevant code, contracts, tests, dependencies, and current state before designing.
- Treat an interview handoff, design document, or source path as evidence or a proposal only. A path alone creates no obligation to load, adopt, persist, or implement it.
- Do not choose `DIRECT` or `PERSIST`, define acceptance authority, mutate target state, call `executor` or `verifier`, or synchronize a Native Goal.

## Develop the Proposal

1. Restate the bounded problem and separate known facts, authority-owned requirements, assumptions, and unresolved decisions.
2. Identify material dimensions: architecture, components, interfaces/APIs, data contracts, dependencies, migration/rollout, security/privacy, performance/SLOs, recovery, and observers.
3. Compare only viable options. Explain tradeoffs, compatibility consequences, failure modes, and rollback or roll-forward needs.
4. Recommend an option only when evidence supports it; label decisions still owned by the relevant authority.
5. Map touched risks to candidate tests or observers and state what the proposal cannot prove.
6. For consequential or cross-cutting design, request independent read-only review from raw artifacts and resolve or record material findings.

Do not silently fill a missing product, scope, risk, rollout, or acceptance decision with a technical preference.

## Handoff

Return the handoff inline by default:

```md
## Technical Design Handoff
- Design question: <bounded problem>
- Sources and provenance: <facts, requirements, assumptions, and proposal authorship>
- Recommended proposal: <option and rationale>
- Alternatives and tradeoffs: <material comparison>
- Interface/data/rollout consequences: <changed or not touched>
- Risk, recovery, and observer mapping: <candidate treatment>
- Unresolved authority decisions: <none or explicit list>
- Adoption note: Non-authoritative input for alpha-goal; source references alone impose no obligation.
```

- Return inline by default. Write `technical_design.md` only when the caller states that routing and side-effect authorization are complete and supplies the exact output path; if the file exists, require explicit replacement authority. Never choose a path or treat the file as lifecycle state.
- Hand off to `alpha-goal`. That owner independently reconciles the content with facts and authority; only content it adopts into its Goal Frame, and for `PERSIST` into the explicitly accepted Goal Contract, can affect later work.
