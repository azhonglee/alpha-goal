# goal-loop

`goal-loop` 现在是一组面向 Codex 的目标驱动技能集合。它不再把所有规则塞进单个技能，而是把工作流拆成四个可审计的状态转换器：

- `goal-loop`：状态机和路由器。
- `goal-frame`：在编码前产出 Goal Contract。
- `goal-iterate`：在合同约束下完成一轮最小有效变更。
- `goal-verify`：在最终声明前产出 Verification Verdict。

核心原则是：先 frame，后 iterate，再 verify；verify 不通过就明确回到 iterate、frame 或 blocked。Final output 只能来自 verification verdict 允许的 claim boundary。

## Key Features

- 目标合同：先定义 intent、target、acceptance、non-goals、constraints、decision boundaries 和 evidence plan。
- 隔离变更：进入修改前执行 mutation preflight，避免在 primary `main`/`master` checkout 上直接编辑。
- 证据裁决：用 `Acceptance -> Evidence -> Status` 映射判断证据是否足够支撑完成声明。
- 原生分层：使用 Codex skills 的渐进加载能力，把阶段规则、脚本和引用资料拆到独立 skill。

## Application Scenarios

当任务涉及实现、调试、重构、测试、行为变更、复杂修复、需求澄清、已有 MR/PR 对比、最终验证或交付声明时，优先使用 `goal-loop` 路由：

```text
REQUEST
  -> FRAME
FRAME
  -> ITERATE
  -> VERIFY
  -> FINAL_ADVISORY
  -> ASK_USER
  -> BLOCKED
ITERATE
  -> VERIFY
  -> FRAME
  -> BLOCKED
VERIFY
  -> ITERATE
  -> FRAME
  -> DELIVER
  -> BLOCKED
DELIVER
  -> FINAL
```

三个核心产物：

- `Goal Contract`：由 `goal-frame` 产出。
- `Iteration Record`：由 `goal-iterate` 产出。
- `Verification Verdict`：由 `goal-verify` 产出。

## Repository Structure

```text
.
├── scripts/
│   └── install.sh
├── skills/
│   ├── goal-loop/
│   │   ├── SKILL.md
│   │   └── agents/openai.yaml
│   ├── goal-frame/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   └── references/
│   │       ├── clarification-policy.md
│   │       ├── goal-contract-schema.md
│   │       └── spec-template.md
│   ├── goal-iterate/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   ├── references/
│   │   │   ├── iteration-record-schema.md
│   │   │   └── plan-template.md
│   │   └── scripts/
│   │       └── mutation-preflight.sh
│   └── goal-verify/
│       ├── SKILL.md
│       ├── agents/openai.yaml
│       ├── references/
│       │   ├── claim-boundary-check.md
│       │   └── verdict-rubric.md
│       └── scripts/
│           └── evidence-summary.sh
└── templates/
    ├── AGENTS.md
    └── config.toml
```

## How to Install it in Codex

在仓库根目录执行：

```bash
scripts/install.sh
```

脚本会执行三类操作：

- 将 `skills/*` 下的技能目录软链接到 `${CODEX_HOME:-$HOME/.codex}/skills`。
- 将 `templates/AGENTS.md` 同步到 `${CODEX_HOME:-$HOME/.codex}/AGENTS.md` 的受管理模板块；如果目标文件没有模板标记，则只追加模板内容，保留既有手写内容。
- 检查 `${CODEX_HOME:-$HOME/.codex}/config.toml` 是否包含 `templates/config.toml` 里的配置，并只补齐缺失项，不覆盖已有值。

如果目标位置已经存在指向其他目录的软链接，可以使用：

```bash
scripts/install.sh --force
```

`--force` 只会替换已有软链接，不会删除或覆盖真实文件、真实目录。

如需安装到自定义 Codex 主目录：

```bash
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## How to Use

安装后，Codex 会在适用任务中加载 `goal-loop`。`goal-loop` 只负责路由；进入阶段时会读取相邻的 `goal-frame`、`goal-iterate` 或 `goal-verify`。

也可以显式使用某个阶段技能：

- `$goal-frame`：只做目标框定和 Goal Contract。
- `$goal-iterate`：在已有 Goal Contract 下做一轮实现。
- `$goal-verify`：检查已有 diff、测试、证据或完成声明。

## Persistent Outputs

默认情况下，小任务只在对话中维护 Goal Contract、Iteration Record 和 Verification Verdict，不创建额外文件。只有在用户明确需要持久化产物，或项目规则要求可复用需求、计划或证据记录时才使用模板：

- 需求规格：`skills/goal-frame/references/spec-template.md`
- 执行计划：`skills/goal-iterate/references/plan-template.md`
- 命令或证据记录：项目内 `.goal-loop/evidence/YYYYMMDD-<slug>/`

`.goal-loop/` 和 `.worktrees/` 已在仓库 `.gitignore` 中忽略。

## Driving Codex Autonomous

除了在 skill 中定义工作流规则，模板配置也让 Codex 在目标明确时保持自主执行：

1. `templates/AGENTS.md` 定义 Agent 行为、隔离原则和交付期望。
2. `templates/config.toml` 配置 sandbox、multi-agent 和 structured input 能力。
3. subagent 只在任务可独立并行、收益明确且项目规则允许时作为增强，不是默认步骤。

## Development and Updates

修改技能内容后，通常重新执行安装脚本即可让本地 Codex 使用最新软链接内容：

```bash
scripts/install.sh
```

如果 `templates/AGENTS.md` 发生变化，重新安装会更新 `${CODEX_HOME:-$HOME/.codex}/AGENTS.md` 中带 `generate-with-template:agents-md` 标记的受管理模板块，并保留模板块之外的用户内容。

新增技能时，按以下结构放置：

```text
skills/<skill-name>/SKILL.md
```

安装脚本会自动发现 `skills/*/SKILL.md`。

## Verification

检查安装脚本和技能脚本语法：

```bash
bash -n scripts/install.sh
bash -n skills/goal-iterate/scripts/mutation-preflight.sh skills/goal-verify/scripts/evidence-summary.sh
```

检查配置模板是否可解析：

```bash
python3 - <<'PY'
import tomllib
from pathlib import Path

tomllib.loads(Path("templates/config.toml").read_text())
PY
```

使用临时 Codex 主目录验证安装行为，避免污染真实配置：

```bash
CODEX_HOME="$(mktemp -d)" scripts/install.sh
```
