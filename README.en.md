# Alpha Goal

Languages: [Chinese](README.md) | English

Alpha Goal is a minimal closed-loop skillset for goal engineering work. It helps agents discover facts before asking, work inside explicit boundaries, and make final claims only as far as evidence supports them.

## When to use it

- A request is ambiguous and needs fact discovery before clarification.
- Outcome, scope, non-goals, or acceptance evidence are unclear enough that acting now would be guesswork.
- A diagnose/repair task needs root-cause proof before changing behavior or claiming repair.
- Work crosses multiple files, repositories, or ownership surfaces and needs explicit authority, sequencing, and validation boundaries.

## How it works

```text
Describe the need -> discover facts -> clarify the boundary -> act in a bounded loop -> verify the claim -> final answer or next loop
```

## Quick start

```bash
scripts/install.sh
npx --no-install tsx tools/validate_skills.ts .
```

The installer creates direct symlinks for the three public skills under `$HOME/.codex/skills/` and cleans same-repo links for merged old public skills.
The validator enforces the whole `skills/` tree under 30,000 bytes.

Runtime records use the user-level Alpha Goal state root: `${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/`, where `<workspace-slug>` is the last directory name of the current session directory path.

## Usage examples

```text
$alpha-goal Decide whether this task should clarify, execute, verify, or continue a loop.
```

You usually do not need to name a skill. Describe the work normally; Alpha Goal is meant to activate when the request needs goal framing, bounded execution, or evidence-backed completion.

## Public skills

| Skill | What it helps with |
| --- | --- |
| `alpha-goal` | Clarify intent, boundaries, acceptance evidence, and the next safe route before work starts. |
| `control-loop` | Carry out one authorized, observable step and compare the result to the goal. |
| `evidence-verify` | Check whether fresh evidence supports final/ready/safe/complete/repair claims. |

## Docs

- [INSTALL.md](INSTALL.md): installation options and smoke test.
- [MANIFEST.md](MANIFEST.md): public skills, scripts, and runtime artifacts.
- [skills/alpha-goal/SKILL.md](skills/alpha-goal/SKILL.md): default entry and routing rules.
- [skills/control-loop/SKILL.md](skills/control-loop/SKILL.md): bounded action loop contract.
- [skills/evidence-verify/SKILL.md](skills/evidence-verify/SKILL.md): evidence comparison contract.

## Structure

```text
skills/alpha-goal/
skills/control-loop/
skills/evidence-verify/
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
- Bounded execution: prefer small observable probes or targeted changes over broad refactors and speculative cleanup.
- Independent verification: final/ready/safe/complete/repair claims require fresh evidence, checked separately from execution.
- Honest routing: unclear goals return to `alpha-goal`, fixable implementation or evidence gaps return to `control-loop`, and unsupported final claims continue through `evidence-verify`.
