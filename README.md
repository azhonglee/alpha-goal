# Alpha Goal 技能集

Alpha Goal 是一组给 Codex 使用的技能，用来把一个还不够清楚、容易做偏的开发任务，推进成可执行、可验证的工作流。

它解决的核心问题是：

- 先弄清楚**要解决什么问题**，避免一上来就改错方向；
- 把范围、限制、验收方式说清楚，形成一份轻量的目标说明；
- 按小步迭代完成修改，并记录做了什么、验证了什么；
- 最后判断现有证据是否足够支持“可以交付”的结论。

```text
需求/问题
  -> alpha-goal：澄清目标，写清范围和验收方式
  -> loop：按一轮最小变更执行、验证、记录反馈
  -> verify：检查证据是否足够，判断能否交付
  -> 最终回复
```

## 三个技能分别做什么

- `alpha-goal`：用于任务开始前。它会阅读上下文、必要时提问，并整理出“目标、范围、不做什么、谁来决定什么、如何验收”。
- `loop`：用于真正开始改动。它会根据已有目标做一轮尽量小的修改，并在本轮结束时记录改了什么、验证了什么、还剩什么。
- `verify`：用于交付前检查。它不会继续实现功能，而是判断当前 diff、测试结果和说明是否足够支持最终结论。

简化理解：

```text
alpha-goal 负责“别做偏”
loop       负责“把事做完一小步”
verify     负责“别把没验证过的事说成已完成”
```

## 安装

默认安装到真实 Codex home，并在 `$HOME/.codex/skills/` 下创建一个 `alpha-goal` 软链接，指向本仓库的 `skills/`：

```bash
scripts/install.sh
```

脚本会执行以下操作：

- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`，并把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`。
- 用户配置模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关；不会修改 sandbox 权限、休眠行为，也不会抑制不稳定特性警告。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接。
- 清理旧版本可能留在目标 `skills/` 下、且指向本仓库的 `loop`、`verify`、`goal-frame`、`goal-loop` 或支持目录旧软链接。
- 校验目标 `skills/alpha-goal` 软链接是否指向当前仓库的 `skills/` 目录，并能通过该链接访问所有必需 skill。
- 安装前运行源码中的 `tools/validate_skillset.py` 校验技能包布局。

> `tools/validate_skillset.py` 只检查目录结构、元数据、引用是否可发现，以及少量一致性规则。它不能证明技能在真实任务中的路由、触发时机、验证边界或验收判断一定正确。

安装到其他位置：

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

替换已有同名软链接：

```bash
scripts/install.sh --force
```

只安装 skill 软链接，不同步用户级模板：

```bash
scripts/install.sh --no-sync-user-templates
```

排查安装过程：

```bash
scripts/install.sh --verbose
```

## 仓库结构

```text
skills/
  alpha-goal/   # 开始前澄清目标、范围和验收方式
  loop/         # 执行一轮最小变更，并记录结果
  verify/       # 交付前检查证据是否足够
templates/      # 可同步到 Codex home 的用户配置模板
scripts/        # 安装脚本
tools/          # 本仓库校验工具
```

各技能目录都包含 `SKILL.md`，并可能包含：

- `references/`：更详细的规则；
- `scripts/`：辅助脚本；
- `agents/openai.yaml`：技能展示和描述信息。

## 用户配置模板

`templates/AGENTS.md` 和 `templates/config.toml` 默认会同步到 Codex home。执行前应确认这些默认值适合当前用户环境。

模板只补齐以下能力相关配置：

- multi-agent；
- child AGENTS；
- 结构化 `request_user_input`。

模板不会改变 sandbox 权限、休眠行为，也不会抑制不稳定特性警告。

