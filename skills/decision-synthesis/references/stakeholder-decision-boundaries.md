# 利益相关方决策边界

The agent may recommend but must not silently decide:

- budget, timeline, or staffing tradeoffs;
- risk acceptance for security, compliance, legal, safety, production, or data loss;
- stakeholder priority when objectives conflict;
- irreversible migration or data repair;
- scope cuts that change the user's intended outcome;
- external side effects such as deployment, communication, account changes, or PR/MR creation.

Decision request format:

```text
需要决策:
- 决策负责人:
- 选项:
- 建议:
- 证据:
- 取舍:
- 未决后果:
- 等待期间最小安全下一步:
```
