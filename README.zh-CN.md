# Alpha Goal

面向工程任务的最小闭环 Codex 技能集。

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

## 安装

```bash
scripts/install.sh
```

安装脚本会在 `$HOME/.codex/skills/` 下为三个公开技能创建直接软链接，并清理指向本仓库旧公开技能的软链接。

## 校验

```bash
npx --yes tsx tools/validate_skills.ts .
```

强制控制字节口径为整个 `skills/` 树，上限 30,000 bytes。

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
