# 控制论一致性

检查任务是否真正遵循闭环控制模型时使用本参考。判断依据是状态转移、证据和边界是否成立，而不是文档里是否出现了控制论术语。

## 状态转移检查

允许的高层路由迁移：

```text
START -> alpha-goal
alpha-goal -> decision-synthesis | system-model | goal-contract | control-loop | evidence-verify | user | blocker
decision-synthesis -> goal-contract | system-model | control-loop | evidence-verify | user | blocker
system-model -> goal-contract | control-loop | evidence-verify | decision-synthesis | blocker
goal-contract -> control-loop | system-model | user | blocker
control-loop -> control-loop | evidence-verify | alpha-goal | system-model | blocker
evidence-verify -> final | control-loop | goal-contract | system-model | blocker
```

遇到以下迁移时必须拒绝或重新界定。只有文件持久化受阻时，聊天态记录才可替代持久化台账或产物文件；但仍必须满足下列安全闸门：

- 在参考状态和执行器边界存在之前进入 `control-loop`。
- 在新鲜证据存在之前进入 `evidence-verify`。
- 在 `evidence-verify` 之前作出最终声明。
- 在需要隔离 worktree 时，从主检出区直接进行实现改动。

## 不变量

- 行动前必须有参考状态：改动前，目标契约或等价上下文必须明确目标、范围、非目标、授权、验收证据和声明边界。
- 大范围控制前必须建模被控对象：高影响面行动前，必须先建模系统边界、传感器、执行器、扰动和耦合。
- 声明前必须有传感器：传感器必须足够新鲜，并且跨越与拟声明内容相同的边界。
- 最终结论前必须有比较器：完成表述前，`evidence-verify` 必须比较证据、残余误差和最终声明边界。
- 恢复前必须有记忆：跨技能任务从 `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 恢复，而不是依赖压缩后的聊天摘要。
- 旧产物路径必须阻断：运行态产物必须留在 `.alpha-goal/YYYYMMDD-<slug>/` 下；旧分类路径应被校验判定为失败。

条件迁移规则：

- `decision-synthesis -> control-loop` 仅在已存在批准后的目标契约，并且综合研判只收窄下一切片、不改变参考状态、范围、授权、风险接受或声明边界时有效。
- `decision-synthesis -> evidence-verify` 仅在综合研判未授权改动，且下一步只是把既有证据包与拟声明内容进行比较时有效。
- `system-model -> control-loop` 仅在已存在批准后的目标契约，并且模型只在该契约内更新被控对象、传感器、执行器、扰动或耦合事实时有效。

## 结构化伴随文件

任务耗时较长、风险较高或可能需要恢复时，要在 `.alpha-goal/YYYYMMDD-<slug>/schema/` 下为阶段产物生成机器可读的结构化伴随文件。该文件用于路由、追踪和机器检查，是紧凑摘要；它不替代完整 Markdown 阶段产物，也不替代持久化的完整控制律。伴随文件使用 JSON，必须满足下列基础 JSON Schema。TypeScript 校验器还会额外检查：产物类型与路径匹配、阶段专用必填字段、迁移闸门、授权规则、样例追踪、运行态追踪连续性、证据边界、阶段决策和声明边界。

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

- `goal-contract`: `reference_id`, `claim_boundary`, `evidence_boundary`, `next_route`, `stage_decision`, `authorization_status`；路由到 `control-loop` 要求 `authorization_status: approved`。
- `system-model`: `sensor`, `evidence_boundary`, `next_route`, `stage_decision`；路由到 `control-loop` 要求已有 `reference_id` 且 `authorization_status: approved`。
- `decision-synthesis`: 有意义的 `next_route`，以及 `reference_id` 或 `claim_boundary` 至少一个；路由到 `control-loop` 要求已有 `reference_id` 且 `authorization_status: approved`。
- `iteration-record`: `target_error`, `control_variable`, `sensor`, `threshold_or_tolerance`, `residual_error`, `next_route`, `stage_decision`, `authorization_status`。
- `verification-verdict`: `sensor`, `evidence_boundary`, `claim_boundary`, `residual_error`, `next_route`, `stage_decision`。
- `conformance-report`: `artifact_path`, `route_state`, `prior_route`, `next_route`, `residual_error`, `claim_boundary`, `stage_decision`。

## 一致性报告

最终声明或交接声明需要审计轨迹时，使用 `.alpha-goal/YYYYMMDD-<slug>/conformance-report.md`：

```text
控制论一致性报告:
- 产物布局: 通过 | 失败
- 状态转移: 通过 | 失败
- 行动前参考状态: 通过 | 失败
- 控制律完整性: 通过 | 失败
- 扰动处理: 通过 | 失败 | 不适用
- 指标转译: 通过 | 失败 | 不适用
- 声明前传感器: 通过 | 失败
- 最终结论前比较器: 通过 | 失败
- 旧产物路径扫描: 通过 | 失败
- 必需下一路由:
```
