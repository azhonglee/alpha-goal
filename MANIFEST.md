# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Discovery + Socratic interview、ambiguity scoring、Goal Contract、入口路由和 artifact safety。 |
| `skills/loop/` | 按 Goal type 执行 dynamic planning、execution、feedback 三段循环。 |
| `skills/verify/` | 验收 acceptance、检查证据边界并给出 Verification Verdict/Judgment。 |

## Supporting directories

| Directory | Purpose |
|---|---|
| `tools/` | 本地校验工具。 |
| `templates/` | 默认同步的用户级 Codex 配置模板；不包含 sandbox 权限、休眠行为或不稳定特性警告抑制项。 |
| `scripts/` | 安装脚本。 |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Symlinks required skills from `skills/` into `${CODEX_HOME:-$HOME/.codex}/skills`, replaces same-repo legacy skill links, merges user config templates by default unless `--no-sync-user-templates` is passed, cleans legacy support links, and validates target symlinks. |
| `skills/loop/scripts/mutation-preflight.sh` | No | Prints git root, branch, status, worktrees, local rule files, ignored worktree/evidence paths, and submodules. |
| `skills/verify/scripts/evidence-summary.sh` | No | Prints changed files, diff stat, diff check status, and recent commits. |
| `tools/validate_skillset.py` | No | Checks skill front matter, invocation metadata, bundled references/scripts, install docs, templates, `skills/` layout, and selected consistency rules. |

## Invocation policy

`skills/alpha-goal/agents/openai.yaml` allows implicit invocation. Downstream stage skills set `policy.allow_implicit_invocation: false` so they can be invoked explicitly or selected by `alpha-goal` without competing during ordinary task matching.

默认主路径是：

```text
INTENT -> ALPHA-GOAL(discovery + interview + contract) -> ITERATE(dynamic plan -> execution -> feedback) -> VERIFY -> FINAL
```
