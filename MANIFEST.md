# Manifest

## Public skills

| Directory | Owned semantics |
| --- | --- |
| `skills/alpha-goal/` | Entry routing and Goal Contract authority. |
| `skills/executor/` | Persistent target/delivery mutation, raw execution evidence, and recovery cursor. |
| `skills/verifier/` | Verification observations, evidence classification, criterion status, and verification route. |

The shared structural contract is `tools/validation/alpha-goal.json`. It declares public skills, semantic owners, routes, conditional artifacts, references, distribution files, and the exclusive skill-unit budget. It does not validate skill prose.

Claude tool-name adaptation lives in `skills/alpha-goal/references/claude-adapter.md`. Codex and Claude installs receive the same runtime-neutral skill tree; no prose is injected into installed copies.

## Scripts

| Path | Mutates state? | Purpose |
| --- | ---: | --- |
| `scripts/install.sh` | Yes | Interactively copies the three skills to the selected Codex/Claude roots, synchronizes managed templates/hooks, migrates managed links, and conservatively uninstalls managed artifacts. |
| `tools/validate_skills.js` | No | Validates contract/schema structure, public skill/frontmatter/reference layout, distribution files, hooks/TOML, fixtures, tools surface, and the count budget. |

## Templates and recovery

- `templates/AGENTS.md` and `templates/CLAUDE.md` carry the materiality-based autonomy boundary.
- `templates/config.toml` enables available structured input and multi-agent capabilities; skill behavior still detects whether each capability is exposed.
- `templates/hooks.json` defines one matcher-free `PostCompact` hook with marker `codex-alpha-goal-compact-recovery:v2`.
- Recovery uses only an explicit artifact path already present in task context: `checkpoint.md` follows its bound route; a lone `goal-contract.md` loads `alpha-goal` when draft and `executor` when accepted. It never guesses the active task from directory recency.
- Hook replacement uses the marker family, so v2 replaces v1 and the earlier experimental family while preserving unmanaged hooks.

## Runtime artifacts

Artifacts exist only for `PERSIST`. The state root is `$HOME/.alpha-goal/<workspace-slug>/`, where the slug comes from the stable workspace basename.

| Path | Condition and owner |
| --- | --- |
| `<state-root>/YYYYMMDD-<task>/goal-contract.md` | Draft/accepted authority contract; only `alpha-goal` modifies it. |
| `<state-root>/YYYYMMDD-<task>/checkpoint.md` | Created after acceptance; `executor` and `verifier` own separate sections and write sequentially. |

`DIRECT` does not resolve this state root or create either artifact.

## Count budget

The complete `skills/` tree must remain strictly below 9,301 word+punctuation units. The validator reports total and per-skill counts; semantic correctness is covered by independent review and representative forward tests.
