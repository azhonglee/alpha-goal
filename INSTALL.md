# Installation and Smoke Test

## 默认安装

```bash
scripts/install.sh
```

默认 Codex home 是 `$HOME/.codex`，技能会从仓库 `skills/` 软链接到 `$HOME/.codex/skills/`。

## 安装到指定 Codex home

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## 安装行为

脚本会：

- 软链接 `skills/*/SKILL.md` 所在技能目录到 `${CODEX_HOME:-$HOME/.codex}/skills/`。
- 默认更新 Codex home 的 `AGENTS.md` 中带 `generate-with-template:agents-md` 标记的受管理模板块，并只补齐 `config.toml` 中缺失的模板设置；模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关，不设置 `sandbox_mode`、休眠行为或不稳定特性警告抑制项。
- 自动替换指向本仓库旧顶层布局的同名 skill 软链接，并清理旧版本可能留在目标 `skills/` 下、且指向本仓库的 obsolete `goal-frame` 或支持目录旧软链接。
- 校验目标 `skills/` 中的 skill 软链接指向源码目录，且旧支持目录没有作为本仓库 skill 安装。
- 安装前运行源码中的 `tools/validate_skillset.py` 校验技能包。该校验只覆盖布局、元数据、引用可发现性和少量一致性规则；不能证明实际路由、误触发、reference 加载策略或验证边界正确。

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
python3 tools/validate_skillset.py .
rm -rf "$tmp_codex_home"
```

## Smoke test prompts

```text
$goal-loop 对本仓库 skill 和 references 做只读一致性审计，不要改文件。
```

Expected behavior:

- It should identify `EXPLORE`.
- It should use `goal-loop` frame/discovery only for routing and target/evidence boundaries.
- It should read the requested SKILL.md/reference files as the audit target.
- It should return findings, evidence, recommendations, and residual uncertainty, not only a Goal Contract.
- It should not run ITERATE or VERIFY because no mutation or completion claim is requested.

```text
$goal-loop 比较当前分支和某个已有 MR 的方案差异，只读。
```

Expected behavior:

- It should identify missing comparison object if no MR/branch is named.
- With a concrete object, it should frame an `EXPLORE` / `COMPARISON_ONLY` boundary.
- It should not mutate files.

```text
请普通 review 这段 diff，不要求判断是否 done/ready，也不需要查仓库规则。
```

Expected behavior:

- It should not force Goal Loop for ordinary standalone review.
- It should use normal read-only review style unless target/rule/evidence-boundary discovery is needed.

```text
$goal-loop 某个工作区页面里列表 A 正常，但列表 B 为空；日志显示 B 的接口返回空。只读判断下一步定位方向，不要改文件。
```

Expected behavior:

- It should identify `EXPLORE` or `DEBUG` without mutation, depending on the requested claim.
- It should frame the user-facing page/workspace as a container.
- It should distinguish affected submodule, data entity, source interface, and log evidence.
- It should return read-only diagnosis and next evidence plan, not mutate files.

```text
$goal-loop 修复一个低风险纯函数 bug：某个输入返回值错误，已有 focused failing test 指向单个分支错误。
```

Expected behavior:

- It should identify `DEBUG`.
- `goal-loop` frame phase should produce a Goal Contract with inline Spec.
- ITERATE should use dynamic planning, execution, and feedback.
- Debug evidence may be compact, but must cover failure path, divergence, fix surface, and post-fix evidence.
- It should verify focused failure path after the patch and narrow the final claim to the tested boundary.

```text
$goal-loop 这是一个多仓 workspace，帮我先 frame “补充产物上传 TOS 日志”，不要改文件。
```

Expected behavior:

- It should avoid mutation.
- It should run discovery before asking.
- It should produce a Goal Contract with `Spec`.
- It should record candidate repos and existing work if likely.

```text
$goal-iterate 根据上面的 Goal Contract 做一轮最小变更。
```

Expected behavior:

- It should run or manually record mutation preflight.
- It should refuse mutation if target is not closed or edit path is unsafe.
- It should produce an Iteration Record with Dynamic plan, Execution, and Feedback.

```text
$goal-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

Expected behavior:

- It should map acceptance items to fresh evidence.
- It should review Spec and claim boundary.
- It should produce a Verification Verdict with Judgment.
- It should route to final, next iteration, reframe, or blocked.

```text
$goal-review 检查当前反馈是否需要改方向。
```

Expected behavior:

- It should run only because explicitly named.
- It should not mutate files.
- It should produce a Review Record as auxiliary input, not a final completion verdict.
