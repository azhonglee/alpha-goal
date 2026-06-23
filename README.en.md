# Alpha Goal

Languages: [Chinese](README.md) | English

Alpha Goal is a minimal persistent closed-loop skillset for goal engineering work. It helps agents discover facts before asking, resume from durable state and compressed memory, work inside explicit boundaries, and make final claims only as far as evidence supports them.

## When to use it

- A request is ambiguous and needs fact discovery before clarification.
- Outcome, scope, non-goals, or acceptance evidence are unclear enough that acting now would be guesswork.
- A diagnose/repair task needs root-cause proof before changing behavior or claiming repair.
- Work crosses multiple files, repositories, or ownership surfaces and needs explicit authority, sequencing, and validation boundaries.

## How it works

```text
Trigger -> Read Goal -> Read Loop State -> Read Memory -> Plan Slice -> Act/Probe -> Evidence -> $goal-verify -> Gap? -> Harden or Final Claim
```

## Quick start

```bash
scripts/install.sh
npx --no-install tsx tools/validate_skills.ts .
```

The installer creates direct symlinks for the four public skills under `$HOME/.codex/skills/` and cleans same-repo links for merged old public skills.
The validator enforces the whole `skills/` tree under 15,000 word+punctuation units, counted as words plus punctuation/symbol marks. This budget preserves the Persistent Goal Loop contracts for trigger behavior, durable state, memory, autonomy gates, behavior-level gates, and evaluator feedback without over-compressing skill text.

Runtime records use the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path. The recovery entry is `<state-root>/control-state/latest.md`; recovery needs the pointer-bound `goal-contract.md`, `run-profile.md`, `loop-state.md`, and `memory.md`; missing or conflicting files route to `alpha-goal` or blocker.

## Usage examples

```text
$alpha-goal Decide whether this task should clarify, execute, verify, or continue a loop.
$codex-native-goal Run or resume an explicit or active Codex Native Goal through a native-goal-driven execution loop.
```

You usually do not need to name a skill. Describe the work normally; Alpha Goal is meant to activate when the request needs goal framing, bounded execution, or evidence-backed completion.

## Public skills

| Skill | What it helps with |
| --- | --- |
| `alpha-goal` | Clarify intent, boundaries, acceptance evidence, and the next safe route before work starts. |
| `codex-native-goal` | Execute an explicit or active Codex Native Goal through a native-goal-driven loop, returning to `alpha-goal` when framing is unclear and to `goal-verify` before final claims. |
| `control-loop` | Execute or harden an authorized slice; `goal-contract.md`, `run-profile.md`, `loop-state.md`, and `memory.md` are recovery and constraint inputs. |
| `goal-verify` | Verify goal completion, claim boundary, evidence coverage, and material unclaimed defects/risks, then return the next Gap. |

## Docs

- [INSTALL.md](INSTALL.md): installation options and smoke test.
- [MANIFEST.md](MANIFEST.md): public skills, scripts, and runtime artifacts.
- [skills/alpha-goal/SKILL.md](skills/alpha-goal/SKILL.md): default entry and routing rules.
- [skills/codex-native-goal/SKILL.md](skills/codex-native-goal/SKILL.md): Codex Native Goal execution loop rules.
- [skills/control-loop/SKILL.md](skills/control-loop/SKILL.md): bounded action loop contract.
- [skills/goal-verify/SKILL.md](skills/goal-verify/SKILL.md): goal verification and defect/risk review contract.

## Structure

```text
skills/alpha-goal/
skills/codex-native-goal/
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
- Persistent state: `loop-state.md` records current state and the latest verification gap, `iteration.md` records this run's facts, and `memory.md` keeps compressed confirmed facts, constraints, and strategy outcomes with evidence, confidence, and invalidation.
- Bounded execution: prefer small observable probes or targeted changes over broad refactors and speculative cleanup; run mode and the Autonomy Ladder constrain trigger behavior and action authority.
- Independent verification: final/ready/safe/complete/repair/review claims require fresh evidence and defect/risk sweep, checked separately from execution.
- Honest routing: unclear goals return to `alpha-goal`, fixable gaps for an active Native Goal return to `codex-native-goal`, other authorized execution gaps return to `control-loop`, and unsupported or under-reviewed final claims continue through `goal-verify`.
