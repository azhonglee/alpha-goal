---
name: deep-interview
description: "Explicit-only standalone clarification for ambiguous or high-impact requests. Discover facts, pressure-test authority-owned decisions, and optionally maintain canonical interview.md. Do not use for technical design, goal routing or acceptance, implementation, or verification."
---

# Deep Interview

Own clarification and the canonical interview record. Turn uncertainty into attributable decisions without assuming or authorizing any downstream workflow.

## Read References When Needed

- Read `references/interview-record.md` before creating, recovering, or updating `interview.md`; it defines artifact location, schema, append-only history, supersession, updates, and recovery.
- In a Claude-installed skill context, also read `references/claude-adapter.md` before selecting or asking a question.

`interview.md` is evidence and provenance, not authority to perform side effects.

## Discover Before Asking

Read relevant instructions, artifacts, tests, docs, history, and current state. Resolve discoverable facts directly. Descriptive evidence cannot grant desired-behavior, side-effect, or acceptance authority.

Maintain only the clarification dimensions needed for the request:

- intent and observable desired outcome;
- scope, exclusions, and material constraints;
- decision owners and side-effect boundaries;
- candidate success signals and observers;
- unresolved decisions that could materially change behavior, interfaces, data, execution, risk, or evidence.

Record facts with attributable sources and decisions with their authority. Never convert a recommendation, convention, or current implementation into authority.

## Interview Loop

Repeat only while an allowed dimension contains a blocking gap:

1. Select the highest-impact unresolved decision by ownership, blast radius, irreversibility, interface/data impact, evidence ambiguity, and rollback risk.
2. When writing an artifact, append a numbered pending turn under its stable gap id before asking.
3. Ask one decision variable; never ask for discoverable facts.
4. Record the answer and source, then pressure-test it with a boundary, counterexample, failure case, implementation consequence, or observer consequence.
5. Keep the gap blocking and append a follow-up under the same id if another reasonable reading could materially change the result.
6. Reprioritize if a higher-impact gap appears.

Do not expand into derivative questions while the governing tradeoff remains unresolved. Do not use a fixed questionnaire, confidence score, or round count as completion evidence.

For exploratory requests, derive the smallest useful allowed dimensions from the user's purpose. If action is not authorized, stop when the requested preference, problem, or direction is clear; mark action-specific dimensions `not-explored` instead of forcing an execution-ready result.

## Return Route

Return the absolute `interview.md` path when written, the Handoff status, and unresolved gap ids. Use exactly one status from `EXPLORED`, `READY`, `BLOCKED_ON_AUTHORITY`, `CANCELLED`, or `CONFLICT`. Make no assumption about which tool, skill, or human will consume it.

## Hard Boundaries

- Do not select an execution route or lifecycle.
- Do not call goal lifecycle tools.
- Do not authorize, implement, mutate, deploy, purchase, or perform external writes.
- Do not create a technical design or Goal Contract.
- Do not hand off to implementation or verification unless the user explicitly requests that separate action after clarification.
- Do not treat `interview.md` as acceptance or side-effect authorization.
