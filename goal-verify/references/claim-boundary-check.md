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

Choose the verdict from delivery intent:

- Use `NEXT_ITERATION` when the user needs the original broad claim, asks for readiness without accepting a narrower boundary, or higher-boundary evidence is required before merge/ship.
- Use `NARROW_CLAIM_AND_FINAL` when the local goal is satisfied, the remaining gap is only a broader unverified boundary, and the final response can explicitly narrow the claim without misleading the user.

## Examples

### Reducer-only evidence

User wording:

```text
Retryable request errors do not mark the user-visible run as failed
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
Add logs for artifact upload to TOS
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
