# Target Discovery

当 target repo/path 不明确、workspace 可能有多个 repo，或 existing work 会让任务变成 duplicate/follow-up/comparison-only 时使用。

## Multi-repo target gate

cwd 是 workspace、aggregator、monorepo 或包含多个候选 repo 时：

- 不 mutation；
- 先列出轻量发现到的候选 repo/path；
- 只检查关闭目标选择所需的证据；
- 记录选中 repo 的正向证据；
- 记录未选 repo 的排除或延期理由；
- 记录选中 repo 的本地规则。

Target selection 只有在选中目标比替代项证据更强时才算 closed。

如果当前 repo 只有示例、docs、tests 或模板提及请求功能，没有真实实现面，返回 `ASK_USER`，要求提供 repo/path 或确认只读搜索计划。

跨 repo、worktree、submodule 或 ownership-boundary implementation 必须有用户请求、确认或已记录 decision boundary；否则返回 `ASK_USER`。

最低只读检查：

- identify git root 和 cwd role；
- 深度 1 查候选 `.git`、worktree、package root；
- 跳过 ignored/cache/vendor/build；
- cheap search task keywords、local branches、recent commits、docs；
- 只读所需 local rule files。

## Domain boundary gate

用户命名 page、product area、workspace、canvas、space、dashboard 或 umbrella term 时，先区分：

- user-facing container；
- 具体 submodule；
- data entity；
- source API/RPC；
- logs/observability；
- code symbols。

记录 related but not equivalent 的术语，例如 UI labels、domain objects、persisted records、jobs、events、operations。优先选择最窄的 evidence-backed submodule，而不是宽泛 container。

若 logs、route names、RPC names 或 payload fields 指向不同 entity，target selection 不闭合。`goal-loop` frame phase 产出新 Goal Contract；后续阶段应 `REFRAME_NEEDED`，不要把证据硬塞进旧 target。

## Existing work scan

做最便宜的本地扫描避免重复或错目标。以下情况升级到更广的 branch、MR/PR、issue 或协作工具扫描：

- 用户提到 MR/PR/issue/branch；
- 请求像 follow-up、duplicate、comparison 或 alternative implementation；
- target ownership 不清；
- local keywords、branches、commits 或 docs 暗示重叠工作；
- final output 可能创建 MR/PR 且 duplicate risk 真实存在。

记录关系：

- `new work`
- `follow-up`
- `duplicate`
- `alternative implementation`
- `comparison-only`
- `unknown`

## Comparison target missing

用户要求比较 MR/PR/branch 但未给对象时，返回 `ASK_USER`，记录缺失 identifier 和精确需要的输入。不要从模糊措辞推断远程对象。
