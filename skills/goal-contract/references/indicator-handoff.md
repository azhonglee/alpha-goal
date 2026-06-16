# 指标转译

当定性目标、综合轮次指标或验收预期需要转成 `system-model`、`control-loop` 或 `evidence-verify` 可观察的证据时，使用 指标转译。

```text
指标转译:
- 定性目标:
- 指标或代理:
- 操作化定义:
- 单位或刻度:
- 传感器 / 证据来源:
- 测量时机或频率:
- 阈值 / 容差:
- 证据边界:
- 负责人或决策边界:
- 缺失传感器或代理风险:
- 路由触发条件:
```

## 规则

- Convert only material objectives into indicators; avoid false precision for preferences that should remain qualitative.
- Every indicator must name a sensor or explicitly name the missing sensor.
- Thresholds may be qualitative, but must be clear enough to decide continue, harden, verify, reframe, or block.
- If a metric changes scope, priority, budget, timeline, risk acceptance, or final claim, route to user before handoff.
- Pass accepted indicators into the 目标契约, system model sensors, 控制律 thresholds, and verification evidence boundary.
