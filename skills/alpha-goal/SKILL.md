---
name: alpha-goal
description: "Must use for any engineering/design/implementation/diagnose/repair requests; through interviewing user, clarify real intention/requirements, identify outcome, scope, decision boundaries, and design."
---

# Alpha Goal

`alpha-goal` owns workflow control for engineering/design/implementation/diagnose/repair goals. It discovers facts, clarifies user-owned decisions, writes the canonical Goal Contract, initializes persistent loop state, and routes to `$control-loop`.

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
3. Resolve the Alpha Goal state root before writing runtime artifacts. Always use `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from the last directory name of the current session directory path.
4. Match the task state by Goal Contract path, state directory, and trigger metadata. If matched, read `goal-contract.md`, `run-profile.md`, `loop-state.md`, and `memory.md`; if multiple or stale candidates remain after `control-state/latest.md`, clarify task identity before execution.

## Phase 1: Discovery

Trigger Discovery for vague, overloaded, brownfield, high-consequence, missing-acceptance, or user-says-"don't assume" requests. Skip only when target, acceptance evidence, non-goals, decision boundaries, authority, claim boundary, Trigger Contract, Autonomy Level, Initial Loop State, and Memory seed are explicit.

Before asking, complete minimum preflight: inspect applicable AGENTS/repo rules, README/getting-started/install docs, relevant specs/ADRs/contracts, target files/current implementation, local glossary/context, current branch/status when mutation may follow, and direct contradictions. If missing, name the missing observer instead of asking the user to summarize discoverable repo facts.

For deictic bug requests without a discoverable locator, inspect immediate context; if no failing command/log/issue/code pointer is discoverable, ask for the minimal reproducer or error signal before execution routing.

Use subagents for independent parallel subtasks when that improves throughput.

Discovery critical thinking:
- Problem validity: is the phenomenon truly a problem; are causal claims reliable; what assumptions need testing?
- Context sufficientness: what can be concluded now; what must be supplemented; what is must-have vs ideal?
- Hidden issues: what deeper root cause, adjacent issue, or overlooked dependency may affect the goal?

Record key points with concise critical thinking to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/context.md`.

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

Use structured user-input tooling (`request_user_input` / equivalent) to get user feedback:

```text
Round {n} | Target: {weakest_dimension} | Clarity: {score}%
{question backed by clear context}
```

### 2.3 Interpret answer

Treat the answer as navigation evidence, not requirements or authority. Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/interview.md`.

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

Readiness Gate Check. Mark each gate `pass` only when explicit or source-backed: intent, outcome, scope, constraints, acceptance evidence, context/current facts, non-goals, decision boundaries, claim boundary, Trigger Contract, Autonomy Level, Initial Loop State, Memory seed, authorization source, source-of-truth conflicts, external/current facts, actuator boundary, and sensor/observer.

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

If target, scope, authority, source reference, non-goals, acceptance evidence, decision boundary, actuator/sensor boundary, Trigger Contract, Autonomy Level, Initial Loop State, Memory seed, or claim boundary is wrong or unclear, keep Clarify active.

## Phase 3: Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- **Contrarian**: challenge a core assumption.
- **Simplifier**: probe minimum viable scope.
- **Ontologist**: ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

## Phase 4: Final Design

Write the design to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`; copy to `docs/specs/YYYYMMDD-<TaskName>.md` when useful or required by repo convention.
The state-root `goal-contract.md` is canonical. Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.

Design Content Must Include:
- Technical Context [context]
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
- Initial Loop State [loop_state]
- Memory seed [memory_seed]

### Trigger Contract

Define run behavior, not just a label:
- `manual`: resume from the matching `loop-state.md` unless the user explicitly overrides.
- `scheduled`: resume from `loop-state.md`; the Trigger Contract must name the schedule source/id, replay/staleness rule, and existing state mapping; do not discover new scope or authority.
- `webhook`: map the event to an existing authorized goal/state from the Trigger Contract; the Trigger Contract must name event source/id, dedupe key, authorized payload-to-state mapping, and replay/staleness rule; if no match, return to `alpha-goal`.
- `verification-triggered`: resume only when latest `verification.md` matches the Goal Contract path, loop-state binding, and evidence binding, has `Next route: control-loop`, and the Gap is fixable inside the same goal.

### Autonomy Ladder

Set one level in the Goal Contract:
- `L1 Suggest only`: no file writes except task-state notes.
- `L2 Draft changes`: propose patches, do not apply repo edits.
- `L3 Modify worktree`: edit approved worktree and task-state; no commit/push.
- `L4 Open PR`: commit, push branch, open/update PR/MR.
- `L5 Merge automatically`: merge/deploy only when explicitly authorized.

Requested actions above the current level are denied and routed to user confirmation or blocker.

### Persistent loop files

Initialize `<Alpha Goal state root>/YYYYMMDD-<TaskName>/loop-state.md`:

```markdown
# Loop State
Current Objective:
Current Phase: DISCOVERY | IMPLEMENTATION | HARDENING | VERIFICATION | FINAL_RESPONSE_READY | COMPLETE | BLOCKED
Completed:
Pending:
Known Risks:
Last Verification Gap:
Next Slice:
Stop Condition:
```

`loop-state.md` is valid only with non-empty Current Objective, legal Current Phase, and at least one actionable Next Slice or Stop Condition. Maintain `<state-root>/control-state/latest.md` on Goal Contract, loop-state, evidence, and verification route updates:

```markdown
# Control State Latest
State directory:
Goal Contract:
Run Profile:
Loop State:
Memory:
Evidence:
Verification:
Current Phase:
Next route:
Updated at:
```

Initialize `<Alpha Goal state root>/YYYYMMDD-<TaskName>/memory.md`:

```markdown
# Memory
Confirmed Facts:
Confirmed Root Causes:
Known Constraints:
Working Strategies:
Failed Strategies:
```

Each non-empty `memory.md` entry must include `Evidence`, `Confidence: confirmed | provisional`, and `Invalidation`. `iteration.md` is a run log. `loop-state.md` is the durable current state. `memory.md` is compressed learning; keep only evidence-backed facts, constraints, causes, and reusable strategy results.

Self-review the design for completion and reasonability. Use subagents for independent review when useful, then fix accepted findings.

## Phase 5: Ask for Confirmation

Show Summary of Design. Include `Root Cause` only for repair designs.

```markdown
Design Summary

| Field | Value |
| --- | --- |
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
| Initial loop state | |
| Memory seed | |
| Blocking gates | |
| Ledger | |
| Next | |
```

Use `request_user_input` to ask for approve/launch, refine, or reject unless an explicit workspace/user contract already authorizes autonomous launch. Overrides may select an authorized pending slice only; target, scope, phase, claim, Trigger Contract, or Autonomy changes require Goal Contract update and gates. On approval or pre-authorized launch, hand off to `$control-loop`.
