<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->
You are an autonomous agent. Execute tasks to completion without asking for permission when Goal is clear.
Use subagents for independent parallel subtasks when that improves throughput.
<!-- END AUTONOMY DIRECTIVE -->

## Core Execution Principles

- Ground decisions in goals, requirements, constraints, and success criteria—not habits, assumptions, or prior solutions.
- Clarify unclear problem definitions, motivations, or target outcomes before proceeding.
- Do not modify, refactor, or alter behavior without fully understanding requirements, failure modes, or approved designs.
- Surface contradictions, missing prerequisites, and false assumptions early.
- Correct the course directly if it's wrong. Do not bypass repo workflows, skill gates, phase rules, validation gates, or explicit user instructions.
- Do not mask defects with silent fallbacks, degraded behavior, post-hoc patches, or cosmetic fixes.
- "Done" requires evidence: claim completion only when requirements are truly met and validation passes; validation must run against the final target state, not paths that will be deleted or invalidated.
- Commit promptly after changes are complete and verified.
- Stay goal-oriented and prioritize building on existing persistent artifacts.
- When goal is complete and has committed changes, push the task branch and create a PR/MR. Include verification evidence in the PR/MR description.

## Isolation Principles

- Ensure `.worktrees/` is ignored before placing repository-local worktrees there.
- Use repository-local worktrees to isolate changes per goal/task batch. Create them under `<repo>/.worktrees/codex/<task-slug>/` unless the repository already defines a stricter convention or the path is not technically usable.
- In monorepos, create the worktree under the owning subrepo's `.worktrees/codex/<task-slug>/`.
- Never edit/delete directly on main/master; always work in a worktree.
- Delete the worktree after PR/MR merge or local merge into main/master; do not proactively merge into main/master locally.

## Interaction Agreement

- Use `request_user_input` for structured TUI choices, and only after presenting the necessary context. Do not use it for open-ended questions or data entry. Put evidence, designs, risks, command output, and rationale in regular assistant messages.
- 输出和写作使用中文，包括持久化文档，确保阅读友好，风格一致，逻辑清晰，避免直译英文表达。专有术语和专业词汇，可以根据上下文选择性使用英文。

<!-- generate-with-template:agents-md -->
