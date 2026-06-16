# 自适应学习记录

Use an 自适应学习记录 when observed feedback shows that a 控制律, threshold, disturbance assumption, route choice, or evidence floor was wrong enough to affect later cycles.

This is not a retrospective essay. Record only learning that changes a future control action, sensor threshold, routing rule, or reuse boundary.

```text
自适应学习记录:
- 学习触发条件:
- 先前假设或控制律:
- 已观察偏差:
- 证据:
- 调整:
  - 控制变量:
  - 阈值 / 容差:
  - 传感器:
  - 失败处理或路由:
- 复用条件:
- 失效条件:
- 负责人或决策边界:
- 台账更新:
```

## 规则

- Learn from residual error, threshold miss, repeated fallback, failed probe, contradicted model, or user/reviewer feedback.
- Do not convert a local observation into a broad rule unless the evidence boundary supports it.
- Name the condition under which the adjustment should be reused and the condition that invalidates it.
- If learning changes reference, scope, authority, risk acceptance, or final claim, route to `goal-contract` or user instead of silently adapting.
- If learning shows plant, sensor, actuator, disturbance, or coupling assumptions were wrong, route to `system-model`.
