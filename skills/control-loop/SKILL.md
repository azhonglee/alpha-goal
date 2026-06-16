---
name: control-loop
description: "Run bounded control iterations under an approved 目标契约: plan one slice, execute or probe safely, sense feedback, compare error, record evidence, and route to continue, harden, evidence-verify, reframe, or block."
---

# Control Loop

Use this skill to advance an approved goal through bounded iterations. It is the controller/actuator stage of the suite.

## Entry requirements before mutation

All must be true before editing implementation files:

- an approved 目标契约 or equivalent context identifies reference state, desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, acceptance evidence, and claim boundary;
- current `.alpha-goal/YYYYMMDD-<slug>/control-state.md` ledger is read when available, especially `最新控制路由`, selected skill, safety boundary, next action, last residual error, control action, feedback, and route decision; if no file ledger exists, use chat state only with an explicit no-write reason;
- current 扰动登记 is read when available, especially material likelihood, impact, sensor, containment, and route triggers;
- target/scope boundary and final claim boundary are clear enough to decide changed files and final wording;
- applicable local rules, durable specs, and active plans have been read;
- repository, worktree, submodule, ownership, dirty-state, and unrelated user-change boundaries are understood;
- isolated edit path is ready, or creating it is the first explicitly recorded setup mutation;
- `.worktrees/` is ignored or otherwise safe for isolated edits, and `.alpha-goal/` is ignored; if `.alpha-goal/` is missing from the repo root `.gitignore`, add it before writing process artifacts;
- strongest material risk, loop mode, evidence floor, and mutation preflight are recorded.

Before mutation, cite the contract source actually read: file path, chat excerpt, or explicit equivalent context. If it is unavailable, do not infer it from phrases like “existing 目标契约”; return to `goal-contract`.

If system boundary, sensors, actuators, disturbances, or coupling are unclear enough to affect safe action, route to `system-model` before mutation.

## Load resources when needed

- `references/worktree-safety.md`: isolated edit paths and primary-checkout safety.
- `references/execution-boundaries.md`: delegation, ownership, submodules, generated output, and user-owned changes.
- `references/loop-modes.md`: mode choice, evidence type, debug receipt, and route decisions.
- `references/plan-template.md`: durable dynamic plans for multi-slice or handoff-heavy work.
- `references/control-law.md`: 目标误差、控制变量、预期效果、传感器阈值、延迟 / 噪声 / 置信度、阻尼、影响范围约束和失败处理。Load before any mutation or diagnostic-probe slice.
- `references/adaptive-learning.md`: record reusable corrections when feedback contradicts a 控制律, threshold, model, or route assumption.
- `references/iteration-record-schema.md`: compact or formal 迭代记录 semantics.
- `references/auto-execution.md`: when to execute the next pass automatically versus recommend or pause.
- `scripts/mutation-preflight.ts`: read-only git/path preflight.

## Iteration process

Each pass is a control cycle:

```text
Plan control slice -> Preflight -> Execute or probe -> Sense feedback -> Compare error -> Record -> Route
```

A single `control-loop` run may perform multiple bounded passes when context, authorization, risk, and user-owned decisions remain stable and each pass is recorded proportionally. If the next pass is safe and deterministic under `references/auto-execution.md`, execute it instead of merely listing it as a suggestion.

### 1. Plan control slice

Dynamic planning answers only the current iteration:

- the smallest coherent acceptance-relevant slice that can be completed and observed now;
- the error signal this slice is expected to reduce, using the ledger or 目标契约 as reference;
- the 控制律 for the slice: 目标误差、控制变量、预期效果、传感器阈值、反馈延迟、信号噪声、置信度、阻尼 / 防振荡、饱和 / 影响范围约束和失败处理;
- control variables to change and variables intentionally held constant;
- fresh evidence needed after the slice and how it will be sensed;
- files, modules, repos, generated outputs, and ownership surfaces allowed to change;
- assumptions, disturbances, and stop conditions for reframe, block, or unsafe execution;
- material 扰动登记 entries and how this slice will monitor or contain them;
- prior 自适应学习记录 and whether their reuse or invalidation conditions apply;
- expected artifacts, side effects, cleanup, rollback, or containment needs;
- strongest material risk and evidence floor;
- success, failure, feedback, and reframe routes;
- whether a durable plan is necessary.

