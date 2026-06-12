# Loop Modes

Use one dominant mode per iteration. The mode sets the evidence shape; it is not a new stage.

For bug fixes, prefer a `debug` iteration until `ROOT_CAUSE_CONFIRMED`. If the confirmed fix is small and happens in the same bounded pass, the Iteration Record may keep `Loop mode: debug` and include the minimal patch after the Debug Receipt. Split into a separate `implementation` iteration when the fix surface is broad, the root cause is uncertain, or review/evidence risk becomes material.

## Modes

- `discovery`: inspect repo, rules, current behavior, logs, ownership, or existing work.
- `debug`: reproduce, isolate, and explain a failure before fixing; keep competing hypotheses when the symptom could belong to different submodules, entities, or source APIs.
- `tdd`: create or adjust a failing test before implementation, or state why a substitute contract check is needed.
- `implementation`: make the smallest acceptance-relevant change.
- `refactor`: simplify structure while preserving behavior with evidence.
- `spike`: test feasibility with bounded or throwaway work; do not claim completion from spike evidence alone.
- `hardening`: add edge cases, coverage, compatibility checks, docs, or cleanup after core behavior works.

## Evidence Types

- `gate_evidence`: can satisfy a Goal, plan, review, or completion gate.
- `advisory_audit`: bounded critique or risk scan; non-gate.
- `exploration_only`: discovery map or source inventory; non-gate.
- `delta_review`: narrow follow-up when original same-boundary gate evidence remains current.
- `evidence_audit`: independent audit of existing evidence; supports judgment but does not replace verification.

## Decisions

Close every iteration with exactly one decision:

- `continue`: evidence supports the route.
- `pivot`: evidence invalidates the route.
- `expand`: Goal remains valid but scope grew.
- `harden`: core behavior works but risk remains.
- `finish`: acceptance appears satisfied and review/verify can run.

## Debug Receipt

Use this receipt only for `debug` mode. Keep it compact but falsifiable.

- For low-risk pure-function or single-branch failures with focused failing-test and direct code-divergence evidence, a one-paragraph receipt is enough if it names symptom, failing path, branch divergence, fix surface, and post-fix evidence; mark entity/API/log alignment as not applicable.
- For entity or module ambiguity, keep competing hypotheses with evidence for, evidence against, discriminator, and status; do not collapse to one hypothesis until evidence explains why alternatives are weaker or out of scope.
- If logs or APIs point to a different submodule than the Goal Contract target, return `REFRAME_NEEDED` instead of forcing the evidence into the old target.


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

- `ROOT_CAUSE_CONFIRMED`: evidence identifies the first divergence point, links it to the affected entity/state and interface boundary, explains relevant log/trace/runtime observations when available, excludes or bounds material alternative hypotheses, and supports the smallest credible fix surface.
- `NOT_REPRODUCED`: reproduction was attempted but not observed; do not claim fixed.
- `BLOCKED`: missing logs, commands, files, environment, or scope prevents diagnosis.

Only `ROOT_CAUSE_CONFIRMED` authorizes a fix action, either as the minimal patch in the same bounded debug iteration or as a separate implementation iteration when the fix surface is broader. `NOT_REPRODUCED` may support a bounded diagnostic/no-fix claim only with scope, no-fix rationale, risk, and needed fresh evidence.
