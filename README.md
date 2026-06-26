# Alpha Goal

语言：简体中文 | [English](README.en.md)

Alpha Goal 是用于 Goal Engineering 的最小持久闭环技能集。它要求智能体先发现事实再提问，基于已接受的 Goal Contract 和必要 checkpoint 恢复执行，在明确边界内行动，并且只在证据支持的范围内做最终声明。

## 解决什么问题

Alpha Goal 给 AI Agent 一套 Goal Engineering 控制闭环，重点约束三类常见失控：

<table>
  <thead>
    <tr>
      <th width="140">问题</th>
      <th>具体表现</th>
      <th>控制方式</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="140"><strong>目标漂移</strong></td>
      <td>需求没澄清就动手，做着做着方向偏了，顺手改一堆无关内容。</td>
      <td><code>alpha-goal</code> 先发现事实、澄清目标、边界、非目标和验收证据，再写出用户确认的 <code>goal-contract.md</code>。</td>
    </tr>
    <tr>
      <td width="140"><strong>行动越界</strong></td>
      <td>没有授权边界，越过 scope、改错分支，或把当前实现当成期望行为。</td>
      <td><code>control-loop</code> 只执行已接受契约内的有界 slice，变更前检查 worktree/branch、scope、non-goals 和 claim boundary。</td>
    </tr>
    <tr>
      <td width="140"><strong>完成无据</strong></td>
      <td>测试过了就说完成，或把局部成功当成目标达成。</td>
      <td><code>goal-verify</code> 对照 acceptance evidence 做证据分类、Gap 分析和路由裁决。</td>
    </tr>
  </tbody>
</table>

本质上，它把需求澄清、授权边界、迭代执行、证据验证和验收声明，压缩成 Agent 能理解、执行、恢复的最小持久闭环。

## 核心架构

```mermaid
%%{init: {"theme":"base","flowchart":{"wrappingWidth":720,"nodeSpacing":80,"rankSpacing":70,"htmlLabels":true},"markdownAutoWrap":false,"themeVariables":{"background":"#364150","primaryColor":"#364150","primaryTextColor":"#f8fafc","primaryBorderColor":"#f8fafc","lineColor":"#f8fafc","edgeLabelBackground":"#364150","fontFamily":"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"}}}%%
flowchart TD
  AG["alpha-goal（入口）<br/>发现事实 → 澄清需求 → 压力测试 → 写 Goal Contract → 用户确认<br/>产出：goal-contract.md（权威契约）"]
  CL["control-loop（执行）<br/>按契约切 slice → 执行 → 收集证据 → 分类证据 → 判断路由<br/>产出：checkpoint.md（按需恢复 / 证据交接）"]
  GV["goal-verify（验证）<br/>证据 vs 验收标准 → Gap 分析 → 给出路由裁决<br/>裁决：PASS_TO_FINAL / NEXT_ITERATION / BLOCKED / RETURN..."]

  AG -->|"契约被 accept 之后"| CL
  CL --> GV
  GV --> Pass["完成交付<br/>（通过）"]
  GV --> Next["继续下一轮<br/>（同目标可修）"]
  GV --> Return["回 alpha-goal<br/>（目标变了 / 越权）"]

  classDef stage fill:#364150,stroke:#f8fafc,color:#f8fafc,stroke-width:2px;
  classDef route fill:#364150,stroke:#364150,color:#f8fafc,stroke-width:0px;
  class AG,CL,GV stage;
  class Pass,Next,Return route;
```

```text
Trigger -> Preflight/Discovery -> Clarify -> Write Contract -> Technical Design? -> Review -> Confirm
Accepted Goal Contract -> $control-loop -> Act -> Evidence -> $goal-verify -> Gap? -> Harden or Final Claim
```

## 快速开始

```bash
scripts/install.sh
npx --no-install tsx tools/validate_skills.ts .
```

安装脚本会在 `$HOME/.codex/skills/` 下为三个公开技能创建直接软链接，并清理指向本仓库旧公开技能的软链接。

## 使用示例

```text
$alpha-goal 判断这个任务下一步应发现事实、澄清、写契约、补技术方案、确认，还是交给闭环执行/验证。
$control-loop 根据已接受 Goal Contract 执行或加固下一轮最有用且可验证的有界 slice。
```

通常不需要显式写出 skill 名称。正常描述你的需求即可；当请求需要目标成帧、有界执行或有证据支撑的完成声明时，Alpha Goal 会隐式触发。

## 公开技能

<table>
  <thead>
    <tr>
      <th width="180">Skill</th>
      <th>作用</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="180"><a href="skills/alpha-goal/"><code>alpha-goal</code></a></td>
      <td>在开始工作前澄清意图、边界、验收证据，产出待确认 Goal Contract；跨文件预测性变更按需补 Technical Design。</td>
    </tr>
    <tr>
      <td width="180"><a href="skills/control-loop/"><code>control-loop</code></a></td>
      <td>执行或加固已授权 slice；<code>goal-contract.md</code> 是必需输入，<code>checkpoint.md</code> 仅作为条件检查点。</td>
    </tr>
    <tr>
      <td width="180"><a href="skills/goal-verify/"><code>goal-verify</code></a></td>
      <td>验证目标完成、声明边界、证据覆盖和重要但未声明的缺陷/风险（material unclaimed defects/risks），并输出下一轮 Gap。</td>
    </tr>
  </tbody>
</table>

## 设计原则

Alpha Goal 让 agent 工作保持目标明确、行动有界、声明受证据约束。

- 证据先于授权：当前代码事实只描述现状；期望行为来自用户意图、规格、issue 或已接受契约。
- 目标先于行动：结果（outcome）、范围（scope）、非目标（non-goals）、验收证据（acceptance evidence）、决策负责人（decision owner）和声明边界（claim boundary）共同限定什么可以被改变。
- 持久状态：`goal-contract.md` 是 `alpha-goal` 的默认产物，直接包含发现记录、访谈记录和最终契约；`checkpoint.md` 按需承载运行档案。
- 有界执行：优先选择可取证的有界动作或定向变更，而不是宽泛重构和猜测式清理；已接受契约、必要 Run Profile 和仓库策略共同约束动作权限。
- 独立验证：最终、就绪、安全、完成、修复或评审等声明需要新鲜证据和缺陷/风险扫描（defect/risk sweep），并且要与执行过程分离检查。
- 诚实路由：目标不清回到 `alpha-goal`，同一目标内可修复的执行缺口回到 `control-loop`，证据或审查面不足的最终声明继续进入 `goal-verify`。
