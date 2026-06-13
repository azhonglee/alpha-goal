# Worktree Safety

Use this reference when mutation could pollute a primary checkout or cross an ownership boundary.

## Isolation rule

Isolation is valid when the edit path is:

- not the primary checkout;
- inside the approved repository or owner boundary;
- ignored by the primary checkout or outside tracked paths;
- recorded before mutation;
- compatible with project rules and unrelated user changes.

The default candidate path is `.worktrees/codex/<task-slug>/`, but project rules or an already approved external worktree path may override it.

## Primary checkout warning signs

Treat the current checkout as primary when:

- it is on `main`, `master`, `trunk`, or the repo default branch;
- `git worktree list` shows it as the base checkout;
- project rules say not to edit the main checkout;
- branch/worktree state is unknown.

## Read-only preflight

Start with facts, not mutation:

```bash
git worktree list
git status --short
git check-ignore -q .worktrees/codex/<task-slug> || printf 'CHECK: default worktree path is not ignored here\n'
git check-ignore -q .alpha-goal/preflight-check || printf 'CHECK: .alpha-goal/ is not ignored here\n'
```

Those checks evaluate default candidates only. If the approved path differs, check that path instead.

## Safe pattern

If `.worktrees/` is ignored and matches the project rules, create a repository-local worktree from the owning repo or subrepo:

```bash
mkdir -p .worktrees/codex
git worktree add .worktrees/codex/<task-slug> -b <branch-name> <base-branch>
cd .worktrees/codex/<task-slug>
```

Only after entering the isolated worktree should mutation begin.

If `.worktrees/` is not ignored, do not silently edit `.gitignore` from a primary checkout. Prefer an already ignored root or an external worktree path. If the repository needs a `.gitignore` setup change, make that change from an isolated branch/worktree when possible, validate it with `git check-ignore`, and record it.

## Lifecycle

Keep the isolated worktree until the PR/MR has merged or the task branch has been locally merged into the target branch. Delete the worktree only after that merge boundary is complete. Do not proactively merge the task branch into `main` or `master` locally.

## Unsafe pattern

Avoid direct mutation in the primary checkout, including:

```bash
git checkout -b <branch-name>
# or
git switch -c <branch-name>
```

Also avoid direct file edits or deletes in that checkout.

## Existing changes

If unrelated user changes exist:

- do not overwrite them;
- avoid broad formatting commands;
- use targeted edits;
- mention the unrelated changes in the Iteration Record;
- ask before stashing, reverting, or moving them.
