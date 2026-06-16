# Cybernetic Conformance

Use this reference when checking whether a task actually followed the closed-loop control model, not just whether documents contain control vocabulary.

## State transition checks

Valid high-level route transitions:

```text
START -> alpha-goal
alpha-goal -> decision-synthesis | system-model | goal-contract | control-loop | evidence-verify | user | blocker
decision-synthesis -> goal-contract | system-model | control-loop | evidence-verify | user | blocker
system-model -> goal-contract | control-loop | evidence-verify | decision-synthesis | blocker
goal-contract -> control-loop | system-model | user | blocker
control-loop -> control-loop | evidence-verify | alpha-goal | system-model | blocker
evidence-verify -> final | control-loop | goal-contract | system-model | blocker
```

Reject or reframe these transitions. A no-write chat state may replace persisted ledger or artifact files only when file persistence is blocked; it never waives these safety gates:

- `control-loop` before a reference and actuator boundary exist.
- `evidence-verify` before fresh evidence exists.
- final claim before `evidence-verify`.
- implementation mutation from a primary checkout when an isolated worktree is required.

## Invariants

- reference before action: a 目标契约 or equivalent context identifies target, scope, non-goals, authority, acceptance evidence, and claim boundary before mutation.
- plant before broad control: system boundary, sensors, actuators, disturbances, and coupling are modeled before high-blast-radius action.
- sensor before claim: the sensor must be fresh enough and cross the same boundary as the proposed claim.
- comparator before final: `evidence-verify` must compare evidence, residual error, and final claim boundary before completion wording.
- memory before resume: cross-skill work resumes from `.alpha-goal/YYYYMMDD-<slug>/control-state.md`, not from a compact chat summary.
- legacy artifact path guard: runtime artifacts stay under `.alpha-goal/YYYYMMDD-<slug>/`; legacy category paths are validation failures.

Conditional transition rules:

- `decision-synthesis -> control-loop` is valid only when an approved 目标契约 already exists and synthesis narrows the next slice without changing reference, scope, authority, risk acceptance, or claim boundary.
- `decision-synthesis -> evidence-verify` is valid only when synthesis did not authorize mutation and the next action is comparing an existing evidence bundle to a proposed claim.
- `system-model -> control-loop` is valid only when an approved 目标契约 exists and the model only updates plant, sensor, actuator, disturbance, or coupling facts within that contract.

## Schema 辅助索引

