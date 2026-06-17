# Alpha Goal

A minimal closed-loop Codex skillset for engineering work.

## Public skills

| Skill | Role |
| --- | --- |
| `alpha-goal` | Default entry: clarify real intent, outcome, constraints, boundaries, authority, design the handoff, and route approved launches. |
| `control-loop` | Bounded execution/probe with mutation safety, feedback, and residual-error routing. |
| `evidence-verify` | Independent comparator for final/ready/safe/complete/repair claims and evidence boundaries. |

## Flow

```text
INTENT -> alpha-goal(clarify/discover/stress/design/confirm) -> control-loop(action+feedback) -> evidence-verify(claim check) -> FINAL or NEXT LOOP
```

## Install

```bash
scripts/install.sh
```

The installer creates direct symlinks for the three public skills under `$HOME/.codex/skills/` and cleans same-repo links for merged old public skills.

## Validate

```bash
npx --yes tsx tools/validate_skills.ts .
```

The enforced control-byte budget is the whole `skills/` tree, capped at 30,000 bytes.

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

- Fact discovery before clarification questions.
- Current code facts describe current state; they do not define desired behavior without authority.
- Clear intent, outcome, boundaries, and authority before action.
- Design handoff before execution.
- User-owned decisions gate execution; ask one high-leverage question per round.
- Bounded action beats broad refactor.
- Evidence bounds final claims.
- Execution and verification stay separate.
