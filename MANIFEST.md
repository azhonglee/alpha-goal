# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `skills/control-kernel/` | 闭环调度、稳定性检查和 Skill 路由。 |
| `skills/alpha-goal/` | Discovery、ambiguity scoring、Goal Contract 和目标参考输入形成。 |
| `skills/system-model/` | plant/state/observer/actuator/Disturbance Register/coupling 建模。 |
| `skills/loop/` | 在 Goal Contract 下执行 bounded controller-actuator iterations。 |
| `skills/verify/` | 验收 acceptance、检查证据边界并给出 Verification Verdict/Judgment。 |
| `skills/meta-synthesis/` | 面向复杂巨系统、多主体和弱结构化问题的 Synthesis Round 综合研判。 |

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
| `skills/system-model/scripts/repo-sensor-snapshot.sh` | No | Prints a repository sensor snapshot for system modeling and observability checks. |
| `skills/loop/scripts/mutation-preflight.sh` | No | Prints git root, branch, status, worktrees, local rule files, ignored worktree/evidence paths, and submodules. |
| `skills/verify/scripts/evidence-summary.sh` | No | Prints changed files, diff stat, diff check status, and recent commits. |
| `tools/validate_skills.py` | No | Canonical lightweight validator for the closed-loop six-skill suite, including reference discoverability and semantic smoke checks. |
| `tools/validate_skillset.py` | No | Compatibility wrapper for older validation commands; delegates to `tools/validate_skills.py`. |

## Runtime Artifacts

| Path | Purpose |
|---|---|
| `.alpha-goal/control-state/YYYYMMDD-<slug>.md` | Optional Closed-loop Ledger for cross-stage control state: reference, current state, Synthesis Round, Disturbance Register, Control Law, feedback, residual error, and next route. |
| `.alpha-goal/iterations/YYYYMMDD-<slug>.jsonl` | Optional append-only cycle log for machine-readable loop history. |

默认主路径是：

```text
INTENT -> CONTROL-KERNEL(route/stability) -> ALPHA-GOAL(reference input) -> SYSTEM-MODEL(if needed) -> LOOP(feedback control) -> VERIFY(error detection) -> FINAL
```
