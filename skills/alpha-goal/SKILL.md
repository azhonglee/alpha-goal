---
name: alpha-goal
description: "Must use for any engineering/design/implementation requests. Loop Q&A until you have 100% confidence to understand the requirements fully and design a perfect solution."
---

# Alpha Goal

## Mission
`alpha-goal` owns workflow control for goal definition.
Loop Q&A until you have 100% confidence to understand the requirements fully and design a perfect solution.

## Authority
- alpha-goal frames goals only.
- alpha-goal does not implement, verify completion, make final-ready, or make complete claims.
- Only an accepted Goal Contract may be handed to `$control-loop`.
- Repository language is evidence, not authority.
- Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority.
- Only explicit user decisions, explicit authorization, or authoritative specs/issues may update Goal Contract authority fields.

Quick Path:
- Skip only for concrete read-only fact lookup.
- Use this skill when intent, scope, acceptance, or decision boundaries are involved.

Anti-Pattern:
- "Too Clear to Need clarification" or "Too Simple to Need design"
- Every project MUST pass the protocol below; the contract or design may be short, but it must be explicit and approved.

## Protocol Contracts
### Goal Contract
The Goal Contract must make these fields explicit enough for the risk of the work:
- Intent
- Outcome
- Scope
- Constraints
- Acceptance evidence
- Non-goals
- Decision boundary
- Claim boundary
- Authorization source

