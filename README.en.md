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
      <td align="left"><code>alpha-goal</code> discovers facts, clarifies the goal, boundaries, non-goals, and acceptance evidence, then writes a user-confirmed <code>goal-contract.md</code>.</td>
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
  I["deep-interview: optional deep clarification"] -.-> A["alpha-goal: form a Goal Frame"]
  T["technical-design: optional technical proposal"] -.-> A
  A --> R{"DIRECT / PERSIST"}
  R --> D["DIRECT: normal execution + final validation"]
  R --> P["PERSIST: expand and confirm goal-contract.md"]
  P --> S["Native Goal Sync: create or reuse the thread goal"]
  S --> E["executor: complete all batches, self-check, and record checkpoint.md"]
  E --> V["verifier: audit the proposed terminal state"]
  V -->|"NEXT_ITERATION (rework)"| E
  V -->|"BLOCKED"| B["Report blocker"]
  V -->|"PASS_TO_FINAL"| F["Final claim"]
```

```text
Trigger -> Frame Goal -> Choose DIRECT/PERSIST
PERSIST -> Confirm accepted Goal Contract -> Native Goal Sync -> $executor -> Proposed Terminal State -> $verifier -> Rework or Final Claim
Accepted goal materially changes -> terminate the old checkpoint -> start a new alpha-goal task directory
```

A Goal Frame contains intent, observable outcome, scope/non-goals, constraints, success signals, observers, and material decisions. Clear fields come from the request and attributable facts; clarification asks the relevant authority about one highest-impact blocking gap and closes it only when the authorized decision and its material boundaries and execution/evidence consequences are determined. A Goal Contract takes effect only after explicit acceptance; once accepted, it is immutable under the protocol. A material goal change terminates the old task and starts `alpha-goal` in a new task directory rather than editing or reopening the old contract or checkpoint.

`deep-interview` and `technical-design` provide optional attributable, non-authoritative inputs. A source path creates no execution obligation; only content written into the Goal Contract by `alpha-goal` and explicitly accepted can constrain execution. `DIRECT` keeps the complete Goal Frame in current context, creates no Alpha Goal state or native goal, and does not call `executor` or `verifier`. After a `PERSIST` contract is explicitly accepted, Alpha Goal reuses any unfinished native goal in the current thread; it creates one only when none is unfinished. Native state is lifecycle metadata and never replaces contract authority or acceptance evidence. The only canonical `PERSIST` lifecycle artifacts remain `goal-contract.md` and `checkpoint.md`.

The installer always installs the three goal-engineering skills: `deep-interview`, `alpha-goal`, and `technical-design`. The complete `PERSIST` execution and final-audit loop additionally requires the optional `executor` and `verifier` pair.

- `goal-contract.md`: maintained by `alpha-goal` while draft; after explicit acceptance it is immutable under the protocol and becomes standard structured input to executor and verifier.
- `checkpoint.md`: records the accepted contract identity and execution/terminal-audit state. Only `active_owner` may write; each write increments `checkpoint_revision` once and assigns the next owner last. The writer re-reads current state and stops on owner, revision, or content conflict.

Routing uses material impact, side effects, recovery needs, and verifiability. Confidence, file count, step count, question count, and estimated duration are not risk proxies.

## Quick start

```bash
bash ./scripts/install.sh
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
```

The installer always copies `deep-interview`, `alpha-goal`, and `technical-design`, and lets the user choose whether to install `executor` and `verifier` as a pair. Codex/all runs independently offer the global Custom Agents declared by the shared contract (default Yes); choosing No preserves existing copies. See [INSTALL.md](INSTALL.md) for full behavior and smoke testing.

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
      <td align="left">Perform explicitly requested or caller-bounded deep clarification and return attributable facts, decisions, and gaps without choosing a route or granting execution authority.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/alpha-goal/"><code>alpha-goal</code></a></td>
      <td align="left">Clarify intent, boundaries, and acceptance evidence, form a Goal Frame, and produce a Goal Contract when persistent closure is required.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/technical-design/"><code>technical-design</code></a></td>
      <td align="left">Produce an explicitly requested, reviewed, non-authoritative technical proposal covering interfaces, data, migration, tests, and risk without creating or accepting a Goal Contract.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/executor/"><code>executor</code></a></td>
      <td align="left">Execute authorized batches inside an accepted contract; <code>goal-contract.md</code> is authoritative and <code>checkpoint.md</code> records mutations, raw execution evidence, and handoff state.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/verifier/"><code>verifier</code></a></td>
      <td align="left">Audit fresh evidence for the proposed terminal state, update criterion status, and return <code>PASS_TO_FINAL</code>, <code>NEXT_ITERATION</code>, or <code>BLOCKED</code>.</td>
    </tr>
  </tbody>
</table>

## Principles

Alpha Goal keeps agent work explicit, bounded, and accountable to evidence.

- Discover facts before handling material decisions owned by the user or another authority; current code cannot define desired behavior by itself.
- Known infeasibility, an unavailable required observer, an unidentified claim surface, or an unmet prerequisite keeps the Goal Contract `draft`; `BLOCKED` only means an accepted premise was invalidated later by new facts.
- Direct work creates no persistent protocol; persistent work uses the minimum artifacts needed for authority, recovery, and audit.
- Executor owns all intermediate batches, risk boundaries, and proportionate checks; invoke verifier only for proposed completion or a terminal blocker decision.
- PASS binds to the target and delivery state actually observed and terminates that checkpoint; later work starts a new task.
- Volatile evidence records observation time and invalidation conditions; unidentified mutable surfaces cannot support an exact-binding claim.
- The Goal Contract is standard structured input to executor/verifier; `alpha-goal` reuses or creates the native goal before accepted `PERSIST` handoff.
- `tools/evals/runtime-boundaries.json` preserves 42 static expected-boundary cases; schema validation is not runtime evidence.
