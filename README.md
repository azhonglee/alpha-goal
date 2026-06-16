# Alpha Goal

English | [简体中文](README.zh-CN.md)

A workflow skill set built on closed-loop control, and an exploration of a next engineering paradigm.

Alpha Goal turns agentic software work from intuition-driven progress into an observable, controllable, and verifiable loop: define the target reference state, model the system and its feedback signals, act through bounded iterations, and use evidence to decide whether the work is actually done.

```text
INTENT
  -> alpha-goal(route)
  -> decision-synthesis?(objective conflicts)
  -> system-model?(observer / actuator / disturbance)
  -> goal-contract(reference)
  -> control-loop(bounded action + feedback)
  -> evidence-verify(error check)
  -> FINAL or NEXT LOOP
```

## Why It Exists

Agentic software work can drift quickly when the task gets complex:

- The agent starts coding before the target is clear.
- It changes files before the system boundary, risks, and observable signals are understood.
- It claims completion without enough tests, logs, diffs, or human feedback.
- It loses state across long-running, multi-turn work.
- It compresses complex decisions into one-off advice without recording conflicts, indicators, or user-owned decisions.

Alpha Goal's core rule is simple: no reference state, no control; no observation signal, no feedback; no evidence boundary, no completion claim.

## When To Use It

Use Alpha Goal for:

- engineering tasks with ambiguous requirements or drifting goals;
- debugging work that needs root cause confirmation;
- higher-risk changes across modules or workflows;
- long-running agent work that needs recoverable state;
- merge-readiness, ship-readiness, or completion judgments;
- multi-stakeholder, weakly structured, high-uncertainty technical decisions.

You probably do not need Alpha Goal for:

- questions that can be answered with one command;
- obvious, low-risk edits with immediate verification;
- quick, temporary, intentionally non-process exploration.

## How It Works

Alpha Goal treats every request as a control system:

1. `alpha-goal` identifies the dominant uncertainty and routes to the next skill.
2. `decision-synthesis` handles complex systems, multi-party conflicts, and weakly quantified goals before handing off to the rest of the loop.
3. `system-model` models the plant, state variables, observation signals, control variables, disturbances, and coupling when those boundaries affect safe action.
4. `goal-contract` turns an ambiguous request into goals, scope, non-goals, acceptance evidence, and final claim boundaries.
5. `control-loop` runs one or more bounded iterations under an approved goal, collects feedback, and records residual error.
6. `evidence-verify` independently compares the goal, evidence, and final claim to decide whether the work can be delivered or needs another loop.

For simple work, `alpha-goal` chooses the smallest viable path. When target, system, or evidence boundaries are unclear, it closes those boundaries before acting.

## Skills

| Skill | Responsibility | Trigger |
| --- | --- | --- |
| `alpha-goal` | Closed-loop entry point, skill routing, stability checks, and cross-stage state memory | The next step may be framing, modeling, execution, verification, or synthesis |
| `goal-contract` | Produces an executable, verifiable, handoff-ready 目标契约 and 指标交接 | Goal, scope, acceptance, non-goals, or authorization boundaries are unclear |
| `system-model` | Models plant, state, observer, actuator, 控制器层级, 扰动登记, and coupling | System boundary, observability, controllability, disturbances, or coupling affect safe action |
| `control-loop` | Runs bounded iterations under an approved 目标契约, collects feedback, and records 自适应学习记录 | The goal is clear and the next step is execution, diagnosis, repair, or hardening |
| `evidence-verify` | Judges whether evidence supports completion, merge-readiness, ship-readiness, or a narrowed claim | Work appears done and needs independent evidence and claim-boundary review |
| `decision-synthesis` | Uses 综合轮次 to combine qualitative judgment, machine evidence, metrics, conflicts, and user decisions | The problem has multiple teams, multiple goals, high uncertainty, or complex-system dynamics |

## Core Concepts

