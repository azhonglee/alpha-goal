# 迭代记录 Schema

Use this reference when a loop result needs a durable or handoff-ready record. Keep it proportional: include fields only when they affect judgment, handoff, recovery, or accountability. Persist the full record at `.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md` by default, with bulky evidence under `.alpha-goal/YYYYMMDD-<slug>/evidence/`. When machine validation or resume safety matters, write a schema sidecar under `.alpha-goal/YYYYMMDD-<slug>/schema/iteration-NN.json`. The TUI should show a Markdown-table `迭代摘要` with action, feedback, residual error, artifact path, and next action unless full chat output is required.

## 紧凑记录

```text
迭代记录:
- 边界:
- 控制切片:
- 动作:
- 证据:
- 误差 / 验收变化:
- 控制律结果:
- 台账更新:
  - 控制状态路径:
  - 产物路径:
  - 结构化索引路径:
  - 证据路径:
  - 残余误差:
  - 路由决策:
- 决策:
- 下一步:
```

## 条件字段

Add when relevant:

- `动态计划`: multi-slice, multi-repo/module, contested ownership, recovery, rollback, compatibility, or handoff sequencing.
- `预检`: mutation path, dirty state, worktree, submodule, local rules, or user-change evidence.
- `已变更文件`: intentional touched paths when there is a diff.
- `生成产物`: generated files, reports, binaries, or documents.
- `验收变化`: criteria covered, partially covered, or uncovered.
- `控制律结果`: 对变更或诊断探测切片，记录目标误差、预期效果、已观察反馈、阈值状态、反馈延迟、信号噪声、置信度、阻尼 / 防振荡、影响范围上限、失败处理和残余误差。
- `自适应学习记录`: trigger, observed mismatch, adjustment, reuse condition, and invalidation condition when feedback changes future control behavior.
- `反馈处理`: user, reviewer, test, runtime, or advisory feedback that changed the route.
- `风险 / 归属`: cross-boundary, generated-output, migration, compatibility, concurrency, data, security, or observability risk.
- `台账更新`: input state, error signal, control action, sensor feedback, residual error, route decision, and next state when the task spans skills or turns.
- `调试回执`: required for bug/root-cause claims.
- `委托回执`: required when subagents own an independent surface.

## 结论词汇

- `ITERATION_CONTINUES`: another bounded slice should proceed or be recommended.
- `ITERATION_HARDEN`: direction is valid but evidence, edge cases, compatibility, or cleanup are insufficient.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears covered; final judgment belongs to `evidence-verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, constraints, decision boundary, authorization, or claim boundary needs reframing.
- `RETURN_TO_SYSTEM_MODEL`: plant boundary, observability, controllability, disturbance, or coupling needs modeling.
- `BLOCKED`: smallest missing input, permission, tool, data, environment, or safe-state condition is named.
