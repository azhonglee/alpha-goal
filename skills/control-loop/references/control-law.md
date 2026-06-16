# Control Law

Use this reference when planning or reviewing a `control-loop` slice that changes implementation, configuration, tests, documents, prompts, generated artifacts, or diagnostic probes. A control law explains why the selected action should reduce the target error and how feedback will decide the next route.

## Internal Schema

Persist this full schema in the Iteration Record, Closed-loop Ledger, or schema sidecar when it affects recovery, audit, or verification. It is not the default TUI shape.

```text
Control Law:
- Target error:
- Control variable:
- Control action or probe:
- Variables held constant:
- Expected effect:
- Sensor:
- Threshold / tolerance:
- Feedback latency:
- Signal noise:
- Confidence:
- Damping / anti-oscillation:
- Saturation / containment:
- Feedback timing:
- Fallback action:
- Stop / reframe trigger:
```

## TUI Projection

Show a concise `Execution Check` table in the TUI by default. Use it as a human-readable projection of the internal Control Law:

```markdown
Execution Check

| Field | Value |
| --- | --- |
| Problem | |
| Action | |
| Held constant | |
| Evidence | |
| Main risk | |
| Fallback | |
```

Map fields as follows:

| TUI field | Internal source |
| --- | --- |
| Problem | Target error |
| Action | Control variable plus control action or probe |
| Held constant | Variables held constant plus saturation / containment |
| Evidence | Sensor plus threshold / tolerance |
| Main risk | Signal noise, damping / anti-oscillation, saturation / containment, or strongest material risk |
| Fallback | Fallback action plus stop / reframe trigger |

Keep the TUI values short enough to scan. Put long reasoning, exact thresholds, and stability guards in the persisted Control Law. Print the raw `Control Law:` block in chat only when the user asks, persistence is blocked, or a high-risk slice requires explicit review of every field before mutation.

## Rules

- `Target error` must be stated as a mismatch between reference state and current state, not as effort already spent.
- `Control variable` must be inside the approved actuator boundary.
- `Expected effect` must name the state change the action should cause.
- `Sensor` must be fresh enough and cross the boundary needed by the claim.
- `Threshold / tolerance` may be qualitative, but it must be explicit enough to decide continue, harden, verify, reframe, or block.
- `Feedback latency` states when the expected signal should change and when waiting is safer than another control action.
- `Signal noise` states known flakiness, stale evidence risk, or ambiguous sensor interpretation.
- `Confidence` is low | medium | high and reflects causal certainty, not optimism.
- `Damping / anti-oscillation` names the guard that prevents repeated broad rewrites, route flapping, or over-correction.
- `Saturation / containment` names the maximum allowed blast radius for this slice and the boundary that must not be crossed.
- `Fallback action` must not silently expand scope, authority, or risk.
- If no sensor can observe the expected effect, route to `system-model` or return `BLOCKED`.

## Example

```text
Control Law:
- Target error: SKILL.md frontmatter fails YAML loading.
- Control variable: description scalar quoting.
- Control action or probe: quote description values containing colon-space.
- Variables held constant: skill names and description semantics.
- Expected effect: all skill frontmatter blocks parse as YAML.
- Sensor: YAML.safe_load over skills/*/SKILL.md.
- Threshold / tolerance: every SKILL.md has name and description after parsing.
- Feedback latency: immediately after the quoting change.
- Signal noise: parser differences between strict YAML and the local frontmatter parser.
- Confidence: high, because parser failure directly names the invalid syntax.
- Damping / anti-oscillation: change only scalar quoting, then rerun the parser before touching descriptions.
- Saturation / containment: do not rename skills or rewrite description semantics.
- Feedback timing: after the quoting change.
- Fallback action: inspect remaining frontmatter syntax and tighten validator.
- Stop / reframe trigger: parser still fails or description semantics must change.
```
