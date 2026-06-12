# Loop Modes

一个 iteration 只选一个主 mode。mode 只定义证据形状，不是额外阶段。

## Modes

- `discovery`：检查 repo、规则、现有行为、日志、ownership、existing work。
- `debug`：复现、隔离、解释 failure，再决定是否修复。
- `tdd`：先建立 failing test 或说明替代 contract check。
- `implementation`：做最小 acceptance-relevant change。
- `refactor`：保持行为不变地简化结构，并用证据证明。
- `spike`：验证可行性；spike evidence 不能直接支持完成声明。
- `hardening`：核心行为工作后补 edge cases、coverage、compatibility、docs 或 cleanup。

## Evidence types

- `gate_evidence`：可满足 approved context、contract、plan 或 completion gate。
- `advisory_audit`：有界 critique/risk scan，不作为 gate。
- `exploration_only`：发现 map 或 source inventory，不作为 gate。
- `delta_review`：原边界 gate evidence 仍新鲜时的窄 follow-up。
- `evidence_audit`：独立审计既有证据，支持 judgment 但不替代 verify。

## Decisions

每轮关闭为一个 decision：

- `continue`：证据支持当前路线；
- `pivot`：证据推翻路线；
- `expand`：Goal 有效但 scope 扩大；
- `harden`：核心行为可用但仍有风险/证据缺口；
- `finish`：acceptance 看似满足，可进入 verify。

## Debug Receipt

debug 先证明，再修复。Keep it compact but falsifiable.

- For low-risk pure-function or single-branch failures with focused failing-test and direct code-divergence evidence, a one-paragraph receipt is enough if it names symptom, failing path, branch divergence, fix surface, and post-fix evidence; mark irrelevant entity/log fields `not applicable`.
- 对 entity 或 module ambiguity，保留 competing hypotheses，直到证据解释为什么替代项更弱或 out of scope。
- If logs or APIs point to a different submodule than the approved target, return to `alpha-goal` instead of forcing the evidence into the old target.

```text
Debug Receipt:
- Symptom:
- Reproduction:
- Problem-space decomposition:
- Competing hypotheses:
- Probe:
- Evidence:
- Entity/interface/log alignment:
- Root cause statement:
- Root cause validation:
- Fix surface:
- Status: ROOT_CAUSE_CONFIRMED | NOT_REPRODUCED | BLOCKED
- Decision:
```

Status rules:

- `ROOT_CAUSE_CONFIRMED`：证据识别 first divergence point，链接 affected entity/state 和 interface boundary，解释相关 log/trace/runtime observation，排除或界定 material alternatives，支持最小可信 fix surface。
- `NOT_REPRODUCED`：尝试复现但未观察到；不得声明 fixed。
- `BLOCKED`：缺日志、命令、文件、环境或 scope，无法诊断。

只有 `ROOT_CAUSE_CONFIRMED` 授权修复 action。`NOT_REPRODUCED` 只能支持有边界的 diagnostic/no-fix claim。
