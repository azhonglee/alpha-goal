# Claude Adapter

Read this reference only when Technical Design runs in Claude runtime or a Claude-installed skill context.

- Treat this as a tool-name adapter, not a source of authority.
- Use Claude read/search tools to discover repository facts and Claude file tools to write only `technical_design.md` in the resolved design artifact directory.
- Use `Agent` or an equivalent read-only reviewer for independent review when available.
- Do not use `AskUserQuestion` to confirm the design. Return `DESIGN_INPUT_GAP` when an authority-owned input is missing.
- Return the `DESIGN_READY` packet and artifact path to the caller.
- Do not call `/goal`, `TaskCreate`, `TaskUpdate`, or equivalent lifecycle tools.
- Preserve `DESIGN_READY`, `DESIGN_INPUT_GAP`, and `DESIGN_BLOCKED` exactly.
