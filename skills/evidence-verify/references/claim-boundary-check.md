# Claim Boundary Check

Use this to prevent final claims from exceeding evidence.

## Boundary ladder

A claim can move from local artifact toward broader behavior only when fresh evidence crosses the relevant interface boundary:

- local helper/function;
- module/class/reducer;
- package/service boundary;
- API/RPC endpoint;
- data/state lifecycle;
- user-visible product behavior;
- production/tenant/compliance/safety boundary.

State the actual boundary if these examples do not fit. Never use lower-boundary evidence to claim higher-boundary success.

## Required comparison

```text
声明边界:
- 用户表述:
- 已实现边界:
- 已测试 / 已观察边界:
- 证据支持的最高实用边界:
- 缺口:
- 允许的最终声明:
```

## Common overclaims

- testing a helper but claiming product flow fixed;
- reading a diff but claiming runtime behavior verified;
- fixing a mock path but claiming API integration fixed;
- proving correlation but claiming root cause;
- completing implementation but claiming production observability works;
- using old test results after the last material change.

## 决策

- Evidence covers user wording: `PASS_TO_FINAL`.
- Local goal is satisfied but wording is broader: `NARROW_CLAIM_AND_FINAL`.
- User needs broader evidence: `NEXT_ITERATION`.
- Contract/model boundary is wrong: `REFRAME`.
- Environment, permission, tool, or data is missing: `BLOCKED`.
