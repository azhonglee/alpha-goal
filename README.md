# Codex Goal Loop 技能集

本仓库提供一组 Codex skill，帮助 Codex 把复杂任务拆成清晰、可追踪的阶段流程：

```text
FRAME -> ITERATE -> REVIEW -> VERIFY -> FINAL
                  -> VERIFY
                  -> ITERATE
                  -> FRAME
                  -> BLOCKED
```

技能集包含 5 个顶层 skill：

- `goal-loop`：统一入口，负责选择合适阶段，并维护阶段之间的通用约束。
- `goal-frame`：先把目标说清楚，产出 Goal Contract，明确范围、验收标准、约束、风险和证据计划；遇到页面/空间/容器型目标时，先区分子模块、数据实体和源接口。
- `goal-iterate`：在已有 Goal Contract 下完成一轮有限实现，记录 mutation preflight、loop mode 证据、debug receipt 和必要计划；debug 模式先确认根因边界再修复。
- `goal-review`：检查实现方向、反馈处理、范围、架构、相关产物状态，以及是否具备收尾条件。
- `goal-verify`：产出 Verification Verdict，核对验收项、证据、产物一致性和最终可声明的范围。

仓库还附带一些可选的只读辅助脚本，以及用户级 Codex 配置模板。

## 安装

默认安装到真实 Codex home，并把这些 skill 软链接到 `$HOME/.codex/skills/`：

```bash
scripts/install.sh
```

脚本会执行以下操作：

- 将顶层 `*/SKILL.md` 所在目录软链接到 `${CODEX_HOME:-$HOME/.codex}/skills/`。
- 默认把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`，并把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`；模板不设置 sandbox 权限或抑制不稳定特性警告，安全边界仍由用户现有配置决定。
- 清理旧版本可能留在 `skills/` 下、且指向本仓库的旧支持目录软链接。
- 校验目标 `skills/` 中的 skill 软链接是否指向当前源码目录。
- 安装后运行源码中的 `tools/validate_skillset.py` 校验技能包布局。`validate_skillset.py` 只验证布局、元数据、引用可发现性和少量一致性规则；不能证明实际路由、误触发、reference 加载策略或验证边界正确。

如果要安装到其他位置，使用 `--codex-home` 或显式设置 `CODEX_HOME`：

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

如果目标位置已经有同名软链接，并且指向其他目录，可以使用 `--force` 替换。脚本不会删除真实文件或真实目录：

```bash
scripts/install.sh --force
```

如果需要只安装 skill symlink、不更新用户级模板，显式追加 `--no-sync-user-templates`：

```bash
scripts/install.sh --no-sync-user-templates
```

默认输出只保留安装摘要。如果需要查看每个软链接、模板合并和校验过程，追加 `--verbose`：

```bash
scripts/install.sh --verbose
```

## 仓库结构

仓库根目录直接放置各个 skill：

```text
goal-loop/
goal-frame/
goal-iterate/
goal-review/
goal-verify/
templates/
```

其中：

- `goal-loop/` 是统一入口。
- `goal-frame/`、`goal-iterate/`、`goal-review/`、`goal-verify/` 分别对应四个阶段。
- `templates/` 保存可选的用户配置模板。
- `scripts/` 保存安装脚本。
- `tools/` 保存本地校验脚本。

## 用户配置模板

`templates/AGENTS.md` 和 `templates/config.toml` 默认同步到 Codex home。执行前应确认这些默认值适合当前用户环境。`templates/AGENTS.md` 只承载推荐的自主 Agent、HITL 和交互约束，隔离工作流由 Goal Loop skills 承载。`templates/config.toml` 只补齐协作/多 agent 相关开关，不设置 `sandbox_mode`，也不抑制不稳定特性警告。

