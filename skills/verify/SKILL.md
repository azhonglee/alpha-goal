---
name: verify
description: "Judge whether fresh evidence satisfies an active Goal Contract and supports completion, correctness, safety, merge readiness, ship readiness, or a narrowed final claim. Use for final comparator/error-boundary decisions, not implementation."
---

# Verify

Use this skill as the independent comparator in the closed loop. It judges whether the observed final state matches the reference state and whether the proposed claim stays within evidence.

## Entry

Use when there is an active or recoverable approved context and the user, `alpha-goal`, `loop`, or `control-kernel` asks whether work is done, correct, safe, ready to merge, ready to ship, or ready for a narrowed final claim.

Do not use it for ordinary advisory review, security scan, or read-only audit without a completion/readiness/correctness claim.

A positive verdict needs proportional semantic evidence for:

- reference state, desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, and claim boundary;
- current durable spec/plan/model if referenced;
- Iteration Record or equivalent diff/evidence bundle;
- Control Law result for each material `loop` slice, when a mutation or diagnostic probe was used;
- Closed-loop Ledger or equivalent chat state when the work crossed skills or turns;
- Disturbance Register handling when material disturbances affected route, evidence, or risk;
- Debug Receipt when the claim is a bug or root-cause fix;
- strongest material risk and matching evidence floor;
- fresh final-target repo/artifact status and applicable project rules;
- exact commands/probes/checks and outcomes, or explicit blocker/substitute evidence;
- feedback handling for user/reviewer/test/runtime feedback.

## Load resources when needed

- `references/verification-verdict-schema.md`: field semantics for formal verdicts.
- `references/completion-review-rubric.md`: final delivery, merge-ready, ship-ready, or production-sensitive evidence floor.
- `references/claim-boundary-check.md`: prevent final claims exceeding evidence.
- `scripts/evidence-summary.sh`: read-only diff/status evidence.

## Process

```text
Map acceptance -> Inspect artifacts -> Check claim boundary -> Judge verdict -> Route
```

### 1. Map acceptance

For each acceptance or evidence expectation, identify fresh final-state evidence, boundary, and status:

- `covered`
- `partially covered`
- `not covered`
- `blocked`
- `not applicable`

Evidence must match the claim boundary. A lower-boundary test cannot prove a higher-boundary user-visible, service, production, tenant, compliance, or safety claim.

### 2. Inspect artifacts and risk

Confirm:

- approved context is current or explicitly superseded;
- Goal Contract, system model, durable spec, and plan are semantically aligned or contradictions are routed;
- ledger reference, current state, residual error, and latest route decision are aligned with fresh evidence or explicitly superseded;
- each material Control Law identifies a target error, approved control variable, expected effect, sensor threshold, observed feedback, and fallback handling;
- each material Disturbance Register entry has sensor evidence, containment, route-trigger handling, or an explicit residual gap;
- Iteration Record goal type, control slice, execution, feedback, learning, and evidence match the final diff/artifact;
- changed files match target and avoid non-goals;
- mutation evidence comes from an isolated or approved edit path;
- `.worktrees/` and process-artifact paths, if used, are ignored or approved;
- checks ran after the last material change, or missing checks have a stated blocker/substitute evidence;
- failing output is understood and does not contradict the final claim;
- feedback is handled, out of scope, or routed elsewhere.

Bug/root-cause fixes need `ROOT_CAUSE_CONFIRMED` before repair-complete claims. `NOT_REPRODUCED` or `BLOCKED` does not support a repair-complete claim.

### 3. Check claim boundary

Compare:

```text
Claim boundary:
- User wording:
- Implemented boundary:
- Tested/observed boundary:
- Highest practical evidence-supported boundary:
- Gap:
- Final claim allowed:
```

If user wording is product-level but evidence is helper-level, choose either `NEXT_ITERATION` for broader evidence or `NARROW_CLAIM_AND_FINAL` with explicit narrowed wording.

### 4. Judge verdict

Return exactly one verdict:

- `PASS_TO_FINAL`: evidence covers acceptance and claim boundary.
- `NARROW_CLAIM_AND_FINAL`: local target is satisfied, but final wording must be narrower than the user request.
- `NEXT_ITERATION`: direction is valid, but implementation, evidence, hardening, or cleanup is still needed.
- `REFRAME`: Goal Contract, system model, target/scope, non-goals, acceptance, existing-work relationship, or claim boundary is wrong or incomplete.
- `BLOCKED`: environment, data, permission, credential, tool, or user-owned risk/scope decision is missing.

### 5. Output

Produce a Verification Verdict proportional to risk.

Compact:

```text
Verification Verdict:
- Verdict:
- Evidence coverage:
- Claim boundary:
- Judgment:
- Gaps:
- Required next step:
- Final claim allowed:
```

Full:

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Contract/model/artifact review:
- Claim boundary:
- Risk/evidence review:
- Control law review:
- Ledger review:
- Disturbance review:
- Fresh checks run:
- Diff/scope review:
- Feedback review:
- Judgment:
- Unresolved gaps:
- Required next step:
- Final claim allowed:
```

Routing:

- `PASS_TO_FINAL`: final answer may claim completion inside the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: final answer must state the narrowed claim and remaining higher-boundary gap.
- `NEXT_ITERATION`: return to `loop`; do not claim completion.
- `REFRAME`: return to `alpha-goal` or `system-model`; do not continue mutation.
- `BLOCKED`: report blocker and smallest missing input or permission.
