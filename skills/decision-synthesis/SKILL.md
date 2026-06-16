---
name: decision-synthesis
description: "Apply decision-synthesis to complex engineering or socio-technical systems: integrate qualitative judgment, quantitative evidence, stakeholder constraints, models, contradictions, and user-owned decisions before forming a 目标契约."
---

# 决策综合

Use this skill when the problem behaves like a complex system rather than a simple implementation task. It helps synthesize goals and decision boundaries before `goal-contract`, `system-model`, or `control-loop` proceeds.

## When to use

Use when the request includes:

- multiple stakeholders with conflicting objectives;
- weakly quantified success, qualitative preferences, or strategic tradeoffs;
- high uncertainty, incomplete data, or changing environment;
- broad architecture, migration, organizational workflow, safety, compliance, research, or product strategy;
- many interacting subsystems where optimizing one part can destabilize another;
- need to combine expert judgment, empirical evidence, models, and scenario analysis.

Do not use for localized low-risk tasks with clear acceptance and direct evidence.

## Boundaries

- Do not mutate implementation files, deploy, push, repair data, or claim final completion.
- Do not invent stakeholder preferences or user-owned risk decisions.
- Do not treat a synthesis as implementation authorization. Convert the selected direction into a 目标契约 via `goal-contract` before mutation.
- Separate facts, expert judgments, assumptions, hypotheses, scenarios, and decisions.
- When a 闭环台账 exists, read its `最新控制路由` from `.alpha-goal/YYYYMMDD-<slug>/control-state.md` before synthesis and update only synthesis-relevant state: objective conflicts, user-owned decisions, scenario assumptions, and the recommended route.

## Load resources when needed

- `references/complexity-triage.md`: classify simple, complicated, complex, or complex-giant-like requests.
- `references/stakeholder-decision-boundaries.md`: distinguish recommendation from user-owned decisions.
- `references/synthesis-round.md`: run human-machine qualitative/quantitative convergence rounds.
- `references/synthesis-record-schema.md`: produce a durable or handoff-ready 决策综合记录.
- `references/meta-synthesis-hall.md`: run a 综合集成厅 with roles, hypothesis bank, model registry, dissent, and convergence conditions.

## Process

```text
Triage complexity -> Collect perspectives -> Build synthesis map -> Run synthesis rounds -> Resolve decisions -> Produce synthesis record -> Route
```

### 1. Triage complexity

Classify the problem:

- `simple`: known goal, known path, direct evidence; route out.
- `complicated`: many parts but decomposable with stable objective; use `system-model` or `goal-contract`.
- `complex`: feedback, adaptation, ambiguity, or conflicting goals; continue synthesis.
- `complex-giant-like`: many subsystems, human decisions, weak observability, high stakes, and no single complete model; use full synthesis and explicit human decision gates.

### 2. Collect perspectives

For each relevant perspective, record:

- objective or concern;
- evidence, model, or expertise basis;
- uncertainty and assumptions;
- conflict with other perspectives;
- decision owner;
- evidence that could change the decision.

Perspectives may include user, customer, operations, security, legal/compliance, engineering, data, UX, research, maintainability, cost, delivery, and long-term strategy.

### 3. Build synthesis map

Create a qualitative-quantitative map:

```text
综合图:
- 系统目的:
- 候选目标:
- 约束:
- 利益相关方与决策负责人:
- 子系统与交互:
- 关键状态变量:
- 可用证据与置信度:
- 缺失证据:
- 冲突 / 取舍:
- 场景:
- 稳定性风险:
- 候选控制策略:
```

Use quantitative evidence when available, but do not force false precision. Qualitative judgments must be labeled and tied to the owner or source.

### 4. Run synthesis rounds

For `complex` and `complex-giant-like` cases, or whenever perspectives conflict, run one or more `综合轮次` records before resolving decisions. Load `references/synthesis-round.md` for the schema. For complex-giant-like work, use the 综合集成厅 from `references/meta-synthesis-hall.md` to preserve roles, hypotheses, models, dissent, and convergence conditions.

Each round must connect:

- human or expert judgment and its decision owner;
- machine evidence, model output, tests, logs, metrics, or probes;
- 综合集成厅 state when many hypotheses, models, or stakeholder perspectives remain active;
- the conflict, contradiction, or missing sensor;
- any metric/proxy that could turn qualitative judgment into bounded evidence;
- the 指标交接 candidate that should become acceptance or sensor evidence;
- the user-owned decision or next hypothesis that would reduce uncertainty.

Stop when the smallest next action is clear: a 目标契约 candidate, a system-model question, a user decision, a blocker, or a bounded validation hypothesis.

### 5. Resolve decisions

Identify:

- decisions the agent can recommend;
- decisions the user must make;
- risks requiring explicit acceptance;
- non-goals that stabilize the effort;
- minimum viable next contract;
- evidence needed before irreversible action.

If a stakeholder conflict cannot be resolved, return a decision request rather than choosing silently.

### 6. Produce synthesis record

Persist the full 决策综合记录 under `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md` by default and update the 闭环台账 artifact registry. Show a compact Markdown-table `综合摘要` in the TUI by default. Print the full synthesis in chat only when the user asks, file persistence is blocked, or a user-owned decision requires reviewing the full tradeoff in the conversation.

紧凑记录字段:

```text
决策综合记录:
- 复杂度类型:
- 核心张力:
- 综合集成厅:
- 最新综合轮次:
- 综合视图:
- 推荐方向:
- 用户自有决策:
- 非目标:
- 所需证据:
- 指标交接:
- 路由:
```

TUI 摘要:

```markdown
综合摘要

| 字段 | 内容 |
| --- | --- |
| 核心张力 | |
| 推荐方向 | |
| 用户决策 | |
| 产物 | |
| 下一步 | |
```

完整产物字段:

```text
决策综合记录:
- 复杂度类型:
- 系统目的:
- 利益相关方 / 视角:
- 证据与模型:
- 定性判断:
- 定量信号:
- 综合集成厅:
- 综合轮次:
- 指标交接:
- 矛盾与取舍:
- 场景:
- 候选策略:
- 推荐方向:
- 决策边界:
- 风险与显式接受:
- 最小可行目标契约候选:
- 台账更新: `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 路径、产物路径、可选 Schema 辅助索引路径、综合状态变更、下一路由，或明确的无法写入原因
- 路由:
```

### 7. Route

- Route to `goal-contract` when a stable recommended direction and 指标交接 can become a 目标契约.
- Route to `system-model` when subsystem boundary or feedback signals remain unclear.
- Route to user when a user-owned decision, risk acceptance, budget/timeline tradeoff, or stakeholder priority is required.
- Route to `evidence-verify` only when synthesis did not authorize mutation and the next action is comparing an existing evidence bundle to a proposed claim.
- Route to `control-loop` only if a valid 目标契约 already exists and synthesis merely narrowed the next slice without changing authorization.
