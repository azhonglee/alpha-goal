# Alpha Goal

语言：简体中文 | [English](README.en.md)

Alpha Goal 将用户意图澄清并结构化为可执行、可验收的目标，再按材料性选择直接执行或持久闭环。每个 change task 先形成最小 Goal Frame；需要确认、恢复或可审计证据时再扩展为 Goal Contract。

## 核心架构

```mermaid
flowchart TD
  A["alpha-goal：澄清需求并形成 Goal Frame"] --> R{"DIRECT / PERSIST"}
  R --> D["DIRECT：正常执行 + 最终验证"]
  R --> P["PERSIST：扩展并确认 goal-contract.md"]
  P --> E["executor：按风险边界执行并记录 checkpoint.md"]
  E --> V["verifier：独立观察当前状态"]
  V -->|"NEXT_ITERATION"| E
  E -. "REFRAME_REQUESTED" .-> A
  V -. "REFRAME_REQUESTED" .-> A
  V -->|"BLOCKED"| B["报告 blocker"]
  V -->|"PASS_TO_FINAL"| F["最终声明"]
```

Goal Frame 包含 intent、observable outcome、scope/non-goals、constraints、success signals、observers 和 material decisions；已清晰内容直接来自请求与可归因事实，只向相关 authority 追问最高影响的单个 blocking gap，并仅在授权决定及其 material boundaries、执行/证据后果可确定时闭合。

`DIRECT` 将完整 Goal Frame 保留在当前上下文，不创建 Alpha Goal 状态，也不调用 `executor` 或 `verifier`。`PERSIST` 只保留两个运行时 artifact：

- `goal-contract.md`：由 `alpha-goal` 独占修改；accepted revision 是 executor、verifier 和可选 native Goal projection 的标准结构化输入。
- `checkpoint.md`：保留不可变契约 epoch，绑定当前 digest 与状态，并用原子锁及 revision/owner 串行化 `executor`、`verifier` 交接。

路由只看材料性影响、副作用、恢复需求和可验证性；不以置信度、文件数、步骤数、问答轮次或预计时长替代风险判断。

## 公开技能

| Skill | 单一职责 |
| --- | --- |
| [`alpha-goal`](skills/alpha-goal/) | 澄清并结构化目标，形成 Goal Frame，选择 `DIRECT / PERSIST`，并在持久路径确认 Goal Contract。 |
| [`executor`](skills/executor/) | 仅执行已接受的持久契约，维护目标/交付 mutation、原始执行证据和恢复记录。 |
| [`verifier`](skills/verifier/) | 仅在风险边界或最终状态独立收集验证观察、更新验收条目状态并返回 route。 |

## 快速开始

```bash
bash ./scripts/install.sh
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
```

安装器把三个公开技能复制到所选运行时的独立目录，并同步相应用户模板。完整行为和 smoke 流程见 [INSTALL.md](INSTALL.md)。

通常不需要显式写 skill 名称，直接描述任务即可。需要手动触发时：

```text
$alpha-goal 根据请求和已发现事实形成 Goal Frame，再判断走 DIRECT 还是 PERSIST。
$executor 从已接受的 Goal Contract 恢复并执行下一批授权工作。
$verifier 对当前持久 checkpoint 做风险边界或最终状态验证。
```

## 设计原则

- 先发现事实，再处理由用户或其他授权来源拥有的材料性决策；现有代码不能自行定义期望行为。
- 已知不可行、required observer 不可用、claim surface 未标识或 prerequisite 未满足时，Goal Contract 必须保持 `draft`；`BLOCKED` 只表示 accepted 前提在运行期被新事实推翻。
- 直达任务不制造持久协议；持久任务用最小 artifact 支持授权、恢复和审计。
- 同一低风险边界内批量执行，只在材料性风险边界和最终状态调用 verifier。
- PASS 绑定实际观察到的最终目标与交付状态；后续 mutation 会使其失效。
- 时效性证据记录观察时间与失效条件；无法标识的可变表面不得声称精确绑定。
- Goal Contract 是标准结构化输入；Native Goal 只是绑定其 path/revision/digest 的 capability-conditional lifecycle projection。
- `tools/evals/runtime-boundaries.json` 固化 28 个静态边界预期；结构校验通过不等于真实运行证据。
