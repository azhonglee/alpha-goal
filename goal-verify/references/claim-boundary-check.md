# Claim Boundary Check

The claim boundary check prevents local evidence from being used to support product-level claims.

## Core question

```text
Does the evidence prove the user's wording at the boundary the user likely cares about?
```

## Boundary model

Start from the artifact directly changed or inspected, then climb only as far as fresh evidence actually reaches:

1. local unit or document section;
2. component, command, handler, rule, or generated artifact;
3. public interface, package contract, API, CLI, installer, or workflow boundary;
4. integration path across components, persistence, queues, external tools, or configuration;
5. user-visible, operator-visible, or downstream-consumer behavior;
6. end-to-end system behavior in the target environment;
7. production or real-world operational evidence.

For web/service tasks, one concrete instantiation is helper function -> reducer/mapper/handler -> service method -> API endpoint -> event stream/persistence/queue lifecycle -> UI dispatch/user-visible state -> end-to-end product behavior -> production observability. Treat this as an example, not a required taxonomy.

For diagnostic claims, use a parallel ladder: symptom observed, reproduction attempted, call chain mapped, first divergence point identified, narrowed component named, material alternatives excluded, fix surface identified, fix verified. Do not use a narrower rung to claim a broader one.

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


### Root-cause claim boundary

User wording:

```text
Find and fix why jobs complete twice.
```

Local evidence supports:

```text
Duplicate completion is caused by retry replay across queue handler X because event idempotency key Y is not checked; this was reproduced by test Z and confirmed by logs A/B.
```

It does not automatically support:

```text
All duplicate job completion causes are fixed in production.
```

Narrow the final claim unless end-to-end or production observability evidence exists.
