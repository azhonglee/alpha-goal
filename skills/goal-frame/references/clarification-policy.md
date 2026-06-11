# Clarification Policy

## 必须澄清

提出一个最小问题，而不是开放式访谈：

- 目标仓库、目标路径或所有权边界不确定。
- 验收语义有多个高概率解释，并且会产生不同实现。
- 用户请求与项目规则、权限、主分支保护或安全边界冲突。
- 操作可能破坏数据、历史、配置、权限、远端状态或生产资源。
- 已有 MR/PR/branch/design 与用户请求关系不明，必须由用户选择。

## 可以记录假设

不要为了以下问题阻塞：

- 命名、文件位置或测试范围可以从代码风格和项目规则推断。
- 不确定点不影响第一轮只读 discovery。
- 实现路径只有一个高置信候选。
- 可以用更窄的第一轮目标验证假设。

把这些内容写入 `Assumptions` 或 `Risks`，并在 evidence plan 里说明如何验证。

## 访谈规则

- 每轮只问一个最高杠杆问题。
- 优先补齐：intent、target、acceptance、non-goals、decision boundaries。
- 对 brownfield 任务先读代码或文档，再问带证据的问题。
- 不要问用户能从仓库直接发现的事实。
- 用户要求继续但仍有不确定性时，记录残余风险并收窄 claim boundary。

## 只读任务

解释、摘录、总结、有限风险扫描和 comparison-only 可以不进入 mutation。只读输出不能作为后续实现完成的 gate evidence，除非后续 `goal-verify` 重新绑定到具体 diff、artifact 或 claim boundary。
