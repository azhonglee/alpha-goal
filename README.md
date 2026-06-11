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

它还包含可选的只读辅助脚本、ByteDance Codebase 适配参考，以及用户配置模板。

## Install

默认安装到仓库根目录下的 `codex/`，并把技能目录软链接到 `codex/skills/`：

```bash
scripts/install.sh
```

脚本会：

- 将顶层 `*/SKILL.md` 技能目录软链接到 `${CODEX_HOME:-<repo>/codex}/skills/`。
- 将 `templates/AGENTS.md` 合并到 `${CODEX_HOME:-<repo>/codex}/AGENTS.md` 的受管理模板块。
- 将 `templates/config.toml` 中缺失的设置补齐到 `${CODEX_HOME:-<repo>/codex}/config.toml`，不覆盖已有值。
- 清理旧版本可能留在 `skills/` 下、且指向本仓库的 `adapters/`、`tools/`、`templates/`、`scripts/` 支持目录软链接。
- 安装后运行源码中的 `tools/validate_skillset.py` 校验技能包。

如果要安装到真实 Codex home，显式指定：

```bash
CODEX_HOME="$HOME/.codex" scripts/install.sh
```

如果目标位置已有指向其他目录的软链接，使用 `--force` 替换软链接；脚本不会删除真实文件或真实目录：

```bash
scripts/install.sh --force
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
templates/
scripts/
codex/        # local install output, ignored by git
```

只有包含 `SKILL.md` 的目录才是技能。`adapters/`、`tools/`、`templates/` 和 `scripts/` 都是支持材料，应与技能目录保持同级，确保相对引用、安装脚本和校验命令可用。

## 可选用户配置模板

`templates/AGENTS.md` 和 `templates/config.toml` 来自原 `main` 分支的安装模型。默认安装只会写入仓库根目录下的 `codex/`。如果显式设置 `CODEX_HOME="$HOME/.codex"`，脚本会合并这些模板到真实 Codex home；执行前应确认这些默认值适合用户环境。

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
