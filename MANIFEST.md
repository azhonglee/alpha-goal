# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | 闭环总入口、稳定性检查和 Skill 路由。 |
| `skills/goal-contract/` | Discovery、ambiguity scoring、指标交接、目标契约 和目标参考输入形成。 |
| `skills/system-model/` | plant/state/observer/actuator/控制器层级/扰动登记/coupling 建模。 |
| `skills/control-loop/` | 在 目标契约 下执行 bounded controller-actuator iterations，并记录 自适应学习记录。 |
| `skills/evidence-verify/` | 验收 acceptance、检查证据边界、Indicator/learning 边界并给出 验证结论/Judgment。 |
| `skills/decision-synthesis/` | 面向复杂巨系统、多主体和弱结构化问题的 综合轮次 与 指标交接 综合研判。 |

## Supporting Directories

| Directory | Purpose |
|---|---|
| `tools/` | 本地校验工具。 |
| `tools/fixtures/schema-sidecars/` | 提交内 schema sidecar 回归样本，用于校验任务级 artifact path、路由状态、状态转换和阶段必填字段。 |
| `tools/fixtures/runtime-sidecars/` | 提交内 runtime sidecar 正负例，用于校验跨阶段 trace 连续性、授权门槛、final 前验证和 reference_id 一致性。 |
| `templates/` | 默认同步的用户级 Codex 配置模板；不包含 sandbox 权限、休眠行为或不稳定特性警告抑制项。 |
| `scripts/` | 安装脚本。 |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Creates one `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` symlink to the repository `skills/` tree, replaces same-repo legacy skill links, merges user config templates by default unless `--no-sync-user-templates` is passed, cleans legacy support links, validates the six-skill suite, and validates the target symlink. |
| `skills/system-model/scripts/repo-sensor-snapshot.ts` | No | Prints a repository sensor snapshot for system modeling and observability checks. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints git root, branch, status, worktrees, local rule files, ignored worktree/evidence paths, and submodules. |
| `skills/evidence-verify/scripts/evidence-summary.ts` | No | Prints changed files, diff stat, diff check status, and recent commits. |
| `tools/validate_skills.ts` | No | Canonical lightweight validator for the closed-loop six-skill suite, including reference discoverability, task-scoped artifact layout checks, install-surface checks with temporary `CODEX_HOME` smoke install, schema sidecar fixture/runtime checks, route consistency checks, semantic smoke checks, legacy path guards, and fixture contract checks. |
| `tools/validate_skillset.ts` | No | Compatibility wrapper for older validation commands; delegates to `tools/validate_skills.ts`. |

## Runtime Artifacts

| Path | Purpose |
|---|---|
| `.alpha-goal/YYYYMMDD-<slug>/control-state.md` | Optional 闭环台账 for cross-stage control state and artifact registry: full 最新控制路由, reference, current state, artifact paths, feedback, residual error, and next route. |
| `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md` | Optional full 目标契约 artifact. |
| `.alpha-goal/YYYYMMDD-<slug>/system-model.md` | Optional full 控制模型 artifact. |
| `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md` | Optional full 决策综合记录 artifact. |
| `.alpha-goal/YYYYMMDD-<slug>/plan.md` | Optional durable dynamic plan. |
| `.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md` | Optional full 迭代记录 artifact. |
| `.alpha-goal/YYYYMMDD-<slug>/iterations/cycles.jsonl` | Optional append-only cycle log for machine-readable loop history. |
| `.alpha-goal/YYYYMMDD-<slug>/evidence/` | Optional durable evidence, logs, screenshots, traces, or check outputs referenced by records. |
| `.alpha-goal/YYYYMMDD-<slug>/schema/` | Optional machine-readable schema sidecars for durable artifacts. |
| `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md` | Optional full 验证结论 artifact. |
| `.alpha-goal/YYYYMMDD-<slug>/conformance-report.md` | Optional 控制论一致性报告 for state-transition, evidence-boundary, and legacy-path checks. |
| `.alpha-goal/YYYYMMDD-<slug>/interviews.md` | Optional discovery/interview notes when needed for a 目标契约. |

默认主路径是：

```text
INTENT -> alpha-goal(route/stability) -> decision-synthesis? -> system-model? -> goal-contract(reference input) -> control-loop(feedback control) -> evidence-verify(error detection) -> FINAL
```
