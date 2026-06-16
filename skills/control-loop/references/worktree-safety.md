# Worktree Safety

Do not mutate primary `main/master/trunk`. Use repo-local `.worktrees/codex/<slug>/` when available unless repo policy defines a safer equivalent. Preserve unrelated user changes; never stash/revert/delete them without approval.
