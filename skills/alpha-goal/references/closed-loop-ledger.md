# 闭环台账

当任务跨多个技能、可能跨轮次恢复，或需要持久状态来避免丢失参考输入、误差、动作、路由决策或反馈历史时，使用本参考。

## 目的

台账是控制状态记忆和产物索引，不是工作日记。只记录会改变路由、安全边界、证据或最终声明判断的信息。完整 `控制路由` 默认放在这里；其他完整阶段产物放在同一个任务运行目录 `.alpha-goal/YYYYMMDD-<slug>/` 下。除非用户要求完整细节、文件持久化受阻，或用户自有决策需要复核，TUI 只展示紧凑摘要。

默认持久化路径:

```text
.alpha-goal/YYYYMMDD-<slug>/control-state.md
```

可选追加式机器日志:

```text
.alpha-goal/YYYYMMDD-<slug>/iterations/cycles.jsonl
```

默认完整产物路径:

```text
.alpha-goal/YYYYMMDD-<slug>/goal-contract.md
.alpha-goal/YYYYMMDD-<slug>/system-model.md
.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md
.alpha-goal/YYYYMMDD-<slug>/plan.md
.alpha-goal/YYYYMMDD-<slug>/iterations/NN-<slice>.md
.alpha-goal/YYYYMMDD-<slug>/evidence/
.alpha-goal/YYYYMMDD-<slug>/schema/
.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md
.alpha-goal/YYYYMMDD-<slug>/conformance-report.md
.alpha-goal/YYYYMMDD-<slug>/interviews.md
```

默认行为是在 `.alpha-goal/` 下写入台账。在仓库内首次写入前，先检查 `.alpha-goal/` 是否已被忽略。如果未被忽略且仓库根目录 `.gitignore` 可写，先加入这一行，再写入台账产物：

```gitignore
.alpha-goal/
```

把向 `.gitignore` 添加 `.alpha-goal/` 视为流程产物初始化变更，不视为实现变更。只有当用户明确禁止写文件、没有仓库路径，或 `.gitignore` 无法安全更新时，才使用仅聊天态台账；并在 `台账路径` 字段说明原因。

## 台账结构

```text
闭环台账:
- 任务 slug:
- 最后更新:
- 台账路径:
- 产物登记:
  - 目标契约:
  - 控制模型:
  - 决策综合:
  - 计划:
  - 迭代记录:
  - 证据:
  - 结构化索引:
  - 验证结论:
  - 一致性报告:
  - 访谈记录:
- 最新控制路由:
  控制路由:
  - 台账路径:
  - 活跃状态:
  - 主导不确定性:
  - 误差信号:
  - 控制律:
  - 指标转译:
  - 自适应学习:
  - 控制器层级:
  - 扰动记录:
  - 选定技能:
  - 选择理由:
  - 需加载或询问的上下文:
  - 安全边界:
  - 下一步:
- 参考状态:
  - 期望结果:
  - 验收证据:
  - 声明边界:
  - 指标转译:
    - 定性目标:
    - 指标 / 代理:
    - 传感器:
    - 阈值 / 容差:
    - 证据边界:
- 当前状态:
  - 已观察事实:
  - 推断:
  - 未知项:
  - 活跃风险 / 扰动:
  - 扰动记录:
    - 扰动:
    - 可能性 / 影响:
    - 传感器:
    - 约束措施:
    - 路由触发条件:
  - 控制器层级:
    - 全局控制器:
    - 局部控制器:
    - 耦合变量:
    - 仲裁 / 升级:
- 控制状态:
  - 活跃路由:
  - 主导不确定性:
  - 最近误差信号:
  - 最近控制律:
  - 最近控制动作:
  - 最近传感器反馈:
  - 残余误差:
  - 自适应学习:
    - 学习触发条件:
    - 已观察偏差:
    - 调整:
    - 复用条件:
    - 失效条件:
  - 下一路由:
- 循环日志:
  - 循环:
    - 输入状态:
    - 选定技能:
    - 误差信号:
    - 控制律:
      - 目标误差:
      - 控制变量:
      - 预期效果:
      - 传感器阈值:
      - 反馈延迟:
      - 信号噪声:
      - 置信度:
      - 阻尼 / 防振荡:
      - 影响范围上限:
      - 失败处理:
    - 控制动作或探测:
    - 已改变变量:
    - 保持不变的变量:
    - 扰动记录更新:
    - 自适应学习记录:
    - 传感器反馈:
    - 证据边界:
    - 残余误差:
    - 路由决策:
    - 下一状态:
```

