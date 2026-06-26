# Alpha Goal

Languages: [Chinese](README.md) | English

Alpha Goal is a minimal persistent closed-loop skillset for goal engineering work. It guides agents to discover facts before asking, resume goal framing from a draft or accepted `goal-contract.md`, pass user confirmation gates before handing an accepted Goal Contract to execution, and make final claims only as far as evidence supports them.

## What Problem It Solves

Alpha Goal gives AI agents a Goal Engineering control loop for three common failure modes:

| Problem | What it looks like | Control point |
| --- | --- | --- |
| Goal drift | The agent starts before requirements are clear, gradually moves off target, and changes unrelated things along the way. | `alpha-goal` discovers facts, clarifies the goal, boundaries, non-goals, and acceptance evidence, then writes a user-confirmed `goal-contract.md`. |
| Action overreach | There is no explicit authority boundary, so work can exceed scope, touch the wrong branch, or treat current implementation as desired behavior. | `control-loop` executes only bounded slices inside an accepted contract, with worktree/branch, scope, non-goals, and claim-boundary checks before mutation. |
| Evidence-free completion | A passing test or partial success is treated as proof that the goal is complete. | `goal-verify` compares evidence against acceptance evidence, classifies gaps, and returns a route decision. |

In practice, it compresses requirement clarification, authority boundaries, iterative execution, evidence verification, and delivery claims into a minimal persistent loop that an agent can understand, execute, and recover.

## Core Architecture

```mermaid
%%{init: {"theme":"base","flowchart":{"wrappingWidth":720,"nodeSpacing":80,"rankSpacing":70,"htmlLabels":true},"markdownAutoWrap":false,"themeVariables":{"background":"#364150","primaryColor":"#364150","primaryTextColor":"#f8fafc","primaryBorderColor":"#f8fafc","lineColor":"#f8fafc","edgeLabelBackground":"#364150","fontFamily":"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"}}}%%
flowchart TD
  AG["alpha-goal (entry)<br/>Discover facts → Clarify requirements → Pressure-test → Write Goal Contract → User confirmation<br/>Output: goal-contract.md (authority contract)"]
  CL["control-loop (execution)<br/>Slice by contract → Execute → Collect evidence → Classify evidence → Route<br/>Output: checkpoint.md (conditional recovery / evidence handoff)"]
  GV["goal-verify (verification)<br/>Evidence vs acceptance evidence → Gap analysis → Route decision<br/>Verdicts: PASS_TO_FINAL / NEXT_ITERATION / BLOCKED / RETURN..."]

  AG -->|"after contract is accepted"| CL
  CL --> GV
  GV --> Pass["Final delivery<br/>(pass)"]
  GV --> Next["Continue next round<br/>(same-goal fixable)"]
  GV --> Return["Return to alpha-goal<br/>(goal changed / overreach)"]

  classDef stage fill:#364150,stroke:#f8fafc,color:#f8fafc,stroke-width:2px;
  classDef route fill:#364150,stroke:#364150,color:#f8fafc,stroke-width:0px;
  class AG,CL,GV stage;
  class Pass,Next,Return route;
```

```text
Trigger -> Preflight/Discovery -> Clarify -> Write Contract -> Technical Design? -> Review -> Confirm
Accepted Goal Contract -> $control-loop -> Act -> Evidence -> $goal-verify -> Gap? -> Harden or Final Claim
```

## Quick start

```bash
scripts/install.sh
npx --no-install tsx tools/validate_skills.ts .
```

The installer creates direct symlinks for the three public skills under `$HOME/.codex/skills/` and cleans same-repo links for merged old public skills.
The validator checks that the whole `skills/` tree stays under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks. This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, authority gates, behavior-level gates, and evaluator feedback without over-compressing skill text.

## Usage examples

```text
$alpha-goal Decide whether this task should discover facts, clarify, write a contract, add a technical design, confirm, or hand off to execution/verification.
$control-loop Execute or harden the next most useful verifiable bounded slice from an accepted Goal Contract.
```

You usually do not need to name a skill. Describe the work normally; Alpha Goal is meant to activate when the request needs goal framing, bounded execution, or evidence-backed completion.

## Public skills

| Skill | What it helps with |
| --- | --- |
| [`alpha-goal`](skills/alpha-goal/) | Clarify intent, boundaries, and acceptance evidence, produce a Goal Contract for confirmation, and add a Technical Design when cross-file predictive changes need one. |
| [`control-loop`](skills/control-loop/) | Execute or harden an authorized slice, with `goal-contract.md` required and `checkpoint.md` used only as a conditional checkpoint. |
| [`goal-verify`](skills/goal-verify/) | Verify goal completion, claim boundary, evidence coverage, and material unclaimed defects/risks, then return the next Gap. |

## Principles

Alpha Goal keeps agent work explicit, bounded, and accountable to evidence.

- Evidence before authority: Current code facts describe current state; desired behavior comes from user intent, specs, issues, or accepted contracts.
- Goals before action: outcome, scope, non-goals, acceptance evidence, decision owner, and claim boundary define what may change.
- Persistent state: `goal-contract.md` is the default `alpha-goal` output and directly contains discovery notes, interview ledger, and the final contract; `checkpoint.md` conditionally carries the run profile.
- Bounded execution: prefer bounded evidence-producing actions or targeted changes over broad refactors and speculative cleanup; the accepted contract, required Run Profile, and repo policy constrain action authority.
- Independent verification: final/ready/safe/complete/repair/review claims require fresh evidence and defect/risk sweep, checked separately from execution.
- Honest routing: unclear goals return to `alpha-goal`, same-goal fixable execution gaps return to `control-loop`, and unsupported or under-reviewed final claims continue through `goal-verify`.
