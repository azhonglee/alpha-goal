# Repository Guidelines

## Project Structure & Module Organization

本仓库维护 `goal-loop` Codex 技能。核心入口是 `skills/goal-loop/SKILL.md`；阶段规则、模板和执行约束位于 `skills/goal-loop/references/`，Agent 配置在 `skills/goal-loop/agents/openai.yaml`。安装与本地同步逻辑集中在 `scripts/install.sh`。`templates/AGENTS.md` 和 `templates/config.toml` 是写入 `${CODEX_HOME:-$HOME/.codex}` 的用户配置模板。`README.md` 应与这些路径和命令保持一致。

## Build, Test, and Development Commands

- `bash -n scripts/install.sh`：对安装脚本做 Bash 语法检查。
- `python3 -c 'import pathlib,tomllib; tomllib.loads(pathlib.Path("templates/config.toml").read_text())'`：验证 TOML 模板可解析。

## Coding Style & Naming Conventions

创建或修改技能时，参考 OpenAI Codex 的 Create a New Skill 指南，并优先使用 `Skill Creator`。

Shell 脚本使用 Bash，保持 `set -euo pipefail`，函数名采用 `snake_case`，变量使用小写加下划线。Markdown 文档保持简洁、可执行，路径和命令使用反引号。技能目录使用短横线命名，例如 `skills/goal-loop/`；新增技能必须包含 `SKILL.md`。

## Testing Guidelines

当前没有独立测试框架。修改脚本时至少运行 `bash -n scripts/install.sh` 和相关 `scripts/install.sh` 命令。修改模板时验证目标格式：TOML 用 `tomllib`，Markdown 需人工检查标题层级、路径和安装说明是否仍准确。涉及安装行为时，优先使用临时 `CODEX_HOME` 进行验证，避免污染真实配置。

## Commit & Pull Request Guidelines

现有历史使用简短祈使式提交，例如 `Initial commit`。后续提交也应保持单一主题，如 `Add install verification`。PR/MR 需说明变更范围、受影响路径、验证命令及结果；涉及模板或安装行为时，说明对既有用户配置的影响。截图通常不需要，除非新增可视化文档或 UI 资产。

## Agent-Specific Instructions

不要直接在 `main` 或 `master` 上修改；为每批任务使用独立 worktree。完成后提交变更，并在最终说明中列出验证证据和剩余风险。
