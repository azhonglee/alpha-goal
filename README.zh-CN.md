# Alpha Goal

语言： [English](README.md) | 简体中文

Alpha Goal 是面向 Goal Engineering 的最小闭环技能集。它让 agent 工作始终围绕明确目标、有界行动和有证据支撑的最终声明展开。

## 适用场景

- 请求含糊，需要先挖掘事实再澄清。

## 公开技能

| Skill | 职责 |
| --- | --- |
| `alpha-goal` | 默认入口：模糊请求先挖掘事实，再澄清目标边界、形成交付设计、路由下一控制器、维护 ledger。 |
| `control-loop` | 有界执行/探针：变更安全门、反馈采样、残余误差路由。 |
| `evidence-verify` | 独立比较器：检查 final/ready/safe/complete/repair 声明与证据边界。 |

## 流程

```text
INTENT -> alpha-goal(discover/clarify/design/route) -> control-loop(action+feedback) -> evidence-verify(claim check) -> FINAL or NEXT LOOP
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

也可以隐式触发：直接向 Agent 描述需求即可。

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
