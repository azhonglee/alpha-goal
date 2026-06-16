# Alpha Goal

一套面向 Codex 的闭环控制技能集。默认路径收敛为四个阶段：

```text
意图 -> alpha-goal(目标契约) -> control-loop(有界行动 + 反馈) -> evidence-verify(证据比较) -> 最终交付或下一轮
                 \-> system-model?(系统边界、可观测性、可控性不清时)
```

## 技能

| 技能 | 负责什么 | 什么时候触发 |
| --- | --- | --- |
| `alpha-goal` | 通过苏格拉底式澄清循环形成目标契约，覆盖真实意图、预期结果、范围、非目标、边界、约束、验收信号和决策边界 | 真实目标、范围、非目标、边界、约束或验收口径不清楚 |
| `system-model` | 建模被控对象、状态变量、观测信号、可控动作、控制器层级、扰动和耦合 | 系统边界、可观测性、可控性、扰动或耦合会影响安全行动 |
| `control-loop` | 在已确认的 alpha-goal 目标契约下执行有界迭代，采集反馈并记录残余误差 | 目标契约已确认，需要安全地执行、诊断、修复或加固 |
| `evidence-verify` | 判断证据是否支持完成、可合并、可发布或窄化声明 | 工作看似完成，需要独立检查证据和最终声明边界 |

`system-model` 是辅助技能和条件升级分支，不是普通任务默认阶段；它最终必须回到 `alpha-goal` 形成目标契约。未经 `alpha-goal` 确认，不允许进入 `control-loop`。

## 核心概念

| 控制论概念 | 在 Alpha Goal 中的含义 |
| --- | --- |
| 参考输入 | `alpha-goal` 确认的目标契约，包括真实意图、预期结果、范围、非目标、边界、约束、验收信号和决策边界 |
| 被控对象 | 代码库、产品、文档、数据流、运行环境或组织流程 |
| 观测器 | 仓库快照、差异、测试、日志、运行探针、截图、人工反馈和评审意见 |
| 执行器 | `control-loop` 执行的有界改动、诊断、修复、加固或只读探针 |
| 控制律 | 目标误差、控制变量、预期效果、传感器阈值、反馈延迟 / 噪声、置信度、阻尼 / 防振荡、饱和条件 / 约束边界和失败处理 |
| 比较器 | `evidence-verify` 对目标、证据和最终声明的误差判定 |
| 状态记忆 | `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 中的闭环台账 |
| 产物布局 | 任务级运行产物统一放在 `.alpha-goal/YYYYMMDD-<slug>/xxx` 下 |

## 安装

```bash
scripts/install.sh
```

默认会在 `$HOME/.codex/skills/alpha-goal` 创建软链接，指向本仓库 `skills/`。更多安装模式见 [INSTALL.md](INSTALL.md)。

## 用法

```text
$alpha-goal your_task_description
```

常见路径：

- 目标契约已确认：`control-loop`
- 系统边界或反馈不清：`system-model -> alpha-goal`
- 需要最终声明：`evidence-verify`

## 运行产物

跨阶段恢复状态时，使用 `.alpha-goal/YYYYMMDD-<slug>/control-state.md`。同一任务的相关产物也放在该任务目录下，例如 `alpha-goal.md`、`system-model.md`、`iterations/`、`evidence/` 和 `verification-verdict.md`。

## 校验

```bash
npx --yes tsx tools/validate_skillset.ts .
```

涉及安装行为时，使用临时 `CODEX_HOME` 做烟测，避免污染真实用户配置。
