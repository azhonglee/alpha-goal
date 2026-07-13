# Repository Guidelines

## Project Structure & Module Organization

本仓库维护 `alpha-goal` Codex 技能包。公开技能位于 `skills/alpha-goal/`、`skills/executor/`、`skills/verifier/`；目标成帧、系统建模和综合研判已折叠进 `alpha-goal` 主技能。`tools/validation/alpha-goal.json` 是 validator 共享契约，`templates/` 是可选用户配置模板，`scripts/install.sh` 负责软链接安装，`tools/validate_skills.js` 用于本地布局校验。`README.md`、`INSTALL.md`、`MANIFEST.md` 应与这些路径和命令保持一致。

## Build, Test, and Development Commands

- `node tools/validate_skills.js .`：验证共享契约、公开技能结构、front matter、引用可发现性、标题结构、工具/模板/文档文件存在性和 15K skills word+punctuation 预算；需要 Node.js 18+。
- `node tools/validate_skills.js --fixtures`：验证 validator fixtures，确保自然语言改写可通过、结构缺失会失败。
- `node tools/verify_strategy_scenarios.js`：验证 revision、stale evidence、post-PASS mutation、恢复歧义、并发写入和 stagnation route；不解析 skill 文本。
- 不许添加任何 skill 文本的校验规则。
- `bash -n scripts/install.sh`：检查安装脚本语法。
- 使用临时 `CODEX_HOME` 执行 `scripts/install.sh`，并从源码仓库运行 `node tools/validate_skills.js .`，验证安装说明可执行。

## Coding Style & Naming Conventions

创建或修改技能时，参考 OpenAI Codex 的 Create a Skill 指南，并优先使用 `skill-creator`。技能目录使用短横线命名，必须包含 `SKILL.md`。`SKILL.md` 保持短小，把详细规则放进同级 `references/`；技能辅助脚本和 `tools/` 校验工具使用无依赖 JavaScript。`scripts/install.sh` 是保留的 Bash 安装入口，保持 `set -euo pipefail`。Markdown 文档保持简洁、可执行，路径和命令使用反引号。

设计skill时，需要考虑以下几点：

- 确保合理、正确且优雅
- 关注效果，避免形式主义
- 保持简洁可靠，避免过渡设计
- 抽象出通用的决策规则，避免case-by-case处理
- Skill 里应该优先用结构化列表，而不是 README 式长句
- 关键不是英语自然度，而是指令执行面更清晰：每个 bullet 都变成独立职责、独立检查点、独立可引用概念

## Testing Guidelines

当前没有独立测试框架。修改技能布局、front matter、安装文档、模板或阶段输出契约后，至少运行 `node tools/validate_skills.js .`、`node tools/validate_skills.js --fixtures` 和 `node tools/verify_strategy_scenarios.js`。修改 JavaScript 校验脚本时运行对应命令。修改安装脚本时运行 `bash -n scripts/install.sh`。修改 `templates/config.toml` 时用临时 `HOME` 和临时 `CODEX_HOME` 安装 smoke 验证 vendored TOML merge。修改安装说明时必须用临时 `HOME` 和临时 `CODEX_HOME` 验证 `scripts/install.sh`，不要污染真实用户配置。默认运行态记录只写入用户级 Alpha Goal state root：`$HOME/.alpha-goal/<workspace-slug>/`，其中 `<workspace-slug>` 来自稳定 workspace identity：`slug(repo_root or Goal Contract target workspace)`；默认入口是当前任务的显式 `goal-contract.md` 路径；路径不可用时，只接受唯一且匹配 workspace identity、accepted active status 和 artifact revisions 的任务目录，零个、多个、已拒绝、已完成、陈旧或不匹配候选都停止；executor checklist、slice 证据、binding、sequence 和 verifier route 统一写入同任务目录下的 `checkpoint.md`。

## Commit & Pull Request Guidelines

提交保持单一主题，使用简短祈使式信息。PR/MR 需说明变更范围、受影响路径、验证命令及结果；涉及安装行为时，说明对既有用户配置的影响。
开发完成及时创建PR

## Agent-Specific Instructions

不要直接在 `main` 或 `master` 上修改；为每批任务使用独立 worktree。完成后提交变更，并在最终说明中列出验证证据和剩余风险。

## Readme Guidelines
不随便修改 README，除非SKILL中的改动与README描述不一致。
README保持简洁，避免包含详细说明。
