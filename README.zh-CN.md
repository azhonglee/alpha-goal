# Alpha Goal

[English](README.md) | 简体中文

一套建立在闭环控制方法论上的工作流技能集，也是我对 next engineering paradigm 的一个探索。

Alpha Goal 把 agentic software work 从“凭感觉推进”转成一个可观测、可控、可验证的闭环：先定义目标参考状态，再建模系统和观测信号，通过有界迭代行动，最后用证据判断是否真的完成。

```text
INTENT
  -> alpha-goal(route)
  -> decision-synthesis?(objective conflicts)
  -> system-model?(observer / actuator / disturbance)
  -> goal-contract(reference)
  -> control-loop(bounded action + feedback)
  -> evidence-verify(error check)
  -> FINAL or NEXT LOOP
```

## 为什么需要它

agentic software work 很容易在复杂任务里偏航：

- 目标还没澄清，就开始写代码。
- 系统边界、风险和可观测信号还不清楚，就跨文件改动。
- 测试、日志、diff 或人工反馈不足，却提前声称“已完成”。
- 多轮任务里丢失状态，后续行动和最初目标脱节。
- 复杂决策被压成一次性建议，没有记录冲突、指标和用户裁决。

Alpha Goal 的核心判断很简单：没有参考状态，就没有控制；没有观测信号，就没有反馈；没有证据边界，就不能宣称完成。

## 什么时候使用

适合使用 Alpha Goal 的任务：

- 需求含糊、目标容易漂移的工程任务。
- 需要先确认 root cause 的 debugging。
- 风险较高、跨模块或跨工作流的代码变更。
- 多轮、长上下文、需要恢复状态的 agent 工作。
- 需要判断是否 ready to merge、ready to ship 或真正完成的任务。
- 多利益相关方、弱结构化、高不确定性的技术决策。

不一定需要 Alpha Goal 的任务：

- 一条命令就能回答的问题。
- 明确、低风险、可立即验证的小改动。
- 你刻意想让 Codex 进行一次快速、临时、非流程化的探索。

## 工作方式

Alpha Goal 把每个请求当作一个控制系统来处理：

1. `alpha-goal` 判断当前主导不确定性，选择下一步 skill。
2. `decision-synthesis` 处理复杂系统、多主体冲突和弱量化目标，把综合研判交接给后续闭环。
3. `system-model` 在边界会影响安全行动时建模被控对象、状态变量、观测信号、可控变量、扰动和耦合。
4. `goal-contract` 把含糊请求转成目标、范围、非目标、验收证据和最终声明边界。
5. `control-loop` 在已批准目标下执行一轮或多轮有界迭代，采集反馈并记录残余误差。
6. `evidence-verify` 独立比较目标、证据和最终声明，判断是否可以交付或需要下一轮。

如果任务足够简单，`alpha-goal` 会选择最小可用路径；如果目标、系统或证据边界不清楚，它会先收敛边界，而不是直接动手。

## 六个技能

| Skill | 负责什么 | 什么时候触发 |
| --- | --- | --- |
| `alpha-goal` | 闭环总入口、Skill 路由、稳定性检查和跨阶段状态记忆 | 不确定下一步该澄清、建模、执行、验证还是综合决策 |
| `goal-contract` | 形成可执行、可验证、可移交的 目标契约，并承接 指标交接 | 目标、范围、验收、非目标或授权边界不清楚 |
| `system-model` | 建模 plant、state、observer、actuator、控制器层级、扰动登记 和 coupling | 系统边界、观测性、可控性、扰动或耦合会影响安全行动 |
| `control-loop` | 在已批准 目标契约 下执行有界迭代，采集反馈并记录 自适应学习记录 | 目标已明确，需要安全地执行、诊断、修复或加固 |
| `evidence-verify` | 判断证据是否支持完成、可合并、可发布或窄化声明 | 工作看似完成，需要独立检查证据和最终声明边界 |
| `decision-synthesis` | 通过 综合轮次 综合定性判断、机器证据、量化指标、冲突和用户裁决 | 多团队、多目标、高不确定性或复杂巨系统式决策 |

## 核心概念

