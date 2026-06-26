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
%%{init: {"theme":"base","themeVariables":{"background":"#364150","primaryColor":"#364150","primaryTextColor":"#f8fafc","primaryBorderColor":"#f8fafc","lineColor":"#f8fafc","edgeLabelBackground":"#364150","fontFamily":"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"}}}%%
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

Runtime state lives under `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`: `goal-contract.md` is the default contract artifact, `checkpoint.md` is conditional, and `control-state/latest.md` points to the latest recoverable task only when task identity is ambiguous.

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
| `alpha-goal` | Clarify intent, boundaries, and acceptance evidence, produce a Goal Contract for confirmation, and add a Technical Design when cross-file predictive changes need one. |
| `control-loop` | Execute or harden an authorized slice, with `goal-contract.md` required and `checkpoint.md` used only as a conditional checkpoint. |
| `goal-verify` | Verify goal completion, claim boundary, evidence coverage, and material unclaimed defects/risks, then return the next Gap. |

## Docs

- [INSTALL.md](INSTALL.md): installation options and smoke test.
- [MANIFEST.md](MANIFEST.md): public skills, scripts, and runtime artifacts.
- [skills/alpha-goal/SKILL.md](skills/alpha-goal/SKILL.md): default entry and routing rules.
- [skills/control-loop/SKILL.md](skills/control-loop/SKILL.md): Goal Contract driven bounded action loop contract.
- [skills/goal-verify/SKILL.md](skills/goal-verify/SKILL.md): goal verification and defect/risk review contract.

## Structure

```text
skills/alpha-goal/
skills/control-loop/
skills/goal-verify/
templates/
scripts/
tools/
```

## Principles

Alpha Goal keeps agent work explicit, bounded, and accountable to evidence.

- Discovery before clarification: inspect local facts, docs, status, and existing contracts before asking questions, so user attention is reserved for choices only they can make.
- Evidence before authority: Current code facts describe current state; desired behavior comes from user intent, specs, issues, or accepted contracts.
- Goals before action: outcome, scope, non-goals, acceptance evidence, decision owner, and claim boundary define what may change.
- Explicit confirmation gates: every project must first make the Goal Contract clear; the contract or design can be short, but it must be explicit and user-confirmed before `$control-loop`.
- Technical Design when needed: when work may involve cross-file predictive operation, Technical Design covers architecture, components, data flow, interfaces, testing strategy, and risks.
- Minimal useful modeling: model dependencies, disturbances, and risks only when they affect safe control, validation, or routing.
- Persistent state: `goal-contract.md` is the default `alpha-goal` output and directly contains discovery notes, interview ledger, and the final contract; compact recovery reads draft or accepted contracts first, while accepted status only gates execution handoff; `checkpoint.md` conditionally carries run profile, loop state, iteration, evidence, verification, and memory with evidence, confidence, and invalidation; `control-state/latest.md` only points to the latest recoverable task when task identity is ambiguous.
- Bounded execution: prefer bounded evidence-producing actions or targeted changes over broad refactors and speculative cleanup; the accepted contract, required Run Profile, and repo policy constrain action authority.
- Independent verification: final/ready/safe/complete/repair/review claims require fresh evidence and defect/risk sweep, checked separately from execution.
- Honest routing: unclear goals return to `alpha-goal`, same-goal fixable execution gaps return to `control-loop`, and unsupported or under-reviewed final claims continue through `goal-verify`.
