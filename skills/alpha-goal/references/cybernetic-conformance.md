# 控制论一致性

## 状态转移

```text
START -> alpha-goal
alpha-goal -> decision-synthesis | system-model | goal-contract | evidence-verify | user | blocker
decision-synthesis -> goal-contract | system-model | evidence-verify | user | blocker
system-model -> goal-contract | evidence-verify | decision-synthesis | blocker
goal-contract -> control-loop | system-model | user | blocker
control-loop -> control-loop | evidence-verify | alpha-goal | system-model | blocker
evidence-verify -> final | control-loop | goal-contract | system-model | blocker
```

不变量：行动前必须有参考状态；行动前必须经过 goal-contract；目标契约不得裁剪语义；声明前必须有传感器；最终结论前必须有比较器；旧产物路径必须阻断。

条件迁移：`decision-synthesis -> goal-contract` 用于把综合研判和指标转译固化为目标契约；`decision-synthesis -> evidence-verify` 仅在综合研判未授权改动；`system-model -> goal-contract` 用于把被控对象、传感器、执行器、扰动或耦合事实固化为目标契约。

## schema sidecar

schema sidecar 是基础 JSON Schema 约束下的紧凑摘要，不替代完整 Markdown 阶段产物，不替代持久化的完整控制律。TypeScript 校验器还会额外检查产物类型、阶段专用必填键、迁移闸门、授权规则和运行态追踪连续性。

核心键: `"artifact_kind"`, `"stage_decision"`, `"authorization_status"`。
阶段专用必填键: `goal-contract`, `system-model`, `decision-synthesis`, `iteration-record`, `verification-verdict`, `conformance-report`。

一致性报告检查产物布局、状态转移、控制律完整性、扰动、指标转译、传感器、比较器和旧产物路径。
