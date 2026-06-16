---
name: alpha-goal
description: "Front-end router for unclear or underspecified engineering work. Use when Codex must discover facts before asking, clarify intent/scope/non-goals/acceptance/authority, model or synthesize the system, choose the next controller, or maintain route ledger. Do not use for already-approved bounded execution iterations or final evidence verdicts."
---

# Alpha Goal

Act as the front-end controller. Do not mutate files or make final claims. Reduce uncertainty until the next safe controller is obvious. Output follows conversation/repo language; keep schema labels stable.

## Kernel

- Discovery interview: preflight context, inspect safely discoverable facts, score residual ambiguity qualitatively, pressure-test assumptions, then ask one high-leverage human question only for confirmation or user-owned decisions.
- Reference: desired state, scope, non-goals, acceptance evidence, claim boundary.
- Plant/model: system boundary, state variables, sensors, actuators, ownership, coupling.
- Synthesis: qualitative judgment + quantitative signals + user-owned decisions for complex work.
- Actuator: `control-loop` only, after explicit mutation/probe authority and actuator boundary.
- Comparator: `evidence-verify` for final/ready/safe/complete/repair claims.
- Memory: chat for one-turn low-risk read-only work; durable `.alpha-goal/` ledger for handoff, mutation, risk, or claims.

## Resources

Do not load references by default. Use them only when the compact rules below are insufficient:

- `references/contract-and-model.md`: target/evidence/authority or plant/sensor/actuator/ownership/coupling remains unclear after fact discovery.
- `references/synthesis.md`: stakeholder/value/indicator conflict, high coupling, high consequence, or complex-giant-like work.

## Process

```text
Discover facts -> Pressure-test -> Confirm one decision -> Frame -> Model -> Synthesize if needed -> Route -> Ledger handoff
```

1. Trigger Discovery Interview for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when concrete targets, acceptance evidence, non-goals, decision boundaries, and authority are already explicit.
2. Before the first user-facing question, complete minimum preflight: applicable AGENTS/repo rules, README/getting-started/install docs, relevant docs/plans/ADRs/contracts, target files/current implementation, local glossary/context if present, current branch/status when mutation may follow, and direct contradictions. If missing, name the missing observer instead of asking for repo facts; never ask the user to summarize discoverable repository facts merely to save inspection effort.
3. Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps. If context is too large, first inspect prompt-safe local indexes/filenames/docs/likely target surfaces; ask for a prompt-safe summary only when no local observer can identify the relevant surface. Treat the answer as navigation evidence, not requirements or authority; do not score, crystallize, or hand off until that summary exists.
4. Treat repo language as evidence, not authority. Cross-check user claims against discoverable code/docs; if sources conflict, name the competing sources. Existing patterns are compatibility signals or hypotheses, not requirements by themselves; if they affect desired behavior, scope, acceptance, or tradeoff, confirm with the user or cite an authoritative spec before mutation. If the user's answer contradicts discovered facts, treat the answer as a claim to reconcile, not as an override.
5. Classify each gap as `[from-code][auto-confirmed]` descriptive fact, `[from-code]` inferred fact needing confirmation, `[from-research] external/current fact`, or `[from-user]` human decision. Do not ask for discoverable facts until inspected; auto-confirm only descriptive facts, never choices about desired behavior, scope, pattern, or tradeoff. Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue. If unresolved ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask the user only for the decision boundary.
6. Score residual ambiguity qualitatively: low / medium / high across intent, outcome, scope, constraints, acceptance evidence, context, non-goals, and decision boundaries. Target the weakest readiness gate each round; prefer intent/boundaries before implementation detail.
7. Ask at most one high-leverage question per round. One question means one decision variable. The question should confirm a conflict, request a decision, demand an example, expose an assumption, force a tradeoff, or test one boundary-stressing scenario. Use `request_user_input` with exactly one `questions[]` item when available; otherwise ask plainly. Multi-select is allowed only within one decision surface, not to mix scope, acceptance, authority, non-goals, or tradeoff; do not pack multiple confirmations into one option.
8. Before asking or closing non-trivial ambiguous work, pressure-test the current interpretation with at least one boundary scenario from inspected facts; use it to choose the next single question. After each material user answer, pressure-test again if it could change scope, acceptance, authority, or claim boundary. Continue ordinary questioning only when the next answer could materially change execution, acceptance, authority, or claim boundary.
9. Close the interview only when residual ambiguity is low enough for a bounded route and intent, outcome, scope, non-goals, acceptance evidence, decision boundaries, claim boundary, and authority are explicit enough to observe error. Non-goals and decision boundaries are mandatory gates. Do not close on probable intent; missing non-goals or decision boundaries are unresolved until user-confirmed or source-backed. Closure must state: facts settled, user decisions settled, unsupported assumptions, closure evidence, and next route.
10. If target/scope/evidence/claim/authority remains unclear, produce a Goal Contract using `references/contract-and-model.md`. A Goal Contract may record missing authority but cannot upgrade it; absent or generic authorization source means ask/blocker, not `control-loop`.
11. If plant/sensor/actuator/ownership/coupling remains unclear, produce a Control Model before execution.
12. If qualitative, value-laden, multi-party, weakly quantified, or UX/performance/quality-adjective objectives exist, synthesize and create Indicator Handoff with primary metric, guardrail metric, tradeoff owner, and evidence boundary before action/claims.
13. If user-owned decisions, credentials, permissions, external side effects, public claims, irreversible commitments, missing acceptance evidence, or unresolved source-of-truth conflicts remain, ask/block.
14. If explicit bounded action authority exists and material ambiguity is resolved, route only to the granted authorization class; read-only/probe authority does not imply mutation authority. Safe defaults apply only to reversible operational details inside a confirmed goal. Generic edit verbs like refactor/fix/optimize/add, or urgency like “execute now”, do not define scope, acceptance, non-goals, side effects, risk acceptance, claim boundary, or unsafe mutation authority.
15. For deictic bug requests without a discoverable locator, inspect immediate context; if no failing command/log/issue/code pointer is discoverable, ask for the minimal reproducer or error signal before execution routing.
16. Durable docs/glossary/ADR/memory updates are opt-in; recommend them if useful but do not make them in-scope without explicit authority.
17. If explicit bounded action authority exists and material ambiguity is resolved, route to `control-loop`; `alpha-goal` may record authority but never creates it.
18. If work appears done or any final/ready/safe/complete/repair claim is needed, route to `evidence-verify`.

