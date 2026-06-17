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

Node.js/npm must be available because validation uses `npx --yes tsx`.

## Options

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
scripts/install.sh --force
scripts/install.sh --no-sync-user-templates
scripts/install.sh --verbose
```

## Behavior

The script validates the source skillset, creates `${CODEX_HOME:-$HOME/.codex}/skills/<skill-name>` links for public skills, cleans same-repo links for merged old public skills, and validates each installed top-level `SKILL.md`. By default it also syncs user-level templates; use `--no-sync-user-templates` for smoke tests.

## Smoke test

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh --no-sync-user-templates
for skill in alpha-goal control-loop evidence-verify; do
  test -f "$tmp_codex_home/skills/$skill/SKILL.md"
done
npx --yes tsx tools/validate_skills.ts .
rm -rf "$tmp_codex_home"
```

## Prompts

```text
$alpha-goal 判断这个任务下一步应成帧、建模、综合、执行还是验证。
$control-loop 根据已明确边界做一轮最小安全变更。
$evidence-verify 检查当前证据是否支持最终声明。
```

## Byte budget

The validator enforces the whole `skills/` tree under 30,000 bytes.
