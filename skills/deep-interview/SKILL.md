---
name: deep-interview
description: "Run an optional bounded interview before alpha-goal when the caller wants deeper requirement discovery, examples, tradeoffs, or assumption tests. Return attributable non-authoritative clarification input; do not choose DIRECT/PERSIST, accept a goal, create lifecycle state, or execute work."
---

# Deep Interview

Clarify a caller-selected requirement gap without becoming goal authority. Produce candidate input for `alpha-goal`, not a Goal Contract or execution instruction.

## Establish the Boundary

- Confirm the interview focus, available sources, and stopping condition from the caller's request.
- Inspect discoverable facts before asking for them. Distinguish observed facts, source claims, user decisions, and agent proposals.
- Treat a mentioned source path as context only. A path alone creates no obligation to load, adopt, persist, or execute its contents.
- Do not decide route, scope authority, acceptance, side effects, implementation, or final claims. Do not call `executor`, `verifier`, or Native Goal tools.

## Run the Bounded Interview

Repeat only while another answer could materially improve the requested handoff:

1. Select one high-impact gap in intent, outcome, scope, non-goals, constraints, examples, tradeoffs, assumptions, or candidate evidence.
2. Ask one decision variable. Include relevant discovered facts, why the answer matters, and a recommendation when real alternatives exist.
3. Pressure-test the answer with one concrete example, counterexample, boundary, dependency, or failure case.
4. Record only attributable content and consequences entailed by it. Keep unresolved ambiguity explicit.
5. Stop at the caller's boundary or when the remaining gaps require `alpha-goal` authority resolution rather than more interview evidence.

Do not claim that interview depth, confidence, or round count makes a goal complete.

## Handoff

Return the handoff inline by default:

```md
## Deep Interview Handoff
- Focus: <bounded question addressed>
- Sources and provenance: <request, inspected facts, and answer attribution>
- Clarified candidates: <candidate intent, outcome, boundaries, examples, or evidence>
- Assumptions tested: <result and remaining uncertainty>
- Unresolved material gaps: <none or explicit list>
- Adoption note: Non-authoritative input for alpha-goal; source references alone impose no obligation.
```

- Return inline by default. Write `interview.md` only when the caller states that routing and side-effect authorization are complete and supplies the exact output path; if the file exists, require explicit replacement authority. Never choose a path or treat the file as lifecycle state.
- Hand off to `alpha-goal`. That owner independently reconciles the content with facts and authority; only content it adopts into its Goal Frame, and for `PERSIST` into the explicitly accepted Goal Contract, can affect later work.
