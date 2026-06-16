---
name: decision-synthesis
description: "Apply decision-synthesis to complex engineering or socio-technical systems: integrate qualitative judgment, quantitative evidence, stakeholder constraints, models, contradictions, and user-owned decisions before forming a Goal Contract."
---

# Decision Synthesis

Use this skill when the problem behaves like a complex system rather than a simple implementation task. It helps synthesize goals and decision boundaries before `goal-contract`, `system-model`, or `control-loop` proceeds.

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
- Do not treat a synthesis as implementation authorization. Convert the selected direction into a Goal Contract via `goal-contract` before mutation.
- Separate facts, expert judgments, assumptions, hypotheses, scenarios, and decisions.
- When a Closed-loop Ledger exists, read its `Latest Control Route` from `.alpha-goal/YYYYMMDD-<slug>/control-state.md` before synthesis and update only synthesis-relevant state: objective conflicts, user-owned decisions, scenario assumptions, and the recommended route.

## Load resources when needed

- `references/complexity-triage.md`: classify simple, complicated, complex, or complex-giant-like requests.
- `references/stakeholder-decision-boundaries.md`: distinguish recommendation from user-owned decisions.
- `references/synthesis-round.md`: run human-machine qualitative/quantitative convergence rounds.
- `references/synthesis-record-schema.md`: produce a durable or handoff-ready Decision Synthesis Record.
- `references/meta-synthesis-hall.md`: run a Meta-Synthesis Hall with roles, hypothesis bank, model registry, dissent, and convergence conditions.

## Process

```text
Triage complexity -> Collect perspectives -> Build synthesis map -> Run synthesis rounds -> Resolve decisions -> Produce synthesis record -> Route
```

### 1. Triage complexity

Classify the problem:

- `simple`: known goal, known path, direct evidence; route out.
- `complicated`: many parts but decomposable with stable objective; use `system-model` or `goal-contract`.
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

### 4. Run synthesis rounds

For `complex` and `complex-giant-like` cases, or whenever perspectives conflict, run one or more `Synthesis Round` records before resolving decisions. Load `references/synthesis-round.md` for the schema. For complex-giant-like work, use the Meta-Synthesis Hall from `references/meta-synthesis-hall.md` to preserve roles, hypotheses, models, dissent, and convergence conditions.

Each round must connect:

- human or expert judgment and its decision owner;
- machine evidence, model output, tests, logs, metrics, or probes;
- Meta-Synthesis Hall state when many hypotheses, models, or stakeholder perspectives remain active;
- the conflict, contradiction, or missing sensor;
- any metric/proxy that could turn qualitative judgment into bounded evidence;
- the Indicator Handoff candidate that should become acceptance or sensor evidence;
- the user-owned decision or next hypothesis that would reduce uncertainty.

Stop when the smallest next action is clear: a Goal Contract candidate, a system-model question, a user decision, a blocker, or a bounded validation hypothesis.

### 5. Resolve decisions

Identify:

- decisions the agent can recommend;
- decisions the user must make;
- risks requiring explicit acceptance;
- non-goals that stabilize the effort;
- minimum viable next contract;
- evidence needed before irreversible action.

If a stakeholder conflict cannot be resolved, return a decision request rather than choosing silently.

### 6. Produce synthesis record

Persist the full Decision Synthesis Record under `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md` by default and update the Closed-loop Ledger artifact registry. Show a compact Markdown-table `Synthesis Summary` in the TUI by default. Print the full synthesis in chat only when the user asks, file persistence is blocked, or a user-owned decision requires reviewing the full tradeoff in the conversation.

Compact record fields:

```text
Decision Synthesis Record:
- Complexity class:
- Core tension:
- Meta-Synthesis Hall:
- Latest synthesis round:
- Integrated view:
- Recommended direction:
- User-owned decisions:
- Non-goals:
- Evidence needed:
- Indicator handoff:
- Route:
```

TUI summary:

```markdown
Synthesis Summary

| Field | Value |
| --- | --- |
| Core tension | |
| Recommended direction | |
| User decision | |
| Artifact | |
| Next | |
```

Full artifact fields:

```text
Decision Synthesis Record:
- Complexity class:
- System purpose:
- Stakeholders / perspectives:
- Evidence and models:
- Qualitative judgments:
- Quantitative signals:
- Meta-Synthesis Hall:
- Synthesis rounds:
- Indicator handoff:
- Contradictions and tradeoffs:
- Scenarios:
- Candidate strategies:
- Recommended direction:
- Decision boundaries:
- Risks and explicit acceptances:
- Minimum viable Goal Contract candidate:
- Ledger update: `.alpha-goal/YYYYMMDD-<slug>/control-state.md` path, artifact path, optional schema sidecar path, synthesis state changes, next route, or explicit no-write reason
- Route:
```

### 7. Route

- Route to `goal-contract` when a stable recommended direction and Indicator Handoff can become a Goal Contract.
- Route to `system-model` when subsystem boundary or feedback signals remain unclear.
- Route to user when a user-owned decision, risk acceptance, budget/timeline tradeoff, or stakeholder priority is required.
- Route to `evidence-verify` only when synthesis did not authorize mutation and the next action is comparing an existing evidence bundle to a proposed claim.
- Route to `control-loop` only if a valid Goal Contract already exists and synthesis merely narrowed the next slice without changing authorization.
