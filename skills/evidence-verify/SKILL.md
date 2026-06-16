---
name: evidence-verify
description: "判断新鲜证据是否满足已确认的 alpha-goal 目标契约，并支持完成、正确性、安全性、可合并、可发布或窄化最终声明。用于最终比较器 / 误差边界决策，不用于实现。"
---

# 证据验证

独立比较器：判断最终状态是否匹配已确认目标契约中的预期结果、边界、约束、验收信号和决策边界，拟声明是否在证据范围内。无完成、正确、安全、可合并、可发布或窄化声明需求时，不使用本技能。

脚本：`scripts/evidence-summary.ts` 用于汇总证据。

## 检查

正向结论必须有风险相称的新鲜证据，至少覆盖：已确认目标契约的验收信号和边界、当前 diff 或产物状态、实际运行的命令 / 探针 / 检查结果、最强风险及其处理结论。长期规范 / 计划 / 模型、闭环台账、扰动记录、自适应学习记录、调试回执只在目标契约、改动风险或已存在产物涉及它们时检查，否则标记 `not applicable`。

对每条验收标记 `covered`、`partially covered`、`not covered`、`blocked` 或 `not applicable`。低边界测试不能支撑高边界声明。bug / 根因修复必须先有 `ROOT_CAUSE_CONFIRMED`；`NOT_REPRODUCED` 或 `BLOCKED` 不支持该声明。

高风险控制律还要复核反馈延迟、信号噪声、置信度、阻尼 / 防振荡、饱和条件 / 约束边界和失败处理。

声明边界:

```text
声明边界:
- 用户表述:
- 已实现边界:
- 已测试 / 已观察边界:
- 证据能支持的最高边界:
- 缺口:
- 允许的最终声明:
```

## 结论

- `PASS_TO_FINAL`: 证据覆盖验收和声明边界。
- `NARROW_CLAIM_AND_FINAL`: 局部满足，但最终措辞必须窄化。
- `NEXT_ITERATION`: 仍需实现、证据、加固或清理。
- `REFRAME`: 目标契约、模型、范围、非目标、验收或声明边界错误。
- `BLOCKED`: 缺环境、数据、权限、工具或用户决策。

默认展示 `验证摘要`。高风险、发布、证据争议、恢复 / 交接或用户要求时，写 `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md` 和 `.alpha-goal/YYYYMMDD-<slug>/schema/verification-verdict.json`。

TUI 摘要:

```markdown
验证摘要

| 字段 | 内容 |
| --- | --- |
| 结论 | |
| 声明边界 | |
| 证据 | |
| 产物 | |
| 下一步 | |
```

完整版:

```text
验证结论:
- 结论:
- 声明边界:
- 证据覆盖:
- 目标契约证据映射复核:
- 自适应学习复核:
- 允许的最终声明:
- 缺口:
- 下一路由:
```

TUI 的下一路由只使用 `final`、`control-loop`、`alpha-goal`、`system-model` 或 `blocker`；schema sidecar 再写 `PASS_TO_FINAL`、`NARROW_CLAIM_AND_FINAL`、`NEXT_ITERATION`、`REFRAME` 或 `BLOCKED`。契约语义错误时返回 `alpha-goal`，系统模型错误时返回 `system-model`；`NARROW_CLAIM_AND_FINAL` 必须说明窄化；`BLOCKED` 报告最小缺失条件。
