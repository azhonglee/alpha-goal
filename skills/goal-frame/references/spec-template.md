# Spec Template

仅当 `goal-frame` 判定需要 durable requirements artifact 时使用。小任务把 compact spec 写进 Goal Contract 的 `Spec` 字段即可。

Spec 说明 what/why/boundaries/success criteria，不拆执行步骤，也不替代 dynamic plan、Iteration Record 或 Verification Verdict。

## Metadata

- Title:
- Status: draft | reviewed | approved | superseded
- Owner:
- Source request:
- Related Goal Contract:
- Loop type:
- Risk tier: low | medium | high
- Claim boundary:
- Approval basis:
- Supersedes:
- Last updated:

Status:

- `draft`：需求还在形成；需要批准时不能当成 approved。
- `reviewed`：已检查清晰度和证据；不自动等于 approved。
- `approved`：用户接受，或在已记录 decision boundaries 内足够清楚。
- `superseded`：仅作历史，不得执行。

## Intent

为什么要做这个 goal？

## Desired Outcome

完成后用户可见或系统可见的结果是什么？

## Scope

In scope:

-

Out of scope:

-

## Success Criteria

-

## Acceptance Evidence

每个 success criterion 需要什么证据？

-

## Decision Boundaries

You may decide:

-

You must ask before:

-

## Constraints

-

## Assumptions And Risks

- Assumption:
  - Basis:
  - Risk if wrong:
- Risk:
  - Mitigation:

## Debug / Root-Cause Frame

仅 bug、incident 或 root-cause goal 需要 durable diagnostic context 时使用。

- Symptom:
- Expected vs actual:
- Problem-space decomposition:
  - Entities:
  - Interfaces:
  - State/lifecycle:
  - Logs/observability:
- Competing hypotheses:
  - Hypothesis:
    - Supports:
    - Contradicts:
    - Next probe:
- Root-cause claim to validate:

## Open Questions

-

## Brownfield Evidence

- Source:
  - Finding:
  - Impact:

## Change Log

追加需求、澄清、边界或 approval 变化。不要删除历史；把过期内容标记为 `superseded`。

- Version:
  - Changed:
  - Reason:
  - Evidence:
