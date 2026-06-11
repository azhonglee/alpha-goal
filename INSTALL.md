# Installation and Smoke Test

## Install user-level

```bash
mkdir -p "$HOME/.agents/skills"
unzip codex-goal-loop-skills.zip -d "$HOME/.agents/skills"
python "$HOME/.agents/skills/tools/validate_skillset.py" "$HOME/.agents/skills"
```

## Install repo-level

```bash
mkdir -p .agents/skills
unzip codex-goal-loop-skills.zip -d .agents/skills
python .agents/skills/tools/validate_skillset.py .agents/skills
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
$goal-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

Expected behavior:

- It should map acceptance items to evidence.
- It should produce a Verification Verdict.
- It should route to final, next iteration, reframe, or blocked.
