# 任务级产物布局

`persisted` 和 `audited` 分层的运行态产物使用同一个任务运行目录。`inline` 任务默认不创建目录，只在聊天中保留紧凑摘要；这只改变持久化位置，不改变契约、执行和验证标准。

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

- 每个目标、任务批次或可恢复工作流只创建一次 `.alpha-goal/YYYYMMDD-<slug>/`。
- 把 `control-state.md` 作为跨技能事实来源，记录路由、参考状态、当前状态、残余误差、最新控制动作、最新传感器反馈、产物登记和下一路由。
- 大体量命令输出、日志、截图、轨迹和原始证据存放到 `evidence/`；从阶段记录链接它们，而不是粘贴进聊天。
- 可选机器可读 schema sidecar 存放到 `schema/`，可行时使用与产物相同的文件主干，例如 `schema/goal-contract.json`。
- 不要直接在 `.alpha-goal/` 下使用旧分类目录，例如 `context/`、`models/`、`control-state/`、`iterations/`、`evidence/` 或 `verification/`。
- 如果文件持久化受阻，在聊天中打印产物，并在通常应出现产物路径的位置说明无法写入原因。

## 产物登记字段

以仓库根目录为基准记录路径：

```text
产物登记:
- 控制状态: .alpha-goal/YYYYMMDD-<slug>/control-state.md
- 目标契约: .alpha-goal/YYYYMMDD-<slug>/goal-contract.md
- 控制模型: .alpha-goal/YYYYMMDD-<slug>/system-model.md
- 决策综合: .alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md
- 计划: .alpha-goal/YYYYMMDD-<slug>/plan.md
- 迭代记录: .alpha-goal/YYYYMMDD-<slug>/iterations/
- 证据: .alpha-goal/YYYYMMDD-<slug>/evidence/
- schema sidecar: .alpha-goal/YYYYMMDD-<slug>/schema/
- 验证结论: .alpha-goal/YYYYMMDD-<slug>/verification-verdict.md
- 一致性报告: .alpha-goal/YYYYMMDD-<slug>/conformance-report.md
```
