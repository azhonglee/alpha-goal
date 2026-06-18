# Alpha Goal

Languages: English | [Chinese](README.zh-CN.md)

Alpha Goal is a minimal closed-loop skillset for goal engineering work.
It keeps agent work grounded in explicit goals, bounded action, and evidence-backed
final claims.

## When to use it

- A request is ambiguous and needs fact discovery before clarification.
- An implementation task needs one bounded, observable action loop.
- A final, ready, safe, complete, or repair claim needs independent evidence.

## Public skills

| Skill | Role |
| --- | --- |
| `alpha-goal` | Default entry: discover facts for ambiguous requests, clarify goal boundaries, design the handoff, route next controller, maintain ledger. |
| `control-loop` | Bounded execution/probe with implementation safety, feedback, and residual-error routing. |
| `evidence-verify` | Independent comparator for final/ready/safe/complete/repair claims and evidence boundaries. |

Former public framing/modeling/synthesis stages are folded into `skills/alpha-goal/SKILL.md`; they are not installed as public skills.

## Flow

```text
INTENT -> alpha-goal(discover/clarify/design/route) -> control-loop(action+feedback) -> evidence-verify(claim check) -> FINAL or NEXT LOOP
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
$control-loop Run one bounded safe execution step from the agreed boundary.
$evidence-verify Check whether current evidence supports the final claim.
```

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
- One decision at a time: when human judgment is required, ask one high-leverage question and let the answer shape the boundary.
- Bounded execution: prefer small observable probes or targeted changes over broad refactors and speculative cleanup.
- Independent verification: final/ready/safe/complete/repair claims require fresh evidence, checked separately from execution.
- Honest routing: unclear goals return to `alpha-goal`, fixable implementation or evidence gaps return to `control-loop`, and unsupported final claims continue through `evidence-verify`.