## 阶段职责

- `alpha-goal`: 发现或初始化台账，分类活跃控制状态，写入完整 `最新控制路由`，把产物登记保持在 `.alpha-goal/YYYYMMDD-<slug>/` 内，并在 TUI 默认只显示 Markdown 表格 `路由摘要`。
- `decision-synthesis`: 综合前读取最新路由；把完整 决策综合记录 写到 `.alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md`，更新产物登记和路由相关综合状态，并在 TUI 默认显示 Markdown 表格 `综合摘要`。
- `system-model`: 建模前读取最新路由；把完整 控制模型 写到 `.alpha-goal/YYYYMMDD-<slug>/system-model.md`，更新产物登记和模型相关状态，并在 TUI 默认显示 Markdown 表格 `模型摘要`。
- `goal-contract`: 修改参考输入前读取最新路由；把完整目标契约写到 `.alpha-goal/YYYYMMDD-<slug>/goal-contract.md`，更新产物登记和参考状态，并在 TUI 默认显示 Markdown 表格 `契约摘要`。
- `control-loop`: 变更 / 探测前读取最新路由；把完整 控制律 持久化到 迭代记录 或台账，变更前显示 Markdown 表格 `执行检查`，把完整 迭代记录 写到 `.alpha-goal/YYYYMMDD-<slug>/iterations/`，必要时把持久日志写到 `.alpha-goal/YYYYMMDD-<slug>/evidence/`，更新产物登记和控制状态，并在反馈后默认显示 Markdown 表格 `迭代摘要`。
- `evidence-verify`: 下结论前读取最新路由；把完整 验证结论 写到 `.alpha-goal/YYYYMMDD-<slug>/verification-verdict.md`，更新产物登记和最终比较器状态，并在 TUI 默认显示 Markdown 表格 `验证摘要`。

## 更新规则

- 当参考输入、指标转译、被控对象模型、控制器层级、扰动记录、自适应学习记录、控制律、执行器边界、证据下限、结构化索引、一致性报告、产物路径、路由、选定技能、下一动作或残余误差发生实质变化时，更新台账。
- 把 `.alpha-goal/YYYYMMDD-<slug>/control-state.md` 视为跨技能路由字段的事实来源。不要要求后续技能从可见 TUI 摘要重建 `控制路由`。
- 把产物登记视为定位完整阶段输出的事实来源。除非文件持久化受阻，不要在台账内重复完整 目标契约、控制模型、决策综合记录、迭代记录、结构化索引、一致性报告或 验证结论。
- TUI 输出默认使用紧凑 Markdown 表格摘要：

```markdown
路由摘要

| 字段 | 内容 |
| --- | --- |
| 路由 | |
| 原因 | |
| 边界 | |
| 台账 | |
| 下一步 | |
```

- 阶段摘要和 control-loop 的 `执行检查` 默认使用带中文标题的紧凑双列表格。如果用户明确要求其他语言，只翻译同一标题语义，不展示多语言模板。值应保持简短；长细节指向产物路径。如果运行环境不能渲染 Markdown 表格，使用紧凑双列纯文本表，而不是项目符号列表。只有在用户要求、持久化受阻，或决策 / 风险需要用户明确复核时，才在聊天中打印完整产物或原始内部 控制律 块。
- 不重复完整命令输出；需要持久日志时，链接或摘要证据，并指向 `.alpha-goal/YYYYMMDD-<slug>/evidence/`。
- 不存储密钥、token、凭证、私有用户数据或仅生产环境敏感记录。
- 标注过期或被取代的状态，而不是静默覆盖。
- 如果台账与当前目标契约、系统模型、diff 或新鲜证据冲突，在进一步改动前路由到 `goal-contract`、`system-model` 或 `evidence-verify`。
