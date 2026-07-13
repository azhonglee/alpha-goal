Write the Technical Design to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/technical_design.md` only from `technical-design-runbook.md`, after Goal Contract Confirmation Gate selects `run technical design`.
Link the Goal Contract and Technical Design to each other when both exist.

The state-root `technical_design.md` is canonical. Material design changes require renewed design confirmation before execution continues.
Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.
Keep `Design status: draft` until Technical Design Confirmation Gate approves it. Set it to `accepted` only when the Goal Contract and Technical Design are approved together.

Always Required Content when Technical Design is created:
- Goal Contract link [goal_contract]
- Design status [design_status]
- Acceptance evidence mapping [acceptance_evidence_mapping]
- Risks or non-material risk note [risks]

Required Content when touched or material:
- Architecture [architecture]
- Components [components]
- Data Flow [data_flow]
- Interfaces [interfaces]
- Data Models [data_models]
- Test Plans [test_plans]
- Persistence [persistence]
- Middleware [middleware]
- Infrastructure [infrastructure]
- External Dependencies [external_dependencies]

Conditional Content:
- Scalability [scalability]
- Rollback plan [rollback_plan]
- Repo manifest [repo_manifest], only for cross-repo framing

Coverage Rule:
- Include any dimension whose answer can change implementation, interfaces, data, dependencies, tests, rollout, rollback, security, privacy, performance, or risk handling.
- Omit untouched dimensions, or record `not touched` only when that prevents ambiguity.
- Do not create placeholder sections solely to satisfy a fixed template.
