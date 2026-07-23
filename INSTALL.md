# Installation and Smoke Test

## Install

Requires Node.js 18+ and Python 3. The installer uses repository-local JavaScript, vendored `smol-toml`, and Python only from the standard library.

```bash
scripts/install.sh
```

`scripts/install.sh` remains the supported entry point. Its implementation is split across `scripts/install/common.sh`, `interactive.sh`, `skills.sh`, `agents.sh`, `markdown.sh`, `config.sh`, `hooks.sh`, `transaction.sh`, `context.sh`, and `preflight.sh`; these modules are internal and are not standalone commands.

The script always copies the `deep-interview` / `alpha-goal` / `technical-design` goal-engineering core under the selected target's skill root and optionally copies the `executor` / `verifier` role pair:

```text
codex:  ${CODEX_HOME:-$HOME/.codex}/skills
claude: $HOME/.claude/skills
```

For `codex` and `all`, a separate default-Yes prompt installs the repository's managed Custom Agents under `${CODEX_HOME:-$HOME/.codex}/agents` and their routing block in the same configuration root's `AGENTS.md`. These agent files are user configuration, not skills or plugin components.

For `PERSIST`, `alpha-goal` compiles the Goal Contract and sets `status: accepted` only after required execution information, authority, observers, and risk treatment are complete. A material goal change starts a new Alpha Goal task instead of editing the accepted contract. Runtime handoff is recorded in `checkpoint.md`: only `active_owner` writes, each write increments `checkpoint_revision` once, and the next owner is assigned last.

## Options

```bash
scripts/install.sh
scripts/install.sh --uninstall
```

## Behavior

The script creates copied skill directories under target-specific independent roots. `codex` uses `${CODEX_HOME:-$HOME/.codex}/skills`; `claude` keeps using `$HOME/.claude/skills`. `--uninstall` is the only supported CLI option. All other choices are made in the interactive terminal flow:

- `codex`: sync Codex config and Codex skill copies.
- `claude`: sync Claude `CLAUDE.md` and Claude skill copies.
- `all`: sync or uninstall both Codex and Claude in one run.

Install uses a three-step terminal wizard: Target, Features, and Review. Up/Down moves, Space toggles a feature, Enter advances or confirms, `b` returns to the previous step, and `q` or Escape cancels before any target write. `codex` is the default target. The optional `executor` / `verifier` pair and, for `codex` or `all`, the contract-declared Custom Agents are enabled by default. `deep-interview`, `alpha-goal`, and `technical-design` are always installed. Disabling optional roles preserves those skill copies and skips Codex recovery-hook installation or update. Disabling Custom Agents leaves their same-name files and the managed routing block untouched. Claude-only runs never inspect or modify Codex agents. The Review step shows selected roots and features before installation begins. The Codex configuration root is `${CODEX_HOME:-$HOME/.codex}` and can operate without `HOME` when `CODEX_HOME` is set; Claude paths remain based on `$HOME/.claude`, so `claude` and `all` require `HOME`. Template sync is enabled and verbose output is disabled. For uninstall, the existing compact flow asks for the target, Codex home when relevant, Custom Agent cleanup when relevant, template cleanup, hook cleanup when relevant, and verbose output; uninstall continues to remove all managed public skills.

Non-interactive runs are refused. Any CLI argument other than `--uninstall`, including `--help`, `--target`, `--codex-home`, `--force`, sync toggles, or `--verbose`, is rejected.

Successful install and uninstall runs print one concise success line. Failures continue to print the specific error and exit non-zero.

Before the first managed-target write, install preflights every selected Markdown/config target, Custom Agent, skill destination, and hook. Markdown, TOML, and hook merges are executed against temporary copies; all skill/agent source copies and target ownership rules are checked. A conflict or malformed target therefore fails before configuration, agents, skills, or hooks are changed.

The write phase assumes one installer process and no external writes to selected targets until it finishes. It snapshots the exact paths it will mutate, renders Markdown, config, and hooks through same-directory staging files, and activates staged skill and Custom Agent copies without nesting them into an existing directory. On failure it restores the snapshots and removes paths created by the run; if rollback or snapshot cleanup fails, it retains the recovery path and reports it. The installer does not provide locking, concurrent-writer detection, or protection against targets changing during installation; do not run overlapping installs or modify their targets externally.

