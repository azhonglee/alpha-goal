# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/alpha-goal/` | Goal framing, entry routing, and Goal Contract authority. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, recovery cursor, and goal-change termination. |
| `skills/verifier/` | Verification observations, evidence classification, criterion status, and verification route. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, routes, conditional artifacts, references, distribution/eval files, and the exclusive instruction-unit budget. It does not validate skill prose.

Claude tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md` and is selected by `templates/CLAUDE.md`, not core skill prose. Codex and Claude installs receive the same runtime-neutral skill tree.

## Scripts

| Path | Persistent managed-state mutation? | Purpose |
| --- | ---: | --- |
| `scripts/install.sh` | Yes | Interactively copies the three skills to the selected Codex/Claude roots, synchronizes managed templates/hooks, migrates managed links, and conservatively uninstalls managed artifacts. |
| `tools/validate_skills.js` | No | Validates contract/schema structure, public skill/frontmatter/reference layout, distribution files, hooks/TOML, fixtures, tools surface, and the count budget. |
| `tools/test_authority_digest.js` | No | Exercises the authority-payload golden SHA-256, marker and line-ending byte semantics, and success/failure output streams. |
| `tools/test_checkpoint_lock.js` | No | Exercises semantic transitions, rejected misuse, concurrent acquisition, automatic unlock, and schema-v3/v4 recovery compatibility. |
| `tools/evals/runtime-boundaries.json` | No | Declares 33 expected boundary cases for independent static or runtime review; schema validity alone is not behavioral evidence. |

`skills/alpha-goal/scripts/authority-digest.js` deterministically hashes the marked authority payload used by contract acceptance and entry checks.
`skills/executor/scripts/checkpoint-lock.js` exposes semantic `init`/`execute`/`verify`/`terminate` transitions, returns JSON lock metadata, atomically commits and unlocks, and supports token-checked abort/recovery plus legacy-lock release.
Each public CommonJS script directory carries a local `package.json` boundary so installed copies do not inherit an ancestor package's module type.

## Templates and recovery

- `templates/AGENTS.md` and `templates/CLAUDE.md` carry the materiality-based autonomy boundary.
- `templates/config.toml` declares structured-input and multi-agent defaults. The installer fills missing keys but preserves existing values, including explicit disables; skill behavior still detects whether each capability is exposed.
- `templates/hooks.json` defines one matcher-free `PostCompact` hook with marker `codex-alpha-goal-compact-recovery:v3`.
- Recovery uses only an explicit artifact path already present in task context and follows top-level `active_owner`; a legacy `alpha-goal` owner is terminated to `caller` instead of resumed. `PASS_TO_FINAL`, `BLOCKED`, and `GOAL_CHANGED` terminate that checkpoint; later work starts a new Alpha Goal task directory. A lone accepted contract must have a valid authority digest and an unchanged goal before checkpoint initialization. Recovery never guesses the active task from directory recency.
- Hook replacement uses the marker family, so the current v3 template replaces other managed numbered versions and the experimental family while preserving unmanaged hooks.

## Runtime artifacts

Canonical lifecycle artifacts exist only for `PERSIST`; the checkpoint helper also creates coordination records: active `.lock`, staged `.pending-*`, and best-effort-cleaned `.lock.closed-*` atomic-unlock tombstones. The state root is `$HOME/.alpha-goal/<workspace-slug>/`, where the slug comes from the stable workspace basename.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Draft/accepted authority contract with accepted authority-payload digest; only `alpha-goal` modifies it. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Created after acceptance; records the accepted contract identity and current execution/verification state, carries atomic write control, and partitions sequential executor/verifier fields. |

`DIRECT` does not resolve this state root or create either artifact.

## Count budget

Non-script files in the public skill directories must remain strictly below 9,301 word+punctuation units. Script resources under `skills/*/scripts/` are reported separately and do not consume the instruction budget; `tools/evals/runtime-boundaries.json` is a static expected-behavior corpus, not runtime evidence.
