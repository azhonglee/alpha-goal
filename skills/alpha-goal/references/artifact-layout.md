# Task-Scoped Artifact Layout

Use one task run directory for every durable runtime artifact:

```text
.alpha-goal/YYYYMMDD-<slug>/
  control-state.md
  goal-contract.md
  system-model.md
  decision-synthesis.md
  plan.md
  iterations/
    NN-<slice>.md
    cycles.jsonl
  evidence/
  schema/
  verification-verdict.md
  conformance-report.md
  interviews.md
```

## Rules

- Create `.alpha-goal/YYYYMMDD-<slug>/` once per goal, task batch, or resumable workstream.
- Keep `control-state.md` as the cross-skill source of truth for route, reference, current state, residual error, latest control action, latest sensor feedback, artifact registry, and next route.
- Store large command output, logs, screenshots, traces, and raw evidence under `evidence/`; link them from stage records instead of pasting them into chat.
- Store optional machine-readable schema sidecars under `schema/`, using the same artifact stem when practical, for example `schema/goal-contract.json`.
- Do not use legacy category directories directly under `.alpha-goal/`, such as `context/`, `models/`, `control-state/`, `iterations/`, `evidence/`, or `verification/`.
- If file persistence is blocked, print the artifact in chat and state the no-write reason where the artifact path would normally appear.

## Artifact registry fields

Record paths relative to the repository root:

```text
Artifact registry:
- Control state: .alpha-goal/YYYYMMDD-<slug>/control-state.md
- Goal Contract: .alpha-goal/YYYYMMDD-<slug>/goal-contract.md
- System Model: .alpha-goal/YYYYMMDD-<slug>/system-model.md
- Decision Synthesis: .alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md
- Plan: .alpha-goal/YYYYMMDD-<slug>/plan.md
- Iteration Records: .alpha-goal/YYYYMMDD-<slug>/iterations/
- Evidence: .alpha-goal/YYYYMMDD-<slug>/evidence/
- Schema sidecars: .alpha-goal/YYYYMMDD-<slug>/schema/
- Verification Verdict: .alpha-goal/YYYYMMDD-<slug>/verification-verdict.md
- Conformance Report: .alpha-goal/YYYYMMDD-<slug>/conformance-report.md
```
