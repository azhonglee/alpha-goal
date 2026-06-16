# 模糊度量化闸门

目标契约必须使用量化模糊度闸门。不要使用定性等级，也不要选择任何配置档位。

## 评分规则

使用 0.0 到 1.0 的清晰度评分，再计算模糊度。1.0 表示该维度已明确且有证据支撑，0.0 表示缺失、冲突或无法安全判断。不要为了通过闸门而虚构小数；无法赋值的关键维度按 0.0 处理，并记录缺口。

```text
新建场景模糊度 = 1 - (intent*0.25 + outcome*0.25 + scope*0.20 + constraints*0.15 + success*0.15)
存量系统模糊度 = 1 - (intent*0.20 + outcome*0.20 + scope*0.18 + constraints*0.14 + success*0.14 + context*0.14)
控制模糊度 = 1 - (reference*0.25 + actuator_boundary*0.20 + sensor_plan*0.20 + disturbance_bounds*0.15 + claim_boundary*0.20)
```

## 交接阈值

唯一交接阈值：模糊度 <= 0.15。

所有适用模型都必须满足阈值。任一适用模糊度超过 0.15，或关键维度无法赋值时，不得交接给 `control-loop`；继续澄清、收窄草案、路由到 `system-model`，或停在 `user` / `blocker`。

低数值不能覆盖缺失的用户自有决策、授权、语义取舍、执行器边界、证据边界或声明边界。
