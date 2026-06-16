---
name: alpha-goal
description: "把目标、边界、执行或验证不清的工作路由到闭环控制技能套件：goal-contract、system-model、control-loop、evidence-verify 和 decision-synthesis。下一技能、目标契约、控制边界或验收边界不清时使用；目标清楚的普通实现任务不需要先使用本技能，但进入本套件后仍必须遵守对应阶段闸门。"
---

# Alpha Goal

只做路由，不实现。分层只影响展示、加载和持久化，不降低目标契约、授权、控制律、证据或最终声明闸门。

关键词：闭环台账、最新控制路由、控制律、指标转译、自适应学习、控制器层级、扰动记录、误差信号、选定技能、TUI、不得收缩目标语义。

资源：`references/artifact-layout.md`、`references/closed-loop-ledger.md`、`references/cybernetic-conformance.md`、`references/cybernetic-routing.md`。

## 边界

- 目标、范围、非目标、验收或授权不清 -> `goal-contract`。
- 被控对象、可观测性、可控性、耦合或归属不清 -> `system-model`。
- 多方冲突、弱量化或开放复杂巨系统 -> `decision-synthesis`。
- 最终声明、正确性、可合并、可发布或安全性 -> `evidence-verify`。
- 进入 `control-loop` 必须来自已批准的 `goal-contract`。
- 写 `.alpha-goal/` 前确认已忽略；运行态产物用 `.alpha-goal/YYYYMMDD-<slug>/xxx`。

## 分层

| 分层 | 场景 | 产物 |
| --- | --- | --- |
| `inline` | 单轮、低风险、无需恢复 | 聊天摘要 |
| `persisted` | 跨技能、多轮、需恢复或有扰动 | `.alpha-goal/YYYYMMDD-<slug>/control-state.md` |
| `audited` | 高风险、外部副作用、审计或敏感声明 | `persisted` + schema sidecar |

## 路由闸门

- 若同一请求有多种合理解释且会改变实现范围、接口或数据来源，先回 `goal-contract`；围绕用户真正要解决的问题澄清，不要选择当前接口最容易支持的一种。
- 目标契约已被用户明确接受；草案 / 待确认时下一路由必须是 `user`。
- 执行前已有目标误差、控制变量、预期效果、传感器阈值、失败处理和边界。
- 最终声明只能由 `evidence-verify` 检查。

## 持久化路由卡并展示摘要

```text
最新控制路由:
控制路由:
- 台账路径:
- 活跃状态:
- 误差信号:
- 控制律:
- 指标转译:
- 自适应学习:
- 控制器层级:
- 扰动记录:
- 选定技能:
- 安全边界:
- 下一步:
```

随后只展示适合 TUI 阅读的 Markdown 表格摘要：

```markdown
路由摘要

| 字段 | 内容 |
| --- | --- |
| 路由 | |
| 原因 | |
| 边界 | |
| 下一步 | |
```

摘要应让用户不读长字段列表也能理解路由。不能写文件时，在聊天中包含完整 `控制路由` 并说明原因。
