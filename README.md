# Alpha Goal

语言：简体中文 | [English](README.en.md)

Agent 工作出问题，通常不是因为不会改文件，而是因为在目标、边界和证据还不清楚时就开始行动。

Alpha Goal 不是更重的流程，而是防止过早行动和无证据完成声明的护栏。它帮助 agent 先发现事实再提问，在明确边界内行动，并且只在证据支持的范围内做最终声明。

## 适用场景

- 请求含糊，需要先挖掘事实再澄清。
- 目标、范围、非目标或验收证据还不明确，直接执行会变成猜测。
- 诊断/修复任务需要先确认根因，避免把假设当成修复结论。
- 任务跨多个文件、仓库或职责面，需要明确授权边界、执行顺序和验证边界。
- 准备声明 final/ready/safe/complete/repair 时，需要检查证据是否覆盖声明范围。

## 工作方式

```text
描述需求 -> 发现事实 -> 澄清边界 -> 有界行动 -> 验证声明 -> 最终答复或下一轮闭环
```

## 快速开始

```bash
scripts/install.sh
npx --no-install tsx tools/validate_skills.ts .
```

安装脚本会在 `$HOME/.codex/skills/` 下为三个公开技能创建直接软链接，并清理指向本仓库旧公开技能的软链接。
校验脚本会强制整个 `skills/` 树不超过 30,000 bytes。

运行态记录使用用户级 Alpha Goal state root：`${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`，其中 `<workspace-slug>` 是当前会话目录路径最后一个目录名。

## 使用示例

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
```

通常不需要显式写出 skill 名称。正常描述你的需求即可；当请求需要目标成帧、有界执行或有证据支撑的完成声明时，Alpha Goal 会隐式触发。

## 公开技能

| Skill | 作用 |
| --- | --- |
| `alpha-goal` | 在开始工作前澄清意图、边界、验收证据和下一步安全路由。 |
| `control-loop` | 执行一轮已授权、可观察的行动，并把结果与目标比较。 |
| `evidence-verify` | 检查新鲜证据是否支持 final/ready/safe/complete/repair 声明。 |

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

## 设计原则

Alpha Goal 让 agent 工作保持目标明确、行动有界、声明受证据约束。

- 先发现，再澄清：提问前先检查本地事实、文档、状态和既有契约，让用户注意力只用于他们真正拥有的选择。
- 证据先于授权：当前代码事实只描述现状；期望行为来自用户意图、规格、issue 或已接受契约。
- 目标先于行动：outcome、scope、non-goals、acceptance evidence、决策 owner 和 claim boundary 共同限定什么可以被改变。
- 只做有用建模：只有依赖、扰动和风险会影响安全控制、验证或路由时，才把它们纳入模型。
- 每次一个决策：需要人判断时，只问一个高杠杆问题，并让答案塑造边界。
- 有界执行：优先选择小而可观察的探针或定向变更，而不是宽泛重构和猜测式清理。
- 独立验证：final/ready/safe/complete/repair 声明需要新鲜证据，并且要与执行过程分离检查。
- 诚实路由：目标不清回到 `alpha-goal`，可修复的实现或证据缺口回到 `control-loop`，证据不足的最终声明继续进入 `evidence-verify`。
