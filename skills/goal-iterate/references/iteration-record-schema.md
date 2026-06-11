# Iteration Record Schema

输出保持紧凑，字段必须齐全。没有内容时写 `none` 或明确原因。

```yaml
Iteration Record:
  Contract version:
  Iteration goal:
  Mutation preflight:
  Action:
  Changed files:
  Local evidence:
  Acceptance delta:
  Risks introduced:
  Iterate verdict:
  Next:
```

## 字段含义

- `Contract version`：本轮依据的 Goal Contract 标识、摘要或时间点。
- `Iteration goal`：本轮最小目标，不重写总目标。
- `Mutation preflight`：preflight 命令和关键结论。
- `Action`：实际做了什么，不写未来计划代替行动。
- `Changed files`：新增、修改、删除的路径。
- `Local evidence`：测试、检查、运行结果或源码证据。
- `Acceptance delta`：本轮推进了哪些 acceptance，哪些仍未覆盖。
- `Risks introduced`：新增风险、未验证路径或回归面。
- `Iterate verdict`：阶段出口。
- `Next`：进入 `goal-verify`、返回 `goal-frame` 或报告 blocker。

## Verdict

- `ITERATION_READY_FOR_VERIFY`：本轮变更和证据足够交给 `goal-verify` 裁决。
- `BLOCKED`：缺权限、环境、依赖或外部状态，无法继续。
- `REFRAME_NEEDED`：Goal Contract、目标边界、已有工作关系或验收定义需要重框定。
