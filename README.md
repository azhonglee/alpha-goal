# Codex Goal Loop Skills

A small Codex skill collection that turns goal-loop into a staged execution protocol:

```text
FRAME -> ITERATE -> VERIFY -> FINAL
                  -> ITERATE
                  -> FRAME
                  -> BLOCKED
```

The package contains four skills:

- `goal-loop`: router and global invariants.
- `goal-frame`: Goal Contract, clarification, target/scope boundary, existing work scan.
- `goal-iterate`: one bounded implementation iteration with mutation preflight.
- `goal-verify`: Verification Verdict, acceptance-to-evidence mapping, claim boundary check.

It also includes optional read-only helper scripts and a ByteDance Codebase adapter reference.

## Install

For Codex CLI / IDE usage, copy the skill directories into either:

```bash
# User-level skills
mkdir -p "$HOME/.agents/skills"
unzip codex-goal-loop-skills.zip -d "$HOME/.agents/skills"

# Or repo-level skills
mkdir -p .agents/skills
unzip codex-goal-loop-skills.zip -d .agents/skills
```

The zip root contains the skill directories directly:

```text
goal-loop/
goal-frame/
goal-iterate/
goal-verify/
adapters/
tools/
```

Only directories containing `SKILL.md` are skills. `adapters/` and `tools/` are supporting material.

## Recommended invocation

Explicit:

```text
$goal-loop 帮我实现这个需求：...
```

More specific:

```text
$goal-frame 先帮我把这个需求 frame 清楚，不要改文件。
$goal-iterate 根据上面的 Goal Contract 做一轮最小实现。
$goal-verify 检查当前 diff 和测试证据，判断能否最终交付。
```

Implicit triggering is supported by the skill descriptions, but explicit invocation is better while tuning.

## Design principles

- The router is thin; stages do the work.
- Each stage has one auditable output.
- References are optional and loaded only when needed.
- Scripts are read-only helpers; they do not replace judgment.
- Project-specific commands and conventions belong in `AGENTS.md`, not in these cross-repo skills.

## Stage outputs

### Goal Contract

Produced by `goal-frame`.

```text
Goal Contract:
- Intent:
- Target:
- Acceptance:
- Non-goals:
- Constraints:
- Claim boundary:
- Evidence plan:
- Existing work:
- Frame verdict:
- Next:
```

### Iteration Record

Produced by `goal-iterate`.

```text
Iteration Record:
- Contract version:
- Iteration goal:
- Mutation preflight:
- Action:
- Changed files:
- Local evidence:
- Acceptance delta:
- Risks introduced:
- Iterate verdict:
- Next:
```

### Verification Verdict

Produced by `goal-verify`.

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Claim boundary:
- Fresh checks run:
- Diff/scope review:
- Unresolved gaps:
- Required next step:
- Final claim allowed:
```

## Safe tuning knobs

If the skills feel too verbose, reduce output detail inside each stage, but keep these fields:

- `Goal Contract.Acceptance`
- `Goal Contract.Claim boundary`
- `Iteration Record.Mutation preflight`
- `Verification Verdict.Acceptance evidence matrix`
- `Verification Verdict.Verdict`

If the skills miss important repo-specific behavior, add that behavior to the repo's `AGENTS.md` or a dedicated adapter reference rather than bloating the core skills.
