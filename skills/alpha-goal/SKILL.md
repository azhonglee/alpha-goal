---
name: alpha-goal
description: Clarify ambiguous engineering goals with Socratic interview, ambiguity scoring, pressure tests, and a compact Goal Contract before implementation mutation. Use for broad requests, missing acceptance criteria before implementation, target/scope uncertainty, decision-boundary discovery, read-only exploration framing, or preparing a handoff to loop. Do not use for verification/completion/readiness judgments unless the claim or evidence boundary is unclear.
---

# Alpha Goal

Use this skill to convert an unclear engineering request into a safe next action. The output may be a Goal Contract, a bounded read-only exploration answer, or a return-to-user decision; do not force every request into the same artifact.

## Boundaries

- Do not edit implementation files, push, open PRs/MRs, deploy, or claim implementation completion; follow repository isolation rules for any allowed artifact work.
- Write process artifacts only after the artifact safety gate. If unsafe, keep artifacts in chat.
- Ask only for user-owned decisions. Discover codebase facts yourself before asking about internals.
- Use `request_user_input` by default when user input is needed and the runtime provides it.
- Choose the lightest alpha-goal mode that can make the next action reliable; keep it as small as safety allows. Avoid ceremony that does not reduce ambiguity or risk.

## Process

```text
Discover -> Choose mode -> Clarify/Explore -> Pressure-test -> Crystallize -> Review -> Handoff
```

### 1. Discover

Collect just enough evidence to choose a safe alpha-goal mode:

- user intent, desired outcome, stated solution, constraints;
- target repo/path/service/module and likely codebase touchpoints;
- candidate repos in workspaces or aggregators;
- existing work or durable specs when likely;
- unknowns, non-goals, decision-boundary risks, and acceptance/evidence gaps.

Derive a short `<slug>` for the goal boundary. Do not create empty directories.

Artifact safety gate:

- Write `.alpha-goal/` artifacts only when that path is gitignored or explicitly approved; otherwise stay chat-only.

Minimum context can be compact: task statement, desired outcome, probable intent, known evidence, constraints, unknowns, decision-boundary gaps, and likely touchpoints. Store it at `.alpha-goal/context/YYYYMMDD-<slug>.md` only when the gate passes.

Announce only the state that helps the user decide or follow the mode. For simple `EXPLORE`, a lightweight mode note is enough; report depth, ambiguity, or artifact location only when they materially affect clarification, persistence, or handoff.

### 2. Choose an alpha-goal mode

Choose how `alpha-goal` should handle this request from semantics, not headings. A mode is internal to `alpha-goal`; leaving `alpha-goal` is a handoff, not a mode.

- `CLARIFY`: clarify the goal before mutation when intent, outcome, target, scope, non-goals, constraints, decision boundaries, or acceptance/evidence expectations are unclear.
- `EXPLORE`: answer a bounded read-only audit, comparison, diagnosis direction, inventory, or evidence-gathering request without mutation.
- `DESIGN`: shape a concrete design/spec before any implementation handoff.
- `CONTRACT`: mutation appears appropriate after the goal is clear; produce or update a reviewed Goal Contract or equivalent approved context for `loop`, but do not implement inside `alpha-goal`.
- `DEBUG`: prove the root cause before any fix; if cause is unconfirmed, keep the mode as diagnosis/probe, not repair.

Verification/completion/readiness judgment requests should use `verify` directly, not `alpha-goal`; only clarify with `alpha-goal` when the claim, scope, or evidence boundary itself is unclear.

If the request is explicitly read-only and the target/evidence boundary is clear enough, answer the bounded exploration directly with findings, evidence, routed next steps, and residual uncertainty. Before ending, apply the next-step routing gate; do not manufacture a full implementation Goal Contract.

Return to clarification when mode, target, scope, non-goals, decision boundaries, or next safe action would otherwise be guessed.

### 3. Clarify

Depth profiles are calibration aids, not ceremony:

- `quick`: pre-PRD or low-risk framing; target ambiguity around `<= 0.30`; normally 1-5 rounds.
- `standard`: default; target ambiguity around `<= 0.20`; stop as soon as remaining uncertainty no longer changes scope, acceptance, risk, or authority.
- `deep`: broad or high-risk; target ambiguity around `<= 0.15`; use multiple rounds only while each round reduces material uncertainty.

Interview loop:

- Ask one high-leverage question per round.
- Ask about intent, outcome, scope, non-goals, and decision boundaries before implementation detail.
- Target the weakest clarity dimension after stage priority:
  1. intent, outcome, scope, non-goals, decision boundaries;
  2. constraints and success criteria;
  3. brownfield context.
