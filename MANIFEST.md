# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: fact discovery, clarification, Goal Contract, trigger contract, authority boundary, route. |
| `skills/control-loop/` | Goal-contract-driven bounded actuator/controller: act or harden authorized slices; use Goal Contract as the required input and one conditional checkpoint for recovery, trigger handling, durable evidence, or verification. |
| `skills/goal-verify/` | Independent goal verifier for evidence coverage, claim boundaries, defect/risk sweep, and verification gaps. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`.

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Installs the three public skills as direct symlinks under `$HOME/.agents/skills`, cleans same-repo old skill links including migrated Codex skill symlinks during install, syncs target-specific Codex/Claude user configuration, and uninstalls managed target-specific artifacts without running skill validation. |
| `tools/validate_skills.js` | No | Validates the shared contract, public-skill structure, references, word+punctuation budget, scripts, docs, fixtures, and schemas. |

## User Hooks

`templates/hooks.json` defines one Codex user-level `SessionStart` / `^compact$` hook, marked by `codex-alpha-goal-compact-recovery:v1`. `scripts/install.sh --target global` and `scripts/install.sh --target codex` merge that template into `${CODEX_HOME:-$HOME/.codex}/hooks.json`. The hook prints a static compact recovery policy that asks Codex to re-check `alpha-goal`, `control-loop`, and `goal-verify` after compaction and load the applicable skill. It restores draft or accepted `goal-contract.md` for Alpha Goal framing, reads `technical_design.md` with the Goal Contract when it exists, requires accepted status only for `control-loop` execution handoff, and covers goal verification, claim-boundary checks, and defect/risk sweep when needed.

Hook replacement is by marker family, not exact version, so later `:v2` template markers replace existing `:v1` hooks. The installer also migrates the earlier experimental `codex-compact-skill-recovery` family.

## User Templates

`templates/AGENTS.md` and `templates/config.toml` are Codex user-level templates. `templates/CLAUDE.md` is the Claude user-level template written to `$HOME/.claude/CLAUDE.md`. `--target global` syncs both Codex and Claude configuration, `--target codex` syncs only Codex configuration, and `--target claude` syncs only Claude configuration. `--no-sync-user-templates` skips both Codex and Claude templates for the selected target; `--no-sync-user-hooks` skips only Codex hooks.

`scripts/install.sh --uninstall` removes only managed artifacts for the selected target. `--target codex` removes managed Codex `AGENTS.md`, `config.toml` that byte-for-byte matches `templates/config.toml`, and managed hooks while preserving shared skills. `--target claude` removes managed Claude `CLAUDE.md` while preserving shared skills. `--target global` removes both Codex and Claude managed configuration plus this repository's skill symlinks under `$HOME/.agents/skills`. Uninstall preserves configuration symlinks, real skill directories, external symlinks, mixed user files, unmanaged hooks, and legacy Codex skills paths.

## Runtime Artifacts

Default runtime artifacts live under the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`, where `<workspace-slug>` comes from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/goal-contract.md` | Default `alpha-goal` artifact and canonical draft or accepted contract, including contract status, discovery notes, interview ledger, authorization source, and handoff context. |
| `<state-root>/YYYYMMDD-<TaskName>/technical_design.md` | Conditional canonical Technical Design for implementation, repair, refactor, hardening, or cross-file behavior changes, including architecture, interfaces, data flow, tests, risks, and acceptance evidence mapping. |
| `<state-root>/YYYYMMDD-<TaskName>/checkpoint.md` | Conditional task checkpoint containing only needed sections: run profile, loop state, memory, iteration, evidence, and verification; memory entries keep evidence, confidence, and invalidation. |
| `<state-root>/control-state/latest.md` | Optional global recovery index pointing to the latest accepted task state, Goal Contract, optional checkpoint, phase, route, and update time; not a stage artifact. |

## Count Budget

The enforced count budget is the whole `skills/` tree, capped at 15,000 word+punctuation units. Counted units are words plus punctuation/symbol marks. The cap preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, authority gates, behavior-level gates, and evaluator feedback without over-compressing their meaning.
