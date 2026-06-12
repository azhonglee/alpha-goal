# Installation and Smoke Test

## 默认安装

```bash
scripts/install.sh
```

默认 Codex home 是 `$HOME/.codex`，技能会软链接到 `$HOME/.codex/skills/`。

## 安装到指定 Codex home

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## 安装行为

脚本会：

- 软链接顶层技能目录到 `${CODEX_HOME:-$HOME/.codex}/skills/`。
- 默认更新 Codex home 的 `AGENTS.md` 中带 `generate-with-template:agents-md` 标记的受管理模板块，并只补齐 `config.toml` 中缺失的模板设置；模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关，不设置 `sandbox_mode`、休眠行为或不稳定特性警告抑制项。
- 清理旧版本可能留在 `skills/` 下、且指向本仓库的旧支持目录软链接。
- 校验目标 `skills/` 中的 skill 软链接指向源码目录，且旧支持目录没有作为本仓库 skill 安装。
- 安装后运行源码中的 `tools/validate_skillset.py` 校验技能包。该校验只覆盖布局、元数据、引用可发现性和少量一致性规则；不能证明实际路由、误触发、reference 加载策略或验证边界正确。

如果目标位置已有其他软链接，可以使用：

```bash
scripts/install.sh --force
```

`--force` 只替换软链接，不删除真实文件或真实目录。

如需跳过用户级模板同步，显式 opt out：

```bash
scripts/install.sh --no-sync-user-templates
```

默认输出只保留安装摘要。排查安装过程时使用：

```bash
scripts/install.sh --verbose
```

## 用户配置模板

源码中的 `templates/` 目录包含：

- `AGENTS.md`：推荐的自主 Agent 行为、HITL 和交互约束；隔离工作流由 Goal Loop skills 承载。
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

- It should use FRAME/discovery only for routing and target/evidence boundaries.
- It should read the requested SKILL.md/reference files as the audit target.
- It should return findings, evidence, recommendations, and residual uncertainty, not only a Goal Contract.
- It should not run ITERATE or VERIFY because no mutation or completion claim is requested.

```text
$goal-loop 比较当前分支和某个已有 MR 的方案差异，只读。
```

Expected behavior:

- It should ask for the MR/branch identifier when the comparison object is missing.
- With a concrete object, it should frame a `COMPARISON_ONLY` read-only comparison.
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

- It should frame the user-facing page/workspace as a container, not as one data model or the Goal Loop `Artifacts` field.
- It should distinguish the affected submodule, data entity, source interface, and log evidence from neighboring healthy modules.
- It should treat the interface/log evidence for the affected module as the primary diagnostic boundary unless evidence links it to another module.
- It should return a read-only diagnosis and next evidence plan, not mutate files.

```text
$goal-loop 修复一个低风险纯函数 bug：某个输入返回值错误，已有 focused failing test 指向单个分支错误。
```

Expected behavior:

- It should still require debug evidence before a bug-fix claim.
- It may use a compact Debug Receipt because the boundary is a low-risk single-function failure.
- It should verify the focused failure path after the patch and narrow the final claim to the tested local boundary.
- It should not require incident-style RCA, durable spec, plan, or review unless new evidence expands the risk.

```text
$goal-frame 这是一个多仓 workspace，帮我先 frame “补充产物上传 TOS 日志”，不要改文件。
```

Expected behavior:

- It should avoid mutation.
- It should produce a Goal Contract.
- It should record candidate repos and existing work if likely.

```text
$goal-iterate 根据上面的 Goal Contract 做一轮最小变更。
```

Expected behavior:

- It should run or manually record mutation preflight.
- It should refuse mutation if target is not closed or edit path is unsafe.
- It should produce an Iteration Record, not a final claim.

```text
$goal-review 检查当前实现方向、反馈和证据缺口。
```

Expected behavior:

- It should not mutate files.
- It should produce a Review Record.
- It should route to iteration, verification, reframe, or blocked.

```text
$goal-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

Expected behavior:

- It should map acceptance items to evidence.
- It should produce a Verification Verdict.
- It should route to final, next iteration, reframe, or blocked.