Before executing a mutation or diagnostic-probe slice, prepare the full 控制律 and persist it in the 迭代记录 or 闭环台账. Do not print the raw `控制律:` block in the TUI by default. Show a user-facing `执行检查` table instead, then execute only if the 目标误差, approved 控制变量, observable 传感器阈值, and 失败处理 are present in the persisted 控制律. For repeated, noisy, broad, or high-risk loops, the persisted 控制律 must also include 反馈延迟、信号噪声、置信度、阻尼 / 防振荡、饱和 / 影响范围约束 before acting again.

Print the raw `控制律:` block in chat only when the user asks for it, file persistence is blocked, or the slice is high-risk enough that the user must review every control field before mutation.

TUI pre-action check:

Use Chinese titles by default, with Chinese field labels. If the user explicitly asks for another language, translate the same field semantics without showing multiple language templates.

```markdown
执行检查

| 字段 | 内容 |
| --- | --- |
| 问题 | |
| 本轮动作 | |
| 保持不变 | |
| 验收证据 | |
| 主要风险 | |
| 失败处理 | |
```

Map `问题` from 目标误差, `本轮动作` from 控制变量 plus control action, `保持不变` from 保持不变的变量 and containment, `验收证据` from 传感器 plus 阈值, `主要风险` from 信号噪声, damping, saturation, or strongest material risk, and `失败处理` from 失败处理 or stop/reframe trigger. Keep values concise and point to the persisted artifact for the full 控制律.

Create or update a durable plan only for multiple independent loops, modules, repos, handoff/recovery needs, external side effects, irreversible/high-risk changes, rollback/compatibility decisions, contested ownership, or user request.

### 2. Preflight

Run `npx --yes tsx scripts/mutation-preflight.ts` or record equivalent manual facts before mutation. Low-risk slices may use compact preflight; dirty state, generated outputs, submodules, cross-file behavior, or user changes require fuller preflight.

Preflight must answer:

- am I in the intended repository and boundary?
- is the current checkout primary, linked worktree, or otherwise unsafe?
- what unrelated user changes exist?
- which local rule files apply?
- is `.alpha-goal/` ignored, or has `.alpha-goal/` just been added to the repo root `.gitignore` before writing process artifacts?
- what evidence floor is required by the strongest material risk?

### 3. Execute or probe

- For a mutation slice, make one coherent targeted change unless the approved slice explicitly requires coordinated edits.
- For a read-only/probe slice, do not mutate; produce evidence, diagnosis, or a route decision.
- Preserve and interpret failing outputs; do not hide, rerun away, or summarize them as success.
- Preserve unrelated user changes; never stash, revert, move, or overwrite them without approval.
- Prefer targeted edits; defer unrelated cleanup unless necessary for the approved slice and recorded as risk-reducing.
- Record artifacts, generated outputs, side effects, cleanup, and rollback/containment actions as they occur.
- Stay inside the approved target, scope, non-goals, constraints, authorization, and claim boundary.

For debugging, identify and record root cause before repair. If root cause is not confirmed, limit changes to diagnostic probes, reversible instrumentation, or explicitly hypothesis-testing slices that do not alter the intended fix surface.

Use subagents only for independent ownership surfaces, read-only review, evidence audit, test/log analysis, or risk assessment. Do not allow overlapping mutation without coordination, and inspect returned evidence before accepting it.

Forbidden unless explicitly requested and risk is recorded:

- editing or deleting files in a primary `main`/`master`/`trunk` checkout;
- creating a branch in a primary checkout when an isolated worktree should be used;
- mutating a candidate repo not selected by the approved context;
- crossing repo, worktree, submodule, or ownership boundaries;
- unrelated broad formatting or opportunistic refactor;
- final completion, merge-ready, ship-ready, production-safe, or root-cause-fixed claims.

### 4. Sense feedback

Collect fresh feedback after the material action:

- tests, builds, linters, type checks, runtime probes, logs, screenshots, diffs, or manual inspection;
- user, reviewer, or subagent feedback;
- stale, contradicted, or newly discovered specs/plans/rules;
- environment, permission, dependency, data, or upstream-state changes;
- regression, compatibility, migration, security, observability, or data-risk signals.

