# Repository Guidelines

## Project Structure & Module Organization

本仓库维护 `goal-loop` Codex 技能包。核心入口是 `goal-loop/SKILL.md`；阶段技能位于 `goal-frame/`、`goal-iterate/`、`goal-review/`、`goal-verify/`。各阶段的详细规则放在本阶段 `references/` 下，脚本放在本阶段 `scripts/` 下。`adapters/` 是可选环境参考，`templates/` 是可选用户配置模板，`scripts/install.sh` 负责软链接安装，`tools/validate_skillset.py` 用于本地布局校验。`README.md`、`INSTALL.md`、`MANIFEST.md` 应与这些路径和命令保持一致。

## Build, Test, and Development Commands

- `python3 tools/validate_skillset.py .`：验证必需技能目录和 front matter。
- `bash -n scripts/install.sh`：检查安装脚本语法。
- `bash -n goal-iterate/scripts/mutation-preflight.sh`：检查迭代阶段脚本语法。
- `bash -n goal-verify/scripts/evidence-summary.sh`：检查验证阶段脚本语法。
- `python3 -c 'import pathlib,tomllib; tomllib.loads(pathlib.Path("templates/config.toml").read_text())'`：验证配置模板可解析。
- 使用临时 `CODEX_HOME` 执行 `scripts/install.sh`，并运行临时目录内的 `tools/validate_skillset.py`，验证安装说明可执行。

## Coding Style & Naming Conventions

创建或修改技能时，参考 OpenAI Codex 的 Create a Skill 指南，并优先使用 `skill-creator`。技能目录使用短横线命名，必须包含 `SKILL.md`。`SKILL.md` 保持短小，把详细规则放进同级 `references/`；脚本放进同级 `scripts/`。Markdown 文档保持简洁、可执行，路径和命令使用反引号。Shell 脚本使用 Bash，保持 `set -euo pipefail`，函数名采用 `snake_case`。

## Testing Guidelines

当前没有独立测试框架。修改技能布局、front matter、安装文档、模板或阶段输出契约后，至少运行 `python3 tools/validate_skillset.py .`。修改 shell 脚本时运行对应 `bash -n`。修改 `templates/config.toml` 时验证 TOML 可解析。修改安装说明时必须用临时 `CODEX_HOME` 验证 `scripts/install.sh`，不要污染真实用户配置。

## Commit & Pull Request Guidelines

提交保持单一主题，使用简短祈使式信息。PR/MR 需说明变更范围、受影响路径、验证命令及结果；涉及安装行为时，说明对既有用户配置的影响。

## Agent-Specific Instructions

不要直接在 `main` 或 `master` 上修改；为每批任务使用独立 worktree。完成后提交变更，并在最终说明中列出验证证据和剩余风险。
