---
name: evidence-verify
description: "Judge whether fresh evidence satisfies an active 目标契约 and supports completion, correctness, safety, merge readiness, ship readiness, or a narrowed final claim. Use for final comparator/error-boundary decisions, not implementation."
---

# 证据验证

Use this skill as the independent comparator in the closed loop. It judges whether the observed final state matches the reference state and whether the proposed claim stays within evidence.

## 入口

Use when there is an active or recoverable approved context and the user, `goal-contract`, `control-loop`, or `alpha-goal` asks whether work is done, correct, safe, ready to merge, ready to ship, or ready for a narrowed final claim.

Do not use it for ordinary advisory review, security scan, or read-only audit without a completion/readiness/correctness claim.

A positive verdict needs proportional semantic evidence for:

- reference state, desired outcome, included scope, excluded scope/non-goals, decision boundaries, constraints, and claim boundary;
- current durable spec/plan/model if referenced;
- 迭代记录 or equivalent diff/evidence bundle;
- 控制律 result for each material `control-loop` slice, including latency/noise/confidence and stability guards when a mutation or diagnostic probe was used;
- 当定性目标或综合指标影响验收证据时，包含 指标转译 处理；
- 闭环台账 from `.alpha-goal/YYYYMMDD-<slug>/control-state.md`, including `最新控制路由`, when the work crossed skills or turns, or explicit no-write chat state when file writing was forbidden or impossible;
- 当实质扰动影响路由、证据或风险时，包含 扰动记录 处理；
- 自适应学习记录 handling when feedback changed thresholds, strategy, route, or reusable assumptions;
- 调试回执 when the claim is a bug or root-cause fix;
- strongest material risk and matching evidence floor;
- fresh final-target repo/artifact status and applicable project rules;
- exact commands/probes/checks and outcomes, or explicit blocker/substitute evidence;
- feedback handling for user/reviewer/test/runtime feedback.

## 按需加载资源

- `references/verification-verdict-schema.md`: field semantics for formal verdicts.
- `references/completion-review-rubric.md`: final delivery, merge-ready, ship-ready, or production-sensitive evidence floor.
- `references/claim-boundary-check.md`: prevent final claims exceeding evidence.
- `scripts/evidence-summary.ts`: read-only diff/status evidence.

## 流程

```text
Map acceptance -> Inspect artifacts -> Check claim boundary -> Judge verdict -> Route
```

### 1. Map acceptance

For each acceptance or evidence expectation, identify fresh final-state evidence, boundary, and status:

- `covered`
- `partially covered`
- `not covered`
- `blocked`
- `not applicable`

Evidence must match the claim boundary. A lower-boundary test cannot prove a higher-boundary user-visible, service, production, tenant, compliance, or safety claim.

### 2. Inspect artifacts and risk

Confirm:

- approved context is current or explicitly superseded;
- 目标契约, system model, durable spec, and plan are semantically aligned or contradictions are routed;
- ledger reference, current state, latest control route, residual error, and latest route decision are aligned with fresh evidence or explicitly superseded;
- 每个实质 控制律 都应识别目标误差、已批准控制变量、预期效果、传感器阈值、已观察反馈、反馈延迟、实质信号噪声、置信度、阻尼 / 防振荡、影响范围上限和失败处理；
- 每个实质 指标转译 都应把定性目标映射到操作化定义、传感器、阈值 / 容差、测量时机和证据边界；
- 每个实质 扰动记录 条目都应包含传感器证据、控制措施、路由触发处理，或明确的残余缺口；
- each material 自适应学习记录 has evidence, adjustment, reuse condition, invalidation condition, and no unsupported broad generalization;
- 迭代记录 goal type, control slice, execution, feedback, learning, and evidence match the final diff/artifact;
- changed files match target and avoid non-goals;
- mutation evidence comes from an isolated or approved edit path;
- `.worktrees/` is ignored or otherwise safe, and `.alpha-goal/` is ignored before ledger/evidence artifacts are written; if `.alpha-goal/` was missing from the repo root `.gitignore`, the setup mutation is included in the evidence;
- checks ran after the last material change, or missing checks have a stated blocker/substitute evidence;
- repeated, noisy, or delayed feedback has not been overclaimed as stable final evidence;
- failing output is understood and does not contradict the final claim;
- feedback is handled, out of scope, or routed elsewhere.

Bug/root-cause fixes need `ROOT_CAUSE_CONFIRMED` before repair-complete claims. `NOT_REPRODUCED` or `BLOCKED` does not support a repair-complete claim.

### 3. Check claim boundary

Compare:

```text
声明边界:
- 用户表述:
- 已实现边界:
- 已测试 / 已观察边界:
- 证据支持的最高实用边界:
- 缺口:
- 允许的最终声明:
```

If user wording is product-level but evidence is helper-level, choose either `NEXT_ITERATION` for broader evidence or `NARROW_CLAIM_AND_FINAL` with explicit narrowed wording.

### 4. Judge verdict

Return exactly one verdict:

- `PASS_TO_FINAL`: evidence covers acceptance and claim boundary.
- `NARROW_CLAIM_AND_FINAL`: local target is satisfied, but final wording must be narrower than the user request.
- `NEXT_ITERATION`: direction is valid, but implementation, evidence, hardening, or cleanup is still needed.
- `REFRAME`: 目标契约, system model, target/scope, non-goals, acceptance, existing-work relationship, or claim boundary is wrong or incomplete.
- `BLOCKED`: environment, data, permission, credential, tool, or user-owned risk/scope decision is missing.

### 5. Output

Persist the full 验证结论 under `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md` by default and update the 闭环台账 artifact registry. Show a compact Markdown-table `验证摘要` in the TUI by default. Print the full verdict in chat only when the user asks, file persistence is blocked, or the final claim requires explicit user review.

紧凑版:

```text
验证结论:
- 结论:
- 证据覆盖:
- 声明边界:
- 判断:
- 缺口:
- 必需下一步:
- 允许的最终声明:
- 产物:
```

TUI 摘要:

```markdown
验证摘要

| 字段 | 内容 |
| --- | --- |
| 结论 | |
| 声明边界 | |
| 证据 | |
| 产物 | |
| 下一步 | |
```

完整版:

```text
验证结论:
- 结论:
- 验收证据矩阵:
- 契约 / 模型 / 产物复核:
- 声明边界:
- 风险 / 证据复核:
- 控制律复核:
- 指标转译复核:
- 自适应学习复核:
- 台账复核:
- 扰动复核:
- 已运行新鲜检查:
- 变更差异 / 范围复核:
- 反馈复核:
- 判断:
- 未解决缺口:
- 必需下一步:
- 允许的最终声明:
- 台账更新:
  - 结构化索引路径:
```

路由:

- `PASS_TO_FINAL`: final answer may claim completion inside the verified boundary.
- `NARROW_CLAIM_AND_FINAL`: final answer must state the narrowed claim and remaining higher-boundary gap.
- `NEXT_ITERATION`: return to `control-loop`; do not claim completion.
- `REFRAME`: return to `goal-contract` or `system-model`; do not continue mutation.
- `BLOCKED`: report blocker and smallest missing input or permission.
