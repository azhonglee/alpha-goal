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
- `goal-frame`：先把目标说清楚，产出 Goal Contract，明确范围、验收标准、约束、风险和证据计划。
- `goal-iterate`：在已有 Goal Contract 下完成一轮有限实现，记录 mutation preflight、loop mode 证据、debug receipt 和必要计划。
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
- 将 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md` 受管理模板块。
- 将 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`，不会覆盖已有值。
- 清理旧版本可能留在 `skills/` 下、且指向本仓库的旧支持目录软链接。
- 校验目标 `skills/` 中的 skill 软链接是否指向当前源码目录。
- 安装后运行源码中的 `tools/validate_skillset.py` 校验技能包布局。

如果要安装到其他位置，使用 `--codex-home` 或显式设置 `CODEX_HOME`：

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

如果目标位置已经有同名软链接，并且指向其他目录，可以使用 `--force` 替换。脚本不会删除真实文件或真实目录：

```bash
scripts/install.sh --force
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

`templates/AGENTS.md` 和 `templates/config.toml` 继承自原 `main` 分支的安装模型。默认安装会把这些模板合并到真实 Codex home；执行前应确认这些默认值适合当前用户环境。

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
- Spec 和 plan 只在风险或复杂度升高时使用，不作为默认流程负担。
- Spec 记录稳定需求，plan 记录当前执行路线和路线调整历史。
- 脚本只作为只读辅助工具，不替代工程判断。
- 项目特有命令和约定应放在目标仓库的 `AGENTS.md`，不要塞进这些跨仓库 skill。

## 默认产物路径

优先沿用目标仓库已有约定。没有约定时，可以使用以下默认路径：

- spec：`docs/design/YYYYMMDD-<slug>-spec.md`
- plan：`docs/plans/YYYYMMDD-<slug>-plan.md`
- review receipt：`.goal-loop/reviews/YYYYMMDD-<slug>-review.md`
- command/output evidence：`.goal-loop/evidence/YYYYMMDD-<slug>/`
- scratch artifacts：`.goal-loop/tmp/YYYYMMDD-<slug>/`

写入运行时证据和临时文件前，必须先把 `.goal-loop/` 加入 `.gitignore`，避免把 scratch 内容提交进仓库。

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

如果阶段输出显得太长，可以减少解释文字，但应保留这些关键字段：

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
