# Installation and Smoke Test

## 默认安装

```bash
scripts/install.sh
```

默认 Codex home 是 `$HOME/.codex`，脚本会创建 `$HOME/.codex/skills/alpha-goal` 软链接，目标是本仓库的 `skills/`。该 `skills/` 树内包含六个必需技能：

安装脚本会通过 `npx --yes tsx` 运行 TypeScript 校验器，因此本机需要可用的 Node.js/npm。

```text
alpha-goal
goal-contract
system-model
control-loop
evidence-verify
decision-synthesis
```

## 安装到指定 Codex home

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## 安装行为

脚本会：

- 安装前运行源码中的 `tools/validate_skills.ts` 校验六技能套件的结构、引用可发现性、闭环语义烟测和 fixture contract checks。
- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认更新 Codex home 的 `AGENTS.md` 中带 `generate-with-template:agents-md` 标记的受管理模板块，并只补齐 `config.toml` 中缺失的模板设置；模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关，不设置 `sandbox_mode`、休眠行为或不稳定特性警告抑制项。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接。
- 清理旧版本可能留在目标 `skills/` 下、且指向本仓库的直连技能软链接。
- 校验目标 `skills/alpha-goal` 软链接指向源码 `skills/` 目录，所有必需 skill 都能通过该链接访问，且旧支持目录没有作为本仓库 skill 安装。

如果目标位置已有其他软链接：

```bash
scripts/install.sh --force
```

如需跳过用户级模板同步：

```bash
scripts/install.sh --no-sync-user-templates
```

排查安装过程：

```bash
scripts/install.sh --verbose
```

## 用户配置模板

源码中的 `templates/` 目录包含：

- `AGENTS.md`：推荐的自主 Agent 行为、HITL 和交互约束。
- `config.toml`：启用 multi-agent、child AGENTS 和结构化 `request_user_input` 的可选 Codex 配置，不改变 sandbox 权限、休眠行为，也不抑制不稳定特性警告。启用 multi-agent 后，复杂任务可能启动多个子 agent；模板默认最多 6 个线程、深度 1，可能增加本地资源和模型用量。

默认安装会同步用户级模板。做 smoke test 或文档验证时，应使用临时 `CODEX_HOME`：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
npx --yes tsx tools/validate_skills.ts .
rm -rf "$tmp_codex_home"
```

兼容校验入口：

```bash
npx --yes tsx tools/validate_skillset.ts .
```

## Smoke test prompts

```text
$alpha-goal 帮我判断这个任务应该走哪个 skill，并说明下一步边界。
```

Expected behavior:

- It should classify whether the task needs goal framing, system modeling, bounded iteration, verification, or decision synthesis.
- It should avoid mutation unless the requested phase and edit boundary are clear.
- It should surface missing target, acceptance, evidence, or side-effect boundaries before implementation.

```text
$goal-contract 对本仓库 skill 和 references 做只读一致性审计，不要改文件。
```

Expected behavior:

- It should frame a read-only discovery/audit boundary.
- It should read the requested `SKILL.md` and relevant `references/` files as the audit target.
- It should return findings, evidence, recommendations, and residual uncertainty, not only a Goal Contract.
- It should create an Indicator Handoff when qualitative objectives need measurable acceptance evidence.
- It should not run `control-loop` or `evidence-verify` because no mutation or completion claim is requested.

```text
$system-model 这个仓库的安装链路现在有失败，先建模可观测信号、可控变量和扰动，不要改文件。
```

Expected behavior:

- It should identify the install script, validators, docs, templates, symlink target, and temporary `CODEX_HOME` smoke test as relevant system parts.
- It should distinguish observed evidence from inferred risks.
- It should produce a Controller Hierarchy when multiple repos, agents, teams, or modules can change a shared objective.
- It should produce a Disturbance Register with likelihood, impact, sensor, containment, and route trigger when install drift or environment issues can affect the claim.
- It should not mutate files.

```text
$decision-synthesis 多团队对迁移方案目标、风险和成功指标有冲突，先做综合研判，不要改文件。
```

Expected behavior:

- It should run at least one Synthesis Round that combines human/expert judgment, machine evidence or available metrics, conflicts, user-owned decisions, and next hypotheses.
- It should emit an Indicator Handoff candidate for success metrics that should become Goal Contract evidence.
- It should route to `goal-contract`, `system-model`, user, or blocker instead of treating a list of opinions as a final plan.

```text
$control-loop 根据上面的 Goal Contract 做一轮最小变更。
```

Expected behavior:

- It should run or manually record mutation preflight.
- It should refuse mutation if target is not closed or edit path is unsafe.
- It should produce an Iteration Record with dynamic plan, execution, feedback, and Adaptive Learning Record when feedback contradicts a reusable control assumption.

```text
$evidence-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

Expected behavior:

- It should map acceptance items to fresh evidence.
- It should review contract acceptance and claim boundary.
- It should review Indicator Handoff and Adaptive Learning Record boundaries when present.
- It should produce a Verification Verdict with judgment.
- It should route to final, next iteration, reframe, or blocked.
