# Execution Boundaries

Use this reference for subagents, unclear ownership, multi-path work, generated outputs, cross-repo/worktree/submodule work, or unrelated user changes.

## Subagent delegation

Delegate only bounded, independent work.

Provide:

- task id;
- scope and working directory;
- ownership surface;
- approved contract/plan evidence;
- constraints and non-goals;
- expected evidence;
- return receipt schema.

Receipt labels:

- `DONE`
- `DONE_WITH_CONCERNS`
- `NEEDS_CONTEXT`
- `BLOCKED`

Accept delegated output only after checking files, ownership, evidence, and concerns. Delegation never bypasses 目标契约, 迭代记录, 验证结论, strongest-risk evidence, or final checks.

## Ownership boundaries

Before editing, identify:

- repository root and current branch;
- whether current directory is a linked worktree;
- dirty state and unrelated user changes;
- owning git root for every touched path;
- nested `.git` directories and submodules;
- local rule files such as `AGENTS.md`, `AGENTS.override.md`, `CLAUDE.md`, or `code_review.md`.

Do not modify a repo, worktree, submodule, generated-output owner, or process boundary unless approved by the 目标契约 or user.

## Generated outputs

When generated files are involved:

- identify generator source and generated target;
- change the source when possible rather than only the generated output;
- run or record the generator command if required;
- avoid partial regeneration that rewrites unrelated surfaces;
- record generated artifacts in the 迭代记录.

## User and unrelated changes

If unrelated user changes exist:

- do not overwrite them;
- avoid broad formatting;
- use targeted edits;
- state how they were preserved;
- ask before stash, revert, move, or cleanup.
