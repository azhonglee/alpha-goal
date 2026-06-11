# Goal Contract Schema

输出保持紧凑，字段必须齐全。没有内容时写 `none` 或明确原因。

```yaml
Goal Contract:
  Intent:
  Target:
  Acceptance:
  Non-goals:
  Constraints:
  Decision boundaries:
  Assumptions:
  Risks:
  Risk tier:
  Claim boundary:
  Evidence plan:
  Existing work:
  Frame verdict:
  Next:
```

## 字段含义

- `Intent`：用户真正希望达成的结果，不写实现手段。
- `Target`：目标仓库、路径、子仓库或 artifact 边界。
- `Acceptance`：可观察、可验证的验收项。
- `Non-goals`：明确不做的范围。
- `Constraints`：项目规则、权限、时间、兼容性、工具限制。
- `Decision boundaries`：Codex 可自主决定什么，必须问用户什么。
- `Assumptions`：可继续推进但尚未证明的推断。
- `Risks`：如果假设错误会造成的影响。
- `Risk tier`：`low`、`medium` 或 `high`。
- `Claim boundary`：最终可声明完成的最大边界。
- `Evidence plan`：证明 acceptance 需要的证据，不是执行计划。
- `Existing work`：已有 MR/PR/branch/design 的关系判断。
- `Frame verdict`：阶段出口。
- `Next`：下一阶段和最小下一步。

## Verdict

- `READY_FOR_ITERATION`：目标、边界、验收和证据计划足够进入一轮实现。
- `ASK_USER`：缺少用户决策，不能安全继续。
- `READ_ONLY`：任务可用只读证据完成，且不声明实现完成。
- `COMPARISON_ONLY`：需要验证或比较已有工作，不创建新实现。
- `BLOCKED`：缺权限、缺环境、规则冲突或外部依赖阻塞。
