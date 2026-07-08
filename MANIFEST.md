# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: fact discovery, Goal Contract clarification, Design Choice Gate, confirmation, and Native Goal Sync. |
| `skills/executor/` | Goal-contract-driven bounded actuator/controller: act or harden authorized slices; use Goal Contract as required input and a conditional checkpoint for recovery or evidence handoff. |
| `skills/verifier/` | Independent verifier for acceptance evidence, hard-blocking checklist coverage, claim boundaries, blockers, and route decisions. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`.

`alpha-goal` also owns Native Goal Sync: after user approval, it may create or reuse the current thread's native goal from the accepted Goal Contract summary and Technical Design link when present. Execution handoff and verification routing remain otherwise unchanged; `executor` and `verifier` do not control native goal status.

Design clarification details are progressively disclosed through `skills/alpha-goal/references/design-clarification-book.md` only after Design Choice Gate selects Technical Design; `skills/alpha-goal/SKILL.md` keeps Goal Contract clarification and confirmation control flow.

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Copies the three public skills under `$HOME/.agents/skills`, links Claude skills from `$HOME/.claude/skills` for `global` and `claude` targets, presents a color+Unicode arrow-key target menu for interactive no-target runs, prints grouped install/uninstall summaries, migrates same Git common-dir worktree skill symlinks into copied directories, cleans same-repo old skill links including migrated Codex skill symlinks during install, syncs target-specific Codex/Claude user configuration, and uninstalls managed target-specific artifacts without running skill validation. |
| `tools/validate_skills.js` | No | Validates the shared contract, public-skill structure, references, word+punctuation budget, scripts, docs, fixtures, and schemas. |

## User Hooks

`templates/hooks.json` defines one Codex user-level `PostCompact` hook, marked by `codex-alpha-goal-compact-recovery:v1`, without a matcher so all post-compaction triggers are covered. `scripts/install.sh --target global` and `scripts/install.sh --target codex` merge that template into `${CODEX_HOME:-$HOME/.codex}/hooks.json`. The hook prints a compact recovery policy that reloads the applicable `alpha-goal`, `executor`, or `verifier` skill, resumes from `goal-contract.md`, reads `technical_design.md` when present for implementation, repair, refactor, hardening, cross-file behavior, interface/data-model changes, or material risk after Design Choice Gate, uses `control-state/latest.md` only when task identity is ambiguous, and uses `checkpoint.md` for recovery, evidence handoff, or verification handoff. `executor` still requires an accepted Goal Contract; `verifier` compares evidence with the hard-blocking acceptance checklist before returning a route.

Hook replacement is by marker family, not exact version, so later `:v2` template markers replace existing `:v1` hooks. The installer also migrates the earlier experimental `codex-compact-skill-recovery` family.

## User Templates

`templates/AGENTS.md` and `templates/config.toml` are Codex user-level templates. `templates/CLAUDE.md` is the Claude user-level template written to `$HOME/.claude/CLAUDE.md`. `--target global` syncs both Codex and Claude configuration, `--target codex` syncs only Codex configuration, and `--target claude` syncs only Claude configuration. `--no-sync-user-templates` skips both Codex and Claude templates for the selected target; `--no-sync-user-hooks` skips only Codex hooks.

Without `--target`, TTY installs use a color+Unicode Up/Down + Enter menu with `codex` selected by default; the menu states that shared skills install to `$HOME/.agents/skills`, and non-TTY installs still default to `codex`. Install and uninstall completion output uses a grouped summary that shows only active effects for the selected target and omits skipped lines; install output omits `Result`, `Skills ... linked`, and `Install target`. During install, an existing skill symlink is migrated without `--force` only when it points to `skills/<skill>` in this repository or another worktree sharing the same Git common-dir. External symlinks and non-skill paths keep the existing refusal or `--force` behavior, real shared skill directories are recopied, and ordinary files are refused.

`scripts/install.sh --uninstall` removes only managed artifacts for the selected target. `--target codex` removes managed Codex `AGENTS.md`, `config.toml` that byte-for-byte matches `templates/config.toml`, and managed hooks while preserving shared skills and Claude skill links. `--target claude` removes managed Claude `CLAUDE.md` while preserving shared skills and Claude skill links. `--target global` removes both Codex and Claude managed configuration plus this repository's copied skills under `$HOME/.agents/skills` and Claude skill links under `$HOME/.claude/skills`. Uninstall preserves configuration symlinks, unmanaged real skill directories, external symlinks, mixed user files, unmanaged hooks, and legacy Codex skills paths.

## Runtime Artifacts

Default runtime artifacts live under the user-level Alpha Goal state root: `$HOME/.alpha-goal/<workspace-slug>/`, where `<workspace-slug>` comes from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/goal-contract.md` | Default `alpha-goal` artifact and canonical draft or accepted contract, including contract status, discovery notes, interview ledger, authorization source, and handoff context. |
| `<state-root>/YYYYMMDD-<TaskName>/technical_design.md` | Conditional canonical Technical Design created only after Design Choice Gate selects Technical Design clarification. |
| `<state-root>/YYYYMMDD-<TaskName>/checkpoint.md` | Conditional task checkpoint for current slice, completed actions, raw evidence, acceptance checklist, known gaps, blockers, and next route. |
| `<state-root>/control-state/latest.md` | Optional global recovery index pointing to the latest accepted task state, Goal Contract, optional checkpoint, phase, route, and update time; not a stage artifact. |

## Count Budget

The enforced count budget is the whole `skills/` tree, capped at 15,000 word+punctuation units. Counted units are words plus punctuation/symbol marks. The cap preserves trigger behavior, durable state, authority gates, hard-blocking acceptance checks, route decisions, and verifier feedback without over-compressing their meaning.
