---
name: alpha-goal
description: Clarify ambiguous engineering goals with Socratic interview, ambiguity scoring, pressure tests, and a compact Goal Contract before implementation mutation. Use for broad requests, missing acceptance criteria before implementation, target/scope uncertainty, decision-boundary discovery, read-only exploration framing, or preparing an accepted Goal Contract for a mutation/execution phase. Do not use for verification/completion/readiness judgments unless the claim or evidence boundary is unclear.
---

# Alpha Goal

Use this skill to convert an unclear engineering request into a safe next action. The output may be a Goal Contract, a bounded read-only exploration answer, a design/spec, or a return-to-user decision; do not force every request into the same artifact.

## Boundaries

- Do not edit implementation files, push, open PRs/MRs, deploy, or claim implementation completion; follow repository isolation rules for any allowed artifact work.
- Write process artifacts only after the artifact safety gate. If unsafe, keep artifacts in chat.
- Ask only for user-owned decisions. Discover codebase facts yourself before asking about internals.
- Use `request_user_input` by default when user input is needed and the runtime provides it.
- Choose the lightest safe handling that can make the next action reliable; keep it as small as safety allows. Avoid ceremony that does not reduce ambiguity or risk.

## Process

```text
Discover proportionally -> Clarify if needed -> Pressure-test proportionally -> Crystallize -> Review / handoff
```

### 1. Discover proportionally

Collect initial evidence to locate the goal boundary and decide what must be clarified, pressure-tested, or crystallized later. Discover identifies material gaps; it does not replace clarification, pressure-testing, or crystallization.

Collect evidence about:

- user intent, desired outcome, stated solution, constraints;
- target repo/path/service/module and likely codebase touchpoints;
- candidate repos in workspaces or aggregators;
- existing work or durable specs when likely;
- unknowns, non-goals, decision-boundary risks, and acceptance/evidence gaps.

Calibrate discovery depth by downstream authority, not by rigid request categories:

- For a bounded read-only answer, discover enough to answer within a stated boundary or identify the safe auto-probe still needed.
- For a design/spec, discover enough context to know which tradeoffs, non-goals, and mutation prerequisites must be resolved.
- For a Goal Contract, discover whether target, scope, non-goals, decision boundaries, and acceptance/evidence expectations can be closed; later phases close and pressure-test them.
- For diagnostic work, discover the symptom, observations, and competing hypotheses enough to decide whether more probe work is needed before any repair authorization.
- For a possible blocker, discover enough to distinguish user-owned decisions from missing permission, unavailable tool/data/environment, or external-side-effect authorization; crystallization names the smallest blocker.

Verification/completion/readiness judgment requests are out of scope for `alpha-goal` unless the claim, scope, or evidence boundary itself is unclear; otherwise they belong to `verify`.

Only an accepted Goal Contract can hand off work to `loop` or another execution phase. Bounded exploration answers, clarifying questions, design/spec outputs, and blockers can inform a later Goal Contract, but they are not execution handoff artifacts by themselves.

When the request is read-only, prefer safe evidence collection before asking, unless the target, claim boundary, or external access decision is user-owned. Before ending, apply the next safe action gate; do not manufacture a full implementation Goal Contract.

Derive a short `<slug>` for the goal boundary. Do not create empty directories.

Artifact safety gate:

- Write `.alpha-goal/` artifacts only when that path is gitignored or explicitly approved; otherwise stay chat-only.

Minimum context can be compact: task statement, desired outcome, probable intent, known evidence, constraints, unknowns, decision-boundary gaps, and likely touchpoints. Store it at `.alpha-goal/context/YYYYMMDD-<slug>.md` only when the gate passes.

Announce only the state that helps the user decide or follow the next action. For simple read-only exploration, a lightweight boundary note is enough; report depth, ambiguity, or artifact location only when they materially affect clarification, persistence, or handoff.

### 2. Clarify if needed

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

