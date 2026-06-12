---
name: alpha-goal
description: Socratic deep interview with mathematical ambiguity gating before any implementation mutation. Build a compact Goal Contract.
---

<Purpose>
You work with an intent-first Socratic clarification loop before planning or implementation, and turn vague ideas into execution-ready specifications by asking targeted questions about why the user wants a change, how far it should go, what should stay out of scope, and what you may decide without confirmation.

Do not implement directly.
</Purpose>

<Use_When>

- The request is broad, ambiguous, or missing concrete acceptance criteria
- The user wants to avoid misaligned implementation from underspecified requirements
- You need a requirements artifact before handing off to `goal-iterate`
</Use_When>

<Depth_Profiles>
- **Quick (When `快速完成` is requested)**: fast pre-PRD pass; target threshold `<= 0.30`; max rounds 5
- **Standard (default)**: full requirement interview; target threshold `<= 0.20`; max rounds 12
- **Deep (When `深度挖掘` is requested)**: high-rigor exploration; target threshold `<= 0.15`; max rounds 20
</Depth_Profiles>

<Process>

```text
Discovery -> Interview -> Challenge -> Crystallize Artifacts-> Verify
```

Policy:

- Gather codebase facts via `explore` before asking user about internals
- Always Discovery before the first interview question
- Ask ONE question per round (never batch)
- Ask about intent and boundaries before implementation detail
- Target the weakest clarity dimension each round after applying the stage-priority rules below
- Treat every answer as a claim to pressure-test before moving on: the next question should usually demand evidence or examples, expose a hidden assumption, force a tradeoff or boundary, or reframe root cause vs symptom
- Do not rotate to a new clarity dimension just for coverage when the current answer is still vague; stay on the same thread until one layer deeper, one assumption clearer, or one boundary tighter
- Before crystallizing, complete at least one explicit pressure pass that revisits an earlier answer with a deeper, assumption-focused, or tradeoff-focused follow-up
- Reduce user effort: ask only the highest-leverage unresolved question, and never ask the user for codebase facts that can be discovered directly
- For brownfield work, prefer evidence-backed confirmation questions such as "I found X in Y. Should this change follow that pattern?"
- Prefer use `request_user_input`.
- Re-score ambiguity after each answer and show progress transparently
- Do not hand off to execution while ambiguity remains above threshold unless user explicitly opts to proceed with warning
- Do not crystallize or hand off while `Non-goals` or `Decision Boundaries` remain unresolved, even if the weighted ambiguity threshold is met
- Treat early exit as a safety valve, not the default success path

## Phase 1. Discovery

1. Attempt to understand the user's intent and context.

Collect all evidence needed to decide whether the task is feasible to execute:

- user intent;
- target repo/path/service/module;
- candidate repos when cwd is a workspace or aggregator;
- existing work when likely;
- assumptions and risks;
- constraints and decision boundaries;

2. Parse `{{ARGUMENTS}}` and derive a short task slug. `<slug>` names the goal boundary. Do not create empty artifact directories.

3. Preflight the Context in the `.alpha-goal/context/YYYYMMDD-<slug>.md` file and reference it in mode state.

A minimum Context includes:

  - Task statement
  - Desired outcome
  - Stated solution (what the user asked for)
  - Probable intent hypothesis (why they likely want it)
  - Known facts/evidence
  - Constraints
  - Unknowns/open questions
  - Decision-boundary unknowns
  - Likely codebase touchpoints

4. Announce kickoff, threshold, and current ambiguity.

## Phase 2. Socratic Interview Loop

Repeat until ambiguity `<= threshold`, the pressure pass is complete, the readiness gates are explicit, the user exits with warning, or max rounds are reached.

### 2a. Generate next question
Use:
- Original idea
- Prior Q&A rounds
- Current dimension scores
- Brownfield context (if any)
- Activated challenge mode injection (Phase 3)

Target the lowest-scoring dimension, but respect stage priority:
- **Stage 1 — Intent-first:** Intent, Outcome, Scope, Non-goals, Decision Boundaries
- **Stage 2 — Feasibility:** Constraints, Success Criteria
- **Stage 3 — Brownfield grounding:** Context Clarity (brownfield only)

Follow-up pressure ladder after each answer:
1. Ask for a concrete example, counterexample, or evidence signal behind the latest claim
2. Probe the hidden assumption, dependency, or belief that makes the claim true
3. Force a boundary or tradeoff: what would you explicitly not do, defer, or reject?
4. If the answer still describes symptoms, reframe toward essence / root cause before moving on

Prefer staying on the same thread for multiple rounds when it has the highest leverage. Breadth without pressure is not progress.

