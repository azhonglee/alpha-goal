---
name: meta-synthesis
description: "Apply meta-synthesis to complex engineering or socio-technical systems: integrate qualitative judgment, quantitative evidence, stakeholder constraints, models, contradictions, and user-owned decisions before forming a Goal Contract."
---

# Meta Synthesis

Use this skill when the problem behaves like a complex system rather than a simple implementation task. It helps synthesize goals and decision boundaries before `alpha-goal`, `system-model`, or `loop` proceeds.

## When to use

Use when the request includes:

- multiple stakeholders with conflicting objectives;
- weakly quantified success, qualitative preferences, or strategic tradeoffs;
- high uncertainty, incomplete data, or changing environment;
- broad architecture, migration, organizational workflow, safety, compliance, research, or product strategy;
- many interacting subsystems where optimizing one part can destabilize another;
- need to combine expert judgment, empirical evidence, models, and scenario analysis.

Do not use for localized low-risk tasks with clear acceptance and direct evidence.

## Boundaries

- Do not mutate implementation files, deploy, push, repair data, or claim final completion.
- Do not invent stakeholder preferences or user-owned risk decisions.
- Do not treat a synthesis as implementation authorization. Convert the selected direction into a Goal Contract via `alpha-goal` before mutation.
- Separate facts, expert judgments, assumptions, hypotheses, scenarios, and decisions.
- When a Closed-loop Ledger exists, update only synthesis-relevant state: objective conflicts, user-owned decisions, scenario assumptions, and the recommended route.

## Process

```text
Triage complexity -> Collect perspectives -> Build synthesis map -> Resolve decisions -> Produce synthesis record -> Route
```

### 1. Triage complexity

Classify the problem:

- `simple`: known goal, known path, direct evidence; route out.
- `complicated`: many parts but decomposable with stable objective; use `system-model` or `alpha-goal`.
- `complex`: feedback, adaptation, ambiguity, or conflicting goals; continue synthesis.
- `complex-giant-like`: many subsystems, human decisions, weak observability, high stakes, and no single complete model; use full synthesis and explicit human decision gates.

### 2. Collect perspectives

For each relevant perspective, record:

- objective or concern;
- evidence, model, or expertise basis;
- uncertainty and assumptions;
- conflict with other perspectives;
- decision owner;
- evidence that could change the decision.

Perspectives may include user, customer, operations, security, legal/compliance, engineering, data, UX, research, maintainability, cost, delivery, and long-term strategy.

### 3. Build synthesis map

Create a qualitative-quantitative map:

```text
Synthesis Map:
- System purpose:
- Candidate objectives:
- Constraints:
- Stakeholders and decision owners:
- Subsystems and interactions:
- Key state variables:
- Available evidence and confidence:
- Missing evidence:
- Conflicts/tradeoffs:
- Scenarios:
- Stability risks:
- Candidate control strategies:
```

Use quantitative evidence when available, but do not force false precision. Qualitative judgments must be labeled and tied to the owner or source.

### 4. Resolve decisions

Identify:

- decisions the agent can recommend;
- decisions the user must make;
- risks requiring explicit acceptance;
- non-goals that stabilize the effort;
- minimum viable next contract;
- evidence needed before irreversible action.

If a stakeholder conflict cannot be resolved, return a decision request rather than choosing silently.

### 5. Produce synthesis record

Compact output:

```text
Meta-Synthesis Record:
- Complexity class:
- Core tension:
- Integrated view:
- Recommended direction:
- User-owned decisions:
- Non-goals:
- Evidence needed:
- Route:
```

Full output:

```text
Meta-Synthesis Record:
- Complexity class:
- System purpose:
- Stakeholders / perspectives:
- Evidence and models:
- Qualitative judgments:
- Quantitative signals:
- Contradictions and tradeoffs:
- Scenarios:
- Candidate strategies:
- Recommended direction:
- Decision boundaries:
- Risks and explicit acceptances:
- Minimum viable Goal Contract candidate:
- Ledger update:
- Route:
```

### 6. Route

- Route to `alpha-goal` when a stable recommended direction can become a Goal Contract.
- Route to `system-model` when subsystem boundary or feedback signals remain unclear.
- Route to user when a user-owned decision, risk acceptance, budget/timeline tradeoff, or stakeholder priority is required.
- Route to `loop` only if a valid Goal Contract already exists and synthesis merely narrowed the next slice without changing authorization.
