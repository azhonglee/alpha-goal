# 安装与烟测

## 默认安装

```bash
scripts/install.sh
```

默认 Codex 主目录是 `$HOME/.codex`。脚本会创建 `$HOME/.codex/skills/alpha-goal` 软链接，指向本仓库的 `skills/`。该目录包含四个必需技能：

```text
alpha-goal
system-model
control-loop
evidence-verify
```

安装脚本会通过 `npx --yes tsx` 运行 TypeScript 校验器，因此本机需要可用的 Node.js/npm。

## 安装到指定 Codex 主目录

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## 安装行为

脚本会：

- 安装前运行源码中的 `tools/validate_skills.ts`。
- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认同步用户级模板：更新受管理的 `AGENTS.md` 模板块，并补齐 `config.toml` 中缺失的模板设置。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接。
- 校验目标软链接能访问四个必需技能。

如果目标位置已有其他软链接：

```bash
scripts/install.sh --force
```

如需跳过用户级模板同步：

```bash
scripts/install.sh --no-sync-user-templates
```

排查安装过程：

```bash
scripts/install.sh --verbose
```

## 临时烟测

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
npx --yes tsx tools/validate_skillset.ts .
rm -rf "$tmp_codex_home"
```

## 行为烟测提示

```text
$alpha-goal 通过一轮一问形成目标契约，覆盖真实意图、预期结果、范围、非目标、边界、约束、验收信号和决策边界，不要改文件。
```

预期：先问最高杠杆问题，量化模糊度；非目标、边界、验收信号或决策边界未明确时停在用户确认，不进入执行。

```text
$system-model 这个仓库的安装链路失败，先建模可观测信号、可控变量和扰动，不要改文件。
```

预期：识别被控对象、传感器、执行器、扰动和控制器层级；执行前回到 `alpha-goal`。

```text
$control-loop 根据已确认的 alpha-goal 目标契约做一轮最小变更。
```

预期：先检查目标契约和编辑边界，输出紧凑中文 `执行检查`，记录反馈和剩余误差。

```text
$evidence-verify 检查当前 diff、测试和声明边界，判断是否可以最终交付。
```

预期：把验收项映射到最新证据，判断最终声明是否必须窄化或回到下一轮。
