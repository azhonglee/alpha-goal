<!-- alpha-goal-managed-custom-agent-routing:v1 -->
## Custom-agent routing

- The main agent owns scope, authority, acceptance decisions, and final synthesis.
- Delegate only independent, bounded work when it materially improves speed, quality, or context isolation.
- Use `scout` for read-only exploration and evidence collection.
- Use `builder` for authorized, clearly scoped local implementation with explicit acceptance criteria.
- Use `reviewer` for complex review, competing interpretations, cross-component consequences, or high-consequence risks.
- Use built-in agents when no pinned custom role is required; if no role clearly fits, keep the work in the main agent.
- Do not repeat the same work across agents merely to compare effort levels, and do not allow concurrent edits to overlapping files.
- A model or reasoning profile never grants additional authority.

<!-- generate-with-template:custom-agent-routing -->
