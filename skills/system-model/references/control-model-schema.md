# Control Model Schema

Persist the full model at `.alpha-goal/models/YYYYMMDD-<slug>-system-model.md` by default. The TUI should show a Markdown-table `Model Summary` with boundary, observability, controllability, artifact path, and recommended route unless full chat output is required.

```text
Control Model:
- Title:
- Date / slug:
- System boundary:
  - Controlled object / plant:
  - Environment:
  - External actors:
  - Ownership boundary:
  - Time boundary:
- State variables:
  - Variable:
  - Current value/evidence:
  - Desired or relevant range:
  - Confidence:
- Inputs:
- Outputs:
- Sensors:
  - Signal:
  - Freshness:
  - Boundary crossed:
  - Failure modes:
- Actuators:
  - Action:
  - Authority:
  - Reversibility:
  - Risk:
- Indicator handoff to sensors:
  - Indicator:
  - Sensor:
  - Timing:
  - Threshold / tolerance:
  - Evidence boundary:
- Candidate control laws:
  - Target error:
  - Control variable:
  - Candidate action or probe:
  - Sensor:
  - Threshold / tolerance:
  - Risk/fallback:
- Disturbance register:
  - Disturbance:
  - Source:
  - Likelihood:
  - Impact:
  - Affected state/control variable:
  - Sensor:
  - Containment:
  - Route trigger:
  - Owner or decision boundary:
- Coupling map:
- Controller hierarchy:
  - Global controller:
  - Local controllers:
  - Coupling variables:
  - Arbitration rule:
  - Escalation trigger:
- Observability rating:
- Controllability rating:
- Stability conditions:
- Missing sensors or authority:
- Model adequacy:
- Ledger update:
  - Control-state path:
  - Artifact path:
  - Model changes:
  - Residual model uncertainty:
  - Next route:
- Recommended route:
```

Use this only when the compact model is insufficient for handoff or recovery.
