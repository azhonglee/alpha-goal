# 清单

## 技能

| 目录 | 用途 |
|---|---|
| `skills/alpha-goal/` | 通过苏格拉底式澄清循环形成目标契约，覆盖真实意图、预期结果、范围、非目标、边界、约束、验收信号和决策边界。 |
| `skills/system-model/` | 建模被控对象、状态、观测器、执行器、控制器层级、扰动和耦合。 |
| `skills/control-loop/` | 在已确认的 alpha-goal 目标契约下执行有界控制迭代，并记录反馈和自适应学习。 |
| `skills/evidence-verify/` | 检查验收、证据边界、指标 / 学习边界，并给出验证结论。 |

## 支持目录

| 目录 | 用途 |
|---|---|
| `tools/` | 本地校验工具和 sidecar fixture。 |
| `templates/` | 默认同步的用户级 Codex 配置模板。 |
| `scripts/` | 安装脚本。 |

## 脚本

| 路径 | 是否改变状态 | 用途 |
|---|---:|---|
| `scripts/install.sh` | 是 | 创建指向本仓库 `skills/` 的 `alpha-goal` 软链接；替换旧链接；默认合并用户配置模板；校验四技能套件和目标软链接。 |
| `skills/system-model/scripts/repo-sensor-snapshot.ts` | 否 | 输出仓库传感器快照，用于系统建模和可观测性检查。 |
| `skills/control-loop/scripts/mutation-preflight.ts` | 否 | 输出 Git 根目录、分支、状态、worktree、本地规则文件、已忽略路径和子模块。 |
| `skills/evidence-verify/scripts/evidence-summary.ts` | 否 | 输出已变更文件、diff 统计、diff 检查状态和最近提交。 |
| `tools/validate_skills.ts` | 否 | 校验四技能结构、旧阶段残留、30K 体量、TUI 模板、安装烟测和 schema sidecar 样本。 |
| `tools/validate_skillset.ts` | 否 | 兼容旧校验命令的包装入口。 |

## 运行产物

| 路径 | 用途 |
|---|---|
| `.alpha-goal/YYYYMMDD-<slug>/alpha-goal.md` | `persisted` / `audited` 时写。完整目标契约产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/system-model.md` | `persisted` / `audited` 时写。完整控制模型产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/plan.md` | 可选。持久化动态计划。 |
| `.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md` | `persisted` / `audited` 时写。完整迭代记录产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/evidence/` | 可选。持久化证据、日志、截图、轨迹或记录引用的检查输出。 |
| `.alpha-goal/YYYYMMDD-<slug>/schema/` | `persisted` / `audited` 时同步写。机器可读 schema sidecar。 |
| `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md` | `persisted` / `audited` 时写。完整验证结论产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/conformance-report.md` | 可选。控制论一致性报告。 |

默认主路径：

```text
意图 -> alpha-goal(目标契约) -> control-loop(反馈控制) -> evidence-verify(误差检测) -> 最终交付
                 \-> system-model?(边界或反馈不清时，回到 alpha-goal)
```
