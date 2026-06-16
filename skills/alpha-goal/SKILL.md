---
name: alpha-goal
description: "澄清需求，把含糊的工程、调试、设计或产物请求转成安全的目标契约：参考状态、范围、非目标、决策边界、验收证据和实现授权。"
---

# Alpha Goal

执行前定义参考状态、完整语义、范围、非目标、决策边界、验收证据、声明边界和用户授权。不编辑实现，不授权 push / 部署 / 数据修复 / 外部副作用。

关键词：目标契约、参考状态、验收证据、声明边界、决策边界、指标转译、候选解释、完整语义候选、选定语义、未选解释、用户裁决依据、待用户确认的候选、产物路径。

## 量化模糊度闸门

必须量化，不使用定性等级，不选择配置档位。清楚的 `inline` 只压缩展示和持久化形式，仍保留分值依据；模糊度必须 `<= 0.15`。

```text
新建场景模糊度 = 1 - (intent*0.25 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.15)
存量系统模糊度 = 1 - (intent*0.20 + outcome*0.20 + scope*0.18 + constraints*0.14 + success*0.14 + context*0.14)
控制模糊度 = 1 - (reference*0.25 + actuator_boundary*0.20 + sensor_plan*0.20 + disturbance_bounds*0.15 + claim_boundary*0.20)
```

语义清晰度不够、关键维度无法赋值，或多种解释会改变实现范围、接口或数据来源时，先澄清，不得交接给 `control-loop`。
关键词必须收敛为唯一的产品 / 工程语义；不得把现有接口能力误当成用户真正诉求。

## 就绪闸门

- 目标和结果能检测误差；范围、非目标、验收、声明边界明确。
- 完整语义覆盖候选解释、取舍依据和覆盖边界；不得把任一候选解释写成选定语义。
- 只问用户自有决策；事实自行发现。
- 在不裁剪目标语义的前提下，找最小安全执行方案。
- 目标契约默认是草案；待用户确认时下一路由是 `user`。
- 用户明确接受同一契约版本后，才可写 `stage_decision: CONTRACT_APPROVED` 和 `authorization_status: approved`。
- 草案 sidecar 使用 `stage_decision: ROUTE_TO_USER` 和 `authorization_status: pending`。

## 产物

`inline` 展示 `契约摘要`；`persisted` / `audited` 写 `.alpha-goal/YYYYMMDD-<slug>/alpha-goal.md` 和 `.alpha-goal/YYYYMMDD-<slug>/control-state.md`。

目标契约结构:

```text
目标契约:
- 参考状态:
- 语义对齐:
- 模糊度数值:
- 分值依据:
- 范围:
- 控制模型:
- 指标转译:
- 验收标准:
- 交接:
- 台账更新:
```

TUI 摘要:

```markdown
契约摘要

| 字段 | 内容 |
| --- | --- |
| 参考 | |
| 语义状态 | |
| 模糊度 | |
| 范围边界 | |
| 证据 | |
| 产物 | |
| 下一步 | |
```

持久化路径:

```text
.alpha-goal/YYYYMMDD-<slug>/alpha-goal.md
.alpha-goal/YYYYMMDD-<slug>/control-state.md
```

## 交接

契约准备好后，请用户接受、拒绝或修改。接受后交接参考状态、完整语义取舍、模糊度结果、范围、非目标、证据下限、声明边界和执行器边界；否则停在 `user`。`system-model` 只能作为条件升级分支，不能代替本技能授权执行。
