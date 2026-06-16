---
name: goal-contract
description: "Convert ambiguous engineering, debugging, design, or artifact requests into a safe 目标契约: reference state, scope, non-goals, decision boundaries, acceptance evidence, and implementation authorization."
---

# 目标契约

Use this skill to form the reference state for a controlled engineering effort. It turns intent into a 目标契约 before any mutation-capable iteration begins.

## Control interpretation

In engineering-cybernetics terms, this skill defines the setpoint and safe control boundary:

- `reference`: desired outcome and acceptance criteria;
- `error signal`: what would count as mismatch between desired and current state;
- `actuator boundary`: what `control-loop` may change, probe, or delegate;
- `sensor plan`: what evidence can observe success, failure, or root cause;
- `control memory`: the ledger state that preserves reference/current/error/route history across stages;
- `stability conditions`: non-goals, stop conditions, claim boundary, and reframe triggers.

## Boundaries

- Do not edit implementation files, push, open PRs/MRs, deploy, repair data, request credentials, or claim implementation completion.
- Default to writing process artifacts under `.alpha-goal/`. Before the first write in a repository, ensure `.alpha-goal/` is ignored; if it is missing from the repo root `.gitignore`, add `.alpha-goal/` there before writing ledger artifacts.
- Keep ledger state in chat only when the user explicitly forbids file writes, no repository path exists, or `.gitignore` cannot be updated safely.
- Ask only for user-owned decisions. Discover codebase or document facts yourself when safe and available.
- 目标契约 acceptance authorizes only handoff to `control-loop`; it does not authorize push, deployment, data repair, production actions, or external side effects.
- For diagnostics, do not assume repair authorization merely because a plausible cause exists. Define what evidence authorizes repair.
- Keep proportionality: gather only what materially changes scope, risk, authority, evidence, or next safe action.

## Load resources when needed

- `references/ambiguity-scoring.md`: score uncertainty only when it changes clarification effort or handoff safety.
- `references/indicator-handoff.md`: convert qualitative objectives or synthesis indicators into measurable evidence.
- `references/goal-contract-schema.md`: produce a durable or handoff-ready 目标契约.

## Process

```text
Observe request -> Model uncertainty -> Clarify -> Pressure-test -> Crystallize -> Review -> Handoff
```

### 1. Observe request

Collect enough context to classify the problem:

- user intent, desired outcome, proposed solution, deadline, constraints, and non-goals;
- target repo/path/service/module/document/data/workflow and likely touchpoints;
- existing work, durable specs, incidents, logs, tickets, or prior decisions;
- 综合轮次 indicators, qualitative objectives, or metrics that must become observable evidence;
- unknowns that affect authority, scope, risk, acceptance, decision boundaries, or claim wording;
- for brownfield work, facts observed directly versus inferences.

If a 闭环台账 exists, read its `最新控制路由` and current control state before changing the 目标契约. Recover route fields from `.alpha-goal/YYYYMMDD-<slug>/control-state.md`, not from the TUI summary. If it conflicts with current user intent or fresh facts, label the superseded state and reframe instead of silently continuing.

If the system boundary or feedback signals are too unclear to write a reliable contract, route to `system-model` first and return with a model summary.

### 2. Model uncertainty

Score ambiguity only to guide effort, not to create ceremony. Use `low / medium / high` unless numeric scoring helps.

Clarity dimensions:

- Intent clarity: why this matters.
- Outcome clarity: what end state is wanted.
- Scope clarity: what is included and excluded.
- Constraint clarity: technical, business, safety, legal, or timing limits.
- Success clarity: how completion will be judged.
- Context clarity: brownfield facts, existing work, ownership, and environment.
- Control clarity: observability, controllability, disturbances, and claim boundary.

Numeric option:

```text
Greenfield ambiguity = 1 - (intent*0.25 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.15)
Brownfield ambiguity = 1 - (intent*0.20 + outcome*0.20 + scope*0.18 + constraints*0.14 + success*0.14 + context*0.14)
Control ambiguity = 1 - (reference*0.25 + actuator_boundary*0.20 + sensor_plan*0.20 + disturbance_bounds*0.15 + claim_boundary*0.20)
```

Default thresholds:

- `quick`: ambiguity <= 0.30 for low-risk framing.
- `standard`: ambiguity <= 0.20 for ordinary implementation handoff.
- `deep`: ambiguity <= 0.15 for broad, high-risk, multi-repo, data, security, or production-affecting work.

### 3. Clarify

Ask only when material user-owned uncertainty remains. Prefer one high-leverage question per round.

Priority order:

1. intent, outcome, scope, non-goals, and authority;
2. acceptance evidence, claim boundary, and stop conditions;
3. constraints, tradeoffs, and user-owned decisions;
4. brownfield context only when it cannot be discovered safely.

Readiness gates before handoff:

