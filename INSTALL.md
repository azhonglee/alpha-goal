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
- 更新 Codex home 的 `AGENTS.md` 中带 `generate-with-template:agents-md` 标记的受管理模板块；如果没有目标文件则创建。
- 只补齐 Codex home 的 `config.toml` 中缺失的模板设置，不覆盖已有值。
- 清理旧版本可能留在 `skills/` 下、且指向本仓库的旧支持目录软链接。
- 校验目标 `skills/` 中的 skill 软链接指向源码目录，且旧支持目录没有作为本仓库 skill 安装。
- 安装后运行源码中的 `tools/validate_skillset.py` 校验技能包。

如果目标位置已有其他软链接，可以使用：

```bash
scripts/install.sh --force
```

`--force` 只替换软链接，不删除真实文件或真实目录。

## 用户配置模板

源码中的 `templates/` 目录包含：

- `AGENTS.md`：推荐的自主 Agent 行为和隔离工作流约束。
- `config.toml`：启用 multi-agent 等本地特性的可选 Codex 配置。

默认安装会更新真实 Codex home。做 smoke test 或文档验证时，应使用临时 `CODEX_HOME`：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
python3 tools/validate_skillset.py .
rm -rf "$tmp_codex_home"
```

## Smoke test prompts

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
