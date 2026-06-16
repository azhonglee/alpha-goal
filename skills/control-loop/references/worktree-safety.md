# 工作树安全

当改动可能污染主检出区或跨越归属边界时，使用本参考。

## 隔离规则

编辑路径满足以下条件时，隔离有效：

- 不是主检出区；
- 位于已批准仓库或归属边界内；
- 被主检出区忽略，或位于已跟踪路径之外；
- 改动前已记录；
- 与项目规则和无关用户变更兼容。

默认候选路径：

```text
.worktrees/codex/<task-slug>/
```

项目规则或已批准的外部 worktree 路径可以覆盖该默认值。

## 主检出目录警示信号

以下情况把当前检出目录视为主检出区：

- 当前分支是 `main`、`master`、`trunk` 或仓库默认分支；
- `git worktree list` 显示它是基础检出区；
- 项目规则说明不要编辑主检出区；
- 分支 / worktree 状态未知。

## 只读预检

```bash
git worktree list
git status --short
git check-ignore -q .worktrees/codex/<task-slug> || printf '检查：默认 worktree 路径在这里未被忽略\n'
git check-ignore -q .alpha-goal/preflight-check || printf '检查：写流程产物前先把 .alpha-goal/ 加入仓库根目录 .gitignore\n'
```

这些检查只评估默认候选路径。如果 `.alpha-goal/` 未被忽略，在写台账、证据、评审或 scratch 产物前，把 `.alpha-goal/` 加入仓库根目录 `.gitignore`。如果已批准路径不同，改查该路径。

## 安全模式

如果 `.worktrees/` 已被忽略且符合项目规则：

```bash
mkdir -p .worktrees/codex
git worktree add .worktrees/codex/<task-slug> -b <branch-name> <base-branch>
cd .worktrees/codex/<task-slug>
```

只有进入隔离 worktree 后，才开始改动。

## 不安全模式

避免在主检出区直接改动，包括：

```bash
git checkout -b <branch-name>
git switch -c <branch-name>
```

除非明确批准并记录风险，否则也避免在该检出区直接编辑或删除。

## 既有变更

如果存在无关用户变更：

- 不覆盖它们；
- 避免大范围格式化命令；
- 使用定向编辑；
- 在迭代记录中说明这些变更；
- stash、revert 或移动前先询问。
