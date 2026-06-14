---
name: alpha-goal
description: Turn engineering/debug/design requests into a safe Goal Contract before implementation, including intent, boundary, root cause, evidence, and execution authorization.
---

# Alpha Goal

Use this skill to convert an unclear engineering request into a safe Goal Contract before implementation; when mutation is not yet safe or not requested, return the lightest non-implementation artifact instead.

## Boundaries

- Do not edit implementation files, push, open PRs/MRs, deploy, or claim implementation completion; follow repository isolation rules for any allowed artifact work.
- Write process artifacts only after the artifact safety gate. If unsafe, keep artifacts in chat.
- Ask only for user-owned decisions. Discover codebase facts yourself before asking about internals.
- Use `request_user_input` by default when user input is needed and the runtime provides it.
- Goal Contract acceptance authorizes only handoff to `loop`; it does not authorize push, PR/MR creation, deployment, data repair, permission requests, or other external side effects in this skill.
- Keep the contract work proportional: gather what makes the Goal Contract reliable, and avoid ceremony that does not reduce ambiguity, risk, or handoff uncertainty.

## Process

```text
Discover proportionally -> Clarify -> Pressure-test proportionally -> Crystallize -> Review -> Handoff
```

### 1. Discover proportionally

Objective:
- Discover exists to identify uncertainty, not to eliminate it.

Collect context around:
- user intent, desired outcome, stated solution, constraints;
- target repo/path/service/module and likely codebase touchpoints;
- existing work or durable specs when likely;
- unknowns, non-goals, decision-boundary risks, and acceptance/evidence gaps.

Calibrate discovery depth by the highest authority that may be exercised next.
Discover is sufficient when additional facts are unlikely to change:
- authority,
- scope,
- risk,
- decision boundaries,
- or the next safe action.

For diagnostic work, distinguish symptoms, observations, and competing hypotheses. Do not assume repair authorization merely because a plausible root cause exists.

Derive a short `<slug>` for the goal boundary. Do not create empty directories.

Minimum context can be compact: task statement, desired outcome, probable intent, known evidence, constraints, unknowns, decision-boundary gaps, and likely touchpoints. Store it at `.alpha-goal/context/YYYYMMDD-<slug>.md` when `.alpha-goal/` is gitignored, otherwise stay chat-only.

Announce the state that helps the user decide or follow the next action.

### 2. Clarify

Do a clarity check every time, but ask only when material user-owned uncertainty remains. Return to clarification when target, scope, non-goals, decision boundaries, evidence needs, or next safe action would otherwise be guessed.

Depth profiles are calibration aids, not ceremony:

- `quick`: pre-PRD or low-risk framing; target ambiguity around `<= 0.30`; normally 1-5 rounds.
- `standard`: default; target ambiguity around `<= 0.20`; stop as soon as remaining uncertainty no longer changes scope, acceptance, risk, or authority.
- `deep`: broad or high-risk; target ambiguity around `<= 0.15`; use multiple rounds only while each round reduces material uncertainty.

Clarification cycle:

- Ask one high-leverage question per round.
- Ask about intent, outcome, scope, non-goals, and decision boundaries before implementation detail.
- Target the weakest clarity dimension after stage priority:
  1. intent, outcome, scope, non-goals, decision boundaries;
  2. constraints and success criteria;
  3. brownfield context.
- Stay on the same thread while the answer is vague; breadth without pressure is not progress.
- Re-score ambiguity after each answer and show progress.
- Continue while ambiguity is materially above threshold, readiness gates are open, pressure pass is incomplete for a contract handoff, or the user changes the target.
- If the user stops clarification before readiness gates close, summarize unresolved gaps and proceed only by narrowing the artifact, asking for explicit risk acceptance, or handing off with unresolved gaps clearly bounded.
- For long interviews, respect the selected depth profile's practical cap; at the cap, crystallize the safest available output and list unresolved gaps.

Clarity dimensions:

- Intent Clarity: why this matters.
- Outcome Clarity: what end state is wanted.
- Scope Clarity: what is included and excluded.
- Constraint Clarity: technical or business limits.
- Success Criteria Clarity: how completion will be judged.
- Context Clarity: brownfield facts and existing-work relationship.

Scoring is a self-check, not a proof. Use `high / medium / low` unless numeric rigor helps the user or risk level. If using numbers:

```text
Greenfield ambiguity = 1 - (intent*0.30 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.10)
Brownfield ambiguity = 1 - (intent*0.25 + outcome*0.20 + scope*0.20 + constraints*0.15 + success*0.10 + context*0.10)
```

Readiness gates:

