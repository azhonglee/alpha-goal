# Alpha Goal

Languages: [Chinese](README.md) | English

Alpha Goal is a modular minimal persistent closed-loop skillset for goal engineering work. It guides agents to discover facts before asking, operate within accepted authority boundaries, resume execution from an accepted Goal Contract and the necessary checkpoint state, and make final claims only as far as evidence supports them.

## What Problem It Solves

Alpha Goal gives AI agents a Goal Engineering control loop for three common failure modes:

<table>
  <thead>
    <tr>
      <th width="260" align="left">Problem</th>
      <th align="left">What it looks like</th>
      <th align="left">Control point</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="260" align="left"><strong>Goal&nbsp;drift</strong></td>
      <td align="left">The agent starts before requirements are clear, gradually moves off target, and changes unrelated things along the way.</td>
      <td align="left"><code>alpha-goal</code> compiles <code>goal-contract.md</code> from the raw request, attributable inputs, and discovered facts, and sets it to `accepted` only when execution information, authority, and verification conditions are complete.</td>
    </tr>
    <tr>
      <td width="260" align="left"><strong>Action&nbsp;overreach</strong></td>
      <td align="left">There is no explicit authority boundary, so work can exceed scope, touch the wrong branch, or treat current implementation as desired behavior.</td>
      <td align="left"><code>executor</code> completes all authorized batches inside an accepted contract, with worktree/branch, scope, non-goals, and claim-boundary checks before mutation.</td>
    </tr>
    <tr>
      <td width="260" align="left"><strong>Evidence&#8209;free&nbsp;completion</strong></td>
      <td align="left">A passing test or partial success is treated as proof that the goal is complete.</td>
      <td align="left"><code>verifier</code> audits only the terminal state proposed by executor and returns a final route decision against acceptance evidence.</td>
    </tr>
  </tbody>
</table>

In practice, it compresses requirement clarification, authority boundaries, iterative execution, evidence verification, and delivery claims into a minimal persistent loop that an agent can understand, execute, and recover.

## Core Architecture

```mermaid
flowchart TD
  I["deep-interview: independent clarification / interview.md"] -.-> C["caller chooses the next stage"]
  T["technical-design: technical_design.md"] -.-> C
  C --> GI["Gate Inputs"]
  GI --> G{"Skip Gate"}
  G -->|"SKIP"| D["caller continues concrete read-only or reversible local work"]
  G -->|"not skipped"| R["resolve task directory and create/recover draft"]
  R --> A["alpha-goal: Inspect Inputs → Clarify"]
  A --> P["compile and accept Goal Contract"]
  P --> E["executor"]
  E --> V["verifier"]
  V -->|"verdict packet"| E
  E -->|"NEXT_ITERATION"| E
  E -->|"BLOCKED / PASS_TO_FINAL"| F["caller reports"]
```

`deep-interview` is explicit-only through `allow_implicit_invocation: false` and is a source-neutral clarification stage. It may maintain canonical `interview.md` with append-only turns, provenance, and unresolved gaps, but it does not choose an execution route. `technical-design` uses the same skill policy and is an independent pre-goal design stage. It writes canonical `technical_design.md`, returns `DESIGN_READY` after review, or returns `DESIGN_INPUT_GAP` / `DESIGN_BLOCKED`; recovery requires the exact path preserved in current context.

`alpha-goal` first reads the already-provided Gate Inputs: raw request, higher-priority/repository constraints, handoff metadata and intended consumption, and exact task path with lifecycle state. It returns `SKIP` only for concrete read-only work or a directly observable reversible local change when those inputs show no material decision, side effect, handoff consumption, recovery, or audit requirement; these requests create no state. When not skipped, an existing lifecycle stays with its current owner for any required transition; otherwise `alpha-goal` immediately resolves the task directory and creates or recovers the canonical `draft` before full input inspection and grill-me clarification. Each material answer is written to the contract before another question or pause. A `DESIGN_READY` handoff remains a non-authoritative proposal: intended consumption prevents `SKIP`, and it affects work only after full validation and explicit adoption. `alpha-goal` sets the contract to `accepted` only when execution information, authority, observers, and risk treatment are complete.