- Stay on the same thread while the answer is vague; breadth without pressure is not progress.
- Re-score ambiguity after each answer and show progress.
- Continue while ambiguity is materially above threshold, readiness gates are open, pressure pass is incomplete for a contract handoff, or the user changes the target.
- If the user stops clarification before readiness gates close, summarize unresolved gaps and proceed only by narrowing the alpha-goal mode, asking for explicit risk acceptance, or handing off with unresolved gaps clearly bounded.
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

### 4. Pressure-test

Use each pressure-test lens at most once when it reduces real uncertainty:

- `contrarian`: challenge the core assumption.
- `simplifier`: ask for the smallest useful scope.
- `ontologist`: reframe symptoms into the underlying entity, state, or cause.

Follow-up ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the assumption or dependency that makes the answer true.
3. Force a boundary or tradeoff: exclude, defer, or reject something.
4. If still symptom-level, reframe toward root cause or essence.

### 5. Crystallize

Produce the lightest artifact that makes the next action safe.

For `CONTRACT`, or when `DEBUG` needs to hand off diagnostic work to `loop`, create a Goal Contract covering these semantics with any concise headings:

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

For `DESIGN`, produce the smallest useful design/spec that resolves the decision boundary: options considered, chosen direction, tradeoffs, non-goals, acceptance implications, and what must be true before mutation. Convert it to `CONTRACT` only when implementation handoff is requested or clearly authorized.

Default durable paths:

- context: `.alpha-goal/context/YYYYMMDD-<slug>.md`
- transcript: `.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- Goal Contract: `docs/design/YYYYMMDD-<slug>.md`

For read-only exploration, output findings, evidence, residual uncertainty, routed next steps, and whether a Goal Contract is needed before any mutation. Before ending, apply the next-step routing gate: continue safe read-only probes, ask for user-owned decisions, or state blockers.

### Next-step routing gate

Before ending with recommendations, next steps, or a handoff note, classify each next step:

- `AUTO_PROBE`: a safely discoverable read-only fact, code inspection, log query, local evidence check, or diagnostic probe that stays inside current target/scope and does not require new permission, mutation, external side effects, or user-owned judgment.
- `ASK_USER`: a decision about target, scope, acceptance, non-goals, risk acceptance, permission request, external side effect, mutation, data repair, push, PR/MR, deployment, credential use, or claim boundary.
- `BLOCKED`: missing permission, tool, data, environment, or safe-state condition prevents progress.

Do not stop with a bare recommendation when an `AUTO_PROBE` remains inside the current alpha-goal responsibility boundary. Continue the probe in the same turn when budget and context allow, or state the concrete blocker. After an accepted Goal Contract, probes that execute the contract belong to `loop`.

Use `request_user_input` when an `ASK_USER` next step is required and the runtime provides it.

For `DEBUG` mode, run safely executable probes that are necessary to define or validate the diagnostic boundary. Do not run probes that belong to an accepted diagnostic execution plan after handoff.

### 6. Review and handoff

Self-review the output against the mode and handoff boundary:

- Does it answer the actual user request rather than a process template?
- Are non-goals, decision boundaries, and claim boundaries explicit enough?
- Are codebase facts labeled as evidence, and guesses labeled as inference?
- Would the next agent know what not to do?
- Are recommended next steps classified as `AUTO_PROBE`, `ASK_USER`, or `BLOCKED`?
- If a safe read-only diagnostic probe remains, did we run it instead of merely recommending it?

For broad or high-risk contracts, request independent review when available without leaking intended answers.

Treat Goal Contract acceptance as a user-owned decision: when a handoff contract is ready, use `request_user_input` to ask the user to accept, reject, or change it.
If the user rejects, changes, or narrows requirements, return to clarification.

After self-review and user acceptance of a Goal Contract, commit allowed process artifacts respecting repository isolation and artifact safety rules, then handoff to `loop` for the next approved slice. For diagnostic contracts, the first loop slice is diagnosis/probe unless repair is already authorized by evidence. For read-only exploration outputs, handoff without creating a contract commit unless the accepted output is a durable contract. Push, PR/MR creation, deployment, or other external side effects still require explicit authorization.

## Final checklist

Artifact safety recorded; context captured; mode is explicit; ambiguity shown when clarifying; non-goals and decision boundaries closed or blocker recorded; diagnostic contracts state whether repair is authorized; handoff contract accepted or blocker stated; pressure pass complete when a Goal Contract is produced; output matches mode; next steps routed with auto-probes executed, user decisions asked, or blockers stated; no implementation mutation performed.