| 控制论概念 | 在 Alpha Goal 中的含义 |
| --- | --- |
| 参考输入 / reference | `goal-contract` 生成的目标、验收标准和最终声明边界 |
| 被控对象 / plant | 代码库、产品、文档、数据流、运行环境或组织流程 |
| 状态变量 / state | 需求清晰度、实现状态、测试状态、风险、证据覆盖率和 blocker |
| 观测器 / observer | repo 快照、diff、测试、日志、运行探针、截图、人工反馈和 review 意见 |
| 控制器 / actuator | `control-loop` 执行的有界改动、诊断、修复、加固或只读探针 |
| 控制律 / control law | target error、control variable、expected effect、sensor threshold、feedback latency/noise、confidence、damping/containment 和 fallback action |
| 比较器 / comparator | `evidence-verify` 对目标、证据和最终声明的误差判定 |
| 状态记忆 / memory | `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 中的 闭环台账，记录 reference、state、error、action、feedback 和 next route |
| 指标交接 / indicator handoff | 把定性目标转成 metric/proxy、sensor、threshold 和 evidence boundary |
| 自适应学习 / adaptive learning | 当反馈推翻阈值、策略、route 或假设时，记录可复用但有边界的修正 |
| 扰动处理 / disturbance handling | 通过 扰动登记 记录 likelihood、impact、sensor、containment 和 route trigger |
| 分层协同控制 | 通过 控制器层级 识别 global/local controller、coupling variable、arbitration 和 escalation |
| 复杂系统综合集成 | 通过 `decision-synthesis` 的 综合轮次 收敛冲突、证据、指标和用户裁决 |
| 产物布局 / artifact layout | 任务级运行产物统一放在 `.alpha-goal/YYYYMMDD-<slug>/xxx` 下 |
| 控制论一致性 / cybernetic conformance | 用状态转移、schema sidecar 和旧路径检查验证闭环是否真正执行 |

## 快速开始

默认安装到真实 Codex home，并在 `$HOME/.codex/skills/` 下创建一个 `alpha-goal` 软链接，指向本仓库的 `skills/`：

```bash
scripts/install.sh
```

安装脚本会通过 `npx --yes tsx` 运行 TypeScript 校验器，因此本机需要可用的 Node.js/npm。

默认安装会同步用户级模板：

- 把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`。
- 把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`。
- 只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关。
- 不修改 sandbox 权限、休眠行为，也不抑制不稳定特性警告。

更多安装模式（指定 `CODEX_HOME`、替换已有软链接、跳过用户级模板同步、排查安装过程）和临时 `CODEX_HOME` smoke test 见 [INSTALL.md](INSTALL.md)。

## 推荐用法

安装后，在 Codex 中直接让入口 skill 判断下一步：

```text
$alpha-goal your_task_description
```

## 状态记忆

跨阶段恢复状态时，Alpha Goal 默认使用 `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 记录 闭环台账。
同一任务的相关产物也放在该任务目录下，例如 `goal-contract.md`、`system-model.md`、`iterations/`、`evidence/` 和 `verification-verdict.md`。

## 校验

修改技能、脚本、模板或文档后，至少运行：

```bash
npx --yes tsx tools/validate_skillset.ts .
```

涉及安装行为时，按 [INSTALL.md](INSTALL.md) 使用临时 `CODEX_HOME` 做 smoke test，避免污染真实用户配置。

## 仓库结构

```text
skills/
  alpha-goal/          # 闭环总入口和路由
  goal-contract/       # 目标澄清和 目标契约
  system-model/        # 系统状态、可观测性和可控性建模
  control-loop/        # 有界迭代执行和反馈
  evidence-verify/     # 证据边界和完成判断
  decision-synthesis/  # 复杂系统综合研判
templates/             # 可同步到 Codex home 的用户配置模板
scripts/               # 安装脚本
tools/                 # 本仓库校验工具
```

## 设计原则

- 目标先于行动：先定义 reference，再选择 actuator。
- 观测先于声明：没有 sensor 和 evidence boundary，就不做完成声明。
- 有界行动优先：每轮只做能降低当前误差的最小 coherent slice。
- 证据高于口头保证：最终判断由 `evidence-verify` 对照目标和证据作出。
- 状态必须可恢复：长任务依靠 闭环台账，而不是依赖聊天上下文。
- 复杂问题需要综合：多目标、多主体和弱量化任务先用 `decision-synthesis` 收敛判断。
