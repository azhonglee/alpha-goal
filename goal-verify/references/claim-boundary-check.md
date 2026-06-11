# Claim Boundary Check

The claim boundary check prevents local evidence from being used to support product-level claims.

## Core question

```text
Does the evidence prove the user's wording at the boundary the user likely cares about?
```

## Boundary ladder

From narrow to broad:

1. helper function;
2. reducer / mapper / handler;
3. service method;
4. API endpoint;
5. event stream / persistence / queue lifecycle;
6. UI dispatch / user-visible state;
7. end-to-end product behavior;
8. production observability.

Use the highest practical boundary for the claim. If not practical, narrow the final claim.

## Examples

### Reducer-only evidence

User wording:

```text
请求重试不算失败状态
```

Reducer test evidence supports:

```text
retryable error does not set reducer run state to failed
```

It does not automatically support:

```text
full app-server stream continues and UI never observes failed state
```

Verdict should be:

- `NEXT_ITERATION` if higher-boundary verification is feasible; or
- `NARROW_CLAIM_AND_FINAL` if final claim is explicitly reducer-scoped.

### Logging implementation evidence

User wording:

```text
补充产物上传 TOS 时日志
```

Local unit tests and diff review support:

```text
selected repo emits intended log calls around upload code paths
```

They do not automatically support:

```text
production logs are visible in the operational logging platform
```

Narrow final claim unless runtime/observability evidence exists.
