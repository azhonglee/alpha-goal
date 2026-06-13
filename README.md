# Alpha Goal 技能集

本仓库提供一组 Alpha Goal skills，帮助 Codex 把非平凡工程任务按“目标澄清、契约生成、迭代执行、验收判断”推进。

```text
INTENT -> ALPHA-GOAL(discovery + interview + contract) -> ITERATE(dynamic plan -> execution -> feedback) -> VERIFY -> FINAL
                                                    ^--------------------------------------------|
```

核心思路：

- `alpha-goal`：执行 Discovery + Socratic interview，产出 Goal Contract，并决定下一入口。
- `loop`：按 Goal type 执行三段循环：dynamic planning、execution、feedback。
- `verify`：验收 acceptance，判断证据是否支持最终 claim。

## 安装

默认安装到真实 Codex home，并在 `$HOME/.codex/skills/` 下创建一个 `alpha-goal` 软链接，指向本仓库的 `skills/`：

```bash
scripts/install.sh
```

脚本会执行以下操作：

- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`，并把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`；模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关，不设置 sandbox 权限、休眠行为或不稳定特性警告抑制项。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接，并清理旧版本可能留在目标 `skills/` 下、且指向本仓库的 `loop`、`verify`、obsolete `goal-frame`、`goal-loop` 或支持目录旧软链接。
- 校验目标 `skills/alpha-goal` 软链接是否指向当前仓库的 `skills/` 目录，并能通过该链接访问所有必需 skill。
- 安装前运行源码中的 `tools/validate_skillset.py` 校验技能包布局。`validate_skillset.py` 只验证布局、元数据、引用可发现性和少量一致性规则；不能证明实际路由、误触发、reference 加载策略或验证边界正确。

安装到其他位置：

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

替换已有同名软链接：

```bash
scripts/install.sh --force
```

只安装 skill symlink，不同步用户级模板：

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
  alpha-goal/
  loop/
  verify/
templates/
scripts/
tools/
```

各技能目录包含 `SKILL.md`，可选 `references/`、`scripts/` 和 `agents/openai.yaml`。

## 用户配置模板

`templates/AGENTS.md` 和 `templates/config.toml` 默认同步到 Codex home。执行前应确认这些默认值适合当前用户环境。模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关，不改变 sandbox 权限、休眠行为，也不抑制不稳定特性警告。

本地验证建议使用临时 `CODEX_HOME`：

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

只读但需要目标/规则/证据边界发现：

```text
$alpha-goal 对这个仓库做只读一致性审计，不要改文件。
```

显式调用阶段：

```text
$alpha-goal 先把这个需求 frame 清楚，不要改文件。
$loop 根据上面的 Goal Contract 做一轮最小变更。
$verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

只有 `alpha-goal` 适合隐式触发。下游阶段技能的 `allow_implicit_invocation` 都是 `false`。

## 设计原则

- `alpha-goal` 承担 Discovery、Socratic interview、ambiguity scoring、Goal Contract 和路由；不做实现 mutation，不做最终完成声明。
- Goal Contract 覆盖 intent、scope、non-goals、decision boundaries、constraints、acceptance 和 evidence；小任务可保持紧凑。
- 写入 `.alpha-goal/` 或 `docs/design/` 前确认路径已 gitignored 或用户明确批准；否则在对话中输出 chat-only contract。
- ITERATE 以 dynamic planning、execution、feedback 为核心；本轮主导不确定性决定证据形状。
- 普通反馈在 loop feedback phase 处理；改变目标、范围、验收或声明边界的反馈回到 `alpha-goal`。
- VERIFY 只做验收和判断；最终完成声明基于 Verification Verdict。
- Alpha Goal 的 process artifacts 只表示流程产物；业务域对象应记录在 Goal Contract 的 Scope、Acceptance、Evidence 中。
- Debug 必须先确认根因再修复；不能只靠 plausible patch。
- 阶段内辅助脚本只作为只读证据收集工具，不替代工程判断。
- 项目特有命令和约定应放在目标仓库的 `AGENTS.md`，不要塞进这些跨仓库 skill。

## 默认产物路径

优先沿用目标仓库已有约定。没有约定时：

- goal contract：`docs/design/YYYYMMDD-<slug>.md`
- plan：`docs/plans/YYYYMMDD-<slug>-plan.md`
- context snapshot：`.alpha-goal/context/YYYYMMDD-<slug>.md`
- interview transcript：`.alpha-goal/interviews/YYYYMMDD-<slug>.md`
- review receipt：`.alpha-goal/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence：`.alpha-goal/evidence/YYYYMMDD-<slug>/`
- scratch artifacts：`.alpha-goal/tmp/YYYYMMDD-<slug>/`

写入 `.alpha-goal/` 前确认它已被 gitignored。若未忽略，不要静默修改 `.gitignore`；改用已批准路径，或在 Goal Contract 中记录用户明确同意的持久化路径。

## 阶段输出

阶段输出契约的权威来源在各阶段 `SKILL.md` 和同级 `references/`：

- `alpha-goal`：Goal Contract，覆盖 intent、outcome、scope、non-goals、decision boundary、constraints、acceptance/evidence 等语义；不要求固定字段名。
- `loop`：Iteration Record，包含 Dynamic plan、Execution、Feedback、Local evidence、Acceptance delta 和下一步判断。
- `verify`：Verification Verdict，包含 Acceptance evidence matrix、Contract review、Claim boundary、Judgment 和 Final claim allowed。

## 调优建议

如果输出太长，可以减少解释文字，但保留会改变判断或交接的关键语义：

- Goal Contract 的 outcome / scope 语义
- Goal Contract 的 non-goals / decision-boundary 语义
- Goal Contract 的 acceptance / evidence 语义
- `Iteration Record.Dynamic plan`
- `Iteration Record.Execution`
- `Iteration Record.Feedback`
- `Iteration Record.Local evidence`
- `Verification Verdict.Acceptance evidence matrix`
- `Verification Verdict.Judgment`
- `Verification Verdict.Final claim allowed`

如果这些 skill 漏掉某个仓库的关键约定，应优先把约定写进目标仓库的 `AGENTS.md`，或新增专门 adapter reference，不要让核心 skill 过度复杂。
