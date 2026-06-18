# Installation and Smoke Test

## Install

```bash
scripts/install.sh
```

Default Codex home is `$HOME/.codex`. The script installs three public skills as direct symlinks:

```text
alpha-goal
control-loop
evidence-verify
```

Node.js/npm must be available. Validation uses an existing `tsx` runner from `tsx` on `PATH` or `npx --no-install tsx`; the installer refuses to auto-download npm packages.

## Options

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
scripts/install.sh --force
scripts/install.sh --no-sync-user-templates
scripts/install.sh --no-sync-user-hooks
scripts/install.sh --verbose
```

## Behavior

The script validates the source skillset, creates `${CODEX_HOME:-$HOME/.codex}/skills/<skill-name>` links for public skills, cleans same-repo links for merged old public skills, and validates each installed top-level `SKILL.md`. By default it also syncs user-level templates, including `templates/hooks.json` into `${CODEX_HOME:-$HOME/.codex}/hooks.json`.

The compact recovery hook definition lives in `templates/hooks.json`. It is a `SessionStart` hook for `compact` starts and prints a static policy telling Codex to decide whether `alpha-goal`, `control-loop`, or `evidence-verify` applies after compaction, and to reread the matching `SKILL.md` before continuing. Use `--no-sync-user-templates` to skip AGENTS/config template updates and `--no-sync-user-hooks` to skip hook template updates.

Codex may require reviewing and trusting the changed hook with `/hooks` before it runs.

## Smoke test

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh --no-sync-user-templates
for skill in alpha-goal control-loop evidence-verify; do
  test -f "$tmp_codex_home/skills/$skill/SKILL.md"
done
python3 -m json.tool "$tmp_codex_home/hooks.json" >/dev/null
grep -q "codex-alpha-goal-compact-recovery:v1" "$tmp_codex_home/hooks.json"
npx --no-install tsx tools/validate_skills.ts .
rm -rf "$tmp_codex_home"
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应澄清、执行、验证，还是继续闭环。
$control-loop 根据已明确边界做一轮最小安全变更。
$evidence-verify 检查当前证据是否支持最终声明。
```

## Byte budget

The validator enforces the whole `skills/` tree under 30,000 bytes.
