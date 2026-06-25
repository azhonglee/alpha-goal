---
name: alpha-goal
description: "Must use for any engineering/design/implementation requests."
---

# Alpha Goal

## Mission
`alpha-goal` owns workflow control for goal definition.

Its responsibility is:
- discover facts
- clarify user intent
- identify outcome
- identify scope
- identify constraints
- identify acceptance evidence
- identify decision boundaries
- produce the canonical Goal Contract

alpha-goal does not implement.
alpha-goal does not verify completion.
alpha-goal does not make final-ready or complete claims.

Only an accepted Goal Contract may be handed to `$control-loop`.

Quick Pass:
- skip only for concrete read-only fact lookup; use this skill when intent, scope, acceptance, or decision boundaries are involved.

Anti-Pattern: "Build it yourself" or "Fix it yourself" or "Implement it yourself"
- Every project MUST go through the workflow below. Maybe contract or design is short, but it must be explicit and you must get approval.

You MUST create a task for each of these items and complete them in order:
1. **Preflight && Discovery**: Inspect the repository facts, current implementation, and external facts when required.
2. **Clarify**: Loop Q&A until clarity score is above `0.92` and goal gates pass.
3. **Assumption Stress Test**: Challenge assumptions with evidence.
4. **Write Contract**: Produce the canonical Goal Contract. Show summary.
5. **Technical Design**: When cross-file operation(predictive) may happen, Loop Q&A until design is explicit and approved.
6. **Review**: Review the Goal Contract with the subagent, and fix accepted findings.
7. **Ask Confirm**: Ask the user to confirm the Goal Contract is explicit and approved. Decide whether to continue or hand off to `$control-loop`.

## Authority

The accepted Goal Contract is the only execution authority.

Evidence ≠ Authority

Evidence may influence a Goal Contract, but not define it.

Current implementation is evidence.
Repository conventions are evidence.
Past conversations are evidence.

None of them may override:
- user decisions
- approved specifications
- accepted Goal Contract

Delegated agents may:
- inspect
- review
- evaluate

Delegated agents may not:
- redefine target
- redefine scope
- redefine acceptance evidence
- redefine non-goals
- redefine authority
- approve execution

## Hard Gates
Do not hand off to `$control-loop` until every gate passes.

### Goal Gates

PASS only if:
- Intent is explicit.
- Outcome is explicit.
- Scope is explicit.
- Acceptance evidence is explicit.
- Non-goals are explicit.
- Decision boundary is explicit.
- Claim boundary is explicit.
- Authorization source is explicit.
- Calirity_Score above 0.92.
- A pressure pass is incomplete: at least one earlier answer must be revisited with evidence, assumption, or tradeoff follow-up

Otherwise:

RETURN = Clarify with User

### Authority Gates

PASS only if:
- The user, issue, spec, contract, or repository policy authorizes execution.
- No unresolved source-of-truth conflict exists.

Otherwise:

RETURN = Clarify with User

### Context Gates

PASS only if:
- Relevant repository facts have been inspected.
- Current implementation has been inspected when applicable.
- External facts have been verified when required.

Otherwise:

RETURN = Discovery
### Repair Gate
For diagnose/repair work:
PASS only if root cause is confirmed.
Otherwise diagnostic probes only.

## Workflow

### Phase 0: Preflight
1. Resolve the Alpha Goal state root before writing runtime artifacts. Always use `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`. Derive `<workspace-slug>` from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`, never from the session directory.
2. Match the task state by Goal Contract path, state directory, and trigger metadata. If matched, read `goal-contract.md`; if multiple or stale candidates remain after local state inspection, clarify task identity before execution.

### Phase 1: Discovery

Inspect applicable AGENTS/repo rules, README/getting-started/install docs, relevant specs/ADRs/contracts, target files/current implementation, local glossary/context, current branch/status when mutation may follow, and direct contradictions. 

Critical thinking:
- Problem validity: is the phenomenon truly a problem; are causal claims reliable; what assumptions need testing?
- Context sufficientness: what can be concluded now; what must be supplemented; what is must-have vs ideal?
- Hidden issues: what deeper root cause, adjacent issue, or overlooked dependency may affect the goal?

Identify:
- facts
- conflicts
- unknowns
- dependencies

Record Details in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`. If the contract is still draft, set `Contract status: draft` and `Issued by: alpha-goal`, then keep target/scope fields unset until Final Design.

### Phase 2: Clarify

Loop Q&A until clarity score is above `0.92` and readiness gates pass.

#### 2.1 Ask User Question
Use current task state:
- original request and probable intent
- prior Q&A
- known facts, conflicts, unknowns, and source-of-truth conflicts
- current readiness gates and clarity_score dimensions
- brownfield context and active Assumption Stress Test mode

Target the first blocking gate or lowest-scoring dimension. Prefer intent and boundaries before implementation details:
- Ladder 1: intent, outcome, scope, non-goals, decision boundaries
- Ladder 2: constraints, success criteria, acceptance evidence, claim boundary
- Ladder 3: context/current facts, actuator boundary, sensor/observer, external/current facts

`Non-goals` and `Decision Boundaries` are mandatory readiness gates. Keep revisiting them until explicit.

Ask User one high-leverage question per round. One question means one decision variable, that confirms a conflict, requests a decision, demands an example, exposes an assumption, forces a tradeoff, or tests a boundary-stressing scenario.

