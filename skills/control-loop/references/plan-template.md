# 计划模板

Use only when `control-loop` needs a durable dynamic plan. A plan is the current execution view and incremental history; it is not an approval gate and must not rewrite the 目标契约.

默认路径:

```text
.alpha-goal/YYYYMMDD-<slug>/plan.md
```

Create or update a plan when:

- multiple independent loops, modules, repos, submodules, or ownership surfaces need sequencing;
- recovery or handoff must survive chat history loss;
- migration, architecture, rollback, compatibility, or evidence sequencing decisions need persistence;
- loop evidence changes the route materially;
- user requests a plan, execution artifact, handoff route, or status artifact.

```text
# 计划

## 元数据
- 标题:
- 状态: draft | reviewed | approved | superseded
- 关联目标契约:
- 关联控制模型:
- 负责人:
- 最强实质风险:
- 批准依据:
- 取代:
- 最后更新:

## 当前策略

2-5 sentences explaining the current route, key tradeoff, and why this is the smallest viable route.

## 活跃边界

- 范围内:
- 范围外:
- 已支持声明边界:
- 控制律:
- 控制变量:
- 保持不变的变量:
- 已应用自适应学习记录:

## 触发证据

- 循环或事件:
- 证据:
- 决策:

## 执行切片

| ID | 目标 | 控制律 | 已应用学习 | 状态 | 依赖 | 证据闸门 | 反馈路由 |
| --- | --- | --- | --- | --- | --- | --- |
| S1 |  |  | none | pending | none |  |  |

Status values: pending, in_progress, done, blocked, superseded.

## 决策

- 决策:
  - 原因:
  - 证据:

## 风险与关注点

- 最强实质风险:
  - 缓解措施:
  - 所需证据:

## 验证路由

- 目标最终状态检查:
- 命令或手动探测:
- 最后实质变更后的新鲜证据:
- 明确排除的检查:

## 变更日志

- 时间 / 版本:
  - 变更:
  - 原因:
  - 证据:
  - 学习:

## 开放问题

-
```
