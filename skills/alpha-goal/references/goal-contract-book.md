
Write the Goal Contract to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/goal-contract.md`.
Copy to `docs/specs/YYYYMMDD-<TaskName>.md` only when useful or required by repo convention.

The state-root `goal-contract.md` is canonical.
Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.
Keep `Contract status: draft` until user confirmation.

Required Content:
- Contract status [contract_status]
- Issued by [issued_by]
- Technical Context [context]
- Intent [intent]
- Outcome [outcome]
- Scope [scope]
- Constraints [constraints]
- Success Criteria [success_criteria]
- Acceptance evidence [acceptance_evidence]
- Non-goals [non_goal]
- Execution boundary [execution_boundary]
- Decision boundary [decision_boundary]
- Claim boundary [claim_boundary]
- Authorization Source [authorization_source]

Optional Content:
- Root Cause [root_cause], only for repair design
- Discovery notes [discovery_notes]
- Interview ledger [interview_ledger]
- Repo surfaces [repo_surfaces]
- Design choice [design_choice]
- Technical Design link [technical_design]
- Assumptions + resolutions [assumptions_resolutions]
- Dependency/integration order [repo_integration_order]