`executor` and `verifier` accept only a canonical Goal Contract with `status: accepted`. They may read a design as explanatory context only after path, ready status, and workspace match, and must not expand scope, acceptance criteria, or checklists from it. `checkpoint.md` records execution phase and evidence; verifier audits the current state and returns a verdict.

## Quick start

```bash
bash ./scripts/install.sh
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
```

The installer always copies `deep-interview`, `alpha-goal`, and `technical-design`, and lets the user choose whether to sync `executor` and `verifier` as a pair. Codex/all runs independently offer the global Custom Agents declared by the shared contract; turning sync off preserves existing copies. Automation can use `scripts/install.sh --non-interactive` for the fixed complete default Codex preset. See [INSTALL.md](INSTALL.md) for full behavior and smoke testing.

## Usage examples

```text
$alpha-goal Implement this requirement: <YOUR-PRD> or <YOUR-DESCRIPTION>, <YOUR-UX> or <YOUR-DESIGN>.
```

You usually do not need to name a skill. Describe the work normally; Alpha Goal activates implicitly.

## Public skills

<table>
  <thead>
    <tr>
      <th width="150" align="left">Skill</th>
      <th align="left">What it helps with</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="180" align="left"><a href="skills/deep-interview/"><code>deep-interview</code></a></td>
      <td align="left">Clarify the request and maintain append-only <code>interview.md</code> when durable provenance is needed, without choosing a route or granting execution authority.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/alpha-goal/"><code>alpha-goal</code></a></td>
      <td align="left">Check Gate Inputs and run the Skip Gate; when not skipped, create or recover a draft before inspection, clarification, and Goal Contract acceptance.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/technical-design/"><code>technical-design</code></a></td>
      <td align="left">Maintain canonical <code>technical_design.md</code>, run technical review, and return DESIGN_READY / DESIGN_INPUT_GAP / DESIGN_BLOCKED without creating a Goal Contract.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/executor/"><code>executor</code></a></td>
      <td align="left">Execute authorized batches inside an accepted contract; <code>goal-contract.md</code> is authoritative and <code>checkpoint.md</code> records mutations, raw execution evidence, and handoff state.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/verifier/"><code>verifier</code></a></td>
      <td align="left">Audit fresh evidence for the proposed terminal state and return criterion results plus a <code>PASS_TO_FINAL</code>, <code>NEXT_ITERATION</code>, or <code>BLOCKED</code> verdict.</td>
    </tr>
  </tbody>
</table>

## Principles

Alpha Goal keeps agent work explicit, bounded, and accountable to evidence.

- Discover facts before handling material decisions owned by the user or another authority; current code cannot define desired behavior by itself.
- Known infeasibility, an unavailable required observer, an unidentified claim surface, or an unmet prerequisite keeps the Goal Contract `draft`; `BLOCKED` only means an accepted premise was invalidated later by new facts.
- `SKIP` work creates no Goal Contract; continued work uses the minimum artifacts needed for authority, recovery, and audit.
- Executor owns all intermediate batches, risk boundaries, and proportionate checks; invoke verifier only for proposed completion or a terminal blocker decision.
- PASS binds to the target and delivery state actually observed and terminates that checkpoint; later work starts a new task.
- Volatile evidence records observation time and invalidation conditions; unidentified mutable surfaces cannot support an exact-binding claim.
- The Goal Contract is standard structured input to executor/verifier; when the Skip Gate does not return `SKIP` and the contract is accepted, it is handed to executor.
- `tools/evals/runtime-boundaries.json` preserves 42 static expected-boundary cases; schema validation is not runtime evidence.
