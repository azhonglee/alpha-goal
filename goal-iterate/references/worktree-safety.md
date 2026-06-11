# Worktree Safety

Use this reference for repositories where primary branch pollution is a risk.

## Primary checkout warning signs

Treat the current checkout as primary when:

- it is on `main`, `master`, `trunk`, or the repo default branch;
- `git worktree list` shows it as the base checkout;
- project rules say not to edit the main checkout;
- branch/worktree state is unknown.

## Safe pattern

Prefer:

```bash
git worktree list
git status --short
mkdir -p .worktrees
git worktree add .worktrees/<task-name> -b <branch-name> <base-branch>
cd .worktrees/<task-name>
```

Only after entering the isolated worktree should mutation begin.

## Unsafe pattern

Avoid:

```bash
git checkout -b <branch-name>
# or
git switch -c <branch-name>
```

inside the primary `main`/`master` checkout.

## Existing changes

If unrelated user changes exist:

- do not overwrite them;
- avoid broad formatting commands;
- use targeted edits;
- mention the unrelated changes in the Iteration Record;
- ask before stashing, reverting, or moving them.
