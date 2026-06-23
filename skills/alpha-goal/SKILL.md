---
name: alpha-goal
description: "Must use for any engineering/design/implementation/diagnose/repair requests; through interviewing user, clarify real intention/requirements, identify outcome, scope, decision boundaries, and design."
---

# Alpha Goal

`alpha-goal` owns workflow control for engineering/design/implementation/diagnose/repair goals. It discovers facts, clarifies user-owned decisions, writes the canonical Goal Contract, and routes to `$control-loop`.

Delegated skills may observe, review, or evaluate, but must not control phase progression, redefine target/scope, set acceptance evidence, waive non-goals, decide authority, or make final/ready/complete claims.

**Must Execute phase to phase strictly whenever using this skill:**

```text
Pre-flight -> Discovery -> Clarify with User -> Assumption Stress Test -> Final Design -> Ask for Confirmation
```

`Clarify with User` is the core phase.

**Do Not Compact or Merge phases.**

## Phase 0: Pre-flight

1. Classify work type:
   - `exploration`: skip only for concrete read-only fact lookup; use this skill when intent, scope, acceptance, or decision boundaries are involved.
   - `design/implementation/maintenance`: follow all phases.
   - `diagnose/repair`: start with Discovery. If root cause is not 100% confirmed, only run diagnostic probes or hypothesis-testing slices. Do not implement/design directly.
   - `other`: ask for minimum details needed to classify.
2. Split mixed work into sequenced items before routing.
3. Resolve the Alpha Goal state root before writing runtime artifacts. Always use `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`, never from the session directory.
4. Match the task state by Goal Contract path, state directory, and trigger metadata. If matched, read `goal-contract.md`; if multiple or stale candidates remain after local state inspection, clarify task identity before execution.

## Phase 1: Discovery

Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when target, acceptance evidence, non-goals, decision boundaries, authority, claim boundary, Trigger Contract, and Autonomy Level are explicit.

Before asking, complete minimum preflight: inspect applicable AGENTS/repo rules, README/getting-started/install docs, relevant specs/ADRs/contracts, target files/current implementation, local glossary/context, current branch/status when mutation may follow, and direct contradictions. If missing, name the missing observer instead of asking the user to summarize discoverable repo facts.

For deictic bug requests without a discoverable locator, inspect immediate context; if no failing command/log/issue/code pointer is discoverable, ask for the minimal reproducer or error signal before execution routing.

Use subagents for independent parallel subtasks when that improves throughput.

Discovery critical thinking:
- Problem validity: is the phenomenon truly a problem; are causal claims reliable; what assumptions need testing?
- Context sufficientness: what can be concluded now; what must be supplemented; what is must-have vs ideal?
- Hidden issues: what deeper root cause, adjacent issue, or overlooked dependency may affect the goal?

Record key points with concise critical thinking in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`. If the contract is still draft, set `Contract status: draft` and `Issued by: alpha-goal`, then keep target/scope fields unset until Final Design.

## Phase 2: Clarify with User

Ground clarification in facts and observations, not habits, assumptions, current implementation, or prior solutions. Loop Deep Discussion until clarity score is above `0.92` and readiness gates pass.

### 2.1 Prepare the next question

Generate one question that confirms a conflict, requests a decision, demands an example, exposes an assumption, forces a tradeoff, or tests a boundary-stressing scenario.

Use current task state:
- original request and probable intent
- prior Q&A
- known facts, conflicts, unknowns, and source-of-truth conflicts
- current readiness gates and clarity_score dimensions
- brownfield context and active Assumption Stress Test mode

Target the first blocking gate or lowest-scoring dimension. Prefer intent and boundaries before implementation details:
- Ladder 1: intent, outcome, scope, non-goals, decision boundaries
- Ladder 2: constraints, success criteria, acceptance evidence, authority, claim boundary
- Ladder 3: context/current facts, actuator boundary, sensor/observer, external/current facts

Pressure ladder after each answer:
1. Ask for concrete example, counterexample, or evidence signal.
2. Probe the hidden assumption or dependency.
3. Force a boundary/tradeoff: what to reject, defer, or not do.
4. If the answer stays symptom-level, reframe toward essence/root cause.

`Non-goals` and `Decision Boundaries` are mandatory readiness gates. Keep revisiting them until explicit.

### 2.2 Ask one question

Ask User one high-leverage question per round. One question means one decision variable.

Do not ask for discoverable facts. Ask only for user-owned decisions, credentials, permissions, external side effects, public claims, irreversible commitments, missing acceptance evidence, or unresolved source-of-truth conflicts.

Present options conversationally with your recommendation and reasoning.

Use structured user-input tooling (`request_user_input` / equivalent) to get user feedback and present:

```text
Round {n} | Target: {weakest_dimension} | Clarity: {score}%
{question backed by clear context}
```

### 2.3 Interpret answer

Treat the answer as navigation evidence, not requirements or authority. Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Interview ledger`.

