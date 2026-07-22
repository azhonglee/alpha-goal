# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/deep-interview/` | Optional bounded requirement clarification, attributable interview provenance, and non-authoritative clarification handoff. |
| `skills/alpha-goal/` | Goal framing, entry routing, Goal Contract authority, optional-input adoption, and accepted-contract native-goal binding. |
| `skills/technical-design/` | Optional reviewed technical proposals and non-authoritative design handoff. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, recovery cursor, and goal-change termination. |
| `skills/verifier/` | Terminal-state observations, evidence classification, criterion status, and final audit route. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, routes, conditional artifacts, Custom Agent profiles and distribution files, templates, eval files, and the exclusive instruction-unit budget. It does not validate skill prose.

Native Goal Sync applies only to `PERSIST`: after explicit contract acceptance, `alpha-goal` reuses any unfinished thread goal or creates one when none exists. Native state is not a canonical Alpha Goal artifact or acceptance evidence.

The installer always copies the deep-interview/alpha-goal/technical-design goal-engineering core and may omit the executor/verifier pair; that pair is required for the repository-defined persistent execution and final-audit loop. When the pair is omitted, the Codex recovery hook is not installed or updated.

Claude tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md` and is selected by `templates/CLAUDE.md`, not core skill prose. Codex and Claude installs receive the same runtime-neutral skill tree.

## Scripts

| Path | Persistent managed-state mutation? | Purpose |
| --- | ---: | --- |
| `scripts/install.sh` | Yes | Supported install/uninstall entry point; resolves the selected targets and orchestrates the internal installer modules. |
| `scripts/install/common.sh`, `interactive.sh`, `skills.sh`, `agents.sh`, `markdown.sh`, `config.sh`, `hooks.sh`, `transaction.sh`, `context.sh`, `preflight.sh` | Yes | Internal modules for shared helpers, terminal interaction, copied skills, Custom Agents, managed Markdown, managed config plus compatibility migration, hooks, and single-process transactional snapshot/write/rollback. They are sourced by `scripts/install.sh`, not run directly. |
| `scripts/test-install.sh` | No | Executable, self-locating smoke test. It isolates `HOME`, `CODEX_HOME`, and temporary state; exercises install, upgrade, uninstall, failure, transaction, and migration cases; runs strict Codex config checks plus validator fixtures; and cleans up on exit. |
| `tools/validate_skills.js` | No | Validates contract/schema structure, public skill/frontmatter/reference layout, Custom Agent fields, distribution files, hooks/TOML, fixtures, tools surface, and the count budget. |
| `tools/evals/runtime-boundaries.json` | No | Declares 42 expected boundary cases for independent static or runtime review; schema validity alone is not behavioral evidence. |

`templates/config.toml` contains the managed defaults for `features.multi_agent`, `features.default_mode_request_user_input`, and the `agents` limits. Install migration removes retired `features.child_agents_md` and removes the old `features.multi_agent_v2` table only when the complete table still matches the former managed values without user-added keys. A parent inline `features = { ... }` representation with retired fields is rejected during preflight and must be rewritten as a standard table or dotted-key form.

## Templates and recovery

- Each `agents/<role>.toml` declared by `tools/validation/alpha-goal.json.customAgents` is a standalone global Codex Custom Agent source, not a skill or plugin component.
- `templates/AGENTS.md` and `templates/CLAUDE.md` carry the materiality-based autonomy boundary.
- `templates/custom-agent-routing.md` is a separately managed global `AGENTS.md` block installed only with the Custom Agent set.
- `templates/config.toml` declares managed defaults for `features.multi_agent`, `features.default_mode_request_user_input`, and the `agents` limits. The installer fills missing managed keys, preserves existing values, and conservatively removes retired managed fields as described above.
- `templates/hooks.json` defines one matcher-free `PostCompact` hook with marker `codex-alpha-goal-compact-recovery:v4`.
- Recovery uses only an explicit artifact path already present in task context and follows top-level `active_owner`; a legacy `alpha-goal` owner is terminated to `caller` instead of resumed. `PASS_TO_FINAL`, `BLOCKED`, and `GOAL_CHANGED` terminate that checkpoint; later work starts a new Alpha Goal task directory. A lone explicitly accepted contract may initialize its checkpoint only when the goal is unchanged. Recovery never guesses the active task from directory recency.
- Hook replacement uses the marker family, so the current v4 template replaces other managed numbered versions and the experimental family while preserving unmanaged hooks.

## Runtime artifacts

`deep-interview` and `technical-design` return inline non-authoritative handoffs by default; after routing, an authorized caller may delegate an exact-path file write, with replacement authority when needed. Canonical lifecycle artifacts exist only for `PERSIST`. A Goal Contract takes effect only after explicit acceptance and is then immutable under the protocol; a material goal change starts a new task instead of editing the accepted contract. Checkpoint updates use a sequential single-writer protocol: only `active_owner` writes, re-reads canonical state before editing, preserves other-owned fields, increments `checkpoint_revision` once, and sets the next owner last. A stale revision, unexpected owner, or changed content stops the write; concurrent writers are unsupported. The state root is `$HOME/.alpha-goal/<workspace-slug>/`, where the slug comes from the stable workspace basename.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Draft contract maintained by `alpha-goal`; explicit acceptance makes it immutable under the protocol. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Created after acceptance; records accepted contract identity and current execution/final-audit state, partitions executor/verifier fields, and carries sequential handoff state. |

`DIRECT` does not resolve this state root or create either artifact.

## Count budget

Non-script files in the public skill directories must remain strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and do not consume the instruction budget; `tools/evals/runtime-boundaries.json` is a static expected-behavior corpus, not runtime evidence.