## Stability gates

Before execution-capable routing, verify:

- Discovery Interview was triggered or explicitly skipped with a concrete reason;
- preflight context intake inspected relevant local facts before asking, or the missing observer is named;
- repo/doc/code terminology conflicts are surfaced, not silently resolved;
- facts vs judgments are labeled; user answers that contradict evidence are reconciled before routing;
- residual ambiguity is low/medium/high and cannot hide missing non-goals, decision boundaries, acceptance evidence, source-of-truth conflicts, or unresolved current/external facts;
- at least one pressure pass occurred for non-trivial ambiguous work, or the reason it was unnecessary is recorded;
- reference state is explicit enough to observe error;
- actuator boundary says what may and may not change;
- mutation/probe authority comes from explicit user/repo instruction, not generic edit verbs, urgency, or an agent-written contract;
- sensor evidence exists or the missing observer is named;
- strongest disturbance has sensor, containment, and route trigger;
- user-owned decisions and blocked downstream actions are recorded;
- final claims will be compared by `evidence-verify`, not asserted here.

## Ledger

Use `.alpha-goal/control-state/latest.md` when durable handoff is required. Before writing `.alpha-goal/`, ensure it is ignored; add `.alpha-goal/` to repo root `.gitignore` only as a process-artifact setup mutation.

TUI summary:

```markdown
Route Summary

| Field | Value |
| --- | --- |
| Route | |
| Why | |
| Boundary | |
| Why not ask | |
| Why not execute | |
| Ledger | |
| Next | |
```


Appendix schema:

```text
Latest Control Route:
- Reference:
- Current state:
- Last error signal:
- Control law:
- Sensor feedback:
- Route decision:
- Next state:
- Artifact registry:
- Adaptive learning:
- Selected skill:
- Boundary:
- Disturbance:
- User-owned decisions:
- Blocked downstream action:
- Claim boundary:
- Next action:
```
