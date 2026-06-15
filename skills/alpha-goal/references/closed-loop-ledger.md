# Closed-loop Ledger

Use this reference when a task spans multiple skills, may resume across turns, or needs durable state to prevent the loop from losing reference, error, action, route decision, or feedback history.

## Purpose

The ledger is a control-state memory and artifact index, not a work diary. Keep only information that changes routing, safety, evidence, or final claim judgment. The full `Control Route` belongs here by default; other full stage artifacts belong in their own `.alpha-goal/` subdirectories. The TUI should show compact summaries unless the user asks for full details, file persistence is blocked, or a user-owned decision needs review.

Default durable path:

```text
.alpha-goal/control-state/YYYYMMDD-<slug>.md
```

Optional append-only machine log:

```text
.alpha-goal/iterations/YYYYMMDD-<slug>.jsonl
```

Default full artifact paths:

```text
.alpha-goal/context/YYYYMMDD-<slug>-goal-contract.md
.alpha-goal/models/YYYYMMDD-<slug>-system-model.md
.alpha-goal/synthesis/YYYYMMDD-<slug>-decision-synthesis.md
.alpha-goal/iterations/YYYYMMDD-<slug>.md
.alpha-goal/evidence/
.alpha-goal/verification/YYYYMMDD-<slug>-verdict.md
```

Default behavior is to write the ledger under `.alpha-goal/`. Before the first write in a repository, check whether `.alpha-goal/` is ignored. If it is not ignored and the repo root `.gitignore` is writable, add this line before writing ledger artifacts:

```gitignore
.alpha-goal/
```

Treat adding `.alpha-goal/` to `.gitignore` as a process-artifact setup mutation, not an implementation mutation. Use chat-only ledger state only when the user explicitly forbids file writes, no repository path exists, or `.gitignore` cannot be updated safely; state that reason in the `Ledger path` field.

## Ledger schema

```text
Closed-loop Ledger:
- Task slug:
- Last updated:
- Ledger path:
- Artifact registry:
  - Goal Contract:
  - System Model:
  - Decision Synthesis:
  - Iteration Records:
  - Evidence:
  - Verification Verdict:
- Latest Control Route:
  Control Route:
  - Ledger path:
  - Active state:
  - Dominant uncertainty:
  - Error signal:
  - Control law:
  - Indicator handoff:
  - Adaptive learning:
  - Controller hierarchy:
  - Disturbance register:
  - Selected skill:
  - Why this skill:
  - Required context to load or ask for:
  - Safety boundary:
  - Next action:
- Reference:
  - Desired outcome:
  - Acceptance evidence:
  - Claim boundary:
  - Indicator handoff:
    - Qualitative objective:
    - Metric/proxy:
    - Sensor:
    - Threshold/tolerance:
    - Evidence boundary:
- Current state:
  - Observed facts:
  - Inferences:
  - Unknowns:
  - Active risks/disturbances:
  - Disturbance register:
    - Disturbance:
    - Likelihood/impact:
    - Sensor:
    - Containment:
    - Route trigger:
  - Controller hierarchy:
    - Global controller:
    - Local controllers:
    - Coupling variables:
    - Arbitration/escalation:
- Control state:
  - Active route:
  - Dominant uncertainty:
  - Last error signal:
  - Last control law:
  - Last control action:
  - Last sensor feedback:
  - Residual error:
  - Adaptive learning:
    - Learning trigger:
    - Observed mismatch:
    - Adjustment:
    - Reuse condition:
    - Invalidation condition:
  - Next route:
- Cycle log:
  - Cycle:
    - Input state:
    - Selected skill:
    - Error signal:
    - Control law:
      - Target error:
      - Control variable:
      - Expected effect:
      - Sensor threshold:
      - Fallback action:
    - Control action or probe:
    - Variables changed:
    - Variables held constant:
    - Disturbance register update:
    - Adaptive learning record:
    - Sensor feedback:
    - Evidence boundary:
    - Residual error:
    - Route decision:
    - Next state:
```

## Stage responsibilities

- `alpha-goal`: discover or initialize the ledger, classify active control state, write the full `Latest Control Route`, and show only a Markdown-table `Route Summary` in the TUI by default.
- `decision-synthesis`: read the latest route before synthesis; write the full Decision Synthesis Record under `.alpha-goal/synthesis/`, update the artifact registry and route-relevant synthesis state, and show a Markdown-table `Synthesis Summary` in the TUI by default.
- `system-model`: read the latest route before modeling; write the full Control Model under `.alpha-goal/models/`, update the artifact registry and model-relevant state, and show a Markdown-table `Model Summary` in the TUI by default.
- `goal-contract`: read the latest route before changing the reference; write the full Goal Contract under `.alpha-goal/context/`, update the artifact registry and reference state, and show a Markdown-table `Contract Summary` in the TUI by default.
- `control-loop`: read the latest route before mutation/probe; write full Iteration Records under `.alpha-goal/iterations/`, durable logs under `.alpha-goal/evidence/` when needed, update the artifact registry and control state, and show a Markdown-table `Iteration Summary` in the TUI by default.
- `evidence-verify`: read the latest route before verdict; write the full Verification Verdict under `.alpha-goal/verification/`, update the artifact registry and final comparator state, and show a Markdown-table `Verification Summary` in the TUI by default.

## Update rules

- Update the ledger when reference, Indicator Handoff, plant model, Controller Hierarchy, Disturbance Register, Adaptive Learning Record, Control Law, actuator boundary, evidence floor, artifact path, route, selected skill, next action, or residual error changes materially.
- Treat `.alpha-goal/control-state/` as the source of truth for cross-skill route fields. Do not require later skills to reconstruct `Control Route` from the visible TUI summary.
- Treat the artifact registry as the source of truth for locating full stage outputs. Do not duplicate full Goal Contracts, Control Models, Decision Synthesis Records, Iteration Records, or Verification Verdicts inside the ledger unless file persistence is blocked.
- TUI output should default to compact Markdown table summaries:

```markdown
Route Summary

| Field | Value |
| --- | --- |
| Route | |
| Why | |
| Boundary | |
| Ledger | |
| Next | |
```

- Stage summaries should use the same two-column Markdown table shape: field and value. Values should be concise and point to artifact paths for long details. If a runtime cannot render Markdown tables, use a compact two-column plain-text table instead of bullet lists. Print full artifacts in chat only when the user asks, persistence is blocked, or a decision/risk requires explicit user review.
- Do not duplicate full command output; link or summarize evidence and point to `.alpha-goal/evidence/` when durable logs are needed.
- Do not store secrets, tokens, credentials, private user data, or production-only sensitive records.
- Label stale or superseded state instead of silently overwriting it.
- If the ledger conflicts with the current Goal Contract, system model, diff, or fresh evidence, route to `goal-contract`, `system-model`, or `evidence-verify` before further mutation.
