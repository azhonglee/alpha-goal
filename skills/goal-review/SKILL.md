---
name: goal-review
description: Optionally challenge an active Goal Contract, dynamic plan, iteration feedback, diff, architecture, scope, or readiness risk. Use only when explicitly named, required by repo rules, or selected because feedback risk needs independent review; not for ordinary standalone code review outside a goal-loop workflow.
---

# Goal Review

`goal-review` 不是默认主阶段。普通执行反馈由 `goal-iterate` 的 feedback phase 处理；只有需要独立挑战时才使用本技能。

不要 mutation。不要批准完成。完成判断交给 `goal-verify`。

## Entry

使用本技能，当：

- 用户显式点名 `$goal-review`；
- 仓库规则要求 review record；
- `goal-iterate` feedback phase 判断有架构、scope、ownership、复杂度或 claim-boundary 风险；
- reviewer/user feedback 需要在 action 前分类；
- active spec/plan 可能 stale、over-broad、superseded 或与证据不一致；
- completion readiness 需要独立挑战，但最终 verdict 仍要由 `goal-verify` 给出。

普通 standalone code review 且没有 Goal Contract 或 completion claim 时，不强制 Goal Loop，按用户要求做普通 review。

字段不清时读取 `references/review-record-schema.md`。

## Review modes

选择一个 mode：

- `goal`
- `loop`
- `code`
- `architecture`
- `scope`
- `feedback`
- `completion`

## Checks

优先挑战：

- 哪个假设可能是错的；
- evidence 是否新鲜、直接、覆盖 claim boundary；
- user-facing term、UI module、data entity、API/RPC、log、code symbol 是否指向同一对象；
- dynamic plan 是否仍是最小可信路线；
- feedback 是否被分类，而非盲目实现；
- scope 是否越过 repo、worktree、submodule 或 ownership boundary；
- spec/plan 是否 current，且没有把 `draft` 或 `superseded` 当成 approved/current；
- debug receipt 是否在对应风险边界证明 `ROOT_CAUSE_CONFIRMED`；
- 更简单方案是否满足 acceptance。

## Feedback classification

逐项分类：

- `accepted`：技术上正确且在 goal scope 内。
- `rejected`：错误、不安全或越界；说明原因。
- `needs_clarification`：缺用户决策，不能安全实现。
- `blocked`：缺数据、凭证、权限或环境。

若反馈改变 target、acceptance、constraints、non-goals 或 claim boundary，返回 `REFRAME`，不要直接 implementation。

## Output

产出一个 Review Record：

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

Allowed `Review verdict` values:

- `CONTINUE`
- `NEXT_ITERATION`
- `REFRAME`
- `SIMPLIFY`
- `BLOCKED`
- `READY_FOR_VERIFY`

`READY_FOR_VERIFY` 只表示可交给 `goal-verify` 判断，不等于完成。
