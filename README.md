# Alpha Goal

A minimal closed-loop Codex skillset for engineering work.

## Public skills

| Skill | Role |
| --- | --- |
| `alpha-goal` | Default entry: discover facts for ambiguous requests, frame goal, model system, synthesize complex decisions, route next controller, maintain ledger. |
| `control-loop` | Bounded execution/probe with mutation safety, feedback, and residual-error routing. |
| `evidence-verify` | Independent comparator for final/ready/safe/complete/repair claims and evidence boundaries. |

Internal framing/modeling/synthesis rules live under `skills/alpha-goal/references/`; they are not installed as public skills.

## Flow

```text
INTENT -> alpha-goal(discover/frame/model/synthesize/route) -> control-loop(action+feedback) -> evidence-verify(claim check) -> FINAL or NEXT LOOP
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
- Goals before action.
- Model only what changes safe control.
- User-owned decisions gate execution; ask one high-leverage question per round.
- Bounded action beats broad refactor.
- Evidence bounds final claims.
- Execution and verification stay separate.