Write the canonical Goal Contract to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`.
Follow `references/goal-contract-book.md` when writing the contract.

### Technical Solution Contract
Required when cross-file predictive operation is involved:
- Architecture
- Components
- Data flow
- Interfaces
- Testing strategy
- Scalability
- Risk

### Authority Contract
Classify every answer before updating the Goal Contract:

| Source | Meaning |
| --- | --- |
| `[from-code][auto-confirmed]` | Descriptive implementation fact |
| `[from-code]` | Inferred implementation fact requiring confirmation |
| `[from-research]` | External or current fact |
| `[from-user]` | Explicit user decision, constraint, acceptance, authority, clarification, example, or non-goal |

Authority invariants:
- Auto-confirm only descriptive facts.
- Cross-check user claims against code/docs; name competing sources on conflict.
- If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first; then ask only for the decision boundary.
- Map actuator boundary to `Decision boundary`.
- Map sensor/observer boundary to `Claim boundary`.

### Question Contract
Each question round has one decision variable.

Question context must include:
- Original request and probable intent
- Prior Q&A
- Known facts, conflicts, unknowns, and source-of-truth conflicts
- Current readiness gates and clarity dimensions
- Brownfield context and active Assumption Stress Test mode

Question constraints:
- Ask one high-leverage question.
- Do not ask for discoverable facts.
- Present options conversationally with recommendation and reasoning.
- Use `request_user_input` or equivalent structured input when available.

Prompt:

```text
Round {n} | Target: {highest_leverage_dimension} | Clarity: {score}%
{question}
```

### Readiness Contract
Score dimensions as decimal values in `[0, 1]`.
Readiness thresholds are decimal values: Goal Readiness PASS is `clarity_score >= 0.92`; Solution Readiness PASS is `solution_clarity >= 0.95`.

Goal readiness formula:

```text
raw_goal_score = 0.25 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context
clarity_score = raw_goal_score / 0.95
```

Solution readiness formula:

```text
solution_clarity = architecture_clarity * 0.2 + component_clarity * 0.2 + data_flow_clarity * 0.2 + interface_clarity * 0.15 + testing_strategy_clarity * 0.15 + scalability_clarity * 0.05 + risk_clarity * 0.05
```

Readiness priority:

| Priority | Focus |
| --- | --- |
| 1 | Intent, Outcome, Scope, Non-goals, Decision Boundary |
| 2 | Constraints, Success Criteria, Acceptance Evidence, Claim Boundary |
| 3 | Context, External Facts, Actuator Boundary, Sensor Boundary |
| 4 | Architecture, Components, Data Flow, Interfaces, Testing, Scalability, Risk |

## Gate Taxonomy
### Hard Gates
Before leaving alpha-goal, all must PASS:
- Goal Readiness Gate
- Solution Readiness Gate
- Authority Gate
- Pressure Gate
- Assumption Stress Test Gate
- Review Gate
- Confirmation Gate

If any gate fails, route by the Transition Contract.

### Gate Definitions
| Gate | PASS condition | Default failure route |
| --- | --- | --- |
| Discovery Gate | Relevant repository, implementation, documentation, conflicts, and unknowns inspected | SAME_STATE or BLOCKED |
| Goal Readiness Gate | Goal Contract fields are explicit and `clarity_score >= 0.92` | SAME_STATE |
| Solution Readiness Gate | Technical Solution is sufficient when required and `solution_clarity >= 0.95` | SAME_STATE |
| Authority Gate | No current-state fact defines desired behavior and all authority fields come from valid authority | RETURN_TO_ALPHA_GOAL if authority changes; otherwise SAME_STATE |
| Pressure Gate | At least one explicit assumption probe and one persistent follow-up completed | SAME_STATE |
| Assumption Stress Test Gate | Each applicable stress-test mode completed, or non-applicable modes recorded with reason | SAME_STATE |
| Write Contract Gate | Required Goal Contract fields complete; `Contract status: draft`; `Issued by: alpha-goal` | SAME_STATE |
| Review Gate | Required fields complete; no contradiction; no unresolved review finding; authority preserved; Goal Contract internally consistent | SAME_STATE |
| Confirmation Gate | User chooses Approve, Refine, or Reject after Goal Contract Summary | route by Confirmation Decision Table |

## Transition Contract
### Global Transition Table
| Condition | Route | Meaning |
| --- | --- | --- |
| Gate PASS | NEXT_STATE | Move to the next state in the State Machine |
| Recoverable gate failure | SAME_STATE | Remain in current state and resolve the gap |
| Missing required data, tool, environment, credential, or user-owned decision | BLOCKED | Stop until the blocker changes |
| Draft Goal Contract field changes during Clarify | SAME_STATE | Update the draft contract inside alpha-goal authority |
| Target, scope, acceptance, non-goal, decision boundary, claim boundary, or authorization source changes after contract acceptance or handoff | RETURN_TO_ALPHA_GOAL | Restart goal definition with new authority |
| User rejects confirmation | STOP | Stop without handoff |

### Confirmation Decision Table
| User Choice | Next Route | Contract Status |
| --- | --- | --- |
| Approve | `$control-loop` | accepted |
| Refine | Clarify | draft |
| Reject | STOP | draft |

## State Machine
Execute states in order.
A state exits only when its gate passes.
If a gate fails, use the Transition Contract.

| State | Entry | Gate | PASS Route | Output |
| --- | --- | --- | --- | --- |
| Discovery | Goal initialized | Discovery Gate | Clarify | Discovery Notes |
| Clarify | Discovery Gate PASS | Goal, Solution, Authority, and Pressure Gates | Assumption Stress Test | Updated Goal Contract |
| Assumption Stress Test | Clarify Gates PASS | Assumption Stress Test Gate | Write Contract | Updated Goal Contract |
| Write Contract | Stress Test PASS | Write Contract Gate | Review | Draft Goal Contract |
| Review | Draft Contract ready | Review Gate | Confirmation | Reviewed Goal Contract |
| Confirmation | Review Gate PASS | Confirmation Gate | `$control-loop`, Clarify, or STOP | Accepted or Draft Goal Contract |

## State Contracts
### Discovery Contract
Gate checklist:
- Inspect AGENTS/repo rules.
- Inspect README/getting-started/install docs.
- Inspect relevant specs/ADRs/contracts.
- Inspect target files and current implementation when applicable.
- Inspect local glossary/context.
- Inspect current branch/status when mutation may follow.
- Identify direct contradictions.

Evaluate:
- Problem validity
- Context sufficiency
- Hidden issues

Output:
- Record facts, conflicts, unknowns, and dependencies under `Discovery notes`.
- If the contract is draft, set `Contract status: draft` and `Issued by: alpha-goal`.
- Keep `Outcome` and `Scope` unset until Write Contract.

Failure exceptions:
- Repository facts unavailable -> BLOCKED.
- Discovery reveals authority drift -> RETURN_TO_ALPHA_GOAL.

### Clarify Contract
Clarify must run as a micro-FSM.

| Micro-State | Entry | Exit | Output |
| --- | --- | --- | --- |
| Question | Highest-leverage unresolved dimension selected | User answered | One decision-variable answer |
| Answer | User answer received | Pressure ladder applied | Clarified decision, example, evidence, or tradeoff |
| Classification | Answer stabilized | Source classified | `[from-*]` classification |
| Contract Update | Classification complete | Goal Contract updated within authority | Updated Goal Contract |
| Readiness Decision | Goal Contract updated | Continue Clarify or exit by gates | SAME_STATE or NEXT_STATE |

Pressure ladder:
1. Ask for concrete example, counterexample, or evidence signal.
2. Probe hidden assumption or dependency.
3. Force a boundary/tradeoff: what to reject, defer, or not do.
4. If the answer stays symptom-level, reframe toward essence/root cause.

Loop control:
- `Non-goals` and `Decision boundary` are mandatory readiness gates.
- Do not offer early exit before one explicit assumption probe and one persistent follow-up.
- Max 6 rounds per dimension.
- Continue while any readiness dimension is unresolved, `clarity_score < 0.92`, or `solution_clarity < 0.95`.
- Proceed with warnings only when further questions would not change execution.

Output:
- Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps under `Interview ledger`.
- Update `Technical Solution` when the question is about architecture, components, data flow, interfaces, testing strategy, scalability, or risk.
- For cross-repo framing, keep one task-level Alpha Goal state root and record a repo manifest: repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.

### Assumption Stress Test Contract
Use each applicable mode once:

| Mode | Contract |
| --- | --- |
| Contrarian | Challenge a core assumption |
| Simplifier | Probe minimum viable scope |
| Ontologist | Ask for essence-level reframing when the user keeps describing symptoms |

Output:
- Update the Goal Contract with assumption resolutions.
- Record why skipped modes were non-applicable.

### Write Contract Contract
- Write the Draft Goal Contract using `references/goal-contract-book.md`.
- Keep `Contract status: draft` until user confirmation.
- Include required fields and Technical Solution when required.

### Review Contract
Review Gate PASS only if:
- Required fields are complete.
- No internal contradiction remains.
- No unresolved review finding remains.
- Authority is preserved.
- Goal Contract is internally consistent.
- Acceptance evidence maps to the stated Outcome and Claim boundary.

Use subagents for independent review when useful.
Fix accepted findings before Confirmation.

### Confirmation Contract
Present the Goal Contract Summary first.

TUI Presentation Style:
```markdown
Goal Contract Summary (Design Summary)
| Field | Value |
| --- | --- |
```

Use `request_user_input` to ask for approve/launch, refine, or reject.
Apply the Confirmation Decision Table exactly.

## Artifacts
Default runtime artifacts live under `<Alpha Goal state root>/YYYYMMDD-<TaskName>/`.
Resolve Alpha Goal state root as `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`, where `<workspace-slug>` is `slug(repo_root or Goal Contract target workspace)`.

Canonical artifact:
- `goal-contract.md`

Optional artifacts:
- `checkpoint.md` only when recovery, evidence handoff, verification handoff, long-running execution, interrupted execution, or multi-step repair needs it.
- Repo specs mirrors only when useful or required by repo convention; state-root `goal-contract.md` remains canonical.
