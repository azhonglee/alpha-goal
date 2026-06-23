# Defect/Risk Rubric

Use this rubric for review, audit, loophole-finding, high-risk, cross-module, replacement, security, migration, or PR-ready checks. The sweep is bounded by the Goal Contract, final diff, touched surfaces, adjacent call paths, and realistic default paths. Do not turn a small goal into an unrelated broad audit; do not ignore material issues in the checked surface because they were not claimed.

## Review Surface

Identify and record:
- Changed files and whether each is authorized by the Goal Contract.
- Adjacent call paths, generated artifacts, configs, hooks, install paths, scripts, and docs affected by the change.
- Old/prohibited/default paths that should no longer be reachable.
- Runtime, persistence, dependency, cross-repo, delivery, rollback, credential, privacy, and security surfaces when the goal depends on them.
- Surfaces not checked and why.

## Material Checks

Check for:
- Scope drift, unauthorized files, or behavior outside non-goals.
- Requirement/implementation mismatch, missing invariant, or weakened gate.
- Regression on default paths, old fallback still reachable, or migration incomplete.
- Edge/error cases, empty/malformed input, stale state, replay/dedupe, caching, concurrency, or ordering faults when relevant.
- Test/validator mismatch: cited checks do not actually observe the requirement or risk.
- Security/privacy/credential exposure when touched files or claims involve secrets, auth, external calls, data, or user-visible safety.
- Cross-module or cross-repo integration gaps where one passing component cannot prove the whole path.

## Finding Classification

- `same-goal fixable`: route `control-loop` with a concrete hardening slice.
- `scope/authority change`: route `alpha-goal`.
- `blocked`: route `BLOCKED` when required permission, data, tool, environment, credential, or user decision is missing.
- `advisory`: record residual risk only when it is outside the authorized surface or not material to the claim.
