---
name: goal-loop
description: 路由非平凡 coding tasks through goal-frame, goal-iterate, and goal-verify。用于多步骤编码、需求不清、仓库修改、review、verification、recovery 或完成声明。
---

# Goal Loop Router

Goal Loop 是状态路由器，不直接承接阶段细节。

## 全局不变量

- 没有 Goal Contract，不进入修改。
- 没有目标边界，不进入修改。
- 没有隔离修改路径，不进入目标文件修改。
- 没有证据，不给 Verification Verdict。
- 没有 Verification Verdict，不声明实现完成。

## 阶段加载

进入阶段前读取对应独立 skill 的完整 `SKILL.md`：

- `FRAME`：读取 `../goal-frame/SKILL.md`。
- `ITERATE`：读取 `../goal-iterate/SKILL.md`。
- `VERIFY`：读取 `../goal-verify/SKILL.md`。

如果相对路径不可用，使用同名已安装 skill。若阶段 skill 不可用，停止并报告缺失，不要凭记忆执行该阶段。

## 状态机

```text
REQUEST
  -> FRAME
FRAME
  -> ITERATE
  -> VERIFY
  -> FINAL_ADVISORY
  -> ASK_USER
  -> BLOCKED
ITERATE
  -> VERIFY
  -> FRAME
  -> BLOCKED
VERIFY
  -> ITERATE
  -> FRAME
  -> DELIVER
  -> BLOCKED
DELIVER
  -> FINAL
```

## 路由规则

默认从 `FRAME` 开始，除非用户明确要求验证、比较或审查已有工作。

进入 `FRAME`：

- 新任务进入。
- 需求、目标仓库、验收、非目标或 claim boundary 不清楚。
- 任务可能跨仓库、子仓库、worktree 或已有 MR/PR/分支。
- 需要判断这是新实现、跟进、重复、替代方案还是 comparison-only。

进入 `ITERATE`：

- 已有 Goal Contract。
- `Frame verdict` 是 `READY_FOR_ITERATION`。
- 目标边界闭合，需要修改。
- 隔离修改路径已知，或可在 `goal-iterate` 的 preflight 后安全建立。

进入 `VERIFY`：

- 已有实现、diff、测试、证据或用户询问是否完成/正确/安全。
- 准备 final output、commit、PR/MR 或完成声明。
- `Frame verdict` 是 `COMPARISON_ONLY`，且需要对已有工作给出裁决。

进入 `FINAL_ADVISORY`：

- 任务是只读解释、摘录、总结或有限风险扫描。
- 输出不声称实现完成、修复完成或可发布。

进入 `DELIVER`：

- `Verification Verdict` 是 `PASS_TO_FINAL` 或 `NARROW_CLAIM_AND_FINAL`。
- 若仓库发生修改，按项目 `AGENTS.md` 完成 commit、push、PR/MR 或报告明确阻塞。

## 阶段产物

- `goal-frame` 产出 `Goal Contract`。
- `goal-iterate` 消费 `Goal Contract`，产出 `Iteration Record`。
- `goal-verify` 消费 `Goal Contract`、`Iteration Record` 和证据，产出 `Verification Verdict`。

Final output 只能引用已存在的阶段产物和新鲜验证证据，不得扩大 `Verification Verdict` 允许的 claim。
