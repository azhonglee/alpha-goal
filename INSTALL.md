# 安装与烟测

## 默认安装

```bash
scripts/install.sh
```

默认 Codex 主目录是 `$HOME/.codex`。脚本会创建 `$HOME/.codex/skills/alpha-goal` 软链接，指向本仓库的 `skills/`。该目录包含六个必需技能：

安装脚本会通过 `npx --yes tsx` 运行 TypeScript 校验器，因此本机需要可用的 Node.js/npm。

```text
alpha-goal
goal-contract
system-model
control-loop
evidence-verify
decision-synthesis
```

## 安装到指定 Codex 主目录

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## 安装行为

脚本会：

- 安装前运行源码中的 `tools/validate_skills.ts`。它会校验六技能结构、引用可发现性、安装脚本、配置模板、临时安装烟测、闭环语义、schema sidecar 样本、运行期样本和样本契约。
- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认同步用户级模板：更新受管理的 `AGENTS.md` 模板块，并补齐 `config.toml` 中缺失的模板设置。模板只涉及多智能体、子目录 AGENTS.md 和结构化 `request_user_input`，不改 sandbox、休眠行为或不稳定特性警告设置。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接。
- 清理旧版本可能留在目标 `skills/` 下、且直接指向本仓库单个技能目录的旧软链接。
- 校验目标 `skills/alpha-goal` 软链接指向源码 `skills/`，六个必需技能都可访问，且旧支持目录没有作为本仓库技能安装。

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

- `AGENTS.md`：推荐的自主智能体行为、人类参与决策（HIL）和交互约束。
- `config.toml`：可选 Codex 配置，启用多智能体、子目录 AGENTS.md 和结构化 `request_user_input`。它不改变 sandbox 权限、休眠行为，也不抑制不稳定特性警告。启用多智能体后，复杂任务可能启动多个子智能体；模板默认最多 6 个线程、深度 1，可能增加本地资源和模型用量。

默认安装会同步用户级模板。做冒烟测试或文档验证时，应使用临时 `CODEX_HOME`：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
npx --yes tsx tools/validate_skillset.ts .
rm -rf "$tmp_codex_home"
```

兼容校验入口：

```bash
npx --yes tsx tools/validate_skillset.ts .
```

## 烟测提示

```text
$alpha-goal 帮我判断这个任务应该走哪个技能，并说明下一步边界。
```

预期行为：

- 应判断任务需要目标定界、系统建模、有界迭代、证据验证还是决策综合。
- 除非阶段和编辑边界已经明确，否则不应直接改文件。
- 应在实现前暴露缺失的目标、验收、证据或副作用边界。
- 需要持久化状态时，应使用 `.alpha-goal/YYYYMMDD-<slug>/control-state.md`。

```text
$goal-contract 对本仓库技能和 references 目录做只读一致性审计，不要改文件。
```

预期行为：

- 应形成只读发现 / 审计边界。
- 应把请求中的 `SKILL.md` 和相关 `references/` 文件作为审计目标读取。
- 应返回发现、证据、建议和残余不确定性，而不是只输出目标契约。
- 当定性目标需要可度量验收证据时，应创建指标转译。
- 因为没有请求变更或完成声明，不应运行 `control-loop` 或 `evidence-verify`。

```text
$system-model 这个仓库的安装链路现在有失败，先建模可观测信号、可控变量和扰动，不要改文件。
```

预期行为：

- 应把安装脚本、校验器、文档、模板、软链接目标和临时 `CODEX_HOME` 烟测识别为相关系统部分。
- 应区分已观察证据和推断风险。
- 当多个仓库、智能体、团队或模块都可能影响共享目标时，应输出控制器层级。
- 当安装漂移或环境问题会影响声明时，应输出扰动记录，并包含可能性、影响、传感器、控制措施和路由触发条件。
- 不应改文件。

```text
$decision-synthesis 多团队对迁移方案目标、风险和成功指标有冲突，先做综合研判，不要改文件。
```

预期行为：

- 应至少运行一轮综合，整合人类 / 专家判断、机器证据或可用指标、冲突、用户自有决策和下一个假设。
- 开放复杂巨系统任务应使用综合研判工作台，记录角色、假设库、模型登记、异议和收敛条件。
- 对需要纳入目标契约证据的成功指标，应输出指标转译候选。
- 应路由到 `goal-contract`、`system-model`、用户或阻塞项，而不是把意见列表当成最终计划。

```text
$control-loop 根据上面的目标契约做一轮最小变更。
```

预期行为：

- 应运行或手动记录变更预检。
- 如果目标未闭合或编辑路径不安全，应拒绝变更。
- 完整控制律应写入迭代产物或台账；TUI 默认显示紧凑中文 `执行检查` 表，而不是原始 `控制律:` 块。
- 当反馈重复、噪声大、影响范围广或风险高时，持久化控制律应包含反馈延迟、信号噪声、置信度、阻尼 / 防振荡和饱和条件 / 约束边界。
- 当反馈推翻可复用控制假设时，应输出包含动态计划、执行、反馈和自适应学习记录的迭代记录。

```text
$evidence-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

预期行为：

- 应把验收项映射到最新证据。
- 应复核契约验收和声明边界。
- 当证据包包含对应产物时，应检查控制律动态和控制论一致性。
- 存在指标转译和自适应学习记录时，应复核其边界。
- 应输出带明确判断的验证结论。
- 应路由到最终交付、下一轮、重新界定或阻塞。
