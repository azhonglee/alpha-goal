# Claim Boundary Check

用来防止 final claim 超过证据。

## Boundary ladder

从最直接改动或检查的 artifact 开始，只能沿 fresh evidence 实际覆盖的层级向上：

1. local helper/function；
2. module/class/reducer；
3. package/service boundary；
4. API/RPC endpoint；
5. data/state lifecycle；
6. user-visible product behavior；
7. production/tenant/compliance boundary。

不要用 lower-boundary evidence 声称 higher-boundary success。

## Required comparison

```text
Claim boundary:
- User wording:
- Implemented boundary:
- Tested boundary:
- Highest practical boundary:
- Gap:
- Final claim allowed:
```

## Common overclaims

- 只测 helper，却声称 product flow fixed；
- 只看 diff，却声称 runtime behavior verified；
- 只修本地 mock path，却声称 API integration fixed；
- 只证明 correlation，却声称 root cause；
- 只完成 implementation，却声称 production observability working；
- 用旧测试结果覆盖最后一次 material change。

## Decisions

- evidence 覆盖 user wording：`PASS_TO_FINAL`。
- local goal 满足但 wording 更宽：`NARROW_CLAIM_AND_FINAL`。
- 用户需要更宽边界：`NEXT_ITERATION` 补证据。
- contract 边界错：`REFRAME`。
- 环境/权限缺失：`BLOCKED`。
