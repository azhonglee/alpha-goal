---
name: alpha-goal
description: "Route engineering, design, and change work between direct execution and a persistent Goal Contract. Use when material ambiguity, risky side effects, recovery or audit needs, explicit approval boundaries, or a verifier authority return may require clarification. Clear reversible local work and pure read-only work may exit through the direct path without artifacts."
---

# Alpha Goal

Own entry routing and Goal Contract authority. Do not implement target changes or judge completion.

## Inspect Before Routing

- Read applicable instructions, relevant files, tests, docs, recent history, and current state.
- Resolve discoverable facts before asking the user.
- Separate descriptive facts from desired behavior and authorization.
- Identify side effects, material unknowns, recovery needs, and the observer for the final claim.

## Route

Choose from the facts, not from task labels.

### DIRECT

Use `DIRECT` for either case:

- Read-only work that does not need recovery across turns, compaction, handoff, or pause, and does not require a persistent audit trail.
- A local change with one clear outcome, explicit scope, reversible effects, direct final-state observation, no unresolved material authority-owned decision, no external/destructive/cross-repository side effect, and no recovery need.

On `DIRECT`:

- Exit the Alpha Goal lifecycle; do not resolve a state root or create Goal Contract/checkpoint artifacts.
- Do not invoke `executor` or `verifier`; perform the work normally and validate the final state in proportion to risk.
- A material ambiguity in read-only work may trigger a targeted question without creating artifacts.
- If the user asked only for approval before an otherwise direct action, pause before that action without creating a persistent lifecycle.
- Stop and reroute if execution discovers material ambiguity, material scope expansion, a risky side effect, or a recovery need.

### PERSIST

Use `PERSIST` when any condition holds:

- A target or delivery mutation needs an authority-owned decision whose answer could change behavior, interface, data, security/privacy, permission, dependency, acceptance, rollout/rollback, or risk treatment.
- The work includes external write, purchase, destructive action, cross-repository write, or material scope expansion.
- Safe completion depends on recovery across turns, compaction, handoff, pause, or multiple independent risk checkpoints.
- The user or repository requires a Goal Contract or persistent auditable evidence.

Apply read-only precedence: ambiguity or claim risk may strengthen questions, sources, and caveats, but does not by itself create `PERSIST`. Pure read-only work persists only for recovery, an explicit Goal Contract, or a persistent audit requirement.

Do not route from confidence, file/line/step count, question count, or estimated duration.

An authority-owned decision belongs to the user or another source named under Authorization Source. Resolve it during inspection when that source already answers it; otherwise treat it as material ambiguity.

## Persistent Clarification

For `PERSIST`, resolve the Alpha Goal state root before writing:

```text
$HOME/.alpha-goal/<workspace-slug>/YYYYMMDD-<task-slug>/
```

Derive `workspace-slug` from the stable workspace basename, never the full path or session directory.

- Ask only unresolved material authority-owned decisions; direct questions to the user when the named authoritative source cannot resolve them.
- Prefer one compact structured prompt; group independent decisions only when their tradeoffs and consequences are clear.
- For each question, state the discovered facts, why the answer changes execution or evidence, and a recommendation.
- Do not ask for discoverable facts or use hypothetical answers as authority.
- Classify unresolved items as `blocking`, `non-material`, or `deferred non-goal`; only explicit authority can defer a goal item.
- Embed material architecture, interface, data, rollout, rollback, or design decisions in the Goal Contract. Do not create a second design authority.

## Goal Contract

Read `references/goal-contract-book.md` only for `PERSIST` or an authority return. Write `goal-contract.md` as `draft` from observed, cited, or explicitly authorized facts.

Before confirmation:

- Ensure every Success Criterion maps to an acceptance observer.
- Ensure contract status/revision, persistence trigger, Authorization Source, Intent and Observable Outcome, Scope, Non-goals, Material Constraints, Execution and Side-effect Boundary, Decision Boundary, Claim Boundary, Success Criteria and Acceptance Evidence, and Confirmation Record are usable without reconstructing the interview.
- Check the highest-impact assumption and any source conflict.
- For cross-cutting or high-risk work, request an independent read-only review when subagents are available; pass raw artifacts and wait for every requested result.

Present a compact summary of outcome, boundaries, success criteria, evidence, and remaining risk. Use structured input when available to ask the user to accept, refine, or reject.

- Accept: set `status: accepted`, record confirmation and revision, then hand off to `executor`.
- Refine or reject: keep `status: draft`; do not hand off.
- A material authority change after acceptance reopens the contract as `draft`, increments its revision, and requires confirmation again.

## Capability-Conditional Aids

- Native goal tools are lifecycle aids, not authority. Use them only when the user or repository explicitly requires native goal tracking, the accepted Execution and Side-effect Boundary permits it, the capability is exposed, and current tool policy allows the call. Never replace a conflicting active goal; record the result. Otherwise continue unless native-goal evidence is an acceptance requirement.
- Use subagents only for cleanly independent read-heavy investigation, review, or evidence reruns. Do not delegate `DIRECT / PERSIST` selection, authority-owned decisions, or contract acceptance.
- Investigation subagents do not write shared artifacts. A dedicated verifier agent may write only verifier-owned checkpoint fields after an explicit exclusive handoff.
- Before synthesizing a delegated batch or ending it, wait for every requested result. If a result is no longer needed, explicitly cancel or discard that task and do not treat its absence as evidence. A timeout or missing return is never a finding.
- In a Claude runtime or Claude-installed context, read `references/claude-adapter.md` for tool-name mapping only.

## Authority Return

When `verifier` returns `RETURN_TO_ALPHA_GOAL`, inspect the recorded gap:

- Missing or changed contract status/revision, persistence trigger, Authorization Source, Intent and Observable Outcome, Scope, Non-goals, Material Constraints, Execution and Side-effect Boundary, Decision Boundary, Claim Boundary, Success Criteria and Acceptance Evidence, or Confirmation Record: reopen and clarify the Goal Contract.
- A discoverable artifact-binding or execution-context mismatch: establish the facts and return it to the checkpoint field owner for correction; reopen the Goal Contract only if that correction changes an authority field.
- An external dependency with unchanged authority: return it to verifier for blocker classification; do not rewrite the contract to hide it.

Only `alpha-goal` may change Goal Contract authority fields.
