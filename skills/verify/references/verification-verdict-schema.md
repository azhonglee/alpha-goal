# Verification Verdict Schema

Verification Verdict 判断证据是否支持 final claim。它不继续实现，也不替代 Iteration Record。

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Contract review:
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

## Verdict

一个值：

- `PASS_TO_FINAL`
- `NARROW_CLAIM_AND_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`

## Acceptance evidence matrix

对 approved context 中的每个 acceptance expectation 写：

- evidence；
- boundary；
- status: `covered`、`partially covered`、`not covered`、`blocked`、`not applicable`。

root-cause claim 要记录 symptom、first divergence point、narrowed component、excluded material alternatives、remaining uncertainty。

## Contract review

说明 Goal Contract 或等价 approved context 是否 current，success criteria 是否被验证。若 durable spec 存在且为 draft、superseded 或宽于当前证据，不得过度声明。

## Artifact review

记录 active plan/review/evidence artifact 是否已读取、current、covered、superseded 或 blocked。

## Claim boundary

比较 user wording、implemented boundary、tested boundary、highest practical boundary、gap、final claim allowed。

## Risk/evidence review

记录 risk tier、expected evidence floor、goal type/mode fit、Debug Receipt status、root-cause validation、feedback handling、project rules、final-state freshness。

## Fresh checks run

列出最后一次 material change 之后运行的命令和结果；未运行则写 blocker 或 substitute evidence。

## Diff/scope review

确认 changed files 匹配 target/non-goals，没有越界、无关改动或 primary checkout 污染。

## Feedback review

说明 test/user/reviewer feedback 是否已在 Iteration Record feedback phase 或 Review Record 中处理。

## Judgment

用 1-3 句说明为什么 verdict 成立，以及 final claim 是否需要缩窄。

## Unresolved gaps

列出阻止更宽声明的缺口。

## Required next step

`final`、`loop`、`alpha-goal` 或具体 blocker。

## Final claim allowed

给出最终回复可以说的最宽声明。
