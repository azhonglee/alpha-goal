# Synthesis Round

Use a Synthesis Round when qualitative judgment, quantitative evidence, stakeholder priorities, or model assumptions conflict enough to affect the Goal Contract or route.

The round is a human-machine convergence mechanism, not a meeting transcript. Keep only claims, evidence, conflicts, decisions, and next hypotheses that change routing or scope.

```text
Synthesis Round:
- Round:
- Core question or hypothesis:
- Human/expert judgments:
  - Source or owner:
  - Judgment:
  - Confidence:
  - Decision authority:
- Machine evidence and models:
  - Signal/model:
  - Boundary crossed:
  - Confidence:
  - Failure mode:
- Meta-Synthesis Hall state:
  - Hypothesis bank:
  - Model registry:
  - Dissent:
  - Convergence condition:
- Quantitative indicators:
  - Metric/proxy:
  - Current value:
  - Target or threshold:
  - Measurement gap:
- Indicator handoff candidate:
- Conflict or contradiction:
- Integrated update:
- User-owned decision:
- Next hypothesis to verify:
- Route trigger: goal-contract | system-model | control-loop | evidence-verify | user | blocker
```

```text
Indicator Handoff:
- Qualitative objective:
- Metric or proxy:
- Operational definition:
- Sensor / evidence source:
- Threshold / tolerance:
- Evidence boundary:
- Route trigger:
```

## Rules

- Use qualitative judgment to select objectives, scenarios, and tradeoffs; use quantitative evidence to constrain claims and detect error.
- Do not average away conflicts. Name the owner, evidence basis, and decision boundary.
- If a metric is unavailable, name a proxy or missing sensor instead of inventing precision.
- Pass accepted indicators to `goal-contract` as an Indicator Handoff with operational definition, sensor, threshold/tolerance, and evidence boundary.
- If user priority, risk acceptance, budget, timeline, or scope changes are required, route to user instead of deciding silently.
- Stop rounds when a stable Goal Contract candidate, system-model question, user decision, or blocker is the smallest next action.
