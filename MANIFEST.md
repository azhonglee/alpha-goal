# Manifest

## Public Skills

| Directory | Purpose |
|---|---|
| `skills/alpha-goal/` | Front-end controller: fact discovery, Goal Contract clarification, Goal Contract review/confirmation, Technical Design runbook routing, and Native Goal Sync. |
| `skills/executor/` | Goal-contract-driven bounded actuator/controller: act or harden authorized slices; use Goal Contract as authority and a required checkpoint for checklist, slice evidence, and verifier handoff. |
| `skills/verifier/` | Independent verifier for acceptance evidence, hard-blocking checklist coverage, claim boundaries, blockers, and route decisions. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`.

`alpha-goal` also owns Native Goal Sync: after user approval, it may create or reuse the current thread's native goal from the accepted Goal Contract summary and Technical Design link when present. `verifier` owns route semantics; the calling Agent uses terminal routes to manage native Goal updates.

Technical Design flow is progressively disclosed through `skills/alpha-goal/references/technical-design-runbook.md` only after Goal Contract Confirmation Gate selects `run technical design`; `skills/alpha-goal/SKILL.md` keeps Goal Contract clarification and confirmation control flow.

Claude runtime tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md`. For `claude` installs, `scripts/install.sh` injects the Entry Gate reminder into the installed Alpha Goal skill copy; source `SKILL.md` remains runtime-neutral.

## Scripts

| Path | Mutates state? | Purpose |
|---|---:|---|
| `scripts/install.sh` | Yes | Copies the three public skills into target-specific independent roots, `$HOME/.codex/skills` for `codex` and `$HOME/.claude/skills` for `claude`, accepts only `--uninstall` as a CLI option, presents a color+Unicode arrow-key target menu for interactive runs with `codex`, `claude`, and `all`, asks only for the target during install, uses fixed install defaults for Codex home, force, template sync, hook sync, and verbose output, prompts interactively for uninstall cleanup choices, rejects non-interactive runs, prints grouped install/uninstall summaries including both skill roots for `all`, migrates same Git common-dir worktree skill symlinks into copied directories, cleans same-repo old Codex skill links during Codex install, injects ClaudeAdapter guidance during Claude install, syncs target-specific Codex/Claude user configuration, and uninstalls managed target-specific artifacts without running skill validation. |
| `tools/validate_skills.js` | No | Validates the shared contract, public-skill structure, references, word+punctuation budget, scripts, docs, fixtures, and schemas. |

## User Hooks

`templates/hooks.json` defines one Codex user-level `PostCompact` hook, marked by `codex-alpha-goal-compact-recovery:v1`, without a matcher. A Codex install merges that template into `$HOME/.codex/hooks.json`. The hook reloads the applicable Alpha Goal skill and resumes only from an explicit current artifact path already present in task context.

Hook replacement is by marker family, not exact version, so later `:v2` template markers replace existing `:v1` hooks. The installer also migrates the earlier experimental `codex-compact-skill-recovery` family.

## User Templates

`templates/AGENTS.md` and `templates/config.toml` are Codex user-level templates. `templates/CLAUDE.md` is the Claude user-level template written to `$HOME/.claude/CLAUDE.md`. The interactive target selection controls whether Codex, Claude, or both configurations are synced. Install always syncs selected user templates and Codex hooks using fixed defaults; uninstall prompts control whether user templates and Codex hooks are cleaned up.

TTY installs use a color+Unicode Up/Down + Enter menu with `codex` selected by default. The menu includes `codex`, `claude`, and `all`; selecting `all` syncs or uninstalls both Codex and Claude in one run. Install asks only for the target menu, fixes Codex home to `$HOME/.codex`, ignores `CODEX_HOME`, uses `force=false`, syncs selected templates and Codex hooks, and leaves verbose output disabled. Non-TTY runs are refused. `all` is rejected when Codex and Claude skill roots resolve to the same path, preventing one target-specific skill copy from overwriting the other. Install and uninstall success output is one concise completion line; detailed summary blocks are not printed. During install, an existing skill symlink is migrated only when it points to `skills/<skill>` in this repository or another worktree sharing the same Git common-dir. External symlinks, non-skill paths, and ordinary files are refused; real managed skill directories are recopied.

`scripts/install.sh --uninstall` enters the interactive uninstall flow and removes only managed artifacts for the selected target. Codex uninstall removes managed Codex `AGENTS.md`, `config.toml` that byte-for-byte matches `templates/config.toml`, managed hooks, and managed Codex skill copies. Claude uninstall removes managed Claude `CLAUDE.md` and managed Claude skill copies. Uninstall preserves configuration symlinks, unmanaged real skill directories, external symlinks, mixed user files, and unmanaged hooks.

## Runtime Artifacts

Default runtime artifacts live under the user-level Alpha Goal state root: `$HOME/.alpha-goal/<workspace-slug>/`, where `<workspace-slug>` comes from stable workspace identity: `slug(repo_root or Goal Contract target workspace)`.

| Path | Purpose |
|---|---|
| `<state-root>/YYYYMMDD-<TaskName>/goal-contract.md` | Default `alpha-goal` artifact and canonical draft or accepted contract, including status, authorization source, discovery, and handoff context. |
| `<state-root>/YYYYMMDD-<TaskName>/technical_design.md` | Conditional canonical Technical Design for the current Goal Contract, with draft, accepted, or rejected status. |
| `<state-root>/YYYYMMDD-<TaskName>/checkpoint.md` | Required during executor runs for the acceptance checklist, current slice, raw evidence, gaps, blockers, and verifier route. |

## Count Budget

The enforced count budget is the whole `skills/` tree, capped at 15,000 word+punctuation units. Counted units are words plus punctuation/symbol marks. The cap preserves trigger behavior, durable state, authority gates, hard-blocking acceptance checks, route decisions, and verifier feedback without over-compressing their meaning.
