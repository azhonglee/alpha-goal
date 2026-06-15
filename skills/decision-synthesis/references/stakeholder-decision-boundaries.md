# Stakeholder Decision Boundaries

The agent may recommend but must not silently decide:

- budget, timeline, or staffing tradeoffs;
- risk acceptance for security, compliance, legal, safety, production, or data loss;
- stakeholder priority when objectives conflict;
- irreversible migration or data repair;
- scope cuts that change the user's intended outcome;
- external side effects such as deployment, communication, account changes, or PR/MR creation.

Decision request format:

```text
Decision needed:
- Decision owner:
- Options:
- Recommendation:
- Evidence:
- Tradeoff:
- Consequence of no decision:
- Smallest safe next action while waiting:
```
