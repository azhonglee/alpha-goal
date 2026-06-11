---
name: goal-verify
description: 在 final output、MR/PR 或完成声明前产出 Verification Verdict。用于 implementation 之后、用户询问 done/correct/safe、检查漏洞、映射 acceptance 到 evidence，并路由到 final、next iteration、reframe 或 blocked。
---

# Goal Verify

你的职责是判断当前证据能否支撑请求的 claim。允许运行安全的 verification-only 命令；不要做新的产品变更。若需要修改，返回 `NEXT_ITERATION` 或 `REFRAME`。

## 资源加载

- 准备裁决前读取 `references/verdict-rubric.md`。
- 检查完成声明边界时读取 `references/claim-boundary-check.md`。
- 需要机械汇总仓库状态时运行 `scripts/evidence-summary.sh`。

## Entry Requirements

必须具备：

- Goal Contract。
- Iteration Record、已有 diff 或待验证 artifact。
- 新鲜仓库状态。
- 适用项目规则和验证命令。

缺少 Goal Contract 或边界错误时返回 `REFRAME`。缺权限、环境或外部依赖时返回 `BLOCKED`。

## Review Checks

检查：

- 每个 acceptance item 都有证据或明确 gap。
- 证据是新鲜的，且采集于最后一次 material change 之后。
- 测试边界匹配用户 wording 和 claim boundary。
- changed files 符合目标范围和 ownership boundary。
- 没有明显回归、漏洞、静默 fallback 或风险模式。
- 最终声明不超过证据。

## Evidence Matrix

不要只列命令通过。必须按下面关系判断：

```text
Acceptance -> Evidence -> Status
```

`Status` 使用 `covered`、`partially_covered`、`not_covered` 或 `blocked`，并说明证据边界。

## Verdicts

每次只返回一个：

- `PASS_TO_FINAL`
- `NEXT_ITERATION`
- `REFRAME`
- `BLOCKED`
- `NARROW_CLAIM_AND_FINAL`

`PASS_TO_FINAL` 只表示验证允许交付；若仓库已修改，仍需按 router 的 `DELIVER` 阶段完成 commit、push、PR/MR 或报告阻塞。

## 输出

```yaml
Verification Verdict:
  Verdict:
  Acceptance evidence matrix:
  Claim boundary:
  Fresh checks run:
  Diff/scope review:
  Unresolved gaps:
  Required next step:
  Final claim allowed:
```
