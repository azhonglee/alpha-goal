# Execution Boundaries

当 iteration 涉及 subagents、ownership 不清、多路径、generated outputs、跨 repo/worktree/submodule 或用户未提交改动时使用。

## Subagent delegation

只把边界清楚、相互独立的工作交给 subagents。

- 提供 task id、scope、working directory、ownership surface、approved context/contract/plan 证据、constraints、expected evidence、return contract。
- 只有 ownership 独立且共享文件/生成物不冲突时并行。
- 要求 receipt：`DONE`、`DONE_WITH_CONCERNS`、`NEEDS_CONTEXT`、`BLOCKED`。
- 接受前检查 delegated files、ownership、evidence、concerns。
- Delegated output 不绕过 Goal Contract、Iteration Record、Verification Verdict、risk-tier evidence 或 final checks。

## Ownership boundaries

编辑前识别：

- repository root 和 current branch；
- 当前目录是否 linked worktree；
- dirty state 和 unrelated user changes；
- 每个 touched path 的 owning git root；
- nested `.git` 或 submodules；
- 适用 `AGENTS.md`、`AGENTS.override.md`、`CLAUDE.md`、`code_review.md`。

Approved context 未明确包含并授权的 repo、worktree、submodule 或 ownership boundary，不得修改。

## User and unrelated changes

若有无关用户改动：

- 不覆盖；
- 避免 broad formatting；
- 使用 targeted edits；
- 在 Iteration Record 里说明；
- stash、revert 或 move 前先问。
