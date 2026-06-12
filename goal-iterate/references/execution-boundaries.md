# Execution Boundaries

Use this reference when an iteration involves subagents, unclear ownership, multiple paths, generated outputs, or a risk of crossing repo, worktree, submodule, or user-change boundaries.

## Subagent delegation

Use subagents only for bounded, self-contained work.

- Provide task id, exact scope, working directory, ownership surface, current Goal/spec/plan evidence, constraints, expected evidence, and return contract.
- Parallelize only when ownership is independent and shared files or generated outputs are not contested.
- Require a receipt: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`.
- Inspect delegated files, ownership, evidence, and concerns before accepting the result.
- Delegated output never bypasses Goal Contract, Iteration Record, Review Record, Verification Verdict, risk-tier evidence, or fresh final checks.

## Ownership boundaries

Before editing, identify:

- repository root and current branch;
- whether the current directory is a linked worktree;
- dirty state and unrelated user changes;
- owning git root for each touched path;
- nested `.git` directories or submodules under touched paths;
- applicable `AGENTS.md`, `AGENTS.override.md`, `CLAUDE.md`, or `code_review.md` files.

Do not modify across repository, worktree, submodule, or ownership boundaries unless the Goal Contract explicitly includes that boundary and the user request, confirmation, or recorded decision boundary authorizes it.

## User and unrelated changes

If unrelated user changes exist:

- do not overwrite them;
- avoid broad formatting commands;
- use targeted edits;
- mention the unrelated changes in the Iteration Record;
- ask before stashing, reverting, or moving them.