- non-goals or excluded scope are explicit;
- decision boundaries state what the agent may decide without confirmation;
- acceptance/evidence expectations are testable enough for the next action;
- diagnostic goals define the evidence that authorizes repair; until then, repair is out of scope;
- one pressure pass revisits an earlier answer with evidence, assumption, or tradeoff probing.

When durable interview state is useful and the artifact safety gate passes, append interview summaries to `.alpha-goal/interviews/`; otherwise keep the summary in chat.

### 3. Pressure-test proportionally

Use each pressure-test lens at most once when it reduces real uncertainty. Pressure-test is optional for simple bounded exploration, useful for design, and required before a Goal Contract or diagnostic handoff.

- `contrarian`: challenge the core assumption.
- `simplifier`: ask for the smallest useful scope.
- `ontologist`: reframe symptoms into the underlying entity, state, or cause.
- `evidence-checker`: how would we know we are wrong?

Follow-up ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the assumption or dependency that makes the answer true.
3. Force a boundary or tradeoff: exclude, defer, or reject something.
4. If still symptom-level, reframe toward root cause or essence.

### 4. Crystallize

Produce the lightest artifact that makes the next action safe:

- `Clarifying question` or `Return-to-user decision/blocker`: name the missing user-owned decision, risk acceptance, permission, tool, data, or environment.
- `Bounded exploration answer`: provide findings, evidence, residual uncertainty, and resolved next actions; state whether a Goal Contract is needed before mutation.
- `Design/spec`: provide the smallest useful design/spec that resolves the decision boundary: options considered, chosen direction, tradeoffs, non-goals, acceptance implications, and what must be true before mutation. It is not an implementation handoff artifact; convert it to an accepted Goal Contract before any `loop` handoff.
- `Goal Contract` or `Diagnostic contract`: create a Goal Contract covering the relevant semantics below.

For Goal Contracts, use any concise headings that cover the needed semantics:

- metadata: profile, rounds, final ambiguity, threshold, context type;
- context snapshot reference/path or chat-only note;
- clarity breakdown;
- intent and desired outcome;
- in-scope and out-of-scope / non-goals;
- decision boundaries, constraints, and assumptions resolved;
- testable acceptance criteria and evidence expectations;
- for diagnostic goals: symptom, observations, competing hypotheses, cause-evidence needed, and repair authorization gate;
- pressure-test findings;
- brownfield evidence vs inference;
- technical context findings;
- condensed transcript when useful.

Default durable paths:

- context: `.alpha-goal/context/YYYYMMDD-<slug>.md`
- transcript: `.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- Goal Contract: `docs/design/YYYYMMDD-<slug>.md`

### 5. Review

Self-review the artifact against the evidence and boundaries. If review fails, return to the earliest phase that can fix the failure: Discover for missing facts, Clarify for user-owned uncertainty, Pressure-test for weak assumptions or boundaries, or Crystallize for an invalid artifact.

Review checks:

- Does it answer the actual user request rather than a process template?
- Are non-goals, decision boundaries, and claim boundaries explicit enough?
- Are codebase facts labeled as evidence, and guesses labeled as inference?
- Would the next agent know what not to do?
- Review fails if implementation mutation has started before an accepted Goal Contract or equivalent accepted context exists; stop, report the boundary breach, and return to Crystallize/Handoff.
- If a safe read-only diagnostic probe remains inside the current alpha-goal boundary, return to Discover and run it instead of merely recommending it.
- If the next step requires a user-owned decision, permission request, external side effect, mutation, data repair, push, PR/MR, deployment, credential use, risk acceptance, or claim-boundary decision, return to Clarify and ask with `request_user_input` when available.
- If missing permission, tool, data, environment, or safe-state prevents progress, return to Crystallize and state the concrete blocker.
- For diagnostic work, keep only probes needed to define or validate the diagnostic boundary inside `alpha-goal`; probes that execute an accepted diagnostic plan belong to `loop`.

For broad or high-risk contracts, request independent review when available without leaking intended answers.

### 6. Handoff

Handoff means passing an accepted Goal Contract to `loop`. Non-contract artifacts return to the user or inform a later Goal Contract; they do not hand off to implementation. Do not treat handoff as permission for the same alpha-goal run to start implementation work.

Treat Goal Contract acceptance as a user-owned decision: when a `loop` handoff contract is ready, use `request_user_input` to ask the user to accept, reject, or change it. If the user rejects, changes, or narrows requirements, return to Clarify.

After self-review and user acceptance of a Goal Contract, commit allowed process artifacts respecting repository isolation and artifact safety rules, then hand off the approved slice to `loop`. Without an accepted Goal Contract, do not hand off to `loop` or any implementation agent. For diagnostic contracts, hand off a repair slice only when the Goal Contract records root-cause evidence and explicitly authorizes repair; otherwise the first `loop` slice is diagnosis/probe.

