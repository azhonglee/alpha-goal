---
name: alpha-goal
description: Clarify ambiguous engineering goals with Socratic interview, ambiguity scoring, pressure tests, and a compact Goal Contract before implementation mutation. Use for broad requests, missing acceptance criteria, target/scope uncertainty, decision-boundary discovery, or handoff to goal-iterate.
---

<Purpose>

Turn vague requests into execution-ready Goal Contracts before planning or implementation.

Do not edit implementation files, create branches or worktrees, commit, push, open PRs/MRs, or claim implementation completion. Process artifacts may be written only after the artifact safety gate below.

</Purpose>

<Use_When>

- The request is broad, ambiguous, or missing concrete acceptance criteria.
- The user wants to avoid misaligned implementation from underspecified requirements.
- Target, scope, non-goals, constraints, or decision boundaries are unclear.
- A requirements artifact is needed before handing off to `goal-iterate`.

</Use_When>

<Depth_Profiles>

- `quick`: fast pre-PRD pass; target ambiguity `<= 0.30`; max rounds 5.
- `standard`: default full requirement interview; target ambiguity `<= 0.20`; max rounds 12.
- `deep`: high-rigor exploration; target ambiguity `<= 0.15`; max rounds 20.

</Depth_Profiles>

<Process>

```text
Discovery -> Interview -> Challenge -> Crystallize -> Verify -> Handoff
```

Core policy:

- Gather codebase facts before asking the user about discoverable internals.
- Always run Discovery before the first interview question.
- Ask one question per round. Do not batch unrelated questions.
- Ask about intent and boundaries before implementation detail.
- Target the weakest clarity dimension after applying stage-priority rules.
- Treat every answer as a claim to pressure-test.
- Stay on the same thread while the current answer is still vague.
- Complete at least one pressure pass that revisits an earlier answer.
- Ask only for user-owned decisions; do not ask the user for discoverable facts.
- Use plain assistant messages for open-ended Socratic questions.
- Use `request_user_input` only for 2-3 structured, mutually exclusive choices.
- Re-score ambiguity after each answer and show progress.
- Do not hand off while ambiguity remains above threshold unless the user explicitly accepts the risk.
- Do not hand off while `Non-goals` or `Decision Boundaries` remain unresolved.

## Phase 1. Discovery

Collect evidence needed to decide whether execution is safe:

- user intent;
- desired outcome;
- target repo/path/service/module;
- candidate repos when cwd is a workspace or aggregator;
- existing work when likely;
- assumptions and risks;
- constraints and decision boundaries;
- likely codebase touchpoints.

Derive a short task slug. `<slug>` names the goal boundary. Do not create empty artifact directories.

Artifact safety gate:

- Before writing `.alpha-goal/` or `docs/design/`, confirm the path is gitignored or the user explicitly approved a durable artifact path.
- If artifact writing is not safe or not allowed, keep the Context, transcript summary, and Goal Contract in chat only.
- Record artifact status as `none`, `chat-only`, `created`, `updated`, or `blocked`.

Minimum Context:

- Task statement
- Desired outcome
- Stated solution
- Probable intent hypothesis
- Known facts/evidence
- Constraints
- Unknowns/open questions
- Decision-boundary unknowns
- Likely codebase touchpoints

If artifact safety is satisfied, store Context at `.alpha-goal/context/YYYYMMDD-<slug>.md`; otherwise keep it in chat.

Announce kickoff, depth profile, threshold, artifact status, and current ambiguity.

## Phase 2. Socratic Interview Loop

Repeat until ambiguity `<= threshold`, pressure pass is complete, readiness gates are explicit, user exits with warning, or max rounds are reached.

### 2a. Generate next question

Use:

- original idea;
- prior Q&A rounds;
- current dimension scores;
- brownfield context, if any;
- active challenge mode.

Target the lowest-scoring dimension, but respect stage priority:

- Stage 1, intent first: Intent, Outcome, Scope, Non-goals, Decision Boundaries.
- Stage 2, feasibility: Constraints, Success Criteria.
- Stage 3, brownfield grounding: Context Clarity.