Treat repo language as evidence, not authority. Cross-check user claims against code/docs; name competing sources on conflict.

Classify gaps:
- `[from-code][auto-confirmed]` descriptive fact
- `[from-code]` inferred fact needing confirmation
- `[from-research]` external/current fact
- `[from-user]` human decision

Auto-confirm only descriptive facts. Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue.

If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask only for the decision boundary.

### 2.4 Score and gate

Use weighted clarity:

```text
clarity_score = 0.3 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context
```

Score each dimension in `[0.0, 1.0]` with justification and gap:
- Intent Clarity
- Outcome Clarity
- Scope Clarity
- Constraint Clarity
- Success Criteria Clarity
- Context Clarity for brownfield work

Readiness Gate Check. Mark each gate `pass` only when explicit or source-backed: intent, outcome, scope, constraints, acceptance evidence, context/current facts, non-goals, decision boundaries, claim boundary, Trigger Contract, Autonomy Level, authorization source, source-of-truth conflicts, external/current facts, actuator boundary, and sensor/observer.

Continue interviewing when:
- Any readiness gate is unresolved.
- `Non-goals` or `Decision Boundaries` are unresolved.
- A pressure pass is incomplete: at least one earlier answer must be revisited with evidence, assumption, or tradeoff follow-up.
- The next answer could materially change execution, acceptance, authority, or claim boundary.

For qualitative, value-laden, multi-party, weakly quantified, or UX/performance/quality-adjective objectives, create Indicator Handoff: primary metric, guardrail metric, tradeoff owner, and evidence boundary.

Before closing Clarify, pressure-test the interpretation with at least one boundary scenario from inspected facts. If scope, acceptance, authority, or claim boundary changes, return to `2.1`.

### 2.5 Record and route

Do not offer early exit before one explicit assumption probe and one persistent follow-up. Max 5 rounds per dimension; after that, proceed with warnings only when further questions would not change execution.

For cross-repo framing, keep one task-level Alpha Goal state root and record a repo manifest: repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.

If target, scope, authority, source reference, non-goals, acceptance evidence, decision boundary, actuator/sensor boundary, Trigger Contract, Autonomy Level, or claim boundary is wrong or unclear, keep Clarify active.

## Phase 3: Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- **Contrarian**: challenge a core assumption.
- **Simplifier**: probe minimum viable scope.
- **Ontologist**: ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

## Phase 4: Final Design

