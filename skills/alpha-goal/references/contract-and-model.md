# Contract and Model

Use before action when reference, evidence, or system boundary is uncertain.

Discovery Record:
- Trigger / skip reason:
- Task / probable intent:
- Prompt-safe context status: not needed / needed / recorded
- Inspected facts/sources:
- Current-state facts:
- Desired-state evidence:
- Inferences not yet confirmed:
- Fact labels: [from-code][auto-confirmed] / [from-code] / [from-research] external/current fact / [from-user]
- Docs/terminology ledger: inspected sources, canonical terms, conflicting user/repo/code terms, decision required yes/no
- Unknowns classified: discoverable fact / fact needing confirmation / user-owned decision
- Ambiguity score: low / medium / high by intent, outcome, scope, constraints, acceptance, context, non-goals, decision boundaries
- Weakest readiness gate:
- Pressure pass: example / assumption / tradeoff / boundary scenario affecting scope/acceptance/authority/handoff, or not needed because ...
- Human question: none / one high-leverage question
- Question type: confirm conflict / decide tradeoff / define non-goal / define acceptance / grant authority / provide missing external signal
- Closure state: ready to route / ask next / blocked
- Closure evidence: desired delta source, non-goals source, decision-boundary source, acceptance sensor source, authority source
- Closure summary: settled facts, settled user decisions, unsupported assumptions, next route

Goal Contract:
- Reference state: desired delta + source/authority
- In scope:
- Non-goals:
- Constraints:
- Decision boundaries: source/authority
- User-owned decisions: none / ...
- Blocked downstream action: none / ...
- Acceptance evidence: sensor + source/authority
- Claim boundary:
- Indicator Handoff: operational definition, sensor, threshold, timing, evidence boundary, route trigger
- Authorization class: analysis/probe, read-only inspection, mutation, external side effect
- Authorization source: exact user/repo instruction; none means no mutation/external route
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

Discovery Record is route evidence: if discoverable or current/external facts remain, inspect or research first. Current-state facts and existing patterns cannot become desired behavior, acceptance, or authority without desired-state evidence. If `[from-code]` inference, `[from-research]` uncertainty, source-of-truth conflict, user/evidence contradiction, or `[from-user]` decision affects behavior, scope, acceptance, compatibility, authority, or claim boundary, next route is ask/blocker, not `control-loop`.

If user-owned decisions or blocked downstream action is not `none`, next route is ask/blocker, not `control-loop`.
