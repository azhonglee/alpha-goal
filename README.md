# Codex Goal Loop Skills

A small Codex skill collection that turns goal-loop into a staged execution protocol:

```text
FRAME -> ITERATE -> REVIEW -> VERIFY -> FINAL
                  -> VERIFY
                  -> ITERATE
                  -> FRAME
                  -> BLOCKED
```

The package contains five skills:

- `goal-loop`: router and global invariants.
- `goal-frame`: Goal Contract, clarification, target/scope boundary, existing work scan.
- `goal-iterate`: one bounded implementation iteration with mutation preflight.
- `goal-review`: direction, feedback, scope, architecture, and completion-readiness review.
- `goal-verify`: Verification Verdict, acceptance-to-evidence mapping, claim boundary check.

It also includes optional read-only helper scripts and a ByteDance Codebase adapter reference.

## Install

For Codex CLI / IDE usage, install from this checkout into either:

```bash
# User-level skills
install_root="$HOME/.agents/skills"
mkdir -p "$install_root"
rsync -a --delete goal-loop/ "$install_root/goal-loop/"
rsync -a --delete goal-frame/ "$install_root/goal-frame/"
rsync -a --delete goal-iterate/ "$install_root/goal-iterate/"
rsync -a --delete goal-review/ "$install_root/goal-review/"
rsync -a --delete goal-verify/ "$install_root/goal-verify/"
rsync -a --delete adapters/ "$install_root/adapters/"
rsync -a --delete tools/ "$install_root/tools/"
python3 "$install_root/tools/validate_skillset.py" "$install_root"

# Or repo-level skills
install_root=".agents/skills"
mkdir -p "$install_root"
rsync -a --delete goal-loop/ "$install_root/goal-loop/"
rsync -a --delete goal-frame/ "$install_root/goal-frame/"
rsync -a --delete goal-iterate/ "$install_root/goal-iterate/"
rsync -a --delete goal-review/ "$install_root/goal-review/"
rsync -a --delete goal-verify/ "$install_root/goal-verify/"
rsync -a --delete adapters/ "$install_root/adapters/"
rsync -a --delete tools/ "$install_root/tools/"
python3 "$install_root/tools/validate_skillset.py" "$install_root"
```

The checkout root contains the skill directories directly:

```text
goal-loop/
goal-frame/
goal-iterate/
goal-review/
goal-verify/
adapters/
tools/
```

Only directories containing `SKILL.md` are skills. `adapters/` and `tools/` are supporting material, but keep them next to the skills so relative references and validation commands continue to work.

## Recommended invocation

Explicit:

```text
$goal-loop 帮我实现这个需求：...
```

More specific:

```text
$goal-frame 先帮我把这个需求 frame 清楚，不要改文件。
$goal-iterate 根据上面的 Goal Contract 做一轮最小实现。
$goal-review 检查当前实现方向、反馈和证据缺口。
$goal-verify 检查当前 diff 和测试证据，判断能否最终交付。
```

Only `goal-loop` is intended to trigger implicitly. Stage skills set `allow_implicit_invocation: false`; invoke them explicitly for focused testing or let the router load them.

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
- Decision boundaries:
- Assumptions and risks:
- Risk tier:
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
- Review needed:
- Iterate verdict:
- Next:
```

### Review Record

Produced by `goal-review`.

```text
Review Record:
- Mode:
- Target:
- Evidence basis:
- Findings:
- Feedback classification:
- Scope/architecture notes:
- Risk tier:
- Required evidence:
- Review verdict:
- Next:
```

### Verification Verdict

Produced by `goal-verify`.

```text
Verification Verdict:
- Verdict:
- Acceptance evidence matrix:
- Claim boundary:
- Risk/evidence review:
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
- `Review Record.Review verdict`
- `Verification Verdict.Acceptance evidence matrix`
- `Verification Verdict.Verdict`

If the skills miss important repo-specific behavior, add that behavior to the repo's `AGENTS.md` or a dedicated adapter reference rather than bloating the core skills.
