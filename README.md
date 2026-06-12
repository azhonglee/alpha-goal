# Codex Goal Loop 技能集

本仓库提供一组 Goal Loop skills，帮助 Codex 把非平凡工程任务按“意图识别、目标澄清、迭代执行、验收判断”推进。

```text
INTENT -> FRAME -> ITERATE(dynamic plan -> execution -> feedback) -> VERIFY -> FINAL
                    ^--------------------------------------------|
```

核心思路：

- `goal-loop`：轻量意图识别，确定 loop type 和入口。
- `goal-frame`：Discovery + Socratic interview，澄清 goal，产出包含 `Spec` 的 Goal Contract。
- `goal-iterate`：按 loop type 执行三段循环：dynamic planning、execution、feedback。
- `goal-verify`：验收 acceptance，判断证据是否支持最终 claim。
- `goal-review`：可选辅助审查；仅在用户点名、仓库规则要求或反馈风险需要独立挑战时使用，不是默认主流程。

## 安装

默认安装到真实 Codex home，并把 `skills/` 下的 skill 软链接到 `$HOME/.codex/skills/`：

```bash
scripts/install.sh
```

脚本会执行以下操作：

- 将 `skills/*/SKILL.md` 所在技能目录软链接到 `${CODEX_HOME:-$HOME/.codex}/skills/`。
- 默认把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`，并把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`；模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关，不设置 sandbox 权限、休眠行为或不稳定特性警告抑制项。
- 自动替换指向本仓库旧顶层布局的同名 skill 软链接，并清理旧版本可能留在目标 `skills/` 下、且指向本仓库支持目录的旧软链接。
- 校验目标 `skills/` 中的 skill 软链接是否指向当前源码目录。
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
  goal-loop/
  goal-frame/
  goal-iterate/
  goal-review/
  goal-verify/
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
$goal-loop 帮我实现这个需求：...
```

只读但需要目标/规则/证据边界发现：

```text
$goal-loop 对这个仓库做只读一致性审计，不要改文件。
```

显式调用阶段：

```text
$goal-frame 先把这个需求 frame 清楚，不要改文件。
$goal-iterate 根据上面的 Goal Contract 做一轮最小变更。
$goal-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
$goal-review 独立挑战当前反馈、scope 或 readiness 风险。
```

只有 `goal-loop` 适合隐式触发。阶段技能的 `allow_implicit_invocation` 都是 `false`。

## 设计原则

- Router 只做意图识别和入口选择，不承载阶段细节。
- FRAME 先 Discovery，再按需 Socratic interview；Goal Contract 必须包含 `Spec` 字段。
- Spec 默认内联且紧凑；只有风险、复杂度、handoff、恢复或用户要求时才写 durable spec。
- ITERATE 固定为 dynamic planning、execution、feedback 三段；loop type 决定本轮证据形状。
- 普通反馈在 ITERATE feedback phase 处理；`goal-review` 只做可选独立挑战。
- VERIFY 只做验收和判断；任何最终完成声明必须基于 Verification Verdict。
- Goal Loop 的 `Artifacts` 只表示流程产物；业务域对象应记录在 Target、Acceptance、Non-goals 或 Evidence plan 中。
- Debug/root-cause 声明必须有能验证根因的证据，不能只靠 plausible patch。
- 阶段内辅助脚本只作为只读证据收集工具，不替代工程判断。
- 项目特有命令和约定应放在目标仓库的 `AGENTS.md`，不要塞进这些跨仓库 skill。

## 默认产物路径

优先沿用目标仓库已有约定。没有约定时：

- spec：`docs/design/YYYYMMDD-<slug>-spec.md`
- plan：`docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt：`.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence：`.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts：`.goal-loop/tmp/YYYYMMDD-<slug>/`

写入 `.goal-loop/` 前必须确认它已被 gitignored。若未忽略，不要静默修改 `.gitignore`；改用已批准路径，或在 Goal Contract 中记录用户明确同意的持久化路径。

## 阶段输出

阶段输出契约的权威来源在各阶段 `SKILL.md` 和同级 `references/`：

- `goal-frame`：Goal Contract，包含 Intent、Loop type、Target、Discovery、Socratic state、Spec、Acceptance、Claim boundary、Evidence plan 等。
- `goal-iterate`：Iteration Record，包含 Dynamic plan、Execution、Feedback、Local evidence、Acceptance delta 和下一步判断。
- `goal-verify`：Verification Verdict，包含 Acceptance evidence matrix、Spec review、Claim boundary、Judgment 和 Final claim allowed。
- `goal-review`：Review Record，仅用于显式辅助审查。

## 调优建议

如果输出太长，可以减少解释文字，但保留关键字段：

- `Goal Contract.Spec`
- `Goal Contract.Acceptance`
- `Goal Contract.Claim boundary`
- `Iteration Record.Dynamic plan`
- `Iteration Record.Execution`
- `Iteration Record.Feedback`
- `Iteration Record.Local evidence`
- `Verification Verdict.Acceptance evidence matrix`
- `Verification Verdict.Judgment`
- `Verification Verdict.Final claim allowed`

如果这些 skill 漏掉某个仓库的关键约定，应优先把约定写进目标仓库的 `AGENTS.md`，或新增专门 adapter reference，不要让核心 skill 过度复杂。
