# 清单

## 技能

| 目录 | 用途 |
|---|---|
| `skills/alpha-goal/` | 闭环总入口、稳定性检查和技能路由。 |
| `skills/goal-contract/` | 目标发现、模糊度评估、指标转译、目标契约和目标参考输入形成。 |
| `skills/system-model/` | 被控对象、状态、观测器、执行器、控制器层级、扰动记录和耦合建模。 |
| `skills/control-loop/` | 在 目标契约 下执行有界控制迭代，并记录 自适应学习记录。 |
| `skills/evidence-verify/` | 检查验收、证据边界、指标 / 学习边界，并给出 验证结论。 |
| `skills/decision-synthesis/` | 面向复杂巨系统、多主体和弱结构化问题的 综合轮次 与 指标转译 综合研判。 |

## 支持目录

| 目录 | 用途 |
|---|---|
| `tools/` | 本地校验工具。 |
| `tools/fixtures/schema-sidecars/` | 提交内结构化索引回归样本，用于校验任务级产物路径、路由状态、状态转换和阶段必填字段。 |
| `tools/fixtures/runtime-sidecars/` | 提交内运行期结构化索引正负例，用于校验跨阶段轨迹连续性、授权门槛、最终前验证和 `reference_id` 一致性。 |
| `templates/` | 默认同步的用户级 Codex 配置模板；不包含 sandbox 权限、休眠行为或不稳定特性警告抑制项。 |
| `scripts/` | 安装脚本。 |

## 脚本

| 路径 | 是否改状态 | 用途 |
|---|---:|---|
| `scripts/install.sh` | 是 | 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接到本仓库 `skills/` 树，替换同仓库旧技能链接，默认合并用户配置模板，清理旧支持链接，校验六技能套件和目标软链接。 |
| `skills/system-model/scripts/repo-sensor-snapshot.ts` | 否 | 输出仓库传感器快照，用于系统建模和可观测性检查。 |
| `skills/control-loop/scripts/mutation-preflight.ts` | 否 | 输出 git 根目录、分支、状态、worktree、本地规则文件、已忽略的 worktree / evidence 路径和子模块。 |
| `skills/evidence-verify/scripts/evidence-summary.ts` | 否 | 输出已变更文件、diff 统计、diff check 状态和最近提交。 |
| `tools/validate_skills.ts` | 否 | 六技能闭环套件的规范轻量校验器，覆盖引用可发现性、任务级产物布局、临时 `CODEX_HOME` 安装烟测、结构化索引样本 / 运行期样本、路由一致性、语义烟测、旧路径防护和样本契约检查。 |
| `tools/validate_skillset.ts` | 否 | 兼容旧校验命令的包装入口，委托给 `tools/validate_skills.ts`。 |

## 运行产物

| 路径 | 用途 |
|---|---|
| `.alpha-goal/YYYYMMDD-<slug>/control-state.md` | 可选 闭环台账，记录跨阶段控制状态和产物登记：完整 最新控制路由、参考输入、当前状态、产物路径、反馈、残余误差和下一路由。 |
| `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md` | 可选完整 目标契约 产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/system-model.md` | 可选完整 控制模型 产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md` | 可选完整 决策综合记录 产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/plan.md` | 可选持久化动态计划。 |
| `.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md` | 可选完整 迭代记录 产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/iterations/cycles.jsonl` | 可选追加式循环日志，用于机器可读的循环历史。 |
| `.alpha-goal/YYYYMMDD-<slug>/evidence/` | 可选持久化证据、日志、截图、轨迹或记录引用的检查输出。 |
| `.alpha-goal/YYYYMMDD-<slug>/schema/` | 可选机器可读结构化索引。 |
| `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md` | 可选完整 验证结论 产物。 |
| `.alpha-goal/YYYYMMDD-<slug>/conformance-report.md` | 可选 控制论一致性报告，用于状态转移、证据边界和旧路径检查。 |
| `.alpha-goal/YYYYMMDD-<slug>/interviews.md` | 可选发现 / 访谈记录，用于形成 目标契约。 |

默认主路径是：

```text
意图 -> alpha-goal(路由 / 稳定性) -> decision-synthesis? -> system-model? -> goal-contract(参考输入) -> control-loop(反馈控制) -> evidence-verify(误差检测) -> 最终交付
```
