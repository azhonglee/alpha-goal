---
name: alpha-goal
description: "Create and accept a Goal Contract for work requiring a material authority decision, external/destructive/cross-repository or disclosure/session effects, recovery across pause/compaction/handoff, or explicit audit evidence. Also use when explicitly invoked. Skip ordinary read-only analysis and clear reversible local changes."
---

# Alpha Goal

Turn persistence-eligible work into an accepted Goal Contract. Own goal framing, activation eligibility, and contract authority; do not implement or verify.

## Frame Before Persistence

Read instructions, artifacts, tests, docs, history, and current state. Resolve discoverable facts; descriptive evidence cannot grant desired-behavior, side-effect, or acceptance authority. Higher-priority instructions, tool policy, credentials, and approval gates remain invariant.

Derive a minimal Goal Frame:

- intent and observable outcome;
- scope, non-goals, and material constraints;
- falsifiable success signals and observers;
- unresolved decisions that could change authority, boundaries, execution/risk, or acceptance evidence.

Use decisions only from the relevant authority and facts only from attributable sources. Descriptive evidence or an agent recommendation never supplies missing authority.

## Clarification Loop

Repeat only while the Goal Frame has a blocking gap:

1. Choose the next gap:
   - Treat intent or observable outcome as blocking when another reasonable reading could change scope, success signals, or evidence; otherwise derive them from the request and attributable facts.
   - Treat a design choice as blocking only when another reasonable choice could change an authority-controlled outcome, interface/data contract, migration/rollout, security/privacy, external SLO, risk/recovery, or acceptance boundary; otherwise do not ask about it.
   - Select the highest-impact remaining gap by authority ownership, blast radius, irreversibility, behavior/interface/data impact, acceptance ambiguity, and rollback risk.
2. Ask the relevant authority for one decision variable. State discovered facts, why it matters, real options when useful, and a recommendation; never ask for discoverable facts.
3. Pressure-test the answer:
   - Check one concrete boundary, counterexample, or failure case.
   - For repair, optimization, or symptom-level goals, investigate problem validity, causal reliability, and root-cause evidence as discoverable facts.
   - If those facts or a smaller viable scope could materially change the goal, keep the gap blocking and ask the authority only for the resulting scope, outcome, or claim decision.
   - Record only consequences entailed by the answer and attributable facts; if another reasonable reading changes execution or evidence materially, ask the smallest follow-up on the same gap.
4. Close only when the authorized decision and all material boundaries and execution/evidence consequences are determined:
   - Reprioritize if the answer exposes a higher-impact gap.
   - Mark non-material only when no authorized answer could change the Goal Frame or route.
   - Defer only when the relevant authority explicitly excludes the affected outcome, claim, or side effect from scope.
5. Update the Goal Frame and stop when no blocking gap remains. Never use a fixed questionnaire, confidence, or round count as completion evidence.

## Require a Persistent Lifecycle

Create persistent state only when any condition holds:

- behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout/rollback, or risk treatment requires an authority decision;
- work includes an external write, purchase, destructive/cross-repository action, material disclosure, credential/session change, or privacy/security impact;
- completion requires recovery across pause, compaction, handoff, or material risk checkpoints;
- the user or repository requires a Goal Contract or persistent audit evidence.

Ambiguity, confidence, size, duration, or approval alone does not trigger persistence. If no trigger remains after discovery and clarification, stop and return ownership to the caller without a route, lifecycle artifact, state-root lookup, or native goal. This is the required exit for an explicit but non-applicable invocation; ordinary direct work should not invoke this skill.

## Expand to a Goal Contract

When eligible, resolve `$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/` from the stable workspace basename. Reuse only a matching `draft`. If that name already holds an accepted, terminated, completed, or unrelated task, choose the first unused `-2`, `-3`, ... suffix; never reopen it.

- Read `references/goal-contract-book.md`; create canonical `goal-contract.md` as `draft` and expand the Goal Frame with authority, side-effect, decision, claim, evidence, freshness, and invalidation boundaries.
- Only the relevant authority may defer a goal item. No blocking gap may reach confirmation, handoff, or target mutation.
- Keep authority-retained material design, rollout/rollback, acceptance, mutable surfaces, and observers in the Goal Contract rather than a second authority artifact.

## Confirm and Handoff

Before confirmation:

- Map every criterion to a currently available observer; identify every claim surface and prerequisite.
- Complete authority-retained material design decisions and their risk/observer treatment.
- Check source conflicts, side-effect authority, freshness, and the highest-impact assumption with a counterexample or failure case.
- Keep `draft` while any known infeasibility, unavailable observer, unidentified claim surface, unmet prerequisite, incomplete authority-retained material-design coverage, or unresolved material finding remains.
- For cross-cutting/high-risk work, request independent read-only review from raw artifacts and await or cancel it.

At confirmation:

- Present the Goal Frame, boundaries, criteria, evidence, and residual risk.
- Accept only an explicit decision from the recorded acceptance authority; silence, history, a spec, or desired-behavior authority does not grant side-effect authority or acceptance.

After the decision:

- On accept, complete Acceptance Completeness and the Confirmation Record, compute the authority-payload digest, set `status: accepted` last, perform Native Goal Sync, and hand off the canonical contract to the designated execution owner.
- On refine/reject, remain `draft`; do not mutate the target or native goal.
- After acceptance, a material goal or authority change is a new task: do not edit or reuse the accepted contract or checkpoint. If acceptance exists without a checkpoint, confirm the accepted goal is still current before handoff.

## Native Goal Sync

After Goal Contract acceptance, treat the native goal as lifecycle metadata, never authority or acceptance evidence. A non-applicable invocation creates no native goal.

- After acceptance, call `get_goal`. Reuse any unfinished native goal; if none exists, call `create_goal` with the accepted outcome and canonical `goal-contract.md` path. Set `token_budget` only when the user explicitly supplied one.

## Capability-Conditional Aids

- Delegate independent read-heavy investigation, review, or evidence reruns. Parallelize independent reads; sequence dependent decisions; synthesize before acting.
- Investigation agents never write shared artifacts.
