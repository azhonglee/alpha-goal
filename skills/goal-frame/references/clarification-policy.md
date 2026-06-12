# Clarification Policy

FRAME 的澄清目标是关闭执行风险，而不是把所有需求都变成访谈。

## Must ask

以下缺口会改变 mutation safety、scope、acceptance 或 final claim 时，先问用户：

- target repo、product、package、service、environment 不确定；
- 不清楚是 new work、follow-up、duplicate、comparison-only；
- 涉及 destructive、remote、production、credential、permission 或数据安全；
- externally visible behavior 或 product-level claim boundary 不清；
- acceptance criteria 相互冲突；
- 用户意图和项目规则冲突。

## Safe to assume

以下情况记录 bounded assumption，不要停下来问：

- 命名遵循明显本地惯例；
- 仓库只有一个高置信实现路径；
- 测试/build 命令可从 `AGENTS.md`、package scripts、Makefile、CI 配置发现；
- 不确定性只影响内部实现风格；
- 下一步只是 read-only discovery。

## Socratic interview

每轮只问一个高杠杆问题：

- 先检查可发现证据，再问用户确认 brownfield 事实；
- 先问 intent、outcome、scope、non-goals、decision boundaries，再问实现细节；
- 优先攻击最弱 Goal Contract 字段；
- 问题要带证据和选择后果；
- 追踪关键字段状态：`clear`、`partial`、`missing`；
- 剩余不确定性能写成 bounded assumption/risk 时，停止提问；
- 缺失答案阻断安全执行时，返回 `ASK_USER`。

好的问题形状：

```text
我找到两个候选位置：`repo-a` 有上传编排和 TOS 日志上下文，`repo-b` 只有底层 TOS driver。这个需求是要改编排日志，还是先比较两个位置的职责边界？
```

用户回答后更新 Goal Contract。若答案改变 target、acceptance、constraints、non-goals 或 claim boundary，后续必须重新走 router，不要继续旧 iteration。

## Default when blocked

用户不可用且 mutation 不安全时，输出 `Frame verdict: ASK_USER` 或 `BLOCKED`。
