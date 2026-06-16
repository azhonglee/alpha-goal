# 任务级产物布局

Use one task run directory for every durable runtime artifact:

```text
.alpha-goal/YYYYMMDD-<slug>/
  control-state.md
  goal-contract.md
  system-model.md
  decision-synthesis.md
  plan.md
  iterations/
    NN-<slice>.md
    cycles.jsonl
  evidence/
  schema/
  verification-verdict.md
  conformance-report.md
  interviews.md
```

## 规则

- Create `.alpha-goal/YYYYMMDD-<slug>/` once per goal, task batch, or resumable workstream.
- Keep `control-state.md` as the cross-skill source of truth for route, reference, current state, residual error, latest control action, latest sensor feedback, artifact registry, and next route.
- Store large command output, logs, screenshots, traces, and raw evidence under `evidence/`; link them from stage records instead of pasting them into chat.
- Store optional machine-readable schema sidecars under `schema/`, using the same artifact stem when practical, for example `schema/goal-contract.json`.
- Do not use legacy category directories directly under `.alpha-goal/`, such as `context/`, `models/`, `control-state/`, `iterations/`, `evidence/`, or `verification/`.
- If file persistence is blocked, print the artifact in chat and state the no-write reason where the artifact path would normally appear.

## 产物登记字段

Record paths relative to the repository root:

```text
产物登记:
- 控制状态: .alpha-goal/YYYYMMDD-<slug>/control-state.md
- 目标契约: .alpha-goal/YYYYMMDD-<slug>/goal-contract.md
- 控制模型: .alpha-goal/YYYYMMDD-<slug>/system-model.md
- 决策综合: .alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md
- 计划: .alpha-goal/YYYYMMDD-<slug>/plan.md
- 迭代记录: .alpha-goal/YYYYMMDD-<slug>/iterations/
- 证据: .alpha-goal/YYYYMMDD-<slug>/evidence/
- 结构化索引: .alpha-goal/YYYYMMDD-<slug>/schema/
- 验证结论: .alpha-goal/YYYYMMDD-<slug>/verification-verdict.md
- 一致性报告: .alpha-goal/YYYYMMDD-<slug>/conformance-report.md
```
