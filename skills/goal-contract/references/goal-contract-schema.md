# Goal Contract Schema

Use this reference when a durable or handoff-ready contract is needed.

Persist the full contract at `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md` by default. When machine validation or resume safety matters, write a schema sidecar at `.alpha-goal/YYYYMMDD-<slug>/schema/goal-contract.json`. The TUI should show a Markdown-table `Contract Summary` with reference, scope boundary, evidence, artifact path, and next action unless full chat output is required.

```text
Goal Contract:
- Title:
- Owner / requester:
- Date / slug:
- Profile: quick | standard | deep
- Reference state:
  - Desired outcome:
  - Final claim boundary:
  - Error condition:
- Current state:
  - Observed facts:
  - Inferences:
  - Unknowns:
- Scope:
  - In scope:
  - Out of scope / non-goals:
- Control model:
  - Controlled object / plant:
  - Allowed control variables:
  - Observability signals:
  - Disturbances:
  - Couplings:
  - Stability conditions:
- Indicator handoff:
  - Qualitative objective:
  - Metric or proxy:
  - Operational definition:
  - Sensor / evidence source:
  - Measurement timing:
  - Threshold / tolerance:
  - Evidence boundary:
  - Owner or decision boundary:
- Decision boundaries:
  - Agent-owned:
  - User-owned:
- Constraints:
- Assumptions resolved:
- Acceptance criteria and evidence:
- Diagnostic gate, if any:
  - Symptom:
  - Competing hypotheses:
  - Cause-evidence needed:
  - Repair authorization:
- Pressure-test findings:
- Handoff:
  - First loop mode:
  - Evidence floor:
  - Stop or reframe triggers:
- Ledger update:
  - Control-state path:
  - Artifact path:
  - Schema sidecar path:
  - Latest error signal:
  - Next route:
```

A contract can be compact when risk is low, but it must preserve reference state, scope, non-goals, decision boundary, acceptance evidence, and claim boundary.
