# Repository Guidelines

## Project Structure & Module Organization

本仓库维护 `alpha-goal` Codex 技能包。技能源码统一位于 `skills/`：目标契约入口是 `skills/alpha-goal/SKILL.md`；条件建模技能位于 `skills/system-model/`；执行与验证阶段技能位于 `skills/control-loop/`、`skills/evidence-verify/`。核心规则直接放在各技能 `SKILL.md`；脚本放在本技能 `scripts/` 下。`templates/` 是可选用户配置模板，`scripts/install.sh` 负责软链接安装，`tools/validate_skillset.ts` 用于本地布局校验。`README.md`、`INSTALL.md`、`MANIFEST.md` 应与这些路径和命令保持一致。

## Build, Test, and Development Commands

- `npx --yes tsx tools/validate_skillset.ts .`：验证必需技能目录和 front matter。
- `bash -n scripts/install.sh`：检查安装脚本语法。
- `npx --yes tsx skills/control-loop/scripts/mutation-preflight.ts`：检查迭代阶段脚本可运行。
- `npx --yes tsx skills/evidence-verify/scripts/evidence-summary.ts`：检查验证阶段脚本可运行。
- `python3 -c 'import pathlib,tomllib; tomllib.loads(pathlib.Path("templates/config.toml").read_text())'`：验证配置模板可解析。
- 使用临时 `CODEX_HOME` 执行 `scripts/install.sh`，并从源码仓库运行 `tools/validate_skillset.ts`，验证安装说明可执行。

## Coding Style & Naming Conventions

创建或修改技能时，参考 OpenAI Codex 的 Create a Skill 指南，并优先使用 `skill-creator`。技能目录使用短横线命名，必须包含 `SKILL.md`。`SKILL.md` 保持短小但自洽，避免为了形式拆出短引用文件；技能辅助脚本和 `tools/` 校验工具使用 TypeScript。`scripts/install.sh` 是保留的 Bash 安装入口，保持 `set -euo pipefail`。Markdown 文档保持简洁、可执行，路径和命令使用反引号。

设计skill时，需要考虑以下几点：

- 确保合理、正确且优雅
- 关注效果，避免形式主义
- 保持简洁可靠，避免过渡设计
- 抽象出通用的决策规则，避免case-by-case处理

## Testing Guidelines

当前没有独立测试框架。修改技能布局、front matter、安装文档、模板或阶段输出契约后，至少运行 `npx --yes tsx tools/validate_skillset.ts .`。修改 TypeScript 脚本时运行对应 `npx --yes tsx <script.ts>`。修改安装脚本时运行 `bash -n scripts/install.sh`。修改 `templates/config.toml` 时验证 TOML 可解析。修改安装说明时必须用临时 `CODEX_HOME` 验证 `scripts/install.sh`，不要污染真实用户配置。默认运行态记录写入 `.alpha-goal/`；若仓库根 `.gitignore` 缺少 `.alpha-goal/`，先添加该条目。

## Commit & Pull Request Guidelines

提交保持单一主题，使用简短祈使式信息。PR/MR 需说明变更范围、受影响路径、验证命令及结果；涉及安装行为时，说明对既有用户配置的影响。
开发完成及时创建PR

## Agent-Specific Instructions

不要直接在 `main` 或 `master` 上修改；为每批任务使用独立 worktree。完成后提交变更，并在最终说明中列出验证证据和剩余风险。
