# Alpha Goal

语言： [English](README.md) | 简体中文

Alpha Goal 是面向 Goal Engineering 的最小闭环技能集。它让 agent 工作始终围绕明确目标、有界行动和有证据支撑的最终声明展开。

## 适用场景

- 请求含糊，需要先挖掘事实再澄清。
- 实现任务需要一轮有边界、可观察的行动闭环。
- final/ready/safe/complete/repair 等声明需要独立证据检查。

## 公开技能

| Skill | 职责 |
| --- | --- |
| `alpha-goal` | 默认入口：模糊请求先挖掘事实，再澄清目标边界、形成交付设计、路由下一控制器、维护 ledger。 |
| `control-loop` | 有界执行/探针：变更安全门、反馈采样、残余误差路由。 |
| `evidence-verify` | 独立比较器：检查 final/ready/safe/complete/repair 声明与证据边界。 |

目标契约、系统建模、综合研判已折叠进 `skills/alpha-goal/SKILL.md`，不再作为公开技能安装。

## 流程

```text
INTENT -> alpha-goal(discover/clarify/design/route) -> control-loop(action+feedback) -> evidence-verify(claim check) -> FINAL or NEXT LOOP
```

## 快速开始

```bash
scripts/install.sh
npx --yes tsx tools/validate_skills.ts .
```

安装脚本会在 `$HOME/.codex/skills/` 下为三个公开技能创建直接软链接，并清理指向本仓库旧公开技能的软链接。
校验脚本会强制整个 `skills/` 树不超过 30,000 bytes。

运行态记录使用 Alpha Goal state root：优先读取 `ALPHA_GOAL_STATE_ROOT`，否则默认 `${CODEX_HOME:-$HOME/.codex}/state/alpha-goal/<workspace-slug>/`。repo 内 `.alpha-goal/` 只作为兼容旧产物或显式项目策略覆盖。

## 使用示例

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$control-loop 根据已确认边界执行一轮最小安全变更。
$evidence-verify 检查当前证据是否支持最终声明。
```

## 文档

- [INSTALL.md](INSTALL.md)：安装选项和 smoke test。
- [MANIFEST.md](MANIFEST.md)：公开技能、脚本和运行时产物清单。
- [skills/alpha-goal/SKILL.md](skills/alpha-goal/SKILL.md)：默认入口和路由规则。
- [skills/control-loop/SKILL.md](skills/control-loop/SKILL.md)：有界行动闭环契约。
- [skills/evidence-verify/SKILL.md](skills/evidence-verify/SKILL.md)：证据比较契约。

## 结构

```text
skills/alpha-goal/
skills/control-loop/
skills/evidence-verify/
templates/
scripts/
tools/
```

## 原则

- 澄清问题前先做事实挖掘。
- 当前代码事实只描述现状；没有授权来源时不能定义期望行为。
- 目标先于行动。
- 只建模影响安全控制的内容。
- 用户拥有的决策会阻断执行；每轮只问一个高杠杆问题。
- 有界行动优先于宽泛重构。
- 最终声明受证据边界约束。
- 执行与验证保持隔离。
