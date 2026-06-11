# Clarification Policy

Goal framing should reduce ambiguity without turning every task into an interview.

## Must ask

Ask the user before implementation when ambiguity affects:

- target repo, product, package, service, or environment;
- whether the task is new work, follow-up, duplicate, or comparison-only;
- data safety, irreversible operations, production behavior, credentials, or permissions;
- externally visible behavior or product-level claim boundary;
- mutually incompatible acceptance criteria;
- user intent versus project rules.

## Safe to assume

Record a bounded assumption instead of asking when:

- naming follows an obvious local convention;
- the repo has one high-confidence implementation path;
- tests/build commands are defined in `AGENTS.md`, package scripts, Makefile, CI config, or similar;
- the uncertainty affects only internal refactoring style;
- the next step is read-only discovery.

## Good clarification question shape

Ask one decision-oriented question, not a questionnaire.

Bad:

```text
Can you clarify the requirement?
```

Good:

```text
I found candidate implementations in `repo-a` and `repo-b`. `repo-a` owns artifact upload and has TOS code under `internal/app`; `repo-b` only has a low-level TOS driver. Should I implement in `repo-a`, or compare both before changing code?
```

## Socratic interview

Rules:

- ask exactly one high-leverage question per round;
- inspect available repo evidence before asking about brownfield facts; ask evidence-backed confirmation questions, not discoverable facts;
- ask about intent, outcome, scope, non-goals, and decision boundaries before implementation details;
- target the weakest Goal Contract field first;
- pressure-test the answer before moving on: example, hidden assumption, boundary/tradeoff, or symptom-to-outcome reframe;
- track critical fields as `clear`, `partial`, or `missing`;
- stop asking when remaining ambiguity can be recorded as a bounded assumption or risk;
- return `ASK_USER` when the missing answer blocks safe progress;
- return `READY_FOR_ITERATION` only after the contract is closed.

After the user answers, update the Goal Contract. If the answer changes target, acceptance, constraints, non-goals, or claim boundary after iteration started, return through the router before any more mutation.

## Default when blocked

If the user is unavailable and mutation would be unsafe, stop with `Frame verdict: ASK_USER` or `BLOCKED`.
