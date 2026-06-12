# Worktree Safety

Use this reference for repositories where primary branch pollution is a risk.

## Primary checkout warning signs

Treat the current checkout as primary when:

- it is on `main`, `master`, `trunk`, or the repo default branch;
- `git worktree list` shows it as the base checkout;
- project rules say not to edit the main checkout;
- branch/worktree state is unknown.

## Safe pattern

Start with a read-only preflight in the current checkout:

```bash
git worktree list
git status --short
git check-ignore -q .worktrees/codex/<task-slug> || printf 'BLOCKED: .worktrees/ is not ignored here\n'
git check-ignore -q .goal-loop/preflight-check || printf 'BLOCKED: .goal-loop/ is not ignored here\n'
```

If `.worktrees/` is already ignored, it is safe to create the isolated worktree. In monorepos, run this from the owning subrepo unless project rules define a stricter owner or path:

```bash
mkdir -p .worktrees/codex
git worktree add .worktrees/codex/<task-slug> -b <branch-name> <base-branch>
cd .worktrees/codex/<task-slug>
```

Only after entering the isolated worktree should mutation begin.

If `.worktrees/` is not ignored, do not silently edit `.gitignore` from the preflight snippet, and do not edit `.gitignore` in the primary checkout. Prefer an already ignored worktree root or an external worktree path outside the primary checkout. If the repository needs a `.gitignore` setup change, make that change from an isolated branch/worktree, validate it with `git check-ignore`, and include it in the Iteration Record.

If project rules require a different ignored worktree root, use that root instead. If `.gitignore` has unrelated user changes or cannot be safely edited, ask before changing it and record the blocker.

## Lifecycle

Keep the isolated worktree until the PR/MR has merged or the task branch has been locally merged into the target branch. Delete the worktree only after that merge boundary is complete. Do not proactively merge the task branch into `main` or `master` locally.

## Unsafe pattern

Avoid:

```bash
git checkout -b <branch-name>
# or
git switch -c <branch-name>
```

inside the primary `main`/`master` checkout. Also avoid direct file edits or deletes in that checkout.

## Existing changes

If unrelated user changes exist:

- do not overwrite them;
- avoid broad formatting commands;
- use targeted edits;
- mention the unrelated changes in the Iteration Record;
- ask before stashing, reverting, or moving them.
