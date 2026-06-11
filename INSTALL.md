# Installation and Smoke Test

## Install user-level

```bash
install_root="$HOME/.agents/skills"
mkdir -p "$install_root"
rsync -a --delete goal-loop/ "$install_root/goal-loop/"
rsync -a --delete goal-frame/ "$install_root/goal-frame/"
rsync -a --delete goal-iterate/ "$install_root/goal-iterate/"
rsync -a --delete goal-review/ "$install_root/goal-review/"
rsync -a --delete goal-verify/ "$install_root/goal-verify/"
rsync -a --delete adapters/ "$install_root/adapters/"
rsync -a --delete tools/ "$install_root/tools/"
rsync -a --delete templates/ "$install_root/templates/"
python3 "$install_root/tools/validate_skillset.py" "$install_root"
```

## Install repo-level

```bash
install_root=".agents/skills"
mkdir -p "$install_root"
rsync -a --delete goal-loop/ "$install_root/goal-loop/"
rsync -a --delete goal-frame/ "$install_root/goal-frame/"
rsync -a --delete goal-iterate/ "$install_root/goal-iterate/"
rsync -a --delete goal-review/ "$install_root/goal-review/"
rsync -a --delete goal-verify/ "$install_root/goal-verify/"
rsync -a --delete adapters/ "$install_root/adapters/"
rsync -a --delete tools/ "$install_root/tools/"
rsync -a --delete templates/ "$install_root/templates/"
python3 "$install_root/tools/validate_skillset.py" "$install_root"
```

## 可选用户配置模板

安装后的 `templates/` 目录包含：

- `AGENTS.md`：推荐的自主 Agent 行为和隔离工作流约束。
- `config.toml`：启用 multi-agent 等本地特性的可选 Codex 配置。

不要直接覆盖已有的 `${CODEX_HOME:-$HOME/.codex}/AGENTS.md` 或 `config.toml`。先审阅模板，只合并适合用户环境的设置。

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