Follow-up pressure ladder:

1. Ask for a concrete example, counterexample, or evidence signal behind the latest claim.
2. Probe the hidden assumption, dependency, or belief that makes the claim true.
3. Force a boundary or tradeoff: what should be excluded, deferred, or rejected?
4. If the answer still describes symptoms, reframe toward essence or root cause.

### 2b. Ask the question

Use this shape:

```text
Round {n} | Target: {weakest_dimension} | Ambiguity: {score}%

{one question}
```

For a structured choice, include consequences for each option. For open-ended clarification, ask in normal chat and wait.

### 2c. Score ambiguity

Score each weighted dimension in `[0.0, 1.0]` with justification and gap.

Greenfield:

```text
ambiguity = 1 - (intent * 0.30 + outcome * 0.25 + scope * 0.20 + constraints * 0.15 + success * 0.10)
```

Brownfield:

```text
ambiguity = 1 - (intent * 0.25 + outcome * 0.20 + scope * 0.20 + constraints * 0.15 + success * 0.10 + context * 0.10)
```

Readiness gates:

- `Non-goals` must be explicit.
- `Decision Boundaries` must be explicit.
- At least one earlier answer has been revisited with evidence, assumption, or tradeoff pressure.

If any readiness gate is unresolved, continue interviewing even when weighted ambiguity is below threshold.

### 2d. Report progress

Show the weighted breakdown table, readiness-gate status, artifact status, and next focus dimension.

### 2e. Track state

Track rounds in chat. If artifact safety is satisfied, append round summaries to the active `.alpha-goal/context/` artifact. Do not call unavailable state tools.

### 2f. Round controls

- Do not offer early exit before the first assumption probe and one persistent follow-up.
- Round 4+: allow explicit early exit with risk warning.
- Warn at the profile midpoint.
- Stop at the profile max rounds.

## Phase 3. Challenge Modes

Use each applicable mode at most once:

- `contrarian`: challenge core assumptions.
- `simplifier`: probe minimal viable scope.
- `ontologist`: reframe symptoms into essence or root cause.

Track used modes in chat or the approved context artifact.

## Phase 4. Crystallize

When threshold is met, user exits with warning, or hard cap is reached, produce a Goal Contract.

If artifact safety is satisfied, write:

- transcript summary: `.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- Goal Contract: `docs/design/YYYYMMDD-<slug>.md`

If artifact safety is not satisfied, output both in chat.

Goal Contract must include:

```text
Goal Contract:
- Intent:
- Goal type: EXPLORE | DESIGN | IMPLEMENT | DEBUG | VERIFY | RECOVER
- Target:
- Discovery:
- Socratic state:
- Spec:
  - Outcome:
  - Scope:
  - Acceptance:
  - Constraints:
  - Claim boundary:
  - Evidence:
- Non-goals:
- Decision Boundaries:
- Assumptions and risks:
- Pressure-pass findings:
- Artifact status:
- Alpha verdict: CONTRACT_READY | USER_DECISION_NEEDED | BLOCKED | REVISE
- Next:
```

## Phase 5. Verify

Self-review the Goal Contract for accuracy and completeness. Correct accepted findings.

For high-risk or broad contracts, use independent review before handoff when available. Do not leak intended answers; pass the artifact and a neutral review request.

Ask the user to confirm only user-owned decisions. If the user rejects or changes requirements, return to the Interview phase with the feedback.

Alpha verdict values:

- `CONTRACT_READY`: handoff is safe inside the recorded boundary.
- `USER_DECISION_NEEDED`: one user-owned decision blocks readiness.
- `BLOCKED`: missing data, permission, environment, or tool blocks readiness.
- `REVISE`: user feedback changed the contract.

Enter `goal-iterate` only when the Goal Contract is `CONTRACT_READY`.

</Process>

Final checklist: artifact safety recorded; context captured; ambiguity shown each round; readiness gates closed or blocker recorded; pressure pass complete; transcript and Goal Contract written or included in chat; no direct implementation performed.
