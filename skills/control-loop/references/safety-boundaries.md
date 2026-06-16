# Safety Boundaries

Do not mutate primary `main/master/trunk`; use repo-local `.worktrees/codex/<slug>/` unless repo policy defines a safer equivalent. Preserve unrelated user changes; never stash/revert/delete them without approval. Stay inside approved files/modules/repos. Commit, push, PR/MR, deployment, credential changes, real user config changes, generated outputs, submodules, and external systems require explicit authority.
