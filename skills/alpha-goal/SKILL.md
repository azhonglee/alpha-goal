---
name: alpha-goal
description: "Must use for any engineering/design/implementation requests. Loop Q&A until you have 100% confidence to understand the requirements fully and design a perfect solution."
---

# Alpha Goal

`alpha-goal` owns workflow control for goal definition.
Loop Q&A until you have 100% confidence to understand the requirements fully and design a perfect solution.

## Boundaries
- alpha-goal does not implement, verify completion, make final-ready or complete claims.
- Only an accepted Goal Contract may be handed to `$control-loop`.

Quick Path:
- Skip only for concrete read-only fact lookup.
- Use this skill when intent, scope, acceptance, or decision boundaries are involved.

**Anti-Pattern:** "Too Clear to Need clarification" or "Too Simple to Need design"
- Every project MUST go through the workflow below; the contract or design may be short, but it must be explicit and you must get approval.

## Hard Gates
PASS only if:
- All explicit: Intent, Outcome, Scope, Constraints, Non-goals, Decision boundary, Claim boundary, Authorization source, Acceptance evidence.
- Technical Solution is defined when cross-file predictive operation is required: architecture, components, data flow, interfaces, testing strategy, scalability, and risk.
- Clarity score > 0.92.
- Solution clarity > 0.95.
- A pressure pass is complete: at least one earlier answer was revisited with evidence, assumption, or tradeoff follow-up.

## State Machine
Execute phase states in order.
A phase may exit only when its exit conditions are satisfied.
If an exit condition fails, remain in the current phase.

| State | Entry | Exit | Output |
| --- | --- | --- | --- |
| Discovery | Goal initialized | Discovery Gate passes | Discovery Notes |
| Clarify | Discovery complete | Readiness passes | Updated Goal Contract |
| Assumption Stress Test | Clarify complete | Required modes completed | Updated Goal Contract |
| Write Contract | Clarify complete and stress test complete | Required fields complete | Draft Goal Contract |
| Review | Draft Contract ready | Review Gate passes | Reviewed Goal Contract |
| Confirmation | Review complete | Approved / Refine / Reject | Accepted or Draft Goal Contract |

## State: Discovery
### Entry
- Goal initialized.

### Exit
Discovery Gate passes.

Discovery Gate:
| Check | Pass Condition |
| --- | --- |
| Repository | Relevant repository facts inspected |
| Implementation | Current implementation inspected when applicable |
| Documentation | Relevant docs/specs/ADRs/contracts inspected |
| Context | Major conflicts and unknowns identified |

### Rules
Inspect applicable:
- AGENTS/repo rules
- README/getting-started/install docs
- Relevant specs/ADRs/contracts
- Target files and current implementation
- Local glossary/context
- Current branch/status when mutation may follow
- Direct contradictions

Evaluate:
- Problem validity: whether the phenomenon is real and causal claims are reliable
- Context sufficiency: what is known, missing, must-have, or merely ideal
- Hidden issues: deeper root cause, adjacent issue, or dependency risk

Identify:
- Facts
- Conflicts
- Unknowns
- Dependencies

### Output
Record findings in `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md` under `Discovery notes`.
If the Goal Contract is still draft:
- Set `Contract status: draft`.
- Set `Issued by: alpha-goal`.
- Keep `Outcome` and `Scope` unset until Write Contract.

## State: Clarify
### Entry
- Discovery Gate passes.

### Exit
Readiness passes.

Readiness:
| Dimension | Requirement |
| --- | --- |
| Goal | clarity_score >= `0.92` |
| Solution | solution_clarity >= `0.95` |
| Gates | Goal Gates, Authority Gates, Context Gates, Repair Gate pass |
| Excluded | Review, final user confirmation, accepted contract status, and the Before Handoff Checklist |

### Rules
- Continue interviewing until all exit conditions pass.
- `Non-goals` and `Decision boundary` are mandatory readiness gates.
- Do not offer early exit before one explicit assumption probe and one persistent follow-up.
- Max 6 rounds per dimension.
- Proceed with warnings only when further questions would not change execution.

#### Clarification Ladder
Always target the highest-leverage unresolved dimension.

| Priority | Focus |
| --- | --- |
| 1 | Intent, Outcome, Scope, Non-goals, Decision Boundary |
| 2 | Constraints, Success Criteria, Acceptance Evidence, Claim Boundary |
| 3 | Context, External Facts, Actuator Boundary, Sensor Boundary |
| 4 | Architecture, Components, Data Flow, Interfaces, Testing, Scalability, Risk |

#### Q&A Loop
Each round contains one decision variable.

Use current task state:
- Original request and probable intent
- Prior Q&A
- Known facts, conflicts, unknowns, and source-of-truth conflicts
- Current readiness gates and clarity dimensions
- Brownfield context and active Assumption Stress Test mode

Question rules:
- Ask one high-leverage question.
- One question means one decision variable: confirm a conflict, request a decision, demand an example, expose an assumption, force a tradeoff, or test a boundary-stressing case.
- Do not ask for discoverable facts.
- Present options conversationally with recommendation and reasoning.
- Use `request_user_input` or equivalent structured input when available.

