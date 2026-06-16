# Contract and Model

Use before action when reference, evidence, or system boundary is uncertain.

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

If user-owned decisions or blocked downstream action is not `none`, next route is ask/blocker, not `control-loop`.