Write the design to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`; copy to `docs/specs/YYYYMMDD-<TaskName>.md` when useful or required by repo convention.
The state-root `goal-contract.md` is canonical. Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.
Keep `Contract status: draft` until user confirmation or an explicit workspace/user contract authorizes autonomous launch. `$control-loop` may execute only an accepted Goal Contract.

Design Content Must Include:
- Contract status [contract_status]
- Issued by [issued_by]
- Technical Context [context]
- Discovery notes [discovery_notes]
- Interview ledger [interview_ledger]
- Intent [intent]
- Root Cause [root_cause] optional, only for repair design
- Outcome [outcome]
- Scope [scope]
- Repo surfaces [repo_surfaces]
- Constraints [constraints]
- Assumptions + resolutions [assumptions_resolutions]
- Acceptance evidence [acceptance_evidence]
- Dependency/integration order [repo_integration_order]
- Non-goals [non_goal]
- Decision boundary [decision_boundary]
- Claim boundary [claim_boundary]
- Trigger Contract [trigger_contract]
- Autonomy Level [autonomy_level]
- Handoff ledger [ledger]

### Trigger Contract

Define run behavior, not just a label:
- `manual`: resume from the Goal Contract unless the user explicitly overrides; `control-loop` may create `checkpoint.md` only when recovery needs it.
- `scheduled`: the Trigger Contract must name the schedule source/id, replay/staleness rule, and existing Goal Contract mapping; do not discover new scope or authority.
- `webhook`: map the event to an existing authorized Goal Contract from the Trigger Contract; the Trigger Contract must name event source/id, dedupe key, authorized payload-to-state mapping, and replay/staleness rule; if no match, return to `alpha-goal`.
- `verification-triggered`: resume only when latest verification evidence matches the Goal Contract path, has `Next route: control-loop`, and the Gap is fixable inside the same goal.

### Autonomy Ladder

Set one level in the Goal Contract:
- `L1 Suggest only`: no file writes except task-state notes.
- `L2 Draft changes`: propose patches, do not apply repo edits.
- `L3 Modify worktree`: edit approved worktree and task-state; no commit/push.
- `L4 Open PR`: commit, push branch, open/update PR/MR.
- `L5 Merge automatically`: merge/deploy only when explicitly authorized.

Requested actions above the current level are denied and routed to user confirmation or blocker.

### Artifact policy

`alpha-goal` writes only `goal-contract.md`. The contract contains:
- `Contract status`: `draft` until confirmed or explicitly pre-authorized; `accepted` before any `$control-loop` handoff.
- `Issued by`: `alpha-goal`; other issuers are not authoritative for `$control-loop`.
- `Discovery notes`: concise discovered facts, contradictions, and critical thinking; reference long logs instead of pasting them.
- `Interview ledger`: clarification rounds, user-owned decisions, and unresolved boundary gaps; keep it as evidence ledger, not executable authority.
- Canonical target, scope, non-goals, acceptance evidence, claim boundary, Trigger Contract, Autonomy Level, and handoff ledger.

Do not create separate discovery, interview, loop, memory, evidence, verification, or latest-pointer files from `alpha-goal`. `$control-loop` or `$goal-verify` may create a single task `checkpoint.md` only when conditional execution, recovery, evidence handoff, or verification requires it. A global `control-state/latest.md` may exist only as a recovery index to an accepted Goal Contract, not as a stage artifact.

Self-review the design for completion and reasonability. Use subagents for independent review when useful, then fix accepted findings.

## Phase 5: Ask for Confirmation

Show Summary of Design. Include `Root Cause` only for repair designs.

```markdown
Design Summary

| Field | Value |
| --- | --- |
| Contract status | |
| Intent | |
| Root Cause | |
| Outcome | |
| Scope | |
| Repo surfaces | |
| Constraints | |
| Acceptance evidence | |
| Dependency/integration order | |
| Non-goals | |
| Decision boundary | |
| Claim boundary | |
| Trigger contract | |
| Autonomy level | |
| Blocking gates | |
| Ledger | |
| Next | |
```

Use `request_user_input` to ask for approve/launch, refine, or reject unless an explicit workspace/user contract already authorizes autonomous launch. Overrides may select an authorized pending slice only; target, scope, phase, claim, Trigger Contract, or Autonomy changes require Goal Contract update and gates. On approval or pre-authorized launch, set `Contract status: accepted` and hand off to `$control-loop`.
