---
name: alpha-goal
description: "Route engineering, debugging, design, and verification work through the closed-loop control skill suite: goal-contract, system-model, control-loop, evidence-verify, and decision-synthesis. Use when the next skill or control boundary is unclear. Use for any engineering, debugging, design, or verification request."
---

# Alpha Goal

Use this skill to select and stabilize the next action in the skill suite. It is a router and control governor, not an implementation skill.

## 控制论框架

Treat the user request as a control problem:

- `reference`: desired outcome, acceptance criteria, and final claim boundary;
- `plant`: repository, product, data flow, document system, workflow, or organization being changed;
- `state`: what is currently known about goal, scope, implementation, evidence, risk, and blockers;
- `observer`: tests, logs, diffs, runtime probes, user feedback, reviewer feedback, and read-only repository facts;
- `actuator`: bounded changes made by `control-loop` under an approved 目标契约;
- `comparator`: `evidence-verify`, which compares fresh evidence against the reference and claim boundary;
- `memory`: a 闭环台账 that carries reference, current state, error, control action, feedback, and route history across skills;
- `adaptation`: 自适应学习记录 that correct reusable control assumptions without silently changing scope or authority;
- `disturbance`: changing requirements, dirty working tree, missing tools, flaky tests, conflicting specs, hidden ownership, broad claims, or external side effects; material items are tracked through 扰动记录.

## 边界

- Do not mutate implementation files, deploy, push, open PRs/MRs, repair data, or claim completion.
- Do not bypass `goal-contract` when the desired reference state is ambiguous.
- Do not bypass `system-model` when observability, controllability, ownership, or coupling is unclear enough to affect safe action.
- Do not bypass `evidence-verify` when making a completion, correctness, readiness, merge, ship, or safety claim.
- Keep routing proportional: choose the smallest next skill that reduces material uncertainty.
- Default to durable process memory under `.alpha-goal/`. Before the first write in a repository, ensure `.alpha-goal/` is ignored; if it is missing from the repo root `.gitignore`, add `.alpha-goal/` there before writing ledger artifacts.
- Use chat-only ledger state only when the user explicitly forbids file writes, no repository path exists, or `.gitignore` cannot be updated safely.

## 按需加载资源

- `references/cybernetic-routing.md`: route selection and stability failure patterns.
- `references/closed-loop-ledger.md`: cross-stage state memory schema and update rules.
- `references/artifact-layout.md`: task-scoped `.alpha-goal/YYYYMMDD-<slug>/xxx` runtime artifact layout.
- `references/cybernetic-conformance.md`: state transition, schema sidecar, and closed-loop invariant checks.

## 流程

```text
Classify state -> Select next skill -> Check stability gates -> Persist route card -> Show route summary
```

### 1. Classify state

Identify the current dominant uncertainty. If a 闭环台账 exists, read its latest reference, current state, residual error, and route decision before classifying:

- unclear target, intent, scope, non-goals, acceptance, or authorization -> goal ambiguity;
- unclear plant boundary, state variables, observability, controllability, disturbances, or coupling -> model ambiguity;
- unclear controller hierarchy, local/global objective conflict, or coupling arbitration -> coordination ambiguity;
- approved goal exists and a bounded action can improve evidence or implementation -> execution need;
- repeated residual error, failed threshold, or contradicted control assumption -> adaptation need;
- work appears done but claim/evidence boundary is unresolved -> verification need;
- many stakeholders, weak quantification, conflicting values, or complex giant-system behavior -> synthesis need;
- missing tool, permission, data, environment, or user-owned decision -> blocker.

If no ledger exists and the task is likely to span multiple skills, initialize `.alpha-goal/YYYYMMDD-<slug>/control-state.md` after ensuring `.alpha-goal/` is ignored. Add `.alpha-goal/` to the repo root `.gitignore` first when needed.

### 2. Select next skill

Use this routing table:

| 当前状态 | 下一技能 | 原因 |
| --- | --- | --- |
| User asks for implementation but goal boundary is unclear | `goal-contract` | define reference/setpoint before control action |
| Goal is broad and system structure is unclear | `system-model` then `goal-contract` | model the plant before writing the contract |
| Multiple local controllers can affect one global objective | `system-model` or `decision-synthesis` | map hierarchy, coupling, arbitration, and user-owned priorities |
| Active approved 目标契约 exists and mutation/probe is needed | `control-loop` | execute one bounded control action and collect feedback |
| Evidence bundle exists and a final claim is proposed | `evidence-verify` | compare output state to reference and claim boundary |
| Problem is socio-technical, strategic, multi-agent, or complex giant-system-like | `decision-synthesis` | synthesize qualitative and quantitative views before contract |
| Required user-owned decision or external permission is missing | user clarification / blocker | do not invent authority |

### 3. Check stability gates

Before routing to an execution-capable path, ensure:

- the reference state is explicit enough to detect error;
- an execution route has a candidate 控制律: target error, control variable, expected effect, sensor threshold, fallback, and dynamics/stability guards when material;
- the actuator boundary says what may change and what must not change;
- observer signals are available or a missing-observer blocker is stated;
- qualitative objectives have accepted indicators or explicitly missing sensors before execution claims depend on them;
- 实质扰动必须记录可能性、影响、传感器、控制措施和路由触发条件；否则路由到建模、综合、用户或 blocker；
- prior 自适应学习记录 are applied only when reuse conditions hold and invalidation conditions do not hold;
- the ledger records the last error signal and why the selected next skill reduces it, or chat-only state is explicitly justified by a no-write constraint;
- final claims will be checked by `evidence-verify` rather than stated by the executor.
- runtime artifacts use the task-scoped layout from `references/artifact-layout.md`; legacy category paths are treated as validation failures.
- complex, high-risk, resumed, or final handoffs must either produce a conformance report using `references/cybernetic-conformance.md` or state why the report is unnecessary for the narrowed claim.

### 4. Persist route card and show summary

Persist the full route card to the 闭环台账 by default. Do not print the full card in the TUI unless the user explicitly asks for it, persistence is blocked, or the route is high-risk enough that the user must review every field before continuing.

Write or update this section in `.alpha-goal/YYYYMMDD-<slug>/control-state.md`:

```text
最新控制路由:
控制路由:
- 台账路径:
- 活跃状态:
- 主导不确定性:
- 误差信号:
- 控制律:
- 指标转译:
- 自适应学习:
- 控制器层级:
- 扰动记录:
- 选定技能:
- 选择理由:
- 需加载或询问的上下文:
- 安全边界:
- 下一步:
```

Then show only a TUI-friendly summary as a Markdown table:

```markdown
路由摘要

| 字段 | 内容 |
| --- | --- |
| 路由 | |
| 原因 | |
| 边界 | |
| 台账 | |
| 下一步 | |
```

The summary must be enough for the user to understand the selected route without reading a long field list. Keep each table value concise; put long reasoning in the ledger artifact. Other skills must recover the full route from `.alpha-goal/YYYYMMDD-<slug>/control-state.md` instead of relying on the TUI transcript. If writing is explicitly forbidden or impossible, include the full `控制路由` in chat and state the no-write reason in `台账路径`.

If the user explicitly named a skill and the route is safe, respect that selection and state any residual gates.
