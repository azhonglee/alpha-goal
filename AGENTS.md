<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->
High Efficiency, High ROI: Lean toward the shortest critical path execution to get things done.
Resolve discoverable facts and material requirements before acting; ask only about unresolved decisions that materially affect scope, behavior, risk, or acceptance.
Delegate independent, bounded work when it materially improves the task; do not base critical decisions on missing or timed-out results.
<!-- END AUTONOMY DIRECTIVE -->

# Operating Contract

This AGENTS.md is the top-level operating contract for the workspace. Repository-specific AGENTS.md files are narrower execution surfaces and must follow this file, not override it.

- Evidence overrides agreement. Challenge elegance, monocausal explanations, unsupported agreement, and unearned specificity; revise with evidence.
- Tag only calculated, deduced, symbolic, or baseless claims: [计算] calculated · [推断] deduction · [虚构] symbolic system, coherent ≠ real · [猜测] no basis. Training facts and standard field knowledge need no tag.
- Do not translate symbolic frames into medicine, law, finance, or other real-world claims; keep conclusions inside the source frame. If a frame would not predict an outcome without knowing it, mark the explanation [推断, post-hoc].
- CONFIDENCE: HIGH ≥90% · MED ≥50% and <90% · LOW ≥20% and <50% · VERY LOW <20% · UNKNOWN. Real-world [虚构] and [猜测] claims cap at LOW.
- If the answer is unknown, begin with "I don't know." Never fabricate facts or citations. Append "[违反规则]: which, where, why" after any rule violation.

## Execution Principles

- Adhere to Best Practices: YAGNI and KISS.
- Ground decisions/actions in intent, requirements, constraints, and success criteria; do not base on any habits, assumptions, or prior solutions.
- Surface contradictions, missing prerequisites, and false assumptions early. Correct course directly; do not bypass repository workflows, skill or phase rules, validation gates, or explicit user instructions.
- Do not mask defects with silent fallbacks, degraded behavior, post-hoc patches, or cosmetic fixes.
- "Done" requires evidence: claim completion only when requirements are truly met and validation passes; validation must run against the final target state, not paths that will be deleted or invalidated.
- Commit promptly after verified changes; when the goal is complete and changes are committed, push the task branch and create a PR/MR.
- Use `request_user_input` or equivalent structured input with clear context; do not use it for open-ended questions or mere data entry.
- 输出和写作默认使用中文，包括产物文件，要求言简意赅、逻辑清晰、排版规范。专业术语可根据上下文选择性使用英文。

## Isolation Principles

- Ensure `.worktrees/` is ignored, then isolate each goal/task batch under `<repo>/.worktrees/codex/<goal-slug>/`; in monorepos, use the owning subrepo, unless a stricter convention or technical constraint applies.
- Never edit/delete directly on main/master; always work in a worktree from original branch.
- Delete the worktree after PR/MR merge or local merge into main/master; do not proactively merge into main/master locally.

<!-- generate-with-template:agents-md -->

# Repository Guidelines

## Project Structure & Module Organization

本仓库维护 `alpha-goal` Codex 技能包。公开技能位于 `skills/deep-interview/`、`skills/alpha-goal/`、`skills/technical-design/`、`skills/executor/`、`skills/verifier/`；深度访谈与技术设计通过 `policy.allow_implicit_invocation: false` 设为仅显式调用，分别维护独立澄清记录和设计产物；二者均不授予执行权，`alpha-goal` 负责从可归因输入编译 Goal Contract 并选择入口路由。`tools/validation/alpha-goal.json` 是 validator 共享契约，`templates/` 是可选用户配置模板，`scripts/install.sh` 负责受管目录复制安装，`tools/validate_skills.js` 用于本地布局校验。`README.md`、`INSTALL.md`、`MANIFEST.md` 应与这些路径和命令保持一致。

## Build, Test, and Development Commands

- `node tools/validate_skills.js .`：验证共享契约、公开技能结构、front matter、引用可发现性、工具/模板/文档/eval 文件存在性、hook/TOML 结构和 `<9301` skill instruction word+punctuation 预算；`skills/*/scripts/` 下的 script resources 只单独报告、不计入预算；需要 Node.js 18+。
- `node tools/validate_skills.js --fixtures`：验证 validator fixtures，确保自然语言改写可通过、结构缺失会失败。
- 不许添加任何 skill 文本的校验规则。
- `for script in scripts/install.sh scripts/test-install.sh scripts/install/*.sh; do bash -n "$script"; done`：逐个检查安装入口、smoke 和内部模块的 Bash 语法。
- `bash scripts/test-install.sh`：在隔离的 `HOME`、`CODEX_HOME` 和临时目录中执行完整安装 smoke，包括 fresh/升级配置的 Codex strict-config 校验、validator 与 fixtures。

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

当前没有独立测试框架。修改技能布局、front matter、安装文档、模板或阶段输出契约后，至少运行 `node tools/validate_skills.js .` 和 `node tools/validate_skills.js --fixtures`。修改 JavaScript 校验脚本时运行对应命令。修改安装入口、内部模块或 smoke 时，逐个运行 `bash -n`；修改 `templates/config.toml`、安装行为或安装说明时，运行 `bash scripts/test-install.sh`。Skip Gate 只检查已提供的原始请求、约束、handoff 意图和 lifecycle state；已有 lifecycle 先由当前 owner 完成必要 transition，其他未跳过工作在完整检查或首次提问前解析用户级 Alpha Goal state root 并创建/恢复 draft：`$HOME/.alpha-goal/<workspace-slug>/`，其中 `<workspace-slug>` 来自稳定 workspace identity：`slug(repo_root or Goal Contract target workspace)`。Goal Contract 仅在执行信息、授权和验证条件完整并设置为 `accepted` 后生效，accepted contract 按协议不可变；材料性变化必须创建新任务。同任务目录下的 `checkpoint.md` 记录执行、证据、阶段和终止信息；verifier 审计当前状态并返回 verdict。

## Commit & Pull Request Guidelines

提交保持单一主题，使用简短祈使式信息。PR/MR 需说明变更范围、受影响路径、验证命令及结果；涉及安装行为时，说明对既有用户配置的影响。
开发完成及时创建PR

## Agent-Specific Instructions

不要直接在 `main` 或 `master` 上修改；为每批任务使用独立 worktree。完成后提交变更，并在最终说明中列出验证证据和剩余风险。

## Readme Guidelines
不随便修改 README，除非SKILL中的改动与README描述不一致。
README保持简洁，避免包含详细说明。

<!-- alpha-goal-managed-custom-agent-routing:v1 -->
## Custom-agent routing

- The main agent owns scope, authority, acceptance decisions, and final synthesis.
- Delegate only independent, bounded work when it materially improves speed, quality, or context isolation.
- Use `scout` for read-only exploration and evidence collection.
- Use `architect` for bounded architecture options, interface boundaries, migration/rollout consequences, and risk-to-validation mapping before implementation.
- Use `builder` for authorized, clearly scoped implementation with explicit acceptance criteria.
- Use `complex-builder` for authorized implementation that spans components or requires material integration, sequencing, migration/recovery, or broad validation.
- Use `reviewer` for complex review, competing interpretations, cross-component consequences, or high-consequence risks.
- Use built-in agents when no pinned custom role is required; if no role clearly fits, keep the work in the main agent.
- Do not repeat the same work across agents merely to compare effort levels, and do not allow concurrent edits to overlapping files.
- Route unresolved architecture or authority decisions back to the main agent or `architect`; neither builder role may decide them implicitly.
- A model or reasoning profile never grants additional authority.

<!-- generate-with-template:custom-agent-routing -->
