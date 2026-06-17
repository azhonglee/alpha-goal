# Alpha Goal

面向工程任务的最小闭环 Codex 技能集。

## 公开技能

| Skill | 职责 |
| --- | --- |
| `alpha-goal` | 默认入口：澄清真实意图、结果、约束、边界和权限，形成设计交接，并路由已确认的启动请求。 |
| `control-loop` | 有界执行/探针：变更安全门、反馈采样、残余误差路由。 |
| `evidence-verify` | 独立比较器：检查 final/ready/safe/complete/repair 声明与证据边界。 |

## 流程

```text
INTENT -> alpha-goal(clarify/discover/stress/design/confirm) -> control-loop(action+feedback) -> evidence-verify(claim check) -> FINAL or NEXT LOOP
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
- 行动前先明确意图、结果、边界和权限。
- 执行前先形成设计交接。
- 用户拥有的决策会阻断执行；每轮只问一个高杠杆问题。
- 有界行动优先于宽泛重构。
- 最终声明受证据边界约束。
- 执行与验证保持隔离。