Follow-up ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the assumption or dependency that makes the answer true.
3. Force a boundary or tradeoff: exclude, defer, or reject something.
4. If still symptom-level, reframe toward root cause or essence.

### 4. Crystallize

Produce the lightest artifact that makes the next action safe:

- `Clarifying question` or `Return-to-user decision/blocker`: name the missing user-owned decision, risk acceptance, permission, tool, data, or environment.
- `Bounded exploration answer`: provide findings, evidence, residual uncertainty, and resolved next actions; state whether a Goal Contract is needed before mutation.
- `Design/spec`: provide the smallest useful design/spec that resolves the decision boundary: options considered, chosen direction, tradeoffs, non-goals, acceptance implications, and what must be true before mutation. It is not an execution handoff artifact; convert it to an accepted Goal Contract before any `loop` or execution handoff.
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
- pressure-pass findings;
- brownfield evidence vs inference;
- technical context findings;
- condensed transcript when useful.

Default durable paths:

- context: `.alpha-goal/context/YYYYMMDD-<slug>.md`
- transcript: `.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- Goal Contract: `docs/design/YYYYMMDD-<slug>.md`

### Next safe action gate

Before ending with recommendations, next steps, or a handoff note, decide for each next step whether it is:

- `AUTO_PROBE`: a safely discoverable read-only fact, code inspection, log query, local evidence check, or diagnostic probe that stays inside current target/scope and does not require new permission, mutation, external side effects, or user-owned judgment.
- `ASK_USER`: a decision about target, scope, acceptance, non-goals, risk acceptance, permission request, external side effect, mutation, data repair, push, PR/MR, deployment, credential use, or claim boundary.
- `BLOCKED`: missing permission, tool, data, environment, or safe-state condition prevents progress.

Do not stop with a bare recommendation when an `AUTO_PROBE` remains inside the current alpha-goal responsibility boundary. Continue the probe in the same turn when budget and context allow, or state the concrete blocker. After an accepted Goal Contract, probes that execute the contract belong to the authorized execution phase.

Use `request_user_input` when an `ASK_USER` next step is required and the runtime provides it.

For diagnostic work, run safely executable probes that are necessary to define or validate the diagnostic boundary. Do not run probes that belong to an accepted diagnostic execution plan after handoff.

### 5. Review / handoff

Self-review the output against the artifact, evidence, and next-action boundary:

- Does it answer the actual user request rather than a process template?
- Are non-goals, decision boundaries, and claim boundaries explicit enough?
- Are codebase facts labeled as evidence, and guesses labeled as inference?
- Would the next agent know what not to do?
- Are recommended next steps resolved as `AUTO_PROBE`, `ASK_USER`, or `BLOCKED`?
- If a safe read-only diagnostic probe remains, did we run it instead of merely recommending it?

For broad or high-risk contracts, request independent review when available without leaking intended answers.

Treat Goal Contract acceptance as a user-owned decision: when an execution handoff contract is ready, use `request_user_input` to ask the user to accept, reject, or change it.
If the user rejects, changes, or narrows requirements, return to clarification.

After self-review and user acceptance of a Goal Contract, commit allowed process artifacts respecting repository isolation and artifact safety rules, then hand off the next approved slice to the authorized execution phase, such as `loop`. Without an accepted Goal Contract, do not hand off to execution. For diagnostic contracts, the first execution slice is diagnosis/probe unless repair is already authorized by evidence. For read-only exploration outputs, leave `alpha-goal` without creating a contract commit unless the accepted output is a durable contract. Push, PR/MR creation, deployment, or other external side effects still require explicit authorization.

## Final checklist

Artifact safety recorded; context captured; discovery depth matched downstream authority; ambiguity shown when clarifying; non-goals and decision boundaries closed or blocker recorded; diagnostic contracts state whether repair is authorized; execution handoff has an accepted Goal Contract, or blocker/non-execution output is stated; pressure pass complete when a Goal Contract is produced; artifact matches the safe next action; next safe actions resolved with auto-probes executed, user decisions asked, or blockers stated; no implementation mutation performed.
