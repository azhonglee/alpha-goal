# 模糊度评分

评分只是辅助路由判断的工具。它应减少不必要澄清，同时防止不安全交接。

## 定性评分

- `low`: 剩余不确定性不会改变范围、授权、证据或最终声明。
- `medium`: 不确定性可能改变切片计划或证据下限；改动前先澄清或收窄。
- `high`: 不确定性会改变目标、负责人、对象、非目标、安全性或授权；不要交接给 `control-loop`。

## 数值评分

使用 0.0 到 1.0 的清晰度评分，再计算模糊度。

```text
新建场景模糊度 = 1 - (intent*0.25 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.15)
存量系统模糊度 = 1 - (intent*0.20 + outcome*0.20 + scope*0.18 + constraints*0.14 + success*0.14 + context*0.14)
控制模糊度 = 1 - (reference*0.25 + actuator_boundary*0.20 + sensor_plan*0.20 + disturbance_bounds*0.15 + claim_boundary*0.20)
```

阈值只是默认值，不是证明：

- quick: <= 0.30
- standard: <= 0.20
- deep: <= 0.15

不要让低数值模糊度覆盖缺失的用户自有决策或不安全的执行器边界。
