# Closed-loop Ledger

Default behavior: use the smallest memory that preserves control state. If durable state is useful, write under `.alpha-goal/` only after `.gitignore` ignores it; adding that ignore is a process-artifact setup mutation.

Required cross-stage source of truth fields:

```text
Latest Control Route:
- Reference:
- Current state:
- Last error signal:
- Control law:
- Sensor feedback:
- Route decision:
- Next state:
- Adaptive learning:
- Artifact registry:
```

Artifact registry may point to `.alpha-goal/context`, `.alpha-goal/models`, `.alpha-goal/synthesis`, `.alpha-goal/iterations`, `.alpha-goal/evidence`, and `.alpha-goal/verification`. Show only a compact `Route Summary` table in the TUI unless full state is needed.

Route Summary table header: `| Field | Value |`.
