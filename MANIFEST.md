# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/alpha-goal/` | Goal framing, entry routing, Goal Contract authority, and accepted-contract native-goal binding. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, recovery cursor, and goal-change termination. |
| `skills/verifier/` | Verification observations, evidence classification, criterion status, and verification route. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, routes, conditional artifacts, references, distribution/eval files, and the exclusive instruction-unit budget. It does not validate skill prose.

Native Goal Sync applies only to `PERSIST`: after explicit contract acceptance, `alpha-goal` reuses any unfinished thread goal or creates one when none exists. Native state is not a canonical Alpha Goal artifact or acceptance evidence. Terminal state follows the runtime mapping; `executor` and `verifier` do not control it.

Claude tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md` and is selected by `templates/CLAUDE.md`, not core skill prose. Codex and Claude installs receive the same runtime-neutral skill tree.

## Scripts

| Path | Persistent managed-state mutation? | Purpose |
| --- | ---: | --- |
| `scripts/install.sh` | Yes | Interactively copies the three skills to the selected Codex/Claude roots, synchronizes managed templates/hooks, migrates managed links, and conservatively uninstalls managed artifacts. |
| `tools/validate_skills.js` | No | Validates contract/schema structure, public skill/frontmatter/reference layout, distribution files, hooks/TOML, fixtures, tools surface, and the count budget. |
| `tools/test_checkpoint_lock.js` | No | Exercises one-shot semantic transitions, rejected writes, operating-system lock release, symlink identity, concurrency, CAS, and atomic publication. |
| `tools/evals/runtime-boundaries.json` | No | Declares 36 expected boundary cases for independent static or runtime review; schema validity alone is not behavioral evidence. |

`skills/alpha-goal/scripts/authority-digest.js` deterministically hashes the marked authority payload used by contract acceptance and entry checks.
`skills/executor/scripts/checkpoint-lock.js` accepts a complete successor on stdin and applies semantic `init`/`execute`/`verify`/`terminate` transitions as one operating-system-locked, revision/owner/content-checked atomic replacement.

## Templates and recovery

- `templates/AGENTS.md` and `templates/CLAUDE.md` carry the materiality-based autonomy boundary.
- `templates/config.toml` declares structured-input and multi-agent defaults. The installer fills missing keys but preserves existing values, including explicit disables; skill behavior still detects whether each capability is exposed.
- `templates/hooks.json` defines one matcher-free `PostCompact` hook with marker `codex-alpha-goal-compact-recovery:v3`.
- Recovery uses only an explicit artifact path already present in task context and follows top-level `active_owner`; a legacy `alpha-goal` owner is terminated to `caller` instead of resumed. `PASS_TO_FINAL`, `BLOCKED`, and `GOAL_CHANGED` terminate that checkpoint; later work starts a new Alpha Goal task directory. A lone accepted contract must have a valid authority digest and an unchanged goal before checkpoint initialization. Recovery never guesses the active task from directory recency or relies on remembered write locks.
- Hook replacement uses the marker family, so the current v3 template replaces other managed numbered versions and the experimental family while preserving unmanaged hooks.

## Runtime artifacts

Canonical lifecycle artifacts exist only for `PERSIST`. The helper uses a process-scoped advisory lock outside task state and one fixed hidden successor beside `checkpoint.md` for same-directory rename; it creates no UUID pending series, and a killed write can leave at most that one overwriteable successor. A legacy `checkpoint.md.lock` must be resolved with the previous helper before upgrade. The state root is `$HOME/.alpha-goal/<workspace-slug>/`, where the slug comes from the stable workspace basename.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Draft/accepted authority contract with accepted authority-payload digest; only `alpha-goal` modifies it. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Created after acceptance; records the accepted contract identity and current execution/verification state, carries concurrent write control, and partitions sequential executor/verifier fields. |

`DIRECT` does not resolve this state root or create either artifact.

## Count budget

Non-script files in the public skill directories must remain strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and do not consume the instruction budget; `tools/evals/runtime-boundaries.json` is a static expected-behavior corpus, not runtime evidence.
