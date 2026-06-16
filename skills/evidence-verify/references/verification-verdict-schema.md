# 验证结论 Schema

Use this full schema for formal acceptance records, merge-ready or ship-ready judgments, high-risk claims, contested evidence, or handoff. For low-risk checks, a compact verdict is enough if it preserves the semantics. Persist the full verdict at `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md` by default. When machine validation or resume safety matters, write a schema sidecar at `.alpha-goal/YYYYMMDD-<slug>/schema/verification-verdict.json`. The TUI should show a Markdown-table `验证摘要` with verdict, claim boundary, evidence, artifact path, and next action unless full chat output is required.

## 紧凑结论

```text
验证结论:
- 结论:
- 证据覆盖:
- 允许声明:
- 缺口:
- 产物:
- 下一步:
```

## 完整结论

```text
验证结论:
- 结论:
- 验收证据矩阵:
- 契约复核:
- 控制模型复核:
- 产物复核:
- 控制律复核:
  - 动态与稳定性复核:
- 指标交接复核:
- 自适应学习复核:
- 声明边界:
- 风险 / 证据复核:
- 已运行新鲜检查:
- Diff / 范围复核:
- 反馈复核:
- 判断:
- 未解决缺口:
- 必需下一步:
- 允许的最终声明:
- 台账更新:
  - 控制状态路径:
  - 产物路径:
  - Schema 辅助索引路径:
  - 结论:
  - 下一路由:
```

## 结论

Exactly one:

- `PASS_TO_FINAL`
- `NARROW_CLAIM_AND_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`

## 验收证据矩阵

For each acceptance expectation:

- evidence;
- boundary;
- freshness;
- status: `covered`, `partially covered`, `not covered`, `blocked`, or `not applicable`.

Root-cause claims should record symptom, first divergence point, narrowed component, excluded alternatives, and remaining uncertainty.

## 控制律复核

For each material control action or diagnostic probe:

- target error;
- expected effect;
- sensor and threshold;
- observed feedback;
- feedback latency;
- signal noise;
- confidence;
- damping / anti-oscillation;
- saturation / containment;
- threshold status: `met`, `partially met`, `not met`, `blocked`, or `not applicable`;
- fallback or residual error.

## 指标交接复核

For each material qualitative objective or synthesis metric:

- operational definition;
- sensor / evidence source;
- timing;
- threshold or tolerance;
- evidence boundary;
- status: `covered`, `partially covered`, `not covered`, `blocked`, or `not applicable`.

## 自适应学习复核

For each material learning record:

- learning trigger;
- observed mismatch;
- evidence;
- adjustment;
- reuse condition;
- invalidation condition;
- whether the final claim stays inside the evidence boundary.

## 允许的最终声明

Write the widest final statement that fresh evidence supports. It must not imply broader product, integration, production, tenant, security, or safety validation than evidence shows.
