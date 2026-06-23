# Alpha Goal

Languages: [Chinese](README.md) | English

Alpha Goal is a minimal persistent closed-loop skillset for goal engineering work. It helps agents discover facts before asking, resume from an accepted Goal Contract and required checkpoints, work inside explicit boundaries, and make final claims only as far as evidence supports them.

## When to use it

- A request is ambiguous and needs fact discovery before clarification.
- Outcome, scope, non-goals, or acceptance evidence are unclear enough that acting now would be guesswork.
- A diagnose/repair task needs root-cause proof before changing behavior or claiming repair.
- Work crosses multiple files, repositories, or ownership surfaces and needs explicit authority, sequencing, and validation boundaries.

## How it works

```text
Trigger -> Resolve Task -> Read Goal -> Read Checkpoint -> Plan Slice -> Act/Probe -> Evidence -> $goal-verify -> Gap? -> Harden or Final Claim
```

## Quick start

```bash
scripts/install.sh
npx --no-install tsx tools/validate_skills.ts .
```

The installer creates direct symlinks for the three public skills under `$HOME/.codex/skills/` and cleans same-repo links for merged old public skills.
The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks. This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, autonomy gates, behavior-level gates, and evaluator feedback without over-compressing skill text.

Runtime records use the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path. `alpha-goal` writes only the accepted `goal-contract.md` by default, with discovery notes and interview ledger inside it; `checkpoint.md` is the single task-level conditional checkpoint created only for recovery, trigger handling, evidence handoff, or verification; `control-state/latest.md` is only a global recovery index, not stage content.

## Usage examples

```text
$alpha-goal Decide whether this task should clarify, execute, verify, or continue a loop.
$control-loop Execute or harden the next smallest safe slice from an accepted Goal Contract.
```

You usually do not need to name a skill. Describe the work normally; Alpha Goal is meant to activate when the request needs goal framing, bounded execution, or evidence-backed completion.

## Public skills

| Skill | What it helps with |
| --- | --- |
| `alpha-goal` | Clarify intent, boundaries, acceptance evidence, and the next safe route before work starts. |
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
- Minimal useful modeling: model dependencies, disturbances, and risks only when they affect safe control, validation, or routing.
- Persistent state: `goal-contract.md` is the default `alpha-goal` output and directly contains discovery notes, interview ledger, and the final contract; `checkpoint.md` conditionally carries run profile, loop state, iteration, evidence, verification, and memory with evidence, confidence, and invalidation; `control-state/latest.md` only points to the latest accepted task when task identity is ambiguous.
- Bounded execution: prefer small observable probes or targeted changes over broad refactors and speculative cleanup; the accepted contract and Autonomy Ladder constrain action authority.
- Independent verification: final/ready/safe/complete/repair/review claims require fresh evidence and defect/risk sweep, checked separately from execution.
- Honest routing: unclear goals return to `alpha-goal`, same-goal fixable execution gaps return to `control-loop`, and unsupported or under-reviewed final claims continue through `goal-verify`.
