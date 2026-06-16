---
name: system-model
description: "Build a control-system model before engineering action: controlled object, state variables, observability, controllability, actuators, disturbances, coupling, controller hierarchy, and evidence sensors. Use for architecture, debugging, brownfield, or complex-system uncertainty."
---

# 系统建模

Use this skill when safe execution depends on understanding the system boundary and feedback signals. It is read-only unless the user explicitly asks for a modeling artifact and artifact creation is safe.

## 使用时机

Use `system-model` when any of these are true:

- the target repo/module/service/document/data flow is unclear;
- symptoms are reported but the failing entity, interface, or state transition is uncertain;
- multiple modules, repos, submodules, generated outputs, teams, or agents could be coupled;
- observability is weak: logs, tests, probes, or feedback signals are missing or stale;
- controllability is weak: it is unclear what variables may be changed safely;
- the work is architectural, migratory, integration-heavy, production-facing, or high blast-radius;
- `goal-contract` cannot produce a reliable 目标契约 without a plant model.

## 边界

- Do not mutate implementation files, repair data, push, deploy, or claim completion.
- Do not decide user-owned goals, risk acceptance, or business tradeoffs.
- Do not over-model simple low-risk work where target, scope, evidence, and ownership are already clear.
- Label observed facts, inferred structure, assumptions, and missing sensors separately.
- If a 闭环台账 exists, read its `最新控制路由` from `.alpha-goal/YYYYMMDD-<slug>/control-state.md` before modeling and update only model-relevant state: plant boundary, state variables, sensors, actuators, disturbances, coupling, and model adequacy.
- Independently review and update the model if needed before routing back to `goal-contract`, `alpha-goal`, or `control-loop`.

## 按需加载资源

- `references/control-model-schema.md`: produce a durable or handoff-ready 控制模型.
- `references/observability-controllability-check.md`: rate sensor and actuator adequacy.
- `references/disturbance-register.md`: 记录扰动的可能性、影响、传感器、控制措施和路由触发条件。
- `references/controller-hierarchy.md`: map global/local controllers, coupling variables, arbitration, and escalation.

## 流程

```text
Set boundary -> Identify state and signals -> Check observability/controllability -> Map coupling/disturbance -> Judge model adequacy -> Route
```

### 1. Set boundary

Define the system of interest:

- controlled object;
- external actors and environment;
- interfaces crossing the boundary;
- ownership boundary: repo, worktree, submodule, team, data owner, or product surface;
- controller hierarchy: global controller, local controllers, coordination boundary, or 无实质项;
- time boundary: current behavior, migration phase, release window, incident window, or historical state.

If a ledger exists, compare its latest route, plant/current-state assumptions, and next action to observed facts. Mark stale assumptions before routing back to `goal-contract`, `alpha-goal`, or `control-loop`.

If a repository is available and read-only inspection is safe, use `npx --yes tsx scripts/repo-sensor-snapshot.ts` or equivalent manual checks to gather structure, status, and local rules.

### 2. Identify state and signals

Map:

- state variables: data shape, configuration, branch, version, lifecycle phase, runtime status, user-visible behavior, evidence coverage;
- inputs: user actions, API calls, jobs, events, prompts, configuration, dependencies, data feeds;
- outputs: UI behavior, responses, files, metrics, logs, tests, artifacts, reports;
- sensors: tests, logs, static analysis, diffs, runtime probes, examples, screenshots, user feedback, review comments;
- actuators: code edits, config changes, migrations, prompts, scripts, documentation, process changes, test changes;
- indicator handoff: metrics/proxies, operational definitions, thresholds/tolerances, and evidence boundaries from `goal-contract` or `decision-synthesis`;
- disturbances: flaky dependencies, dirty working tree, clock/time zone, environment drift, missing credentials, concurrent edits, ambiguous specs.

### 3. Check observability

Ask:

- What evidence can distinguish success from failure?
- What evidence can distinguish competing root-cause hypotheses?
- Which signals are fresh final-state evidence versus advisory or stale evidence?
- What boundary does each signal actually cross: helper, module, service, user-visible, production?
- Which missing signal blocks a claim or requires a narrowed claim?

Classify sensor quality:

```text
传感器质量: 强 | 足够 | 弱 | 阻塞
理由:
新鲜度:
已跨越边界:
支持的声明:
```

### 4. Check controllability

Ask:

- Which variables may the agent control without further permission?
- Which variables require user approval, credentials, external tools, deployment, data repair, or production access?
- Can the desired state be reached through small reversible control actions?
- Are there coupled outputs where changing one variable destabilizes another?
- Is a diagnostic probe safer than a repair action?
- What sensor threshold would show that a candidate control action reduced the target error?

