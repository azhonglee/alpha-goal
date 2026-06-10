# goal-loop

`goal-loop` 是一套目标驱动的 Agent 工作流, 默认安装支持Codex。它把编码任务拆成 Goal、Loop、Review 三个内部阶段，要求先定义成功标准，再通过证据驱动的迭代推进，最后在完成前做评审，避免只凭意图或局部改动声明完成。

## 适用场景

当任务涉及实现、调试、重构、测试、行为变更、复杂修复、需求澄清或迭代验证时，`goal-loop` 技能会提供一套统一工作流：

1. Goal：明确目标、成功标准、约束、非目标、决策边界和验收证据。
2. Loop：用最小有效行动产出证据，并根据证据决定继续、转向、扩展、加固或进入完成评审。
3. Review：挑战当前方向、证据强度、范围漂移和完成声明，确认是否真的满足验收条件。

## 仓库结构

```text
.
├── scripts/
│   └── install.sh              # 安装脚本，将 skills 软链接到 Codex 技能目录
├── skills/
│   └── goal-loop/
│       ├── SKILL.md            # 技能入口和总流程
│       ├── agents/
│       │   └── openai.yaml     # 代理配置
│       └── references/
│           ├── goal.md         # Goal 阶段规则
│           ├── loop.md         # Loop 阶段规则
│           ├── review.md       # Review 阶段规则
│           ├── spec-template.md
│           └── plan-template.md
└── templates/
    └── AGENTS.md               # 推荐写入 CODEX_HOME 的代理行为模板
```

## 安装

在仓库根目录执行：

```bash
scripts/install.sh
```

脚本会执行两类操作：

- 将 `skills/*` 下的技能目录软链接到 `${CODEX_HOME:-$HOME/.codex}/skills`。
- 确保 `${CODEX_HOME:-$HOME/.codex}/AGENTS.md` 包含 `templates/AGENTS.md` 的内容。

如果目标位置已经存在指向其他目录的软链接，可以使用：

```bash
scripts/install.sh --force
```

`--force` 只会替换已有软链接，不会删除或覆盖真实文件、真实目录。

如需安装到自定义 Codex 主目录：

```bash
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

## 使用方式

安装后，Codex 会在适用任务中加载 `goal-loop`。典型执行顺序如下：

```text
Request
  ↓
Goal
  ↓
Loop
  ↓
Review
  ↓
Goal Update
  ↓
Next Loop or Final Output
```

Goal、Loop、Review 是 `goal-loop` 内部的三个阶段，由 `skills/goal-loop/SKILL.md` 统一调度。

## 持久化产物

默认情况下，小任务只在对话中维护 Goal、Loop 和 Review 信息，不创建额外文件。只有在任务需要可复用的需求、计划或评审记录时，才按模板生成持久化产物：

- 需求规格：`docs/design/YYYYMMDD-<slug>-spec.md`
- 执行计划：`docs/plans/YYYYMMDD-<slug>-plan.md`
- 评审记录：`.goal-loop/reviews/YYYYMMDD-<slug>-review.md`

对应模板位于 `skills/goal-loop/references/`。

## 开发与更新

修改技能内容后，通常重新执行安装脚本即可让本地 Codex 使用最新软链接内容：

```bash
scripts/install.sh
```

新增技能时，按以下结构放置：

```text
skills/<skill-name>/SKILL.md
```

安装脚本会自动发现 `skills/*/SKILL.md`。

## 验证

检查安装脚本帮助信息：

```bash
scripts/install.sh --help
```
