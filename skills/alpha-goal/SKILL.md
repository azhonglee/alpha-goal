---
name: alpha-goal
description: Clarify ambiguous engineering goals with Socratic interview, ambiguity scoring, pressure tests, and a compact Goal Contract before implementation mutation. Use for broad requests, missing acceptance criteria, target/scope uncertainty, decision-boundary discovery, read-only exploration framing, or handoff to loop.
---

# Alpha Goal

Use this skill to convert an unclear engineering request into a safe next route. The output may be a Goal Contract, a bounded read-only exploration answer, or a return-to-user decision; do not force every request into the same artifact.

## Boundaries

- Do not edit implementation files, create branches or worktrees, push, open PRs/MRs, deploy, or claim implementation completion.
- Write process artifacts only after the artifact safety gate. If unsafe, keep artifacts in chat.
- Ask only for user-owned decisions. Discover codebase facts yourself before asking about internals.
- Use `request_user_input` for bounded choices only; use plain assistant messages for open-ended Socratic questions.
- Prefer the smallest process that can make the next route safe. Avoid ceremony that does not reduce ambiguity or risk.

## Process

```text
Discover -> Route -> Clarify/Explore -> Pressure-test -> Crystallize -> Review -> Handoff
```

### 1. Discover

Collect just enough evidence to choose a safe route:

- user intent, desired outcome, stated solution, constraints;
- target repo/path/service/module and likely codebase touchpoints;
- candidate repos in workspaces or aggregators;
- existing work or durable specs when likely;
- unknowns, non-goals, decision-boundary risks, and acceptance/evidence gaps.

Derive a short `<slug>` for the goal boundary. Do not create empty directories.

Artifact safety gate:

- Before writing `.alpha-goal/`, confirm it is gitignored. If not ignored, do not silently edit `.gitignore`; use chat-only artifacts, an already approved path, or ask before changing ignore rules.
- Before writing tracked artifacts such as `docs/design/YYYYMMDD-<slug>.md`, confirm the request calls for a durable contract or the user/repo workflow already approves it.
- Record artifact status as `none`, `chat-only`, `created`, `updated`, or `blocked`.

Minimum context can be compact: task statement, desired outcome, probable intent, known evidence, constraints, unknowns, decision-boundary gaps, and likely touchpoints. Store it at `.alpha-goal/context/YYYYMMDD-<slug>.md` only when the gate passes.

Announce only the state that helps the user decide or follow the route. For simple `EXPLORE`, a lightweight route note is enough; report depth, ambiguity, or artifact status only when they materially affect clarification, persistence, or handoff.

### 2. Route

Choose the route from semantics, not headings:

- `CLARIFY`: intent, outcome, scope, non-goals, constraints, or acceptance are unclear.
- `EXPLORE`: the user asks for read-only audit, comparison, diagnosis direction, inventory, or evidence gathering without mutation.
- `DESIGN`: a concrete design/spec is needed before implementation.
- `IMPLEMENT` or `DEBUG`: mutation may follow, but only after a reviewed Goal Contract or equivalent approved context exists.
- `VERIFY`: the user asks whether current evidence supports a completion/readiness/correctness claim.

If the request is explicitly read-only and the target/evidence boundary is clear enough, answer the bounded exploration directly with findings, evidence, recommendations, and residual uncertainty. Do not manufacture a full implementation Goal Contract.

Return to clarification when route, target, scope, non-goals, decision boundaries, or final claim would otherwise be guessed.

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
- If the user stops clarification before readiness gates close, summarize unresolved gaps and proceed only with a narrowed route or explicit risk acceptance.
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
- acceptance/evidence expectations are testable enough for the next route;
- one pressure pass revisits an earlier answer with evidence, assumption, or tradeoff probing.

Append interview summaries to `.alpha-goal/interviews/` only when artifact safety passes; otherwise keep the transcript summary in chat.

### 4. Pressure-test

Use each mode at most once when it reduces real uncertainty:

- `contrarian`: challenge the core assumption.
- `simplifier`: ask for the smallest useful scope.
- `ontologist`: reframe symptoms into the underlying entity, state, or cause.

Follow-up ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the assumption or dependency that makes the answer true.
3. Force a boundary or tradeoff: exclude, defer, or reject something.
4. If still symptom-level, reframe toward root cause or essence.

### 5. Crystallize

Produce the lightest artifact that makes the next route safe.

For implementation or debug handoff, create a Goal Contract covering these semantics with any concise headings:

- metadata: profile, rounds, final ambiguity, threshold, context type;
- context snapshot reference/path or chat-only note;
- clarity breakdown;
- intent and desired outcome;
- in-scope and out-of-scope / non-goals;
- decision boundaries, constraints, and assumptions resolved;
- testable acceptance criteria and evidence expectations;
- pressure-pass findings;
- brownfield evidence vs inference;
- technical context findings;
- condensed transcript when useful.

Default durable paths, only after safety approval:

- context: `.alpha-goal/context/YYYYMMDD-<slug>.md`
- transcript: `.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- Goal Contract: `docs/design/YYYYMMDD-<slug>.md`

For read-only exploration, output findings, evidence, recommendations, residual uncertainty, and whether a Goal Contract is needed before any mutation.

### 6. Review and handoff

Self-review the output against the route:

- Does it answer the actual user request rather than a process template?
- Are non-goals, decision boundaries, and claim boundaries explicit enough?
- Are codebase facts labeled as evidence, and guesses labeled as inference?
- Would the next agent know what not to do?

For broad or high-risk contracts, request independent review when available without leaking intended answers. Ask the user to confirm only user-owned decisions. If the user rejects, changes, or narrows requirements, return to clarification.

After self-review and user acceptance of a Goal Contract, commit the Goal Contract and handoff to `loop` for mutation. For read-only exploration or verify routes, handoff without creating a contract commit unless the accepted output is a durable contract. Push, PR/MR creation, deployment, or other external side effects still require explicit authorization.

## Final checklist

Artifact safety recorded; context captured; route is explicit; ambiguity shown when clarifying; non-goals and decision boundaries closed or blocker recorded; pressure pass complete when a Goal Contract is produced; output matches route; no implementation mutation performed.