Classify control quality:

```text
可控性质量: 强 | 足够 | 弱 | 阻塞
允许的执行器:
禁止的执行器:
用户自有决策:
```

### 5. Map coupling and disturbances

Create a clearly labeled 控制器层级（协同图）when multiple local controllers can affect the same global objective. Load `references/controller-hierarchy.md` when controller ownership, arbitration, or escalation is unclear.

```text
控制器层级:
- 全局控制器:
- 局部控制器:
- 耦合变量:
- 仲裁规则:
- 升级触发条件:
- 推荐协同路由:
```

Do not collapse material multi-controller relationships into a prose coordination section. A 控制模型 is incomplete if it names multiple local controllers that can affect one global objective but does not either emit a `控制器层级:` block or explicitly state `控制器层级: 无实质项`.

Create a compact coupling map. Use a matrix only when it clarifies risk.

```text
耦合图:
- 表面 A -> 表面 B:
  - 共享状态 / 产物:
  - 扰动:
  - 风险:
  - 隔离策略:
```

为实质扰动创建清晰标记的 扰动记录。当扰动的可能性、影响、传感器、控制措施或路由触发条件不明显时，加载 `references/disturbance-register.md`。

```text
扰动记录:
- 扰动:
  - 来源:
  - 可能性:
  - 影响:
  - 受影响状态 / 控制变量:
  - 传感器:
  - 约束措施:
  - 路由触发条件:
  - 负责人或决策边界:
```

不要把实质扰动压缩成散文式风险列表。如果 控制模型 命名了实质扰动，却既没有输出 扰动记录，也没有明确写明 `扰动记录: 无实质项`，该模型就是不完整的。

高影响或影响未知的扰动必须先具备传感器、控制措施和路由触发条件，才能路由到 `control-loop`。

Stabilization strategies:

- isolate worktree or ownership surface;
- reduce slice size;
- add or reuse a sensor before changing behavior;
- sequence changes so one control variable moves at a time;
- monitor registered disturbance sensors and route when a trigger fires;
- return to `goal-contract` if coupling changes scope or claim boundary;
- route to `decision-synthesis` if objectives or stakeholders conflict.

### 6. Judge model adequacy

Persist the full 控制模型 under `.alpha-goal/YYYYMMDD-<slug>/system-model.md` by default and update the 闭环台账 artifact registry. Show a compact Markdown-table `模型摘要` in the TUI by default. Print the full model in chat only when the user asks, file persistence is blocked, or a modeling gap requires explicit user review.

紧凑模型:

```text
控制模型:
- 边界:
- 状态变量:
- 传感器:
- 执行器:
- 候选控制律:
- 控制器层级:
- 扰动记录:
- 耦合图:
- 可观测性:
- 可控性:
- 模型充分性:
- 台账更新:
- 推荐路由:
```

TUI 摘要:

```markdown
模型摘要

| 字段 | 内容 |
| --- | --- |
| 边界 | |
| 可观测性 | |
| 可控性 | |
| 产物 | |
| 推荐路由 | |
```

完整模型:

```text
控制模型:
- 系统边界:
- 被控对象:
- 环境与外部参与方:
- 接口:
- 状态变量:
- 输入:
- 输出:
- 传感器与证据边界:
- 执行器与授权边界:
- 指标到传感器的交接:
- 候选控制律:
  - 目标误差:
  - 控制变量:
  - 候选动作或探测:
  - 传感器与阈值:
  - 反馈延迟:
  - 信号噪声:
  - 置信度:
  - 阻尼 / 防振荡:
  - 影响范围上限:
  - 风险 / 失败处理:
- 扰动记录:
  - 扰动:
  - 可能性 / 影响:
  - 传感器:
  - 约束措施:
  - 路由触发条件:
- 耦合图:
- 控制器层级:
  - 全局目标:
  - 局部控制器:
  - 耦合变量:
  - 仲裁 / 升级:
- 稳定性条件:
- 缺失信息:
- 模型充分性: sufficient | sufficient with narrowed claim | insufficient | blocked
- 台账更新: `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 路径、产物路径、可选结构化索引路径、模型变更、残余模型不确定性、下一路由，或明确的无法写入原因
- 推荐路由: goal-contract | control-loop | evidence-verify | decision-synthesis | blocker
```

Route to `goal-contract` when the model is sufficient to write or revise a 目标契约. Route to `control-loop` only when an approved 目标契约 already exists and this model merely informs the next bounded slice. Route to `evidence-verify` only when comparing evidence to a claim is the next action.