Do not ask for discoverable facts.

Present options conversationally with your recommendation and reasoning.
Use structured user-input tooling (`request_user_input` / equivalent) to get user feedback and present:

```text
Round {n} | Target: {weakest_dimension} | Clarity: {score}%
{question backed by clear context}
```

Pressure ladder after each answer:
1. Ask for concrete example, counterexample, or evidence signal.
2. Probe the hidden assumption or dependency.
3. Force a boundary/tradeoff: what to reject, defer, or not do.
4. If the answer stays symptom-level, reframe toward essence/root cause.

#### 2.2 Interpret answer

Treat the answer as classified input, not automatic authority. Classify each answer before updating the Goal Contract.

Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Interview ledger`.

Treat repo language as evidence, not authority. Cross-check user claims against code/docs; name competing sources on conflict.

Classify inputs:
- `[from-code][auto-confirmed]` descriptive implementation fact
- `[from-code]` inferred implementation fact needing confirmation
- `[from-research]` external/current fact
- `[from-user]` explicit user-provided decision, constraint, acceptance signal, non-goal, authority, example, or clarification

Auto-confirm only descriptive facts. Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority without explicit user request or authoritative spec/issue.

Only explicit user decisions, explicit authorization, or authoritative specs/issues may update Goal Contract authority fields.

If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first, then ask only for the decision boundary.

#### 2.3 Score

Use weighted clarity:

```text
clarity_score = 0.2 * intent + 0.18 * outcome + 0.15 * scope + 0.12 * constraints + 0.12 * solution + 0.1 * success + 0.08 * decision_boundary + 0.05 * context
```

Score each dimension in `[0.0, 1.0]` with justification and gap:
- Intent Clarity
- Outcome Clarity
- Scope Clarity
- Constraint Clarity
- Success Criteria Clarity
- Context Clarity for brownfield work
- Technical Solution Clarity (When need cross-file operation, required; None otherwise, solution_clarity_score is 1)

#### 2.4 Record and Cycle-Control

Do not offer early exit before one explicit assumption probe and one persistent follow-up. Max 5 rounds per dimension; after that, proceed with warnings only when further questions would not change execution.

For cross-repo framing, keep one task-level Alpha Goal state root and record a repo manifest: repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.

If target, scope, authority, source reference, non-goals, acceptance evidence, decision boundary, actuator/sensor boundary, or claim boundary is wrong or unclear, keep Clarify active.

### Phase 3: Assumption Stress Test

Use each applicable mode once; if none applies, record why:
- **Contrarian**: challenge a core assumption.
- **Simplifier**: probe minimum viable scope.
- **Ontologist**: ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

### Phase 4: Write Contract

Write the Goal Contract to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`; copy to `docs/specs/YYYYMMDD-<TaskName>.md` when useful or required by repo convention.
The state-root `goal-contract.md` is canonical. Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.
Keep `Contract status: draft` until user confirmation.

Required Content:
- Contract status [contract_status]
- Issued by [issued_by]
- Technical Context [context]
- Intent [intent]
- Outcome [outcome]
- Scope [scope]
- Constraints [constraints]
- Acceptance evidence [acceptance_evidence]
- Non-goals [non_goal]
- Decision boundary [decision_boundary]
- Claim boundary [claim_boundary]
- Authorization Source [authorization_source]

Optional Content:
- Root Cause [root_cause] optional, only for repair design
- Discovery notes [discovery_notes]
- Interview ledger [interview_ledger]
- Repo surfaces [repo_surfaces]
- Assumptions + resolutions [assumptions_resolutions]
- Dependency/integration order [repo_integration_order]

Optional Specifications(When need cross-file operation):
- Technical Solution [technical_solution] (design includes architecture、components、data flow、solution、interface、protocol、testing strategy、scalability、risk)

### Phase 5: Technical Solution Question(Conditional)

Use `request_user_input` to ask for if need Technical Solution.
- On approval: Continue this phase to 
- On rejection: Skip to next phase.

- Understand what you're building, present the design which includes:
  - Architecture
  - Components
  - Data flow
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense
- Update the Technical Solution Content in Goal Contract After each section

### Phase 6: Artifact Review

- Self-review the Goal Contract for completion and reasonability. 
- Use subagents for independent review when useful.
- Fix accepted findings.

### Phase 7: Ask for Confirmation

Present Goal Contract Summary First.

```markdown
Goal Contract Summary
| Field | Value |
| --- | --- |
| Contract | |
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
| Authorization Source | |
| Blocking gates | |
| Ledger | |
| Next | |
```

Use `request_user_input` to ask for approve/launch, refine, or reject.
- On approval: Contract status = accepted; hand off to `$control-loop`.
- On rejection: Contract status = draft
- On refine: Contract status = draft; return to Phase 2 with user feedback.

## Before Handoff Checklist

- Goal Contract exists
- Contract status = accepted
- Issued by = alpha-goal
- Intent explicit
- Outcome explicit
- Scope explicit
- Constraints explicit
- Acceptance evidence explicit
- Non-goals explicit
- Decision boundary explicit
- Claim boundary explicit
- Authorization source explicit
- Repository inspection completed
- External facts verified
- Source-of-truth conflicts resolved
- Root cause confirmed (repair only)
- Technical Solution explicit(if need)

