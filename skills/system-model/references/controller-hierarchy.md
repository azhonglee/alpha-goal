# Controller Hierarchy

Use a Controller Hierarchy / Coordination Map when a task has multiple subsystems, teams, repos, agents, modules, services, or objectives that can act as local controllers under a shared goal.

If material multi-controller relationships exist, output a clearly labeled `Controller Hierarchy:` block. If none exist, state `Controller hierarchy: none material`. Do not replace the hierarchy with an unlabeled prose coordination section.

```text
Controller Hierarchy:
- Global controller:
  - Objective:
  - Authority boundary:
  - Global sensors:
  - Arbitration rule:
- Local controller:
  - Owner:
  - Controlled object / plant:
  - Local objective:
  - Control variables:
  - Local sensors:
  - Constraints:
  - Coupling variables:
  - Escalation trigger:
- Coordination risks:
- Recommended coordination route:
```

## Rules

- Use the hierarchy to keep local optimization from destabilizing the global objective.
- Name coupling variables that multiple controllers can change or observe.
- Do not let a local controller decide global priority, risk acceptance, budget, timeline, production impact, or final claim.
- If controllers conflict on objective priority, risk, or authority, route to `meta-synthesis` or user.
- If the hierarchy exposes missing plant, sensor, actuator, or coupling facts, route to `system-model` before mutation.
