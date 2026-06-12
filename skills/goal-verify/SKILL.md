---
name: goal-verify
description: Stage skill for the goal-loop package. 对 active Goal Contract 做验收和判断，产出 Verification Verdict，决定证据是否支持 completion、readiness、correctness/safety、MR/PR-ready 或 narrowed claim。Use only when explicitly named by the user or selected by goal-loop; not for standalone read-only code review or advisory audits without a completion claim.
---

# Goal Verify

你的职责是判断当前证据是否足以支持声明。VERIFY 不负责继续实现，也不把“运行过测试”等同于完成。

## Entry

使用本技能，当：

- implementation 看起来完成；
- 有 diff、patch、commit、MR/PR、test result、runtime observation 或 Iteration Record 可验收；
- 用户问 done、ready、correct、safe、ready to merge/ship；
- 最终输出将包含完成、交付、正确性、安全性、MR/PR-ready 或类似声明；
- `goal-iterate` 返回 `ITERATION_READY_FOR_VERIFY`。

不要用于没有 active/recoverable Goal Contract、没有 completion/readiness/correctness claim 的普通 standalone review、安全扫描、loophole scan 或 advisory audit。

## Required inputs

正向 verdict 至少需要：

- Goal Contract，含 target、Spec.Acceptance、Spec.Claim boundary、Risk tier；
- current durable spec/plan，如果 Goal Contract 或 Iteration Record 引用它；
- Iteration Record 或等价的 diff/evidence bundle；
- Debug Receipt，当 loop mode 是 `debug` 或声明修复 bug/root cause；
- final target state 的 fresh repo status；
- applicable project rules，或无法读取的明确原因；
- exact test/check/probe commands and outcomes，或无法运行的明确 blocker；
- feedback phase 对用户/reviewer/test 反馈的处理记录。

缺 Goal Contract、target boundary、`Spec.Acceptance` 或 evidence bundle 时，返回 `REFRAME`，不要猜。

可使用 `scripts/evidence-summary.sh` 收集只读 diff/status 证据。

按需加载引用：

- `references/verification-verdict-schema.md`：字段定义不清时。
- `references/completion-review-rubric.md`：readiness-to-merge、readiness-to-ship 或 final-delivery 判断。
- `references/claim-boundary-check.md`：用户措辞比证据更宽，或考虑 narrowed claim。

## Acceptance and judgment

VERIFY 做两件事：

1. `Acceptance`：逐项映射 Goal Contract 和 Spec 的验收标准到 fresh evidence。
2. `Judgment`：判断证据是否支持用户要说的话，或是否必须缩窄声明、继续迭代、回 frame、block。

检查：

- 每个 `Spec.Acceptance` item 是否有 fresh、relevant、final-state evidence；
- inline/durable Spec 的 success criteria 是否在 claim boundary 内被覆盖或明确排除；
- active plan 的 evidence gate 是否满足、被 superseded，或被 blocker 阻断；
- Iteration Record 的 loop type、dynamic plan、execution、feedback、learning 与最终声明一致；
- bug/root-cause 声明是否有 `ROOT_CAUSE_CONFIRMED`；low-risk local bug fixes without a formal RCA claim 可用 focused failure-path evidence、直接代码分歧和 post-fix tests 支持；
- `NOT_REPRODUCED` 或 `BLOCKED` Debug Receipt 不得被当作 repair completion；
- changed files 是否匹配 target 和 non-goals；
- mutation evidence 是否来自隔离编辑路径，而不是 primary `main`/`master` checkout；
- `.worktrees/` 或 `.goal-loop/` 路径如被使用，是否 gitignored 或已批准；
- tests/checks 是否覆盖被声明的边界，而不是只覆盖邻近 helper、mock-only path 或将被删除的临时路径；
- 失败输出是否被理解；
- 用户/reviewer/test feedback 是否已处理；
- final claim 是否超过 evidence。

## Evidence matrix

显式映射验收：

```text
Acceptance evidence matrix:
- Acceptance:
  Evidence:
  Boundary:
  Status:
```

Allowed status:

- `covered`
- `partially covered`
- `not covered`
- `blocked`
- `not applicable`

## Claim boundary check

最终声明前比较：

```text
Claim boundary:
- User wording:
- Implemented boundary:
- Tested boundary:
- Highest practical boundary:
- Gap:
- Final claim allowed:
```

若用户措辞是 product-level，但证据只到 local helper/reducer-level，不返回 `PASS_TO_FINAL`。选择 `NEXT_ITERATION` 补更高边界证据，或 `NARROW_CLAIM_AND_FINAL` 明确缩窄声明。

## Verdicts

返回一个 verdict：

- `PASS_TO_FINAL`：证据覆盖 acceptance 和 claim boundary。
- `NARROW_CLAIM_AND_FINAL`：本地目标满足，但 final claim 必须窄于用户宽泛措辞。
- `NEXT_ITERATION`：方向正确，但还需要实现或证据。
- `REFRAME`：Goal Contract、target、Spec.Acceptance、Spec.Claim boundary 或 existing-work 关系错误/不完整。
- `BLOCKED`：缺环境、数据、权限、凭证或用户决策。

## Output

产出一个 Verification Verdict：

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Spec review:
- Artifact review:
- Claim boundary:
- Risk/evidence review:
- Fresh checks run:
- Diff/scope review:
- Feedback review:
- Judgment:
- Unresolved gaps:
- Required next step:
- Final claim allowed:
```

## Routing

- `PASS_TO_FINAL`：最终回复可声明 verified boundary 内完成。
- `NARROW_CLAIM_AND_FINAL`：最终回复必须显式写窄声明和剩余高边界缺口。
- `NEXT_ITERATION`：回 `goal-iterate`，不要声明完成。
- `REFRAME`：回 `goal-frame`，不要继续 mutation。
- `BLOCKED`：说明 blocker 和最小缺失输入/权限。