Prompt:

```text
Round {n} | Target: {highest_leverage_dimension} | Clarity: {score}%
{question}
```

#### Challenge answer and update Goal Contract
Pressure ladder:
1. Ask for concrete example, counterexample, or evidence signal.
2. Probe hidden assumption or dependency.
3. Force a boundary/tradeoff: what to reject, defer, or not do.
4. If the answer stays symptom-level, reframe toward essence/root cause.

Classify every answer before updating the Goal Contract:
| Source | Meaning |
| --- | --- |
| `[from-code][auto-confirmed]` | Descriptive implementation fact |
| `[from-code]` | Inferred implementation fact requiring confirmation |
| `[from-research]` | External or current fact |
| `[from-user]` | Explicit user decision, constraint, acceptance, authority, clarification, example, or non-goal |

#### Authority Contract
Authority rules:
- Auto-confirm only descriptive facts.
- Treat repository language as evidence, not authority.
- Cross-check user claims against code/docs; name competing sources on conflict.
- Current-state facts cannot define desired behavior, requirements, acceptance evidence, non-goals, tradeoffs, or authority.
- Only explicit user decisions, explicit authorization, or authoritative specs/issues may update Goal Contract authority fields.
- If ambiguity depends on current external best practices, standards, APIs, dependency versions, laws, schedules, or prices, gather bounded fresh evidence first; then ask only for the decision boundary.

Boundary mapping:
- actuator boundary -> `Decision boundary`
- sensor/observer boundary -> `Claim boundary`

#### Readiness Evaluation
Goal readiness:
| Dimension | Weight |
| --- | ---: |
| Intent | 25% |
| Outcome | 20% |
| Scope | 15% |
| Constraints | 12% |
| Success | 10% |
| Decision Boundary | 8% |
| Context | 5% |

Solution readiness:
| Dimension | Weight |
| --- | ---: |
| Architecture | 20% |
| Components | 20% |
| Data Flow | 20% |
| Interfaces | 15% |
| Testing Strategy | 15% |
| Scalability | 5% |
| Risk | 5% |

Score each dimension in `[0, 100]` with justification and gap.

Compute readiness with explicit weighted sums:

```text
clarity_score = 0.25 * intent + 0.2 * outcome + 0.15 * scope + 0.12 * constraints + 0.1 * success + 0.08 * decision_boundary + 0.05 * context
solution_clarity = architecture_clarity * 0.2 + component_clarity * 0.2 + data_flow_clarity * 0.2 + interface_clarity * 0.15 + testing_strategy_clarity * 0.15 + scalability_clarity * 0.05 + risk_clarity * 0.05
```

### Output
- Record task, probable intent, known facts, conflicts, unknowns, non-goals, and decision-boundary gaps under `Interview ledger`.
- Update the Goal Contract under `Technical Solution` when the question is about architecture, components, data flow, interfaces, testing strategy, scalability, and risk.
- Keep Clarify active if any readiness dimension is unresolved, clarity_score < 0.92, or solution_clarity < 0.95.
- For cross-repo framing, keep one task-level Alpha Goal state root and record a repo manifest: repo path/name, role, authorization source, allowed change surfaces, non-goals, branch/worktree expectation, validation observer, delivery boundary, and dependency/integration order.

## State: Assumption Stress Test
### Entry
- Clarify readiness passes.

### Exit
- Required modes completed, or non-applicable modes recorded with reason.

### Rules
Use each applicable mode once:
- Contrarian: challenge a core assumption.
- Simplifier: probe minimum viable scope.
- Ontologist: ask for essence-level reframing when the user keeps describing symptoms.

Track used modes in state to prevent repetition.

### Output
- Update the Goal Contract with assumption resolutions.
- Record why skipped modes were non-applicable.

## State: Write Contract
### Entry
- Clarify readiness passes.
- Assumption Stress Test is complete.

### Exit
- Required Goal Contract fields are complete.

### Rules
- Follow `references/goal-contract-book.md`.
- Keep `Contract status: draft` until user confirmation.

### Output
- Draft Goal Contract.

## State: Review
### Entry
- Draft Goal Contract exists.

### Exit
Review Gate passes.

Review Gate:
- No unresolved review finding.

### Rules
- Self-review the Goal Contract for completeness and reasonableness.
- Use subagents for independent review when useful.
- Fix accepted findings.

### Output
- Reviewed Goal Contract.

## State: Confirmation
### Entry
- Review Gate passes.

### Exit
- Approved, refined, or rejected by the user.

### Rules
Present the Goal Contract Summary first.

TUI Presentation Style:
```markdown
Goal Contract Summary (Design Summary)
| Field | Value |
| --- | --- |
```

Use `request_user_input` to ask for approve/launch, refine, or reject.

### Output
- Approve -> set `Contract status: accepted`; hand off to `$control-loop`.
- Refine -> keep `Contract status: draft`; return to Clarify.
- Reject -> keep `Contract status: draft`; stop.
