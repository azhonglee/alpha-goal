# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/deep-interview/` | Explicit-only independent requirement clarification, canonical append-only `interview.md`, provenance, and source-neutral handoff. |
| `skills/alpha-goal/` | Raw-input goal compilation, entry routing, Goal Contract authority, design-handoff validation, contract acceptance, and native-goal synchronization. |
| `skills/technical-design/` | Explicit-only pre-goal `technical_design.md`, input-gap/blocker routes, technical review, exact-path recovery, and non-authoritative design handoff. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, recovery cursor, and goal-change termination. |
| `skills/verifier/` | Read-only terminal-state observations, evidence classification, criterion results, and final audit verdict. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, routes, conditional artifacts, Custom Agent profiles and distribution files, templates, eval files, and the exclusive instruction-unit budget. It does not validate skill prose.

Native Goal Sync applies only to `PERSIST`: after the contract becomes accepted, `alpha-goal` reuses only a native goal for the same contract and generated objective, or creates one when none exists. Native state is not a canonical Alpha Goal artifact or acceptance evidence.

The installer always copies the deep-interview/alpha-goal/technical-design goal-engineering core and may omit the executor/verifier pair; that pair is required for the repository-defined persistent execution and final-audit loop. When the pair is omitted, the Codex recovery hook is not installed or updated.

Claude capability adaptation lives in each applicable skill reference (`deep-interview`, `technical-design`, and `alpha-goal`). Codex and Claude installs receive the same skill tree.

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
- Recovery is stage navigation, not a duplicate protocol: use the exact task directory from current context; `checkpoint.md.phase` selects `executor`, `verifier`, or terminal state; without a checkpoint, `goal-contract.md` draft selects `alpha-goal` and accepted selects `executor`; caller/terminal state needs no lifecycle skill. The selected skill owns detailed validation; only executor writes checkpoint.
- Hook replacement uses the marker family, so the current v4 template replaces other managed numbered versions and the experimental family while preserving unmanaged hooks.

## Runtime artifacts

`deep-interview` and `technical-design` set `policy.allow_implicit_invocation: false`; Codex exposes them only through explicit `$skill` invocation. `deep-interview` may create canonical `interview.md` for durable clarification; its append-only record is evidence and provenance, not execution authority. `technical-design` creates canonical `technical_design.md`, returns `DESIGN_READY`, `DESIGN_INPUT_GAP`, or `DESIGN_BLOCKED`, and requires exact-path recovery. A ready design remains a proposal. `alpha-goal` validates its path, ready status, workspace, and original request source before adoption; consuming any design proposal requires `PERSIST`, and every binding constraint must be copied into the Goal Contract. `status` is the sole lifecycle field; acceptance requires complete execution information, authority, observers, and risk treatment. Only executor writes checkpoint; verifier reads it and returns a revision/identity-bound verdict packet directly to executor, which persists it before caller reporting.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/interview.md` | Durable clarification record owned by `deep-interview`; source-neutral and non-authoritative. |
| `<state-root>/YYYYMMDD-<task>/technical_design.md` | Draft/ready technical proposal owned by `technical-design`; exact-path recovery required. |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Compiled by `alpha-goal`; an accepted contract is the execution authority. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Executor-owned execution state and evidence handoff; verifier is read-only. |

`DIRECT` creates no Goal Contract or native goal. It must ignore a supplied design completely.

## Count budget

Non-script files in the public skill directories must remain strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and do not consume the instruction budget; `tools/evals/runtime-boundaries.json` is a static expected-behavior corpus, not runtime evidence.