Classify evidence:

- `gate evidence`: can satisfy acceptance or claim boundary;
- `advisory evidence`: identifies risk but does not prove completion;
- `exploration evidence`: maps possibilities only;
- `blocked evidence`: shows missing environment, tool, data, or permission.

Also record whether the observed sensor feedback crossed the 控制律 threshold, whether latency/noise make the signal inconclusive, and whether fallback/reframe is required.
If a registered disturbance trigger fires, route according to the register instead of continuing the planned slice.
If feedback contradicts the 控制律, threshold, model, or route assumption in a reusable way, load `references/adaptive-learning.md` and create an 自适应学习记录 before the next pass.

### 5. Compare error and decide route

Compare current state against the reference and 控制律, not against effort spent. If observed feedback does not match the expected effect or threshold, choose hardening, fallback, reframe, or blocker instead of treating the action as successful.

Choose one primary route:

- `ITERATION_CONTINUES`: goal remains valid and another bounded slice should proceed or be recommended.
- `ITERATION_HARDEN`: implementation direction is valid but evidence, edge cases, compatibility, cleanup, or observability are insufficient.
- `ITERATION_READY_FOR_VERIFY`: acceptance appears covered and the evidence bundle is ready for independent `evidence-verify`.
- `RETURN_TO_ALPHA_GOAL`: target, scope, acceptance, non-goals, constraints, decision boundaries, authorization, or final claim changed or is unreliable.
- `RETURN_TO_SYSTEM_MODEL`: plant boundary, sensors, actuators, disturbances, or coupling became materially unclear.
- `BLOCKED`: missing permission, tool, data, environment, credential, or user-owned decision prevents safe progress.

Do not choose `ITERATION_READY_FOR_VERIFY` merely because implementation is done. Choose it only when fresh evidence plausibly covers acceptance and claim boundary.

### 6. Record

Persist a full 迭代记录 under `.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md` before handoff, blocking, or materially changing direction. Use `.alpha-goal/YYYYMMDD-<slug>/iterations/cycles.jsonl` only when an append-only machine log is useful. Store bulky command output, logs, screenshots, or traces under `.alpha-goal/YYYYMMDD-<slug>/evidence/` and link to them from the record. Update the 闭环台账 artifact registry and show a compact Markdown-table `迭代摘要` in the TUI by default.

Print the full 迭代记录 in chat only when the user asks, file persistence is blocked, or a blocker/risk requires explicit user review. Compact records are still acceptable for low-risk passes, but preserve:

- approved context and boundary;
- dynamic plan and preflight;
- action or probe;
- fresh evidence and evidence class;
- acceptance delta and error remaining;
- 控制律结果: 预期效果、已观察反馈、阈值状态、反馈延迟、信号噪声、置信度、阻尼 / 防振荡、饱和 / 影响范围约束、失败处理或调整;
- 自适应学习更新: 触发条件、已观察偏差、调整、复用条件、失效条件;
- feedback and disturbances;
- 台账更新: 输入状态、误差信号、扰动更新、控制动作、传感器反馈、残余误差和下一状态;
- 路由决策;
- 下一步.

TUI 摘要:

```markdown
迭代摘要

| 字段 | 内容 |
| --- | --- |
| 动作 | |
| 反馈 | |
| 剩余误差 | |
| 产物 | |
| 下一步 | |
```

Do not make final completion claims in the 迭代记录. Completion judgment belongs to `evidence-verify`.

### 7. Route next

- For `ITERATION_CONTINUES` or `ITERATION_HARDEN`, do not stop at “recommended next step” when the next pass is already authorized, safe, and actionable. Apply the auto-execution test in `references/auto-execution.md`, then either start the next bounded pass immediately or record the concrete stop reason.
- For `ITERATION_READY_FOR_VERIFY`, hand off to `evidence-verify` with the current claim, 目标契约, ledger state, diff/artifact evidence, and fresh checks.
- For `RETURN_TO_ALPHA_GOAL`, stop mutation and revise the contract.
- For `RETURN_TO_SYSTEM_MODEL`, stop mutation and model the system boundary.
- For `BLOCKED`, stop and report the smallest missing input, permission, tool, data, environment, or safe-state condition.
