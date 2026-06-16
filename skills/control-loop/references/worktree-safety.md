# Worktree 安全

不得在主 `main` / `master` / `trunk` 检出区改动。优先仓库本地 `.worktrees/codex/<slug>/`。确认 `.worktrees/` 与 `.alpha-goal/` 被忽略；无关用户变更保留；危险命令、跨仓库或子模块边界需先回契约。
