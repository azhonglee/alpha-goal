# 控制路由

默认链路：`decision-synthesis? -> system-model? -> goal-contract -> control-loop -> evidence-verify -> final`。

禁止：未经 `goal-contract` 到 `control-loop`；未经 `evidence-verify` 作最终声明；把最小执行范围当目标语义。路由到能降低误差的最小技能；局部低风险任务可不运行完整建模或综合，但不降低目标契约、控制律、证据或声明闸门。
