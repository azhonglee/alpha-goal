# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `goal-loop/` | Router and global invariants. |
| `goal-frame/` | Goal Contract, clarification, target/domain boundary, existing work scan, and spec escalation. |
| `goal-iterate/` | One bounded implementation iteration with loop mode evidence, risk-matched debug receipts, mutation preflight, and plan escalation. |
| `goal-review/` | Review Record for direction, feedback, scope, entity/evidence alignment, artifact freshness, architecture, and completion readiness. |
| `goal-verify/` | Verification Verdict, artifact alignment, root-cause/claim-boundary checks, and completion routing. |

## Supporting directories

| Directory | Purpose |
|---|---|
| `tools/` | Local validation helper. |
| `templates/` | 默认同步的用户级 Codex 配置模板；不包含 sandbox 权限、休眠行为或不稳定特性警告抑制项。 |
| `scripts/` | 安装脚本。 |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Symlinks required top-level skills into `${CODEX_HOME:-$HOME/.codex}/skills`, merges user config templates by default unless `--no-sync-user-templates` is passed, cleans legacy support links, and validates target symlinks. |
| `goal-iterate/scripts/mutation-preflight.sh` | No | Prints git root, branch, status, worktrees, local rule files. |
| `goal-verify/scripts/evidence-summary.sh` | No | Prints changed files, diff stat, diff check status, recent commits. |
| `tools/validate_skillset.py` | No | Checks skill front matter, invocation metadata, bundled references/scripts, install docs, templates, top-level skill set, and selected consistency rules. |

## Invocation policy

`goal-loop/agents/openai.yaml` allows implicit invocation. Stage skills set `policy.allow_implicit_invocation: false` so they can be invoked explicitly or loaded by the router without competing with the router during ordinary task matching.
