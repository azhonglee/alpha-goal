# Target Discovery

Use this reference when the target repo/path is ambiguous, the workspace may contain multiple repos, or existing work could make the task duplicate, follow-up, alternative implementation, or comparison-only.

## Multi-repo target gate

If cwd is a workspace, aggregator, monorepo, or contains multiple candidate repos:

- do not mutate anything;
- list the candidate repos or paths found by lightweight read-only checks;
- inspect candidate repos only as needed;
- record positive evidence for the selected repo;
- record exclusion or deferral reasons for non-selected repos;
- record applicable local rules for the selected repo.

Target selection is closed only when the selected repo/path has stronger evidence than alternatives.

If the current repo only has examples, docs, tests, or template mentions of the requested feature and no real implementation surface, target selection is not closed. Return `ASK_USER` with the missing repo/path or ask whether to produce a read-only search plan.

For cross-repo, worktree, submodule, or ownership-boundary implementation, record the explicit user request, confirmation, or decision boundary that authorizes that boundary. Otherwise return `ASK_USER`.

Minimum read-only checks:

- identify the git root and current directory role;
- look one level down for candidate `.git` directories, worktrees, or package roots;
- bound broad workspace scans: prefer depth 1 first, skip ignored/cache/vendor/build directories, and expand only when cheap evidence cannot close target selection;
- search task keywords in candidate names, local branches, recent commits, and docs when cheap;
- read only the local rule files needed to decide target ownership.

If the user describes a multi-repo workspace but cwd is not enough to find candidates, return `ASK_USER` with the missing workspace or repo path. Return `BLOCKED` only when the needed data, permission, or tooling is unavailable after the target source is known.

## Existing work scan

Always do the cheapest local scan needed to avoid duplicate or wrong-target work. Escalate to broader branch, MR/PR, issue, or collaboration-tool scans only when:

- user mentions MR/PR/issue/branch;
- the request sounds like follow-up, duplicate, comparison, or alternative implementation;
- target ownership is ambiguous;
- local keywords, branches, commits, or docs suggest overlapping work;
- final output may create MR/PR and duplicate risk is material.

Record whether the task is:

- `new work`
- `follow-up`
- `duplicate`
- `alternative implementation`
- `comparison-only`
- `unknown`

## Comparison target missing

When the user asks for a read-only comparison against an existing MR/PR/branch but does not identify the comparison object, return `ASK_USER` before `COMPARISON_ONLY`. Record the comparison intent, current object if known, missing MR/PR/branch identifier, claim boundary, and exact input needed. Do not infer a remote object from vague wording.