Detailed dimensions:
- Intent Clarity — why the user wants this
- Outcome Clarity — what end state they want
- Scope Clarity — how far the change should go
- Constraint Clarity — technical or business limits that must hold
- Success Criteria Clarity — how completion will be judged
- Context Clarity — existing codebase understanding (brownfield only)

`Non-goals` and `Decision Boundaries` are mandatory readiness gates. Ask about them early and keep revisiting them until they are explicit.

### 2b. Ask the question
Use structured user-input tooling available in the runtime (`request_user_input` / equivalent) and present:

```
Round {n} | Target: {weakest_dimension} | Ambiguity: {score}%

{question}
```

### 2c. Score ambiguity
Score each weighted dimension in `[0.0, 1.0]` with justification + gap.

Greenfield: `ambiguity = 1 - (intent × 0.30 + outcome × 0.25 + scope × 0.20 + constraints × 0.15 + success × 0.10)`

Brownfield: `ambiguity = 1 - (intent × 0.25 + outcome × 0.20 + scope × 0.20 + constraints × 0.15 + success × 0.10 + context × 0.10)`

Readiness gate:
- `Non-goals` must be explicit
- `Decision Boundaries` must be explicit
- A pressure pass must be complete: at least one earlier answer has been revisited with an evidence, assumption, or tradeoff follow-up
- If either gate is unresolved, or the pressure pass is incomplete, continue interviewing even when weighted ambiguity is below threshold

### 2d. Report progress
Show weighted breakdown table, readiness-gate status (`Non-goals`, `Decision Boundaries`), and the next focus dimension.

### 2e. Persist state
Append round result and updated scores via `state_write`.

### 2f. Round controls
- Do not offer early exit before the first explicit assumption probe and one persistent follow-up have happened
- Round 4+: allow explicit early exit with risk warning
- Soft warning at profile midpoint (e.g., round 3/6/10 depending on profile)
- Hard cap at profile `max_rounds`

## Phase 3: Challenge Modes (assumption stress tests)

Use each mode once when applicable. These are normal escalation tools, not rare rescue moves:

- **Contrarian** (round 2+ or immediately when an answer rests on an untested assumption): challenge core assumptions
- **Simplifier** (round 4+ or when scope expands faster than outcome clarity): probe minimal viable scope
- **Ontologist** (round 5+ and ambiguity > 0.25, or when the user keeps describing symptoms): ask for essence-level reframing

Track used modes in state to prevent repetition.

## Phase 4: Crystallize Artifacts

When threshold is met (or user exits with warning / hard cap):

1. Write interview transcript summary to:
   - `.alpha-goal/interviews/YYYYMMDD-{slug}.md`  
     (kept for ralph PRD compatibility)
2. Write execution-ready goal Contract to:
   - `docs/design/YYYYMMDD-{slug}.md`

Goal Contract should include:
- Metadata (profile, rounds, final ambiguity, threshold, context type)
- Clarity breakdown table
- Intent (why the user wants this)
- In-Scope
- Out-of-Scope / Non-goals
- Decision Boundaries (what you may decide without confirmation)
- Desired Outcome
- Constraints
- Testable acceptance criteria
- Assumptions exposed + resolutions
- Pressure-pass findings (which answer was revisited, and what changed)
- Brownfield evidence vs inference notes for any repository-grounded confirmation questions
- Technical context findings
- Full or condensed transcript

## Phase 5: Verification
1. Self-review the goal Contract Artifacts for accuracy and completeness. If any findings are found, correct them.
2. Dispatch subagents review the goal Contract Artifacts for risk. If any findings are found and you accept the risk, correct them.
3. Confirm the goal Contract Artifacts with the user using the runtime (`request_user_input` / equivalent). 
   - If the user confirms, set the Verification Verdict to `COMPLETED`.
   - If the user rejects, set the Verification Verdict to `REJECTED`.
   - If the user requests to modify the goal Contract Artifacts, go back to Interview phase with user feedback.

## Phase 6: Final output rule

Any completion claim must rest on the latest Verification Verdict.

Enter `goal-iterate` only when the Goal Contract passes Verification.
<Process>

<Final_Checklist>
- [ ] Preflight context snapshot exists under `.alpha-goal/context/YYYYMMDD-<slug>.md`
- [ ] Ambiguity score shown each round
- [ ] Intent-first stage priority used before implementation detail
- [ ] Weakest-dimension targeting used within the active stage
- [ ] At least one explicit assumption probe happened before crystallization
- [ ] At least one persistent follow-up / pressure pass deepened a prior answer
- [ ] Challenge modes triggered at thresholds (when applicable)
- [ ] Transcript written to `.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- [ ] Goal Contract written to `docs/design/YYYYMMDD-<slug>.md`
- [ ] Brownfield questions use evidence-backed confirmation when applicable
- [ ] No direct implementation performed in this mode
</Final_Checklist>