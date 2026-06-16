# Contract and Model

Use before action when reference, evidence, or system boundary is uncertain.

Discovery Record:
- Trigger / skip reason:
- Task / probable intent:
- Prompt-safe context status: not needed / needed / recorded
- Inspected facts/sources:
- Fact labels: [from-code][auto-confirmed] / [from-code] / [from-research] / [from-user]
- Docs/terminology ledger: inspected sources, canonical terms, conflicting user/repo/code terms, decision required yes/no
- Unknowns classified: discoverable fact / fact needing confirmation / user-owned decision
- Ambiguity score: low / medium / high by intent, outcome, scope, constraints, acceptance, context, non-goals, decision boundaries
- Weakest readiness gate:
- Pressure pass: example / assumption / tradeoff / boundary scenario affecting scope/acceptance/authority/handoff, or not needed because ...
- Human question: none / one high-leverage question
- Closure state: ready to route / ask next / blocked

Goal Contract:
- Reference state:
- In scope:
- Non-goals:
- Constraints:
- Decision boundaries:
- User-owned decisions: none / ...
- Blocked downstream action: none / ...
- Acceptance evidence:
- Claim boundary:
- Indicator Handoff: operational definition, sensor, threshold, timing, evidence boundary, route trigger
- Authorization class: analysis/probe, read-only inspection, mutation, external side effect
- Next route:

Control Model:
- System boundary:
- State variables:
- Sensors / blind spots:
- Actuators / authority limits:
- Observability / controllability: enough / weak / missing
- Ownership/source of truth:
- Disturbance Register: none / likelihood, impact, sensor, containment, route trigger
- Controller Hierarchy: none / global goal, local controller, coupling variable, arbitration, escalation
- Candidate Control Law: target error, control variable, expected effect, sensor threshold, fallback

Discovery Record is route evidence: if discoverable facts remain, inspect first; if `[from-code]` inference, source-of-truth conflict, or `[from-user]` decision affects behavior, scope, acceptance, compatibility, authority, or claim boundary, next route is ask/blocker, not `control-loop`.

If user-owned decisions or blocked downstream action is not `none`, next route is ask/blocker, not `control-loop`.
