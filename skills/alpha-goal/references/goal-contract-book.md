
Write the Goal Contract to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`.
Copy to `docs/specs/YYYYMMDD-<TaskName>.md` only when useful or required by repo convention.

The state-root `goal-contract.md` is canonical.
Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.
Keep `Contract status: draft` until user confirmation.

# Required Content:
- Contract status
- Technical Context
- Intent
- Outcome
- Success Criteria
- Acceptance evidence / Verification surface
- Boundaries
  - Scope
  - Non-goals
  - Constraints
  - Execution boundary
  - Decision boundary
  - Claim boundary

# Optional Content:
Use optional fields when they improve execution safety, auditability, or implementation order.
- Root Cause, only for repair design
- Issued by
- Discovery notes
- Interview ledger 
- Repo surfaces
- Confirmation route
- Technical Design link
- Assumptions + resolutions
- Dependency/integration order

## Required Field Definitions

### Authorization Source

Defines who or what has authority to define desired behavior.

Include:

- current user request
- explicit user answers
- accepted contract revision
- linked issue/spec, if authoritative
- repo spec, if explicitly designated as authoritative

Example:

```md
Authorization Source:
- [from-user] Current thread request: "Fix duplicate notification delivery in retry path."
- [from-user] User confirmation of Goal Contract v1 on 2026-07-09.
- [from-issue] ISSUE-1842, treated as authoritative for expected behavior.
```

Rules:

- Do not use code state alone as authorization for desired behavior.
- Do not let test expectations override explicit user non-goals unless the user confirms.
- Record conflicts instead of silently choosing an authority.

Coverage test:

```text
If code, docs, tests, and user request disagree, does the contract say which source wins?
```

---

### Technical Context

Records relevant known facts from repo inspection, docs, tests, logs, issues, and user input.

Include:

- relevant files/components
- observed current behavior
- known failing symptoms
- existing tests or commands
- dependencies and integration points
- source-of-truth conflicts
- unavailable context that matters

Example:

```md
Technical Context:
- [from-code][auto-confirmed] Retry delivery is handled in `src/notifications/retry_worker.ts`.
- [from-test] `retry_worker.test.ts` covers basic retry but not duplicate suppression.
- [from-user] The intended behavior is at-most-once notification delivery per retry token.
- [blocking] Production provider retry semantics are not yet confirmed.
```

Rules:

- Inspect discoverable facts before asking the user about them.
- Keep context descriptive unless backed by Authorization Source.
- Do not overfill with unrelated repo facts.

Coverage test:

```text
Can an executor understand the relevant current system state without redoing discovery from scratch?
```

---

### Intent

States why the user wants the work done.

Intent is not the same as outcome.

Example:

```md
Intent:
- [from-user] Prevent customers from receiving duplicate retry notifications while preserving existing retry reliability.
```

Rules:

- Capture the user’s purpose, not merely the requested edit.
- If intent is inferred, tag it as `[assumption]` or ask for confirmation when material.

Coverage test:

```text
Would two different plausible intents lead to different implementation tradeoffs?
If yes, unresolved intent is blocking.
```

---

### Outcome

Defines the desired end state.

Example:

```md
Outcome:
- [from-user] Duplicate retry notifications are prevented for the retry path.
- [from-user] Existing successful retry delivery behavior remains intact.
```

Rules:

- State what must be true after completion.
- Prefer observable behavior over implementation technique.
- Avoid vague outcomes such as "make it better" or "clean it up".

Coverage test:

```text
Can the executor determine whether the outcome is true or false from evidence?
```

---

### Scope

Defines what behavior, feature, bug, component, or user-visible result is included.

Example:

```md
Scope:
- Retry-path notification duplicate suppression.
- Unit and integration tests covering duplicate retry behavior.
```

Rules:

- Scope is about what problem is included.
- Scope is not the same as execution boundary.
- Include enough scope to prevent local fixes that miss the intended behavior.

Coverage test:

```text
Can the executor tell which problem is inside the goal and which adjacent problems are not?
```

---

### Non-goals

Defines what must not be done as part of this goal.

Example:

```md
Non-goals:
- [from-user] Do not redesign the notification provider abstraction.
- [from-user] Do not change queue schema or production configuration.
- [deferred-non-goal] Do not address historical duplicate deliveries already sent.
```

Rules:

- A deferred non-goal requires explicit user or authoritative exclusion.
- Non-goals are protective boundaries, not a dumping ground for uncertainty.
- If an excluded item becomes necessary for success, stop and ask.

Coverage test:

```text
Can the executor reject tempting adjacent work without asking again?
```

---

### Constraints

Defines invariants that must remain true while completing the task.

Types:

- behavioral constraints
- API compatibility constraints
- data compatibility constraints
- security/privacy constraints
- performance constraints
- style/pattern constraints
- dependency constraints
- rollout constraints

Example:

```md
Constraints:
- [from-user] Preserve public API behavior.
- [from-code] Follow existing retry worker test style.
- [from-user] Do not add new external dependencies.
- [from-spec] Maintain at-most-once delivery per retry token.
```

Coverage test:

```text
Can the executor identify a change that appears to solve the goal but violates a constraint?
```

---

### Success Criteria

Defines checklist items that must be true for completion.

Example:

```md
Success Criteria:
- Duplicate retry delivery is prevented for the documented retry path.
- Existing retry success behavior is not regressed.
- Relevant tests pass locally.
- No out-of-scope files or production configuration are changed.
```

Rules:

- Each success criterion must map to acceptance evidence.
- Use criteria that can be proven or falsified.
- Do not include aspirational quality bars without evidence.

Coverage test:

```text
Does every success criterion have an observer, command, artifact, or inspection path?
```

---

### Acceptance evidence / Verification surface

Defines the evidence that proves success.

Examples:

```md
Acceptance evidence:
- `npm test -- retry_worker.test.ts` passes.
- New or updated test covers duplicate retry delivery.
- Code inspection confirms no queue schema or provider config changes.
- Completion audit lists changed files and command output.
```

Rules:

- Evidence must be inspectable: command output, tests, logs, benchmark, artifact, diff, report, or explicit review.
- Do not use model confidence as evidence.
- Do not use “implementation seems correct” as evidence.
- If exact proof is impossible, define proxy evidence and label remaining uncertainty.

Coverage test:

```text
Can a reviewer verify completion without trusting the model's internal reasoning?
```

---

### Execution boundary

Defines what you may touch or run.

Execution boundary is about allowed actions, tools, files, systems, commands, credentials, and side effects.

Example:

```md
Execution boundary:
- May edit `src/notifications/retry_worker.ts` and related tests.
- May run local unit/integration tests.
- May inspect notification provider interfaces.
- Must not change queue schema, production config, secrets, deployment settings, or external provider settings.
```

Rules:

- Be explicit about files, commands, services, and side effects.
- If execution requires credentials or external systems, state whether they are allowed.
- If the executor needs to cross the boundary, stop for confirmation.

Coverage test:

```text
Can the executor tell whether a proposed file edit or command is allowed?
```

---

### Decision boundary

Defines what you may decide independently and what requires user/spec confirmation.

This is the actuator boundary.

Example:

```md
Decision boundary:
- You may choose internal helper names and local refactor shape.
- You may choose the smallest test structure consistent with existing patterns.
- You may not redefine desired behavior, public API contract, retry semantics, migration strategy, or rollout policy.
```

Rules:

- Separate implementation choices from product/architecture/acceptance choices.
- You may decide local mechanics when they do not alter meaning, risk, or public behavior.
- User-owned decisions must remain explicit.

Coverage test:

```text
Can You tell which decisions it can make without asking and which decisions must stop execution?
```

---

### Claim boundary

Defines what You may claim from available evidence and what must remain caveated.

This is the sensor/observer boundary.

Example:

```md
Claim boundary:
- You may claim local tests pass only with command output.
- You may claim duplicate suppression is covered by tests only if the new test fails before the fix or directly asserts the behavior.
- You may not claim production safety without deployment logs, staged rollout evidence, or explicit user acceptance of proxy evidence.
```

Rules:

- Define allowed claims before execution.
- Preserve uncertainty when evidence is incomplete.
- Do not turn proxy evidence into absolute proof.

Coverage test:

```text
Can the final answer distinguish proven facts, likely inferences, unverified claims, and blocked claims?
```

---