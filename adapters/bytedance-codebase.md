# ByteDance Codebase Adapter

This is an optional adapter reference for internal Codebase-style repositories. It is not part of the core protocol.

Use it when the repository has internal MR tooling, nested repos, or workspace-level aggregation.

## When to trigger

During `goal-frame`, run an existing work scan when:

- the user request looks like an implementation task: 补充, 修复, 实现, 支持, 优化;
- the task likely ends with creating an MR;
- feature keywords match an existing branch, commit, local doc, or MR title;
- the user references an MR after implementation;
- multiple subrepos contain related symbols.

## Existing work scan record

```text
Existing Work Scan:
- keywords:
- local branches searched:
- recent commits searched:
- open MRs searched:
- docs/specs searched:
- findings:
- relation:
- decision:
```

Allowed relation values:

- `new work`
- `follow-up`
- `duplicate`
- `alternative implementation`
- `comparison-only`
- `unknown`

## Suggested local checks

Use available internal tools only when already configured and permitted.

Read-only checks may include:

```bash
git branch --all --list '*<keyword>*'
git log --oneline --all --grep='<keyword>'
git log --oneline --all --name-only -- '<path-or-keyword-related-file>'
```

If `bytedcli` or Codebase MR tooling is available, search open MRs by title/keyword before mutation. Do not assume a tool exists; detect or ask.

## Decision rules

- If an open MR appears to implement the same acceptance, do not create a competing implementation until the user chooses comparison/follow-up/new MR.
- If existing work is broader and current task is narrow, return to `goal-frame` and classify relation.
- If user asks “和 MR X 比起来呢”, switch to comparison-only framing before making claims.
- If an MR is inaccessible, say what was searched and what could not be verified.
