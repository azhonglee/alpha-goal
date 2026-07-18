# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/alpha-goal/` | Persistence-eligible goal framing and activation, Goal Contract authority, and accepted-contract native-goal binding. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, recovery cursor, and goal-change termination. |
| `skills/verifier/` | Terminal-state observations, evidence classification, criterion status, and final audit route. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, verification routes, conditional artifacts, references, distribution/eval files, and the exclusive instruction-unit budget. It does not validate skill prose.

Native Goal Sync applies only after a persistent Goal Contract is explicitly accepted: `alpha-goal` reuses any unfinished thread goal or creates one when none exists. Native state is not a canonical Alpha Goal artifact or acceptance evidence.

The installer may omit the executor/verifier pair; that pair is required for the repository-defined persistent execution and final-audit loop. When the pair is omitted, the Codex recovery hook is not installed or updated.

Claude tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md` and is selected by `templates/CLAUDE.md`, not core skill prose. Codex and Claude installs receive the same runtime-neutral skill tree.

## Scripts

| Path | Persistent managed-state mutation? | Purpose |
| --- | ---: | --- |
| `scripts/install.sh` | Yes | Always copies `alpha-goal`, optionally copies the executor/verifier pair to selected Codex/Claude roots, synchronizes applicable managed templates/hooks, migrates managed links, and conservatively uninstalls managed artifacts. |
| `tools/validate_skills.js` | No | Validates contract/schema structure, public skill/frontmatter/reference layout, distribution files, hooks/TOML, fixtures, tools surface, and the count budget. |
| `tools/evals/runtime-boundaries.json` | No | Declares 36 expected boundary cases for independent static or runtime review; schema validity alone is not behavioral evidence. |
| `tools/evals/trigger-boundaries.json` | No | Declares 12 static activation/skip expectations, including ordinary direct work and explicit non-applicable invocation; schema validity does not prove model trigger behavior. |

`skills/alpha-goal/scripts/authority-digest.js` deterministically hashes the marked authority payload used by contract acceptance and entry checks.

## Templates and recovery

- `templates/AGENTS.md` and `templates/CLAUDE.md` carry the materiality-based autonomy boundary.
- `templates/config.toml` declares structured-input and multi-agent defaults. The installer fills missing keys but preserves existing values, including explicit disables; skill behavior still detects whether each capability is exposed.
- `templates/hooks.json` defines one matcher-free `PostCompact` hook with marker `codex-alpha-goal-compact-recovery:v4`.
- Recovery uses only an explicit artifact path already present in task context and follows top-level `active_owner`; a legacy `alpha-goal` owner is terminated to `caller` instead of resumed. `PASS_TO_FINAL`, `BLOCKED`, and `GOAL_CHANGED` terminate that checkpoint; later work starts a new Alpha Goal task directory. A lone accepted contract must have a valid authority digest and an unchanged goal before checkpoint initialization. Recovery never guesses the active task from directory recency.
- Hook replacement uses the marker family, so the current v4 template replaces other managed numbered versions and the experimental family while preserving unmanaged hooks.

## Runtime artifacts

Canonical lifecycle artifacts exist only for persistent work handled by `alpha-goal`. Checkpoint updates use a sequential single-writer protocol: the active owner re-reads canonical state before editing, preserves other-owned fields, increments `checkpoint_revision` once, and sets the next owner last. A stale revision, unexpected owner, or changed content stops the write; concurrent writers are unsupported. The state root is `$HOME/.alpha-goal/<workspace-slug>/`, where the slug comes from the stable workspace basename.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Draft/accepted authority contract with accepted authority-payload digest; only `alpha-goal` modifies it. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Created after acceptance; records accepted contract identity and current execution/final-audit state, partitions executor/verifier fields, and carries sequential handoff state. |

Ordinary read-only work and clear reversible local changes do not activate `alpha-goal`, resolve this state root, or create either artifact. An explicit non-applicable invocation returns to the caller without lifecycle state.

## Count budget

Non-script files in the public skill directories must remain strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and do not consume the instruction budget; runtime and trigger boundary corpora are static expected-behavior artifacts, not model-performance evidence.