做本地验证时，建议使用临时 `CODEX_HOME`，避免污染真实配置：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
python3 tools/validate_skillset.py .
rm -rf "$tmp_codex_home"
```

## 推荐调用方式

直接走总入口：

```text
$goal-loop 帮我实现这个需求：...
```

需要非平凡只读审查时，也可以走总入口先确认目标、规则和证据边界：

```text
$goal-loop 对这个仓库做只读审查，先确认目标和证据边界，不要改文件。
```

也可以显式调用某个阶段：

```text
$goal-frame 先帮我把这个需求 frame 清楚，不要改文件。
$goal-iterate 根据上面的 Goal Contract 做一轮最小实现。
$goal-review 检查当前实现方向、反馈和证据缺口。
$goal-verify 检查当前 diff 和测试证据，判断能否最终交付。
```

只有 `goal-loop` 适合隐式触发。其他阶段 skill 的 `allow_implicit_invocation` 都是 `false`，更适合显式测试，或由路由入口按需加载。

## 设计原则

- 路由入口只负责分派，具体工作交给阶段 skill。
- 每个阶段只产出一份便于追踪的记录。
- 详细规则放在 `references/`，只在需要时加载。
- 诊断任务先区分用户可见容器、子模块、数据实体、API/RPC 和日志证据，不把业务域里的 artifact/product item 混同为 Goal Loop 的 `Artifacts` 字段。
- Debug receipt 要与风险匹配：复杂 RCA 需要竞争假设、entity/interface/log 对齐和根因声明验证；低风险单函数/单分支 bug 可用 focused failing test、直接代码分歧和修复后测试形成紧凑证据。
- Spec 和 plan 只在风险或复杂度升高时使用，不作为默认流程负担。
- Spec 记录稳定需求，plan 记录当前执行路线和路线调整历史。
- 阶段内辅助脚本只作为只读证据收集工具，不替代工程判断；安装脚本是显式安装入口，可能修改 Codex home。
- 项目特有命令和约定应放在目标仓库的 `AGENTS.md`，不要塞进这些跨仓库 skill。

## 默认产物路径

优先沿用目标仓库已有约定。没有约定时，可以使用以下默认路径：

- spec：`docs/design/YYYYMMDD-<slug>-spec.md`
- plan：`docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt：`.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence：`.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts：`.goal-loop/tmp/YYYYMMDD-<slug>/`

写入运行时证据和临时文件前，必须先确认 `.goal-loop/` 已被 gitignored。如果未被忽略，不要静默修改 `.gitignore`；改用已批准的路径，或在 Goal Contract 中记录用户明确同意的持久化路径。

## 阶段输出

### Goal Contract

由 `goal-frame` 产出，用来固定目标、范围和验收边界。

```text
Goal Contract:
- Intent:
- Target:
- Acceptance:
- Non-goals:
- Constraints:
- Decision boundaries:
- Assumptions and risks:
- Risk tier:
- Claim boundary:
- Evidence plan:
- Artifacts:
- Existing work:
- Frame verdict:
- Next:
```

### Iteration Record

由 `goal-iterate` 产出，用来记录一轮有限实现的目标、动作、证据和下一步判断。

```text
Iteration Record:
- Contract version:
- Active artifacts:
- Loop mode:
- Hypothesis:
- Evidence type:
- Debug receipt:
- Iteration goal:
- Mutation preflight:
- Action:
- Changed files:
- Local evidence:
- Learning:
- Decision:
- Acceptance delta:
- Risks introduced:
- Review needed:
- Iterate verdict:
- Next:
```

### Review Record

由 `goal-review` 产出，用来检查方向是否正确、反馈是否处理、范围和架构是否合理，以及是否还缺关键证据。

```text
Review Record:
- Mode:
- Target:
- Evidence basis:
- Freshness boundary:
- Findings:
- Feedback classification:
- Artifact review:
- Scope/architecture notes:
- Risk tier:
- Required evidence:
- Review verdict:
- Next:
```

### Verification Verdict

由 `goal-verify` 产出，用来判断当前证据是否足以支持最终交付声明。

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Artifact review:
- Claim boundary:
- Risk/evidence review:
- Fresh checks run:
- Diff/scope review:
- Unresolved gaps:
- Required next step:
- Final claim allowed:
```

## 调优建议

如果阶段输出显得太长，可以减少解释文字，但应保留这些关键字段。低风险本地 bug 可以压缩 Debug receipt 内容，但不能省略失败路径、分歧点、修复面和修复后证据：

- `Goal Contract.Acceptance`
- `Goal Contract.Claim boundary`
- `Goal Contract.Artifacts`
- `Iteration Record.Active artifacts`
- `Iteration Record.Loop mode`
- `Iteration Record.Debug receipt`
- `Iteration Record.Mutation preflight`
- `Review Record.Freshness boundary`
- `Review Record.Review verdict`
- `Verification Verdict.Acceptance evidence matrix`
- `Verification Verdict.Verdict`

如果这些 skill 漏掉了某个仓库的关键约定，应优先把约定写进目标仓库的 `AGENTS.md`，或新增专门的 adapter reference，而不是让核心 skill 变得过于复杂。
