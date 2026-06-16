# 任务级产物布局

`persisted` / `audited` 使用同一目录；`inline` 不写文件但不降标准。

```text
.alpha-goal/YYYYMMDD-<slug>/
  control-state.md
  goal-contract.md
  system-model.md
  decision-synthesis.md
  plan.md
  iterations/
  evidence/
  schema/
  verification-verdict.md
  conformance-report.md
  interviews.md
```

禁止旧分类路径。大输出放 `evidence/`，schema sidecar 放 `schema/`。