建议先用临时 `CODEX_HOME` 验证安装流程：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
python3 tools/validate_skillset.py .
rm -rf "$tmp_codex_home"
```

## 推荐调用方式

通常直接走总入口：

```text
$alpha-goal 帮我实现这个需求：...
```

只想做只读审计，不希望改文件：

```text
$alpha-goal 对这个仓库做只读一致性审计，不要改文件。
```

分阶段显式调用：

```text
$alpha-goal 先把这个需求梳理清楚，不要改文件。
$loop 根据上面的目标说明做一轮最小变更。
$verify 检查当前 diff、测试和最终说明，判断是否可以交付。
```

`alpha-goal`、`loop` 和 `verify` 都支持被 Codex 按语义自动触发；真正是否进入某个阶段，仍以各技能自己的入口规则和当前任务边界为准。

## 什么时候该用哪个技能

| 场景 | 建议 |
| --- | --- |
| 需求比较模糊，不确定该改哪里 | 先用 `alpha-goal` |
| 用户只要求只读分析、盘点、审计 | 用 `alpha-goal` 做只读探索，通常不需要进入 `loop` |
| 已经有清楚目标，可以开始改 | 用 `loop` 做一轮最小变更 |
| 想确认“是否真的完成了” | 用 `verify` 检查证据和最终结论 |
| bug 修复 | 先确认根因，再进入修复；不要只凭猜测打补丁 |
| 目标、范围或验收方式变了 | 回到 `alpha-goal` 重新对齐 |

## 设计原则

- 先澄清目标，再动手修改。
- 范围要写清楚：做什么、不做什么、哪些决定可以由 Codex 自行判断、哪些必须问用户。
- 验收方式要可检查：例如看 diff、跑测试、人工检查某个输出，或明确说明为什么暂时无法验证。
- `loop` 每次只做一轮尽量小的变更，避免把多个不确定方向混在一起。
- `verify` 只判断是否可以交付，不继续偷偷补实现。
- 最终回复不能夸大：只说已经被当前证据支持的结论。
- bug 修复必须先证明根因，再说明修了哪里、用什么验证修复有效。
- 辅助脚本只负责收集信息，不替代人的工程判断。
- 项目特有命令和约定应放在目标仓库的 `AGENTS.md`，不要塞进这些跨仓库 skill。

## 默认产物路径

优先沿用目标仓库已有约定。没有约定时，默认使用以下路径：

- 目标说明：`docs/design/YYYYMMDD-<slug>.md`
- 执行计划：`docs/plans/YYYYMMDD-<slug>-plan.md`
- 上下文快照：`.alpha-goal/context/YYYYMMDD-<slug>.md`
- 访谈记录：`.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- 审查记录：`.alpha-goal/reviews/YYYYMMDD-<slug>-review.md`
- 命令输出和验证证据：`.alpha-goal/evidence/YYYYMMDD-<slug>/`
- 临时草稿：`.alpha-goal/tmp/YYYYMMDD-<slug>/`

写入 `.alpha-goal/` 前必须确认它已被 gitignored。若未忽略，不要静默修改 `.gitignore`；应改用已批准路径，或在目标说明中记录用户明确同意的持久化路径。

## 阶段输出

阶段输出的权威规则在各阶段 `SKILL.md` 和同级 `references/` 中。README 只做概览。

- `alpha-goal` 输出目标说明：包括目标、期望结果、范围、不做什么、决策边界、限制、验收方式和需要的证据。字段名不需要完全固定，语义清楚即可。
- `loop` 输出迭代记录：包括本轮计划、实际改动、处理过的反馈、本地验证结果、距离验收还差什么，以及下一步判断。
- `verify` 输出验收判断：包括每条验收要求对应的证据、目标说明是否仍然有效、当前证据能支持多大的最终结论，以及是否可以交付。

## 调优建议

如果输出太长，可以减少解释文字，但不要删掉会影响判断或交接的关键信息：

- 目标和期望结果；
- 做什么、不做什么；
- 哪些决定 Codex 可以自行做，哪些必须问用户；
- 如何验收，以及需要哪些证据；
- 本轮计划、实际改动和本地验证结果；
- 验收判断，以及最终可以说到什么程度。

如果这些 skill 漏掉某个仓库的关键约定，应优先把约定写进目标仓库的 `AGENTS.md`，或新增专门的适配说明；不要让核心 skill 为单个仓库变得过度复杂。