When installing skill copies, an existing target skill symlink is migrated only when it points to `skills/<skill-name>` in this repository or another worktree with the same Git common directory. A real directory is replaced only when it contains a valid, regular `.alpha-goal-skill-copy` marker; each new copy is staged before activation inside the install transaction. Unmanaged or malformed directories, Git detection failures, external symlinks, symlinks to other repo-relative paths, and ordinary files are refused. Codex and Claude receive the same runtime-neutral skill tree; Claude capability mapping is a conditional reference in that tree, not installer-injected prose.

Use `--uninstall` to enter the interactive uninstall flow. The selected target controls which managed configuration and skill copies are removed.

Existing same-name Custom Agent files are replaced only when their first line is the managed marker `# alpha-goal-managed-custom-agent:v1`; symlinks, non-regular paths, and unmarked files fail the whole install during preflight. Managed files are staged before activation and participate in the same rollback transaction.

`templates/config.toml` contains only the stable managed defaults: `features.multi_agent`, `agents.max_threads`, and `agents.max_depth`. Config merge fills missing stable keys without replacing existing values. It also retires fields from the previous managed template: `features.child_agents_md` is removed; `features.default_mode_request_user_input` is removed only at its former managed value; and the complete `features.multi_agent_v2` table is removed only when it still exactly matches the former managed table. User-different values and tables with additional keys are preserved. If `features` is written as a parent inline table (`features = { ... }`) containing retired fields, preflight refuses the install without writing managed targets; rewrite it as a standard table or dotted-key form before retrying.

Uninstall is conservative outside the managed copied-skill path. It removes only managed Markdown blocks, managed Custom Agent files, managed hooks, `config.toml` that byte-for-byte matches `templates/config.toml`, skill copies with the install marker, and skill symlinks that resolve to this repository. Mixed user Markdown keeps user content, mixed or modified `config.toml` is preserved, unmanaged agents and hooks are preserved, configuration symlinks are not followed or deleted, and unmanaged skill directories or external symlinks are preserved. The interactive cleanup prompts independently control Custom Agent, Markdown/config, and hook cleanup.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `PostCompact` hook without a matcher and must not set matcher. It reloads only from an explicit current artifact path and delegates identity, owner, recovery, and termination decisions to the selected skills instead of duplicating their protocol.

Native Goal Sync is not hook-driven. On `PERSIST`, `alpha-goal` reuses only a native goal matching the same accepted contract and generated objective, or creates one after the contract becomes accepted; `DIRECT` creates no native goal.

Hook replacement is keyed by marker family. The current v4 template replaces other managed numbered versions in that family before it is added. The installer also removes the experimental `codex-compact-skill-recovery` family and preserves unmanaged hooks.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

Before upgrading, finish any active checkpoint handoff. A remaining legacy `checkpoint.md.lock` is an unresolved conflict; do not guess whether its write completed.

Run the executable smoke from the repository root:

```bash
bash scripts/test-install.sh
```

When invoked by absolute path it can run from any working directory because the script resolves the repository from its own path, isolates `HOME`, `CODEX_HOME`, and temporary files, and cleans up on exit. It fails explicitly when `codex` is unavailable. Coverage includes:

- default, overridden, and HOME-less Codex roots, plus Claude HOME requirements and overlapping-target rejection;
- contract-defined Custom Agents, managed routing, source-identical skill copies, repeat installs, upgrades, and conservative uninstall;
- stable config merge and retired-field migration with user-owned value preservation;
- fresh-install and legacy-config `codex app-server --strict-config --listen stdio://` checks;
- preflight refusal, staged atomic file writes, rollback, managed symlink handling, and write-fault recovery;
- invalid and non-interactive invocation rejection, shell syntax, validator, and fixture validation.

## Prompts

```text
$deep-interview 仅在用户显式调用时运行，并按需维护 canonical interview.md。
$technical-design 仅在用户显式调用时创建并评审 canonical technical_design.md，返回 DESIGN_READY / DESIGN_INPUT_GAP / DESIGN_BLOCKED。
$alpha-goal 从原始请求和可归因输入编译 Goal Contract，选择 DIRECT/PERSIST，并在自审接受后同步 native goal。
$executor 从已接受的 Goal Contract 恢复并执行下一批授权工作。
$verifier 只审核 executor 提交的拟议终态，并给出最终路由。
```

## Count budget

The validator keeps non-script skill instructions strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and excluded because they are executable resources rather than loaded skill instruction prose. Structure validation deliberately ignores skill prose; semantic quality is covered by independent review against the static boundary corpus and, when separately authorized, runtime evaluations.
