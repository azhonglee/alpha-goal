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

When the Skip Gate does not return `SKIP`, `alpha-goal` compiles the Goal Contract and sets `status: accepted` only after required execution information, authority, observers, and risk treatment are complete. A material goal change starts a new Alpha Goal task instead of editing the accepted contract. Runtime state is recorded in `checkpoint.md` with `phase` set to `executing`, `ready_for_verification`, or `terminal`; verifier audits the current state and returns a verdict. `SKIP` returns ownership to the caller without running `alpha-goal`, creating a Goal Contract, or creating a native goal.

## Options

```bash
scripts/install.sh
scripts/install.sh --non-interactive
scripts/install.sh --uninstall
scripts/install.sh --non-interactive --uninstall
```

## Behavior

The script creates copied skill directories under target-specific independent roots. `codex` uses `${CODEX_HOME:-$HOME/.codex}/skills`; `claude` keeps using `$HOME/.claude/skills`. Interactive choices select one of these targets:

- `codex`: sync Codex config and Codex skill copies.
- `claude`: sync Claude `CLAUDE.md` and Claude skill copies.
- `all`: sync or uninstall both Codex and Claude in one run.

Install uses a three-step terminal wizard: Target, Features, and Review. Up/Down moves, Space toggles a feature, Enter advances or confirms, `b` returns to the previous step, and `q` or Escape cancels before any target write. Cursor-capable terminals use an alternate screen so redraws do not erase the calling terminal's visible history. `codex` is the default target. The optional `executor` / `verifier` pair and, for `codex` or `all`, the contract-declared Custom Agents are selected for sync by default. `deep-interview`, `alpha-goal`, and `technical-design` are always synced. Turning optional roles off preserves those skill copies and skips Codex recovery-hook installation or update. Turning Custom Agents off leaves their same-name files and the managed routing block untouched. Claude-only runs never inspect or modify Codex agents. The Review step distinguishes `sync` from `keep existing` and shows the managed configuration coupled to each selection. The Codex configuration root is `${CODEX_HOME:-$HOME/.codex}` and can operate without `HOME` when `CODEX_HOME` is set; Claude paths remain based on `$HOME/.claude`, so `claude` and `all` require `HOME`. Template sync is enabled and verbose output is disabled. For interactive uninstall, the flow asks for the target, Codex home when relevant, Custom Agent cleanup when relevant, template cleanup, hook cleanup, and verbose output, then shows a final cleanup review before any write; uninstall continues to remove all managed public skills.

`--non-interactive` is the fixed automation preset. It selects the default Codex root, all five public skills, managed Codex templates, the recovery hook, and Custom Agents without reading from a terminal. With `--uninstall`, it removes that default managed Codex installation without prompts. `CODEX_HOME` continues to override the default Codex root. The preset intentionally exposes no target or feature switches; it never selects Claude and never treats an omitted feature as an instruction to delete existing files. Runs without `--non-interactive` still require a terminal. Other CLI arguments, including `--help`, `--target`, `--codex-home`, `--force`, sync toggles, or `--verbose`, are rejected.

Successful install and uninstall runs print a concise result summary with the selected root, skill counts, managed configuration actions, preserved content, and Custom Agent actions. Failures continue to print the specific error and exit non-zero.

Before the first managed-target write, install preflights every selected Markdown/config target, Custom Agent, skill destination, and hook. Markdown, TOML, and hook merges are executed against temporary copies; all skill/agent source copies and target ownership rules are checked. A conflict or malformed target therefore fails before configuration, agents, skills, or hooks are changed.

The write phase assumes one installer process and no external writes to selected targets until it finishes. It snapshots the exact paths it will mutate, renders Markdown, config, and hooks through same-directory staging files, and activates staged skill and Custom Agent copies without nesting them into an existing directory. On failure it restores the snapshots and removes paths created by the run; if rollback or snapshot cleanup fails, it retains the recovery path and reports it. The installer does not provide locking, concurrent-writer detection, or protection against targets changing during installation; do not run overlapping installs or modify their targets externally.

