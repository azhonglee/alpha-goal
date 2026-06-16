# Closed-loop Ledger

Default behavior: use chat only for one-turn low-risk read-only work. Use `.alpha-goal/control-state/latest.md` as the stable latest route entry. Use durable `.alpha-goal/` ledger when crossing skills/turns, mutating, using subagents, handling risk, or supporting final claims. Write only after `.gitignore` ignores it; adding that ignore is a process-artifact setup mutation.

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
- Artifact registry:
- Adaptive learning:
- Selected skill:
- Boundary:
- Disturbance:
- User-owned decisions:
- Blocked downstream action:
- Claim boundary:
- Next action:
```

Artifact registry may point to `.alpha-goal/context`, `.alpha-goal/models`, `.alpha-goal/synthesis`, `.alpha-goal/iterations`, `.alpha-goal/evidence`, and `.alpha-goal/verification`. Show only a compact `Route Summary` table in the TUI unless full state is needed.

Route Summary table header: `| Field | Value |`.
