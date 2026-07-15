# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/alpha-goal/` | Goal framing, entry routing, Goal Contract authority/reframing, and standard Goal input projection. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, recovery cursor, and direct reframe handoff. |
| `skills/verifier/` | Verification observations, evidence classification, criterion status, and verification route. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, routes, conditional artifacts, references, distribution/eval files, and the exclusive instruction-unit budget. It does not validate skill prose.

Claude tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md` and is selected by `templates/CLAUDE.md`, not core skill prose. Codex and Claude installs receive the same runtime-neutral skill tree.

## Scripts

| Path | Mutates state? | Purpose |
| --- | ---: | --- |
| `scripts/install.sh` | Yes | Interactively copies the three skills to the selected Codex/Claude roots, synchronizes managed templates/hooks, migrates managed links, and conservatively uninstalls managed artifacts. |
| `tools/validate_skills.js` | No | Validates contract/schema structure, public skill/frontmatter/reference layout, distribution files, hooks/TOML, fixtures, tools surface, and the count budget. |
| `tools/test_checkpoint_lock.js` | No | Exercises semantic transitions, rejected misuse, concurrent acquisition, automatic unlock, and schema-v3 recovery compatibility. |
| `tools/evals/runtime-boundaries.json` | No | Declares 28 expected boundary cases for independent static or runtime review; schema validity alone is not behavioral evidence. |

`skills/alpha-goal/scripts/authority-digest.js` deterministically hashes the marked authority payload used by contract acceptance and entry checks.
`skills/executor/scripts/checkpoint-lock.js` exposes semantic `init`/`execute`/`verify`/`reframe`/`supersede` transitions, returns JSON lock metadata, atomically commits and unlocks, and supports token-checked abort/recovery plus legacy-lock release.

## Templates and recovery

- `templates/AGENTS.md` and `templates/CLAUDE.md` carry the materiality-based autonomy boundary.
- `templates/config.toml` enables available structured input and multi-agent capabilities; skill behavior still detects whether each capability is exposed.
- `templates/hooks.json` defines one matcher-free `PostCompact` hook with marker `codex-alpha-goal-compact-recovery:v3`.
- Recovery uses only an explicit artifact path already present in task context. A checkpoint validates its current contract epoch and resumes only from top-level `active_owner`; historical routes never override the current handoff. An explicit goal change uses direct `reframe` ownership, then a same-task accepted revision uses guarded epoch supersession; verifier never changes authority. Terminal PASS rechecks identity/freshness, and later mutations resume `executor`. A lone accepted contract must have a valid authority digest. Recovery never guesses the active task from directory recency.
- Hook replacement uses the marker family, so v3 replaces earlier versions and the experimental family while preserving unmanaged hooks.

## Runtime artifacts

Artifacts exist only for `PERSIST`. The state root is `$HOME/.alpha-goal/<workspace-slug>/`, where the slug comes from the stable workspace basename.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Draft/accepted authority contract with accepted authority-payload digest; only `alpha-goal` modifies it. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Created after acceptance; retains immutable contract epochs, binds the current digest/state, carries atomic write control, and partitions sequential executor/verifier fields. |

`DIRECT` does not resolve this state root or create either artifact.

## Count budget

Non-script files in the public skill directories must remain strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and do not consume the instruction budget; `tools/evals/runtime-boundaries.json` is a static expected-behavior corpus, not runtime evidence.
