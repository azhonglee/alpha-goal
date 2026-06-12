---
name: goal-frame
description: Stage skill for the goal-loop package. 用 Discovery 和 Socratic interview 澄清目标，产出包含 inline Spec 的 Goal Contract，并只在风险、复杂度、handoff 或用户要求时创建 durable spec artifact。Use only when explicitly named by the user or selected by goal-loop for ambiguous requirements, unclear target repo/path, multi-repo workspaces, existing work discovery, acceptance criteria, claim boundary, clarification, and spec escalation.
---

# Goal Frame

你的职责是把请求澄清成可执行、可验收、可声明边界清楚的 Goal Contract。不要编辑实现文件，不要创建分支、worktree、commit、push 或 MR/PR。

FRAME 由两步组成：

1. `Discovery`：用只读证据确认目标、上下文、约束和已有工作。
2. `Socratic interview`：只在关键决策无法安全推断时提出一个高杠杆问题。

产物是 Goal Contract；它必须包含 `Spec` 字段，并把验收、范围、约束、声明边界和证据计划收进 Spec，而不是在顶层重复铺开。小任务使用内联 compact spec；只有升级条件成立且 artifact 写入被允许时，才创建或更新 durable spec 文件。

## Entry

使用本技能，当：

- task 是新需求、非平凡需求或可能 mutation；
- target repo/path/service/module 不清楚；
- workspace 有多个候选 repo、submodule 或 package；
- 用户术语可能是页面、空间、工作区、容器或 umbrella concept；
- 请求可能与已有 MR/PR/branch/issue/design doc 重叠；
- acceptance、non-goals、constraints、claim boundary 不清楚；
- verification 返回 `REFRAME`。

`Loop type` 必须取 `goal-loop` 定义的一个原子值。不要把阶段状态写进 loop type：只读 frame 一个未来实现目标时，仍使用 `NEW_GOAL`；只读 frame 一个 bug 修复目标时，仍使用 `DEBUG_GOAL`；只有用户最终要求本身是只读审计、诊断、比较或方向判断时，才使用 `READ_ONLY_DISCOVERY`。

## Discovery

只收集能决定“是否安全执行”的信息：

- user intent 和期望 outcome；
- target repo/path/service/module，以及候选项排除理由；
- 容器型目标的子模块、数据实体、source API/RPC、日志和代码符号；
- 本地规则，如 `AGENTS.md`、`CLAUDE.md`、`code_review.md`；
- 现有分支、MR/PR、issue、design doc 或本地改动是否改变任务身份；
- scope、non-goals、constraints、decision boundaries；
- isolation requirement：owning repo/subrepo、ignored worktree root、allowed edit path；
- risk tier、evidence plan、claim boundary；
- spec need：inline compact spec 还是 durable spec。

bug/debug/root-cause 任务保持紧凑：记录 symptom、expected vs actual、reproduction boundary 或 blocker、problem-space decomposition、初始 competing hypotheses，以及区分假设所需证据。low-risk single-function failures 有 focused failing test 和直接分支证据时，可用一句话覆盖这些字段。

按需加载引用：

- `references/target-discovery.md`：target、multi-repo、existing work 或容器/实体边界不清。
- `references/clarification-policy.md`：判断是否询问、假设、Socratic interview 或 `ASK_USER`。
- `references/goal-contract-schema.md`：字段定义、风险较高或输出边界需精确。
- `references/spec-template.md`：需要 durable spec 文件。
- `references/frame-examples.md`：路由或输出形状不确定。

示例只说明形状，不得复制其中事实。

## Socratic interview

先读可发现证据，再问用户。每轮最多一个问题。

优先问会改变以下内容的决策：

- target 或 ownership；
- acceptance、non-goals、constraints；
- destructive/remote/production/credential 风险接受；
- product-level claim boundary；
- 两个互斥实现方向或验收标准；
- 用户意图与仓库规则冲突。

能安全推断时不问，记录 bounded assumption 和风险。缺失输入会改变 mutation safety、scope、acceptance 或 final claim 时，返回 `ASK_USER`。

## Spec policy

`Spec` 是 Goal Contract 的需求载体：

- 小任务：写 3-8 行 inline compact spec，覆盖 outcome、scope/non-goals、acceptance、constraints/decision boundary、claim boundary、evidence。
- 复杂任务：`Spec` 字段引用 durable spec path/status，并给出同样维度的摘要。

只有以下情况才创建或更新 durable spec：

- 澄清跨多轮，聊天中容易丢失需求；
- 跨多个独立阶段、模块、repo、ownership boundary 或 handoff；
- acceptance、non-goals、constraints 或 decision boundaries 过长；
- risk tier 是 high，或 medium 且 scope drift 风险真实存在；
- 用户要求 spec、design artifact、durable requirements 或 handoff document。

默认路径：

```text
docs/design/YYYYMMDD-<slug>-spec.md
```

写 spec 文件前必须闭合 target repo/path 和 applicable rules；只读任务或禁止写文件时，在对话中草拟 spec，不写文件。

## Goal Contract

输出一个紧凑契约：

```text
Goal Contract:
- Intent:
- Loop type:
- Target:
- Discovery:
- Socratic state:
- Spec:
- Risk tier:
- Risks and assumptions:
- Artifacts:
- Existing work:
- Frame verdict:
- Next:
```

`Spec` 写稳定需求。需要分行时使用：

```text
Spec:
- Outcome:
- Scope:
- Acceptance:
- Constraints:
- Claim boundary:
- Evidence:
```

`Scope` 同时写 in-scope 和 out-of-scope。`Constraints` 包含 decision boundaries。`Artifacts` 只写 loop/process artifacts，例如 durable spec、plan、review、evidence、scratch。不要把业务对象、UI 区块、数据库记录或产品产物放进 `Artifacts`。

Allowed `Frame verdict` values:

- `READY_FOR_ITERATION`
- `ASK_USER`
- `READ_ONLY`
- `COMPARISON_ONLY`
- `BLOCKED`

## Exit

返回 `READY_FOR_ITERATION` 仅当：

- target boundary 已闭合；
- `Spec.Acceptance` 可验证；
- `Spec.Claim boundary` 明确；
- `Spec.Scope`、`Spec.Constraints`、`Spec.Evidence` 已记录；
- risk tier、assumptions、risks 已记录；
- `Spec` 已包含内联内容，或 durable spec path/status/current summary 已记录；
- 容器/umbrella 术语已拆分，或风险被明示；
- 触发 existing-work scan 时已检查；
- 没有阻塞 mutation safety 的用户决策缺失。

返回 `READ_ONLY` 时，如用户要求审计发现，Goal Contract 后继续给 findings、evidence、recommendations 和 residual uncertainty。

返回 `COMPARISON_ONLY` 时，只比较既有工作，不进入实现。

返回 `ASK_USER` 时仍输出 Goal Contract，并在 `Next` 写明一个精确问题。

返回 `BLOCKED` 时写清缺失数据、权限、环境或工具。
