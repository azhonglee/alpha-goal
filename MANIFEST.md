# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `goal-loop/` | Router and global invariants. |
| `goal-frame/` | Goal Contract, clarification, target boundary, existing work scan. |
| `goal-iterate/` | One bounded implementation iteration with mutation preflight. |
| `goal-review/` | Review Record for direction, feedback, scope, architecture, and completion readiness. |
| `goal-verify/` | Verification Verdict and completion routing. |

## Supporting directories

| Directory | Purpose |
|---|---|
| `adapters/` | Optional environment-specific references. |
| `tools/` | Local validation helper. |
| `templates/` | 可选的用户级 Codex 配置模板。 |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `goal-iterate/scripts/mutation-preflight.sh` | No | Prints git root, branch, status, worktrees, local rule files. |
| `goal-verify/scripts/evidence-summary.sh` | No | Prints changed files, diff stat, diff check status, recent commits. |
| `tools/validate_skillset.py` | No | Checks skill front matter, invocation metadata, bundled references/scripts, install docs, and templates. |

## Invocation policy

`goal-loop/agents/openai.yaml` allows implicit invocation. Stage skills set `policy.allow_implicit_invocation: false` so they can be invoked explicitly or loaded by the router without competing with the router during ordinary task matching.
