# Review Record Schema

Review Record 是可选辅助审查产物，用来挑战 goal-loop workflow 中的方向、反馈、scope 或架构风险。它不做最终完成判断。

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

## Fields

### Mode

`goal`、`loop`、`code`、`architecture`、`scope`、`feedback`、`completion`。

### Target

被审查的 Goal Contract、dynamic plan、Iteration Record、diff、feedback item、architecture choice 或 readiness claim。

### Evidence basis

读过的文件、diff、命令输出、artifact、feedback。说明缺失证据。

### Freshness boundary

审查覆盖到的 commit、diff、artifact version 或最后 material change。

### Findings

以 correctness、regression、missing evidence、scope、entity alignment、safety 为优先。代码审查给 file/line references。诊断任务说明 problem-space decomposition、hypotheses、entity/API/log/code alignment 和 root-cause validation 是否充分。

### Feedback classification

`accepted`、`rejected`、`needs_clarification`、`blocked`。

### Artifact review

active spec/plan 是否 current、draft、approved、superseded、over-broad 或 inconsistent。

### Scope/architecture notes

记录 ownership、coupling、复杂度、替代方案和 scope creep。

### Risk tier

`low`、`medium`、`high`，以及证据门槛是否足够。

### Required evidence

进入 verify 前缺少的测试、probe、artifact update 或 feedback action。

### Review verdict

`CONTINUE`、`NEXT_ITERATION`、`REFRAME`、`SIMPLIFY`、`BLOCKED`、`READY_FOR_VERIFY`。

### Next

`goal-iterate`、`goal-frame`、`goal-verify` 或 blocker。