When installing skill copies, an existing target skill symlink is migrated only when it points to `skills/<skill-name>` in this repository or another worktree with the same Git common directory. A real directory is replaced only when it contains a valid, regular `.alpha-goal-skill-copy` marker; each new copy is staged before activation inside the install transaction. Unmanaged or malformed directories, Git detection failures, external symlinks, symlinks to other repo-relative paths, and ordinary files are refused. Codex and Claude receive the same runtime-neutral skill tree; Claude capability mapping is a conditional reference in that tree, not installer-injected prose.

Use `--uninstall` to enter the interactive uninstall flow. The selected target controls which managed configuration and skill copies are removed.

Custom Agents are managed by contract role name, not file markers. Sync replaces same-name regular files; cleanup removes same-name regular files. Symlinks and non-regular paths are refused during sync and preserved during cleanup.

`templates/config.toml` contains only the stable managed defaults: `features.multi_agent`, `agents.max_threads`, and `agents.max_depth`. Config merge fills missing stable keys without replacing existing values. It also retires fields from the previous managed template: `features.child_agents_md` is removed; `features.default_mode_request_user_input` is removed only at its former managed value; and the complete `features.multi_agent_v2` table is removed only when it still exactly matches the former managed table. User-different values and tables with additional keys are preserved. If `features` is written as a parent inline table (`features = { ... }`) containing retired fields, preflight refuses the install without writing managed targets; rewrite it as a standard table or dotted-key form before retrying.

Uninstall removes managed Markdown blocks, contract-declared regular Custom Agent files, managed hooks, matching managed config, and managed skill copies or repository symlinks. Undeclared Agent names, Agent symlinks, non-regular Agent paths, mixed user configuration, unmanaged hooks, unmanaged skill directories, and external skill symlinks are preserved. The interactive cleanup prompts independently control Custom Agents, Markdown/config, and hooks.

The compact recovery hook definition lives in `templates/hooks.json`. It is a matcher-free `PostCompact` stage navigator: use the exact task directory from current context, inspect `checkpoint.md` and `phase` when present, otherwise inspect `goal-contract.md` status, then load only `alpha-goal`, `executor`, or `verifier`. Detailed validation and write protocols remain in those skills.

Native Goal Sync is not hook-driven. When the Skip Gate does not return `SKIP` and the contract is accepted, `alpha-goal` reuses only a native goal matching the same accepted contract and generated objective, or creates one; `SKIP` creates no native goal.

Hook replacement is keyed by marker family. The current v4 template replaces other managed numbered versions in that family before it is added. The installer also removes the experimental `codex-compact-skill-recovery` family and preserves unmanaged hooks.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

Run the executable smoke from the repository root:

```bash
bash scripts/test-install.sh
```

When invoked by absolute path it can run from any working directory because the script resolves the repository from its own path, isolates `HOME`, `CODEX_HOME`, and temporary files, and cleans up on exit. It fails explicitly when `codex` is unavailable. Coverage includes:

- default, overridden, and HOME-less Codex roots, plus Claude HOME requirements and overlapping-target rejection;
- fixed-preset non-interactive Codex install and uninstall without a TTY;
- contract-defined Custom Agents, managed routing, source-identical skill copies, repeat installs, upgrades, and conservative uninstall;
- stable config merge and retired-field migration with user-owned value preservation;
- fresh-install and legacy-config `codex app-server --strict-config --listen stdio://` checks;
- preflight refusal, staged atomic file writes, rollback, managed symlink handling, and write-fault recovery;
- invalid and non-interactive invocation rejection, shell syntax, validator, and fixture validation.

## Prompts

```text
$deep-interview 通过 skill policy 设为仅显式调用，并按需维护 canonical interview.md。
$technical-design 通过 skill policy 设为仅显式调用，创建并评审 canonical technical_design.md，返回 DESIGN_READY / DESIGN_INPUT_GAP / DESIGN_BLOCKED。
$alpha-goal 检查并澄清原始请求和可归因输入，执行 Skip Gate；继续处理的工作编译并接受 Goal Contract，再同步 native goal。
$executor 从已接受的 Goal Contract 恢复并执行下一批授权工作。
$verifier 只审核 executor 提交的拟议终态，并给出最终路由。
```

## Count budget

The validator keeps non-script skill instructions strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and excluded because they are executable resources rather than loaded skill instruction prose. Structure validation deliberately ignores skill prose; semantic quality is covered by independent review against the static boundary corpus and, when separately authorized, runtime evaluations.
