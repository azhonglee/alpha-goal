# Claim Boundary Check

用来防止 final claim 超过证据。

## Boundary ladder

A claim may move from a local artifact toward broader behavior only when fresh evidence crosses the relevant interface boundary. Typical examples are:

- local helper/function;
- module/class/reducer;
- package/service boundary;
- API/RPC endpoint;
- data/state lifecycle;
- user-visible product behavior;
- production/tenant/compliance boundary.

This is not an exhaustive taxonomy. State the actual boundary if these examples do not fit. Do not use lower-boundary evidence to claim higher-boundary success.

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

These are examples, not a case list:

- testing a helper but claiming product flow fixed;
- reading a diff but claiming runtime behavior verified;
- fixing a mock path but claiming API integration fixed;
- proving correlation but claiming root cause;
- completing implementation but claiming production observability works;
- using old test results after the last material change.

## Decisions

- Evidence covers user wording: `PASS_TO_FINAL`.
- Local goal is satisfied but wording is broader: `NARROW_CLAIM_AND_FINAL`.
- User needs broader evidence: `NEXT_ITERATION`.
- Contract boundary is wrong: `REFRAME`.
- Environment, permission, or data is missing: `BLOCKED`.