- target and desired outcome are explicit enough to detect error;
- included scope and excluded non-goals are clear;
- decision boundaries state what the agent may decide without confirmation;
- acceptance criteria and evidence expectations are testable enough for the next action;
- material qualitative goals have an 指标交接 with sensor, threshold or tolerance, and evidence boundary, or an explicit missing-sensor gap;
- diagnostic contracts define symptoms, observations, hypotheses, and root-cause evidence needed before repair;
- claim boundary states what final wording may and may not say;
- at least one pressure pass has checked an assumption, example, counterexample, or tradeoff for non-trivial work.

If the user stops early, either narrow the artifact, ask for explicit risk acceptance, or return a bounded unresolved-gap contract.

### 4. Pressure-test

Use lenses only when they reduce real uncertainty:

- `contrarian`: what assumption would make this goal wrong?
- `simplifier`: what is the smallest useful scope?
- `ontologist`: what entity, state, or cause is really changing?
- `evidence-checker`: how would we know the result is wrong?
- `disturbance-checker`: what external change or hidden coupling can destabilize the plan?

Follow-up ladder:

1. Ask for a concrete example, counterexample, or evidence signal.
2. Probe the dependency that makes the answer true.
3. Force a tradeoff: exclude, defer, or reject something.
4. If the answer stays symptom-level, reframe toward state, boundary, or root cause.

### 5. Crystallize

Produce the lightest safe artifact:

- `Clarifying question`: name the user-owned decision.
- `Bounded exploration answer`: summarize findings, evidence, residual uncertainty, and whether a 目标契约 is needed before mutation.
- `Design/spec`: resolve a decision boundary without authorizing implementation.
- `目标契约`: authorize a bounded `control-loop` handoff after user acceptance.
- `Diagnostic Contract`: authorize diagnosis first, and repair only after recorded root-cause evidence.

Persist full artifacts under `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md` by default and update the 闭环台账 artifact registry. Show a compact Markdown-table `契约摘要` in the TUI by default. Print the full contract in chat only when the user asks, file persistence is blocked, or explicit user acceptance requires reviewing all contract fields in the conversation.

目标契约结构:

```text
目标契约:
- 元数据: 配置档、轮次、最终模糊度、上下文类型、日期 / slug
- 参考状态: 期望结果与最终声明边界
- 当前状态: 已观察事实、推断、未解决不确定性
- 范围: 范围内、范围外、非目标
- 控制模型: 被控对象、允许的控制变量、可观测信号、扰动、耦合风险
- 指标交接: 定性目标、指标 / 代理、操作化定义、传感器、测量时机、阈值 / 容差、证据边界、负责人、路由触发条件
- 决策边界: agent 可决策事项与用户自有决策
- 约束与假设: 已解决假设与条件
- 验收标准: 可验证的证据预期
- 诊断闸门: 症状、假设、所需原因证据、修复授权闸门（如适用）
- 压力测试发现: 假设 / 取舍 / 证据探测
- 交接: 已接受指标、允许的首轮循环模式、证据下限、停止 / 重构触发条件
- 台账更新: `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 路径、产物路径、可选 Schema 辅助索引路径、最新误差信号、下一路由，或明确的无法写入原因
```

TUI 摘要:

```markdown
契约摘要

| 字段 | 内容 |
| --- | --- |
| 参考 | |
| 范围边界 | |
| 证据 | |
| 产物 | |
| 下一步 | |
```

默认持久化路径:

```text
.alpha-goal/YYYYMMDD-<slug>/goal-contract.md
.alpha-goal/YYYYMMDD-<slug>/control-state.md
.alpha-goal/YYYYMMDD-<slug>/interviews.md
```

Write a committed design document outside `.alpha-goal/` only when the user or repository explicitly requests one.

### 6. Review

Self-review the artifact:

- Does it answer the actual request rather than fill a template?
- Are non-goals, actuator boundary, sensor plan, and claim boundary explicit?
- Are qualitative objectives connected to indicators, sensors, thresholds/tolerances, and evidence boundaries where needed?
- Are observed facts labeled separately from inference?
- Would `control-loop` know what not to do?
- Would `evidence-verify` know what evidence is required?
- Would a later skill recover reference, current state, latest control route, last error, and next route from `.alpha-goal/YYYYMMDD-<slug>/control-state.md` or an explicitly justified no-write chat state?
- Does any next step require user permission, risk acceptance, credentials, external side effects, data repair, push, PR/MR, deployment, or production access?

If review fails, return to the earliest phase that can fix it.

### 7. Handoff

Handoff means passing a user-accepted 目标契约 to `control-loop`. Non-contract artifacts inform later work but do not authorize implementation.

When a contract is ready, ask the user to accept, reject, or change it unless the runtime already contains explicit acceptance.
- If accepted, update `.alpha-goal/YYYYMMDD-<slug>/control-state.md` with reference, current state, actuator boundary, evidence floor, artifact path, and next route before handoff. If `.alpha-goal/` is not ignored, add it to the repo root `.gitignore` first. If writing is explicitly forbidden or impossible, include the ledger state and full contract in chat and state the no-write reason.
- If rejected or changed, return to clarification.
