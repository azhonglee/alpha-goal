---
name: control-loop
description: "在已批准目标契约下运行有界控制迭代：规划一个切片，安全执行或探测，感知反馈，比较误差，记录证据，并路由到继续、加固、evidence-verify、重新界定或阻塞。"
---

# 控制循环

只在已批准目标契约下执行或探测；`alpha-goal`、`system-model`、`decision-synthesis` 不能推断授权。已批准契约保留完整目标语义、参考状态、范围 / 非目标、声明边界、用户意图解释和产品 / 工程语义；不能裁剪契约语义。

资源：`references/control-law.md`、`references/worktree-safety.md`、`references/execution-boundaries.md`、`references/loop-modes.md`、`references/adaptive-learning.md`、`references/iteration-record-schema.md`、`references/auto-execution.md`、`references/plan-template.md`、`scripts/mutation-preflight.ts`。

## 入口

读取 `最新控制路由`、上一残余误差、边界和路由决策。多种解释会改变实现范围、接口或数据来源时，返回 `goal-contract`，不要任选一种开始实现，也不要只实现当前字段 / 接口能承载的子集。系统边界、传感器、执行器、扰动或耦合不清时，到 `system-model`。

## 执行

控制律必须含目标误差、控制变量、控制动作或探测、预期效果、传感器阈值、反馈延迟、信号噪声、置信度、阻尼 / 防振荡、饱和条件 / 约束边界、失败处理。`persisted` / `audited` 按需保存持久化控制律；默认不要在 TUI 打印原始 `控制律:` 块。在完整目标语义下说明实现语义；只有用户要求、持久化受阻或高风险复核时打印原始控制律。

TUI 执行前检查:

默认使用中文标题和中文字段名。如果用户明确要求其他语言，只翻译同一组字段语义，不同时展示多语言模板。

```markdown
执行检查

| 字段 | 内容 |
| --- | --- |
| 问题 | |
| 本轮动作 | |
| 保持不变 | |
| 验收证据 | |
| 主要风险 | |
| 失败处理 | |
```

字段映射：`问题`=目标误差；`本轮动作`=控制变量；`验收证据`=传感器阈值；`主要风险`=噪声 / 阻尼 / 饱和条件；`失败处理`=停止或重新界定。

只有存在多个独立循环、跨模块 / 仓库、恢复 / 交接、外部副作用、不可逆 / 高风险、回滚 / 兼容性或用户请求时，才创建持久化计划。

## 反馈

动作后采集新鲜反馈，标记 `gate evidence`、`advisory evidence`、`exploration evidence` 或 `blocked evidence`。反馈反驳控制律、阈值、模型或路由假设时，创建自适应学习记录。主路由只能选 `ITERATION_CONTINUES`、`ITERATION_HARDEN`、`ITERATION_READY_FOR_VERIFY`、`RETURN_TO_ALPHA_GOAL`、`RETURN_TO_SYSTEM_MODEL`、`BLOCKED`。

## 记录

`persisted` / `audited` 写 `.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md`，大证据进 `.alpha-goal/YYYYMMDD-<slug>/evidence/`。记录动作、反馈、剩余误差、控制律结果、台账更新和下一路由。

TUI 摘要:

```markdown
迭代摘要

| 字段 | 内容 |
| --- | --- |
| 动作 | |
| 反馈 | |
| 剩余误差 | |
| 产物 | |
| 下一步 | |
```

不要在迭代记录中作出最终完成声明；完成判断属于 `evidence-verify`。
