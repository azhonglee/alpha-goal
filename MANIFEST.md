# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | 闭环总入口、稳定性检查和 Skill 路由。 |
| `skills/goal-contract/` | Discovery、ambiguity scoring、Indicator Handoff、Goal Contract 和目标参考输入形成。 |
| `skills/system-model/` | plant/state/observer/actuator/Controller Hierarchy/Disturbance Register/coupling 建模。 |
| `skills/control-loop/` | 在 Goal Contract 下执行 bounded controller-actuator iterations，并记录 Adaptive Learning Record。 |
| `skills/evidence-verify/` | 验收 acceptance、检查证据边界、Indicator/learning 边界并给出 Verification Verdict/Judgment。 |
| `skills/decision-synthesis/` | 面向复杂巨系统、多主体和弱结构化问题的 Synthesis Round 与 Indicator Handoff 综合研判。 |

## Supporting Directories

| Directory | Purpose |
|---|---|
| `tools/` | 本地校验工具。 |
| `templates/` | 默认同步的用户级 Codex 配置模板；不包含 sandbox 权限、休眠行为或不稳定特性警告抑制项。 |
| `scripts/` | 安装脚本。 |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Creates one `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` symlink to the repository `skills/` tree, replaces same-repo legacy skill links, merges user config templates by default unless `--no-sync-user-templates` is passed, cleans legacy support links, validates the six-skill suite, and validates the target symlink. |
| `skills/system-model/scripts/repo-sensor-snapshot.ts` | No | Prints a repository sensor snapshot for system modeling and observability checks. |
| `skills/control-loop/scripts/mutation-preflight.ts` | No | Prints git root, branch, status, worktrees, local rule files, ignored worktree/evidence paths, and submodules. |
| `skills/evidence-verify/scripts/evidence-summary.ts` | No | Prints changed files, diff stat, diff check status, and recent commits. |
| `tools/validate_skills.ts` | No | Canonical lightweight validator for the closed-loop six-skill suite, including reference discoverability, semantic smoke checks, and fixture contract checks. |
| `tools/validate_skillset.ts` | No | Compatibility wrapper for older validation commands; delegates to `tools/validate_skills.ts`. |

## Runtime Artifacts

| Path | Purpose |
|---|---|
| `.alpha-goal/control-state/YYYYMMDD-<slug>.md` | Optional Closed-loop Ledger for cross-stage control state: full Latest Control Route, reference, current state, Synthesis Round, Indicator Handoff, Controller Hierarchy, Disturbance Register, Control Law, Adaptive Learning Record, feedback, residual error, and next route. |
| `.alpha-goal/iterations/YYYYMMDD-<slug>.jsonl` | Optional append-only cycle log for machine-readable loop history. |

默认主路径是：

```text
INTENT -> alpha-goal(route/stability) -> decision-synthesis? -> system-model? -> goal-contract(reference input) -> control-loop(feedback control) -> evidence-verify(error detection) -> FINAL
```
