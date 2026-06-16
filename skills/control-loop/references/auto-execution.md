# 自动执行边界

Use this reference when an 迭代记录 has a `下一步` action, especially when the wording might become a passive “recommended next step”. The loop controller should continue acting when it is safe to do so; recommendation-only output is a stop decision that needs a reason.

## 默认姿态

Execute the next bounded pass immediately when all are true:

- the current route is `ITERATION_CONTINUES` or `ITERATION_HARDEN`;
- the next action is concrete enough to run now, with known target paths, commands, probes, or evidence sensors;
- it remains inside the approved 目标契约, scope, non-goals, constraints, authorization, and claim boundary;
- the next pass has a 控制律 with target error, approved control variable, expected effect, sensor threshold, and fallback action;
- 对重复、噪声大或影响范围广的循环，已明确反馈延迟、信号噪声、置信度、阻尼 / 防振荡和影响范围上限；
- it does not require a user-owned decision, credential, secret, unavailable environment, external approval, deployment, push, PR/MR, or other external side effect;
- it will not overwrite unrelated user changes, cross unclear ownership boundaries, or mutate a primary checkout unsafely;
- risk has not increased enough to require reframing, system modeling, durable planning, or explicit acceptance;
- context and budget are sufficient to perform the pass and record evidence.

Read-only probes, local inspections, local tests, local builds, local linters, and targeted reversible diagnostics normally satisfy this test when their scope and evidence value are clear.

## 停止而非执行

Pause and record a recommendation only when at least one stop reason applies:

- `USER_DECISION_REQUIRED`: target, acceptance, non-goal, risk acceptance, or final claim is user-owned.
- `AUTHORIZATION_MISSING`: mutation, external side effect, credential use, push, PR/MR, deployment, destructive action, or config change is not authorized.
- `BOUNDARY_UNCLEAR`: repository, worktree, submodule, generated output, owner, or system boundary is unclear enough to affect safe action.
- `CONTROL_LAW_UNCLEAR`: target error, control variable, expected effect, sensor threshold, or fallback action is missing.
- `DYNAMICS_UNSTABLE`: 反馈延迟或噪声大，路由振荡，或控制措施不清楚。
- `RISK_ESCALATED`: the next pass introduces materially higher security, data, migration, compatibility, production, or rollback risk.
- `BLOCKED_ENVIRONMENT`: required tool, data, log, service, dependency, credential, or environment is unavailable.
- `BUDGET_OR_CONTEXT_INSUFFICIENT`: continuing would likely drop necessary evidence, rules, or active state.
- `VERIFY_HANDOFF`: acceptance appears covered and independent `evidence-verify` should judge completion.

When pausing, name the stop reason and the smallest concrete next action. Avoid vague phrasing such as “建议下一步” without the reason execution did not continue.

## 输出规则

For every `下一步` field, use one of these forms:

```text
下一步: 自动执行 <有界轮次>，因为 <安全 / 可执行原因>。
下一步: 暂停；<STOP_REASON>；建议 <有界轮次>。
```

If a next action is read-only and already authorized, the expected form is `auto-executing`, followed by actually performing the pass before responding.