| Control concept | Meaning in Alpha Goal |
| --- | --- |
| Reference input / reference | The goal, acceptance criteria, and final claim boundary produced by `goal-contract` |
| Controlled object / plant | A codebase, product, document, data flow, runtime environment, or organizational workflow |
| State variables / state | Requirement clarity, implementation state, test state, risk, evidence coverage, and blockers |
| Observer | Repository snapshots, diffs, tests, logs, runtime probes, screenshots, human feedback, and review comments |
| Actuator | Bounded changes, diagnostics, repairs, hardening, or read-only probes run by `control-loop` |
| Control law | Target error, control variable, expected effect, sensor threshold, feedback latency/noise, confidence, damping/containment, and fallback action |
| Comparator | `evidence-verify`, which checks error between the goal, evidence, and final claim |
| Memory | The 闭环台账 under `.alpha-goal/YYYYMMDD-<slug>/control-state.md`, recording reference, state, error, action, feedback, and next route |
| Indicator handoff | Mapping qualitative goals to metrics/proxies, sensors, thresholds, and evidence boundaries |
| Adaptive learning | Bounded reusable corrections when feedback invalidates a threshold, strategy, route, or assumption |
| Disturbance handling | 扰动登记 entries with likelihood, impact, sensor, containment, and route trigger |
| Hierarchical control | 控制器层级 for global/local controllers, coupling variables, arbitration, and escalation |
| Complex-system synthesis | `decision-synthesis` 综合轮次 for conflicts, evidence, indicators, and user decisions |
| Artifact layout | Task-scoped runtime artifacts under `.alpha-goal/YYYYMMDD-<slug>/xxx` |
| Cybernetic conformance | State-transition, schema sidecar, and legacy-path checks that verify the loop was followed |

## Quick Start

The default install creates an `alpha-goal` symlink under `$HOME/.codex/skills/` that points to this repository's `skills/` tree:

```bash
scripts/install.sh
```

The installer runs the TypeScript validator through `npx --yes tsx`, so Node.js/npm must be available.

By default, installation also syncs user-level templates:

- It merges `templates/AGENTS.md` into the Codex home `AGENTS.md`.
- It fills missing settings from `templates/config.toml` into the Codex home `config.toml`.
- It only fills settings related to multi-agent, child AGENTS, and structured `request_user_input`.
- It does not change sandbox permissions, sleep behavior, or unstable-feature warning settings.

For custom `CODEX_HOME`, replacing existing symlinks, skipping user-level template sync, verbose troubleshooting, and temporary `CODEX_HOME` smoke tests, see [INSTALL.md](INSTALL.md).

## Usage

After installation, ask the entry skill to choose the next step:

```text
$alpha-goal your_task_description
```

## State Memory

For cross-stage recovery, Alpha Goal uses `.alpha-goal/YYYYMMDD-<slug>/control-state.md` as the default 闭环台账.
Related artifacts for the same task stay under that task directory, such as `goal-contract.md`, `system-model.md`, `iterations/`, `evidence/`, and `verification-verdict.md`.

## Validation

After changing skills, scripts, templates, or documentation, run at least:

```bash
npx --yes tsx tools/validate_skillset.ts .
```

For installation behavior, use a temporary `CODEX_HOME` smoke test as described in [INSTALL.md](INSTALL.md), so real user configuration is not polluted.

## Repository Structure

```text
skills/
  alpha-goal/          # closed-loop entry point and routing
  goal-contract/       # goal clarification and 目标契约
  system-model/        # system state, observability, and controllability modeling
  control-loop/        # bounded iteration execution and feedback
  evidence-verify/     # evidence boundaries and completion judgment
  decision-synthesis/  # complex-system synthesis
templates/             # user-level Codex configuration templates
scripts/               # install script
tools/                 # local validators
```

## Design Principles

- Goals before action: define the reference before choosing the actuator.
- Observation before claims: no sensor and evidence boundary, no completion claim.
- Bounded action first: each loop changes the smallest coherent slice that can reduce the current error.
- Evidence over assertion: final judgment belongs to `evidence-verify`.
- Recoverable state: long-running work depends on the 闭环台账, not just chat history.
- Complex problems need synthesis: use `decision-synthesis` for multi-goal, multi-party, weakly quantified work.
