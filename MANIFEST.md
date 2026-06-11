# Manifest

## Skills

| Directory | Purpose |
|---|---|
| `goal-loop/` | Router and global invariants. |
| `goal-frame/` | Goal Contract, clarification, target boundary, existing work scan. |
| `goal-iterate/` | One bounded implementation iteration with mutation preflight. |
| `goal-verify/` | Verification Verdict and completion routing. |

## Supporting directories

| Directory | Purpose |
|---|---|
| `adapters/` | Optional environment-specific references. |
| `tools/` | Local validation helper. |

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `goal-iterate/scripts/mutation-preflight.sh` | No | Prints git root, branch, status, worktrees, local rule files. |
| `goal-verify/scripts/evidence-summary.sh` | No | Prints changed files, diff stat, diff check status, recent commits. |
| `tools/validate_skillset.py` | No | Checks skill directories have basic front matter. |
