# 控制器层级

Use a 控制器层级 / Coordination Map when a task has multiple subsystems, teams, repos, agents, modules, services, or objectives that can act as local controllers under a shared goal.

If material multi-controller relationships exist, output a clearly labeled `控制器层级:` block. If none exist, state `控制器层级: none material`. Do not replace the hierarchy with an unlabeled prose coordination section.

```text
控制器层级:
- 全局控制器:
  - 目标:
  - 权限边界:
  - 全局传感器:
  - 仲裁规则:
- 局部控制器:
  - 负责人:
  - 被控对象 / plant:
  - 局部目标:
  - 控制变量:
  - 局部传感器:
  - 约束:
  - 耦合变量:
  - 升级触发条件:
- 协同风险:
- 推荐协同路由:
```

## Rules

- Use the hierarchy to keep local optimization from destabilizing the global objective.
- Name coupling variables that multiple controllers can change or observe.
- Do not let a local controller decide global priority, risk acceptance, budget, timeline, production impact, or final claim.
- If controllers conflict on objective priority, risk, or authority, route to `decision-synthesis` or user.
- If the hierarchy exposes missing plant, sensor, actuator, or coupling facts, route to `system-model` before mutation.
