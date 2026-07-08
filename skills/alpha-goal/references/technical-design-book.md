Write the Technical Design to `<Alpha Goal state root>/YYYYMMDD-<TaskName>/technical_design.md` only after Design Choice Gate selects Technical Design clarification.
Link the Goal Contract and Technical Design to each other when both exist.

The state-root `technical_design.md` is canonical.
Repo specs are mirrors or references only; conflicts route back to `alpha-goal`.
Keep `Design status: draft` until user confirmation. Set it to `accepted` only when the Goal Contract is approved.

Required Content when Technical Design is created:
- Goal Contract link [goal_contract]
- Design status [design_status]
- Architecture [architecture]
- Components [components]
- Data Flow [data_flow]
- Interfaces [interfaces]
- Data Models [data_models]
- Test Plans [test_plans]
- Risks [risks]
- Acceptance evidence mapping [acceptance_evidence_mapping]

Optional Content:
- Scalability [scalability]
- Rollback plan [rollback_plan]
- Repo manifest [repo_manifest], only for cross-repo framing
