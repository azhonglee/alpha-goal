# Loop Modes

A mode names the dominant uncertainty in the current iteration; it is not an extra ceremony layer.

## Choose by dominant uncertainty

- `discovery`: unknown target, owner, behavior, rules, logs, or existing work.
- `debug`: unknown cause or first divergence point.
- `tdd`: known desired behavior, missing regression guard.
- `implementation`: known change, uncertain implementation path.
- `refactor`: behavior should stay the same while structure changes.
- `spike`: feasibility unknown and output will not itself prove completion.
- `hardening`: core behavior appears done but evidence, edge cases, compatibility, cleanup, docs, or observability remain weak.
- `evidence-audit`: implementation may already exist, but evidence quality and claim boundary are uncertain.

## Evidence shape

Evidence is useful only if it can change the next decision.

- Gate evidence can satisfy approved context, acceptance, or completion gates.
- Advisory audit identifies risks but does not prove completion.
- Exploration-only evidence maps sources or possibilities without authorizing mutation or final claims.
- Delta review is a narrow follow-up when prior gate evidence remains fresh.
- Blocker evidence shows a missing input, permission, tool, data, environment, or safe-state condition.

## 调试回执

Debug must identify root cause before repair actions. Keep the receipt compact but falsifiable.

```text
调试回执:
- 症状:
- 复现:
- 问题空间拆解:
- 竞争假设:
- 探测:
- 证据:
- 实体 / 接口 / 日志对齐:
- 首个分歧点:
- 根因陈述:
- 根因验证:
- 修复面:
- 状态: ROOT_CAUSE_CONFIRMED | HYPOTHESIS_TESTED | MITIGATION_APPLIED | NOT_REPRODUCED | BLOCKED
- 决策:
```

Status rules:

- `ROOT_CAUSE_CONFIRMED`: evidence identifies the first divergence point, links entity/state to the interface boundary, and bounds material alternatives enough to support the fix surface.
- `HYPOTHESIS_TESTED`: a falsifiable hypothesis was tested with a bounded probe, instrumentation, or reversible change that does not alter the intended fix surface.
- `MITIGATION_APPLIED`: authorized containment or risk reduction was applied without claiming root-cause repair.
- `NOT_REPRODUCED`: reproduction was attempted but not observed; do not claim fixed.
- `BLOCKED`: missing logs, commands, files, environment, data, or scope prevents diagnosis.

Only `ROOT_CAUSE_CONFIRMED` authorizes repair-complete claims, and those claims still require `evidence-verify`.
