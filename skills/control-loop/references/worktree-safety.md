# Worktree Safety

Use this reference when mutation could pollute a primary checkout or cross an ownership boundary.

## Isolation rule

Isolation is valid when the edit path is:

- not the primary checkout;
- inside the approved repository or owner boundary;
- ignored by the primary checkout or outside tracked paths;
- recorded before mutation;
- compatible with project rules and unrelated user changes.

Default candidate path:

```text
.worktrees/codex/<task-slug>/
```

Project rules or an already approved external worktree path may override it.

## Primary checkout warning signs

Treat the current checkout as primary when:

- it is on `main`, `master`, `trunk`, or the repo default branch;
- `git worktree list` shows it as the base checkout;
- project rules say not to edit the main checkout;
- branch/worktree state is unknown.

## Read-only preflight

```bash
git worktree list
git status --short
git check-ignore -q .worktrees/codex/<task-slug> || printf 'CHECK: default worktree path is not ignored here\n'
git check-ignore -q .alpha-goal/preflight-check || printf 'CHECK: add .alpha-goal/ to the repo root .gitignore before writing process artifacts\n'
```

These checks evaluate default candidates only. If `.alpha-goal/` is not ignored, add `.alpha-goal/` to the repo root `.gitignore` before writing ledger, evidence, review, or scratch artifacts. If the approved path differs, check that path instead.

## Safe pattern

If `.worktrees/` is ignored and matches project rules:

```bash
mkdir -p .worktrees/codex
git worktree add .worktrees/codex/<task-slug> -b <branch-name> <base-branch>
cd .worktrees/codex/<task-slug>
```

Only after entering the isolated worktree should mutation begin.

## Unsafe pattern

Avoid direct mutation in the primary checkout, including:

```bash
git checkout -b <branch-name>
git switch -c <branch-name>
```

Also avoid direct edits or deletes in that checkout unless explicitly approved and risk is recorded.

## Existing changes

If unrelated user changes exist:

- do not overwrite them;
- avoid broad formatting commands;
- use targeted edits;
- mention them in the 迭代记录;
- ask before stashing, reverting, or moving them.
