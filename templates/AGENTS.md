<!-- AUTONOMY DIRECTIVE — DO NOT REMOVE -->
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
- When goal is complete and has committed changes, push the task branch and create a PR/MR.

## Human-in-the-Loop Policy

Use Human-in-the-Loop (HIL) policy for decisions, not for discoverable facts.

Before asking, decide whether the missing input is material, discoverable, risky, and user-owned.

- If it is safely discoverable, inspect local evidence first.
- If it is under-specified but safe defaults exist, state the defaults and continue only for reversible operational details inside an already confirmed goal; never default target, scope, acceptance, non-goals, side effects, risk acceptance, authority, or final claim.
- If it changes target, scope, acceptance, non-goals, side effects, risk acceptance, or final claim, ask before proceeding.
- Ask for permission before executing destructive actions, external side effects, credentials, or real user config changes.
- Ask one high-leverage question per round, backed by evidence already checked.

## Isolation Principles

- Resolve the Alpha Goal state root before writing runtime evidence, review notes, scratch artifacts, interview records, iteration records, or verification records. Use `ALPHA_GOAL_STATE_ROOT` when set; otherwise use `${CODEX_HOME:-$HOME/.codex}/state/alpha-goal/<workspace-slug>/`. Derive `<workspace-slug>` from the absolute git root when available, otherwise the absolute working directory or task context; strip leading slashes, replace characters outside `[A-Za-z0-9_.-]` with `-`, keep the last 80 characters, and fallback to `workspace`. Do not require a repo root for these files.
- Use repo-local `.alpha-goal/` only when user/project policy explicitly requires that override. If repo-local `.alpha-goal/` is used, ensure it is ignored before writing artifacts.
- Ensure `.worktrees/` is ignored before placing repository-local worktrees there.
- Use repository-local worktrees to isolate changes per goal/task batch. Create them under `<repo>/.worktrees/codex/<goal-slug>/` unless the repository already defines a stricter convention or the path is not technically usable.
- In monorepos, create the worktree under the owning subrepo's `.worktrees/codex/<goal-slug>/`.
- Never edit/delete directly on main/master; always work in a worktree.
- Delete the worktree after PR/MR merge or local merge into main/master; do not proactively merge into main/master locally.

## Interaction Agreement

- Use `request_user_input` default, backed by presenting the necessary clear context. Do not use it for purely open-ended questions or mere data entry.
- 输出和写作默认使用中文，包括持久化文档，确保阅读友好，风格一致，逻辑清晰，避免直译。涉及专业术语，可根据上下文选择性使用英文。

<!-- generate-with-template:agents-md -->
