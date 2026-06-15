# 闭环控制式 Alpha Goal 技能集

本仓库维护一组给 Codex 使用的 Agent Skills。当前分支以 `alpha-goal` 作为总入口，把目标契约、系统建模、有界执行、证据验证和复杂决策综合组织成六技能闭环控制套件。

核心映射：

| 工程控制论概念 | 在本 Skills 套件中的角色 |
| --- | --- |
| 参考输入 / 期望状态 | `goal-contract` 生成的 Goal Contract |
| 被控对象 / plant | 代码库、产品、文档、数据流或组织流程 |
| 状态变量 | 需求清晰度、实现状态、测试状态、风险、证据覆盖率 |
| 传感器 / observer | repo 快照、日志、测试、人工反馈、审查意见 |
| 指标交接 / indicator handoff | `goal-contract` 把定性目标转成 metric/proxy、sensor、threshold 和 evidence boundary |
| 控制律 / control law | `control-loop` 中的 target error、control variable、expected effect、sensor threshold 和 fallback action |
| 控制器 / actuator | `control-loop` 的有界迭代、诊断、修复、加固 |
| 比较器 / error detector | `evidence-verify` 对“目标、证据、最终声明”的误差判定 |
| 状态记忆 / memory | `.alpha-goal/control-state/` 中的 Closed-loop Ledger，跨阶段记录完整 Control Route、reference、state、error、action、feedback 和 next route |
| 自适应学习 / adaptive learning | `control-loop` 从反馈失配中记录可复用的 threshold、strategy、route 或假设修正 |
| 分层协同控制 | `system-model` 中的 Controller Hierarchy，识别 global/local controller、coupling variable、arbitration 和 escalation |
| 鲁棒性 / disturbance handling | `system-model` 中的 Disturbance Register，记录 likelihood、impact、sensor、containment 和 route trigger |
| 复杂巨系统综合集成 | `decision-synthesis` 的 Synthesis Round，把定性判断、机器证据、量化指标、冲突和用户裁决迭代收敛 |
| 总调度器 | `alpha-goal` 根据当前系统状态选择 Skill 和下一步 |

## 六个技能

- `alpha-goal`：闭环总入口，负责 Skill 路由、稳定性检查和跨阶段状态记忆。
- `goal-contract`：把含糊请求转为可执行、可验证、可移交的 Goal Contract，并承接 Indicator Handoff。
- `system-model`：建立被控对象模型，识别状态变量、观测信号、可控变量、分层控制、扰动登记和耦合。
- `control-loop`：在已批准 Goal Contract 下执行有界迭代，采集反馈、记录自适应学习并路由。
- `evidence-verify`：独立判断证据是否支持完成、可合并、可发布或窄化声明，并审查指标和学习记录边界。
- `decision-synthesis`：处理复杂系统、多利益相关方、弱结构化需求与高不确定性决策，并通过 Synthesis Round 收敛。

## 安装

默认安装到真实 Codex home，并在 `$HOME/.codex/skills/` 下创建一个 `alpha-goal` 软链接，指向本仓库的 `skills/`：

安装脚本会通过 `npx --yes tsx` 运行 TypeScript 校验器，因此本机需要可用的 Node.js/npm。

```bash
scripts/install.sh
```

脚本会执行以下操作：

- 运行 `tools/validate_skills.ts` 校验六技能套件的结构、引用可发现性、闭环语义烟测和 fixture contract checks。
- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`，并把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`。
- 用户配置模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关；不会修改 sandbox 权限、休眠行为，也不会抑制不稳定特性警告。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接。
- 清理旧版本可能留在目标 `skills/` 下、且指向本仓库的直连技能软链接。
- 校验目标 `skills/alpha-goal` 软链接是否指向当前仓库的 `skills/` 目录，并能通过该链接访问全部六个必需 skill。

安装到其他位置：

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

替换已有同名软链接：

```bash
scripts/install.sh --force
```

只安装 skill 软链接，不同步用户级模板：

```bash
scripts/install.sh --no-sync-user-templates
```

排查安装过程：

```bash
scripts/install.sh --verbose
```

## 校验

推荐校验命令：

```bash
npx --yes tsx tools/validate_skills.ts .
```

兼容校验入口：

```bash
npx --yes tsx tools/validate_skillset.ts .
```

校验器检查目录结构、元数据、脚本权限、macOS 元数据残留、reference 可发现性、关键闭环字段的 semantic smoke tests，以及典型 prompt 对应的 schema/route fixture contract checks。它仍不能证明技能在真实任务中的触发时机、验证边界或验收判断一定正确。

建议先用临时 `CODEX_HOME` 验证安装流程：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
npx --yes tsx tools/validate_skills.ts .
rm -rf "$tmp_codex_home"
```

## 仓库结构

```text
skills/
  alpha-goal/      # 闭环总入口和路由
  goal-contract/   # 目标澄清和 Goal Contract
  system-model/    # 系统状态、可观测性和可控性建模
  control-loop/    # 有界迭代执行和反馈
  evidence-verify/ # 证据边界和完成判断
  decision-synthesis/  # 复杂系统综合研判
templates/         # 可同步到 Codex home 的用户配置模板
scripts/           # 安装脚本
tools/             # 本仓库校验工具
```

运行中如需跨阶段恢复状态，默认使用 `.alpha-goal/control-state/YYYYMMDD-<slug>.md` 记录 Closed-loop Ledger，包括完整 `Latest Control Route`、Synthesis Round、Indicator Handoff、Controller Hierarchy、Disturbance Register、Control Law、Adaptive Learning Record、error、feedback 和 next route。TUI 默认只展示短的 `Route Summary`，下游技能从 `.alpha-goal/control-state/` 读取完整路由字段。写入前检查 `.alpha-goal/` 是否已被忽略；如果仓库根 `.gitignore` 缺少 `.alpha-goal/`，先加入该条目再写 ledger。
