# Decision Synthesis Record Schema

Persist the full record at `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md` by default. When machine validation or resume safety matters, write a schema sidecar at `.alpha-goal/YYYYMMDD-<slug>/schema/decision-synthesis.json`. The TUI should show a Markdown-table `Synthesis Summary` with core tension, recommended direction, user decision, artifact path, and next action unless full chat output is required.

```text
Decision Synthesis Record:
- Title:
- Complexity class:
- System purpose:
- Decision context:
- Stakeholders / perspectives:
  - Perspective:
  - Objective:
  - Evidence/model/judgment:
  - Confidence:
  - Conflict:
  - Decision owner:
- Qualitative judgments:
- Quantitative signals:
- Meta-Synthesis Hall:
  - Hypothesis bank:
  - Model registry:
  - Dissent:
  - Convergence condition:
- Synthesis rounds:
  - Round:
  - Core question or hypothesis:
  - Human/expert judgments:
  - Machine evidence and models:
  - Meta-Synthesis Hall state:
  - Quantitative indicators:
  - Conflict or contradiction:
  - Integrated update:
  - User-owned decision:
  - Next hypothesis to verify:
  - Route trigger:
- Indicator handoff:
  - Qualitative objective:
  - Metric/proxy:
  - Operational definition:
  - Sensor:
  - Threshold/tolerance:
  - Evidence boundary:
- Subsystems and interactions:
- State variables:
- Constraints:
- Scenarios:
- Candidate strategies:
- Tradeoff matrix:
- Recommended direction:
- Non-goals:
- User-owned decisions:
- Risks requiring acceptance:
- Evidence needed:
- Minimum viable Goal Contract candidate:
- Ledger update:
  - Control-state path:
  - Artifact path:
  - Schema sidecar path:
  - Synthesis state changes:
  - Next route:
- Route:
```

Keep the record compact unless broad handoff or recovery is needed.