When a task is long-running, high-risk, or likely to resume, emit a machine-readable Schema 辅助索引 in `.alpha-goal/YYYYMMDD-<slug>/schema/` for the stage artifact. The sidecar is a compact summary and index for routing, traceability, and machine checks; it does not replace the full Markdown stage artifact or the persisted full 控制律. The sidecar is JSON and must satisfy this base JSON Schema. The TypeScript validator additionally enforces artifact-kind path matching, stage-specific required fields, transition guards, authorization rules, fixture trace, runtime trace continuity, evidence boundaries, stage decisions, and claim boundaries:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "artifact_kind",
    "task_slug",
    "artifact_path",
    "reference_id",
    "route_state",
    "prior_route",
    "next_route",
    "target_error",
    "control_variable",
    "sensor",
    "threshold_or_tolerance",
    "evidence_boundary",
    "residual_error",
    "claim_boundary",
    "stage_decision",
    "authorization_status",
    "generated_at"
  ],
  "properties": {
    "artifact_kind": {
      "type": "string",
      "enum": [
        "goal-contract",
        "system-model",
        "decision-synthesis",
        "iteration-record",
        "verification-verdict",
        "conformance-report"
      ]
    },
    "task_slug": {
      "type": "string",
      "pattern": "^\\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "artifact_path": {
      "type": "string",
      "pattern": "^\\.alpha-goal/\\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*/.+\\.md$"
    },
    "reference_id": {
      "type": ["string", "null"]
    },
    "route_state": {
      "type": "string",
      "enum": [
        "alpha-goal",
        "decision-synthesis",
        "system-model",
        "goal-contract",
        "control-loop",
        "evidence-verify",
        "final",
        "user",
        "blocker"
      ]
    },
    "prior_route": {
      "type": ["string", "null"],
      "enum": [
        "alpha-goal",
        "decision-synthesis",
        "system-model",
        "goal-contract",
        "control-loop",
        "evidence-verify",
        "final",
        "user",
        "blocker",
        null
      ]
    },
    "next_route": {
      "type": "string",
      "enum": [
        "alpha-goal",
        "decision-synthesis",
        "system-model",
        "goal-contract",
        "control-loop",
        "evidence-verify",
        "final",
        "user",
        "blocker"
      ]
    },
    "target_error": {
      "type": ["string", "null"]
    },
    "control_variable": {
      "type": ["string", "null"]
    },
    "sensor": {
      "type": ["string", "null"]
    },
    "threshold_or_tolerance": {
      "type": ["string", "null"]
    },
    "evidence_boundary": {
      "type": "string",
      "enum": [
        "artifact",
        "helper",
        "module",
        "service",
        "user-visible",
        "production",
        "safety",
        "custom"
      ]
    },
    "residual_error": {
      "type": ["string", "null"]
    },
    "claim_boundary": {
      "type": ["string", "null"]
    },
    "stage_decision": {
      "type": "string",
      "enum": [
        "ROUTE_TO_GOAL_CONTRACT",
        "ROUTE_TO_SYSTEM_MODEL",
        "ROUTE_TO_CONTROL_LOOP",
        "ROUTE_TO_EVIDENCE_VERIFY",
        "ROUTE_TO_USER",
        "CONTRACT_APPROVED",
        "CONTRACT_REFRAME",
        "ITERATION_CONTINUES",
        "ITERATION_HARDEN",
        "ITERATION_READY_FOR_VERIFY",
        "RETURN_TO_ALPHA_GOAL",
        "RETURN_TO_SYSTEM_MODEL",
        "BLOCKED",
        "PASS_TO_FINAL",
        "NARROW_CLAIM_AND_FINAL",
        "NEXT_ITERATION",
        "REFRAME",
        "CONFORMANCE_PASS",
        "CONFORMANCE_FAIL"
      ]
    },
    "authorization_status": {
      "type": "string",
      "enum": [
        "approved",
        "not-required",
        "pending",
        "blocked",
        "unknown"
      ]
    },
    "generated_at": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

阶段专用必填键:

- `goal-contract`: `reference_id`, `claim_boundary`, `evidence_boundary`, `next_route`, `stage_decision`, `authorization_status`; routing to `control-loop` requires `authorization_status: approved`.
- `system-model`: `sensor`, `evidence_boundary`, `next_route`, `stage_decision`; routing to `control-loop` requires an existing `reference_id` and `authorization_status: approved`.
- `decision-synthesis`: meaningful `next_route` and either `reference_id` or `claim_boundary`; routing to `control-loop` requires an existing `reference_id` and `authorization_status: approved`.
- `iteration-record`: `target_error`, `control_variable`, `sensor`, `threshold_or_tolerance`, `residual_error`, `next_route`, `stage_decision`, `authorization_status`.
- `verification-verdict`: `sensor`, `evidence_boundary`, `claim_boundary`, `residual_error`, `next_route`, `stage_decision`.
- `conformance-report`: `artifact_path`, `route_state`, `prior_route`, `next_route`, `residual_error`, `claim_boundary`, `stage_decision`.

## 一致性报告

Use `.alpha-goal/YYYYMMDD-<slug>/conformance-report.md` when a final or handoff claim needs an audit trail:

```text
控制论一致性报告:
- 产物布局: pass | fail
- 状态迁移: pass | fail
- 行动前参考状态: pass | fail
- 控制律完整性: pass | fail
- 扰动处理: pass | fail | not applicable
- 指标交接: pass | fail | not applicable
- 声明前传感器: pass | fail
- 最终结论前比较器: pass | fail
- 旧产物路径扫描: pass | fail
- 必需下一路由:
```
