# 闭环控制式 Alpha Goal 技能集

本仓库维护一组给 Codex 使用的 Agent Skills。当前分支把原有 `alpha-goal`、`loop`、`verify` 三段式流程扩展为六技能闭环控制套件：先形成目标参考输入，再建模系统状态，随后有界执行、采集反馈并独立验证。

核心映射：

| 工程控制论概念 | 在本 Skills 套件中的角色 |
| --- | --- |
| 参考输入 / 期望状态 | `alpha-goal` 生成的 Goal Contract |
| 被控对象 / plant | 代码库、产品、文档、数据流或组织流程 |
| 状态变量 | 需求清晰度、实现状态、测试状态、风险、证据覆盖率 |
| 传感器 / observer | repo 快照、日志、测试、人工反馈、审查意见 |
| 控制器 / actuator | `loop` 的有界迭代、诊断、修复、加固 |
| 比较器 / error detector | `verify` 对“目标、证据、最终声明”的误差判定 |
| 复杂巨系统综合集成 | `meta-synthesis` 对复杂、多主体、弱量化问题的综合研判 |
| 总调度器 | `control-kernel` 根据当前系统状态选择 Skill 和下一步 |

## 六个技能

- `control-kernel`：闭环调度和 Skill 路由。
- `alpha-goal`：把含糊请求转为可执行、可验证、可移交的 Goal Contract。
- `system-model`：建立被控对象模型，识别状态变量、观测信号、可控变量、扰动和耦合。
- `loop`：在已批准 Goal Contract 下执行有界迭代，采集反馈并路由。
- `verify`：独立判断证据是否支持完成、可合并、可发布或窄化声明。
- `meta-synthesis`：处理复杂系统、多利益相关方、弱结构化需求与高不确定性决策。

## 安装

默认安装到真实 Codex home，并在 `$HOME/.codex/skills/` 下创建一个 `alpha-goal` 软链接，指向本仓库的 `skills/`：

```bash
scripts/install.sh
```

脚本会执行以下操作：

- 运行 `tools/validate_skills.py` 校验六技能套件。
- 创建 `${CODEX_HOME:-$HOME/.codex}/skills/alpha-goal` 软链接，目标是本仓库的 `skills/` 目录。
- 默认把 `templates/AGENTS.md` 合并到 Codex home 的 `AGENTS.md`，并把 `templates/config.toml` 中缺失的设置补齐到 Codex home 的 `config.toml`。
- 用户配置模板只补齐 multi-agent、child AGENTS 和结构化 `request_user_input` 相关开关；不会修改 sandbox 权限、休眠行为，也不会抑制不稳定特性警告。
- 自动替换指向本仓库旧顶层布局或旧 `skills/alpha-goal` 目录的 `alpha-goal` 软链接。
- 清理旧版本可能留在目标 `skills/` 下、且指向本仓库的直连技能软链接。
- 校验目标 `skills/alpha-goal` 软链接是否指向当前仓库的 `skills/` 目录，并能通过该链接访问全部六个必需 skill。

安装到其他位置：

```bash
scripts/install.sh --codex-home /path/to/codex-home
CODEX_HOME=/path/to/codex-home scripts/install.sh
```

替换已有同名软链接：

```bash
scripts/install.sh --force
```

只安装 skill 软链接，不同步用户级模板：

```bash
scripts/install.sh --no-sync-user-templates
```

排查安装过程：

```bash
scripts/install.sh --verbose
```

## 校验

推荐校验命令：

```bash
python3 tools/validate_skills.py .
```

兼容旧命令：

```bash
python3 tools/validate_skillset.py .
```

校验器只检查目录结构、元数据、脚本权限和 macOS 元数据残留；它不能证明技能在真实任务中的路由、触发时机、验证边界或验收判断一定正确。

建议先用临时 `CODEX_HOME` 验证安装流程：

```bash
tmp_codex_home="$(mktemp -d)"
CODEX_HOME="$tmp_codex_home" scripts/install.sh
python3 tools/validate_skills.py .
rm -rf "$tmp_codex_home"
```

## 仓库结构

```text
skills/
  control-kernel/  # 闭环调度和路由
  alpha-goal/      # 目标澄清和 Goal Contract
  system-model/    # 系统状态、可观测性和可控性建模
  loop/            # 有界迭代执行和反馈
  verify/          # 证据边界和完成判断
  meta-synthesis/  # 复杂系统综合研判
templates/         # 可同步到 Codex home 的用户配置模板
scripts/           # 安装脚本
tools/             # 本仓库校验工具
```
