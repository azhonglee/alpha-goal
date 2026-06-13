# Loop Modes

Use this reference when the next loop action is not obvious. A mode names the dominant uncertainty for this iteration; it is not an extra phase or an output template.

## Choose by dominant uncertainty

- Unknown target, owner, existing behavior, rules, logs, or existing work -> `discovery`.
- Unknown cause or first divergence point -> `debug`.
- Known desired behavior, missing regression guard -> `tdd` or focused contract check.
- Known change, uncertain implementation path -> `implementation`.
- Behavior should stay the same while structure changes -> `refactor`.
- Feasibility is unknown and output will not itself prove completion -> `spike`.
- Core behavior appears done but edge cases, compatibility, cleanup, docs, or evidence are weak -> `hardening`.

These labels are examples. If a task fits none exactly, state the uncertainty directly and choose the evidence that would resolve it.

## Evidence shape

Evidence is useful only if it can change the next decision.

- Gate evidence can satisfy approved context, plan, acceptance, or completion gates.
- Advisory audit identifies risks but does not prove completion.
- Exploration-only evidence maps sources or possibilities without authorizing mutation or final claims.
- Delta review is a narrow follow-up when prior gate evidence remains fresh.
- Evidence audit judges existing evidence but does not replace `verify`.

## Decisions

Close each iteration with the route it justifies:

- `continue`: current route still works and another slice is needed.
- `harden`: behavior is plausible but evidence/risk/cleanup remains insufficient.
- `verify`: acceptance appears covered by fresh final-state evidence and remaining uncertainty is immaterial, explicitly bounded, or suitable for a narrowed claim.
- `reframe`: target, scope, acceptance, non-goals, decision boundary, or claim boundary needs `alpha-goal`.
- `blocked`: smallest missing input, permission, tool, data, environment, or safe-state condition is named.

## Debug Receipt

Debug must identify root cause before any fix. Keep the receipt compact but falsifiable.

- For low-risk pure-function or single-branch failures with focused failing-test and direct code-divergence evidence, a one-paragraph receipt is enough if it names symptom, failing path, branch divergence, fix surface, and post-fix evidence; mark irrelevant entity/log fields `not applicable`.
- For entity, module, API, or log ambiguity, preserve competing hypotheses until evidence explains why alternatives are weaker, out of scope, or blocked.
- If logs or APIs point to a different submodule than the approved target, return to `alpha-goal` instead of forcing the evidence into the old target.

Optional full shape:

```text
Debug Receipt:
- Symptom:
- Reproduction:
- Problem-space decomposition:
- Competing hypotheses:
- Probe:
- Evidence:
- Entity/interface/log alignment:
- Root cause statement:
- Root cause validation:
- Fix surface:
- Status: ROOT_CAUSE_CONFIRMED | NOT_REPRODUCED | BLOCKED
- Decision:
```

Status rules:

- `ROOT_CAUSE_CONFIRMED`: evidence identifies the first divergence point, links affected entity/state to the interface boundary, explains relevant logs/traces/runtime observations, and bounds material alternatives enough to support the fix surface.
- `NOT_REPRODUCED`: reproduction was attempted but not observed; do not claim fixed.
- `BLOCKED`: missing logs, commands, files, environment, data, or scope prevents diagnosis.

Only `ROOT_CAUSE_CONFIRMED` authorizes a fix action or repair claim. `NOT_REPRODUCED` can support only a bounded diagnostic or no-fix claim.
