# Alpha Goal

Languages: [Chinese](README.md) | English

Alpha Goal is a minimal persistent closed-loop skillset for goal engineering work. It guides agents to discover facts before asking, operate within accepted authority boundaries, resume execution from an accepted Goal Contract and the necessary checkpoint state, and make final claims only as far as evidence supports them.

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
      <td align="left"><code>executor</code> executes only bounded slices inside an accepted contract, with worktree/branch, scope, non-goals, and claim-boundary checks before mutation.</td>
    </tr>
    <tr>
      <td width="260" align="left"><strong>Evidence&#8209;free&nbsp;completion</strong></td>
      <td align="left">A passing test or partial success is treated as proof that the goal is complete.</td>
      <td align="left"><code>verifier</code> compares fresh evidence against acceptance evidence and returns a route decision.</td>
    </tr>
  </tbody>
</table>

In practice, it compresses requirement clarification, authority boundaries, iterative execution, evidence verification, and delivery claims into a minimal persistent loop that an agent can understand, execute, and recover.

## Core Architecture

```mermaid
flowchart TD
  A["alpha-goal: clarify and form a Goal Frame"] --> R{"DIRECT / PERSIST"}
  R --> D["DIRECT: normal execution + final validation"]
  R --> P["PERSIST: expand and confirm goal-contract.md"]
  P --> E["executor: execute at risk boundaries and record checkpoint.md"]
  E --> V["verifier: independently observe current state"]
  V -->|"NEXT_ITERATION"| E
  G["Acceptance authority explicitly changes the active goal"] -. "REFRAME_REQUESTED lifecycle" .-> A
  V -->|"BLOCKED"| B["Report blocker"]
  V -->|"PASS_TO_FINAL"| F["Final claim"]
```

```text
Trigger -> Frame Goal -> Choose DIRECT/PERSIST
PERSIST -> Confirm accepted Goal Contract -> $executor -> Evidence + checkpoint -> $verifier -> Route -> Next Slice or Final Claim
Explicit acceptance-authority goal change during an active epoch -> REFRAME_REQUESTED lifecycle handoff -> alpha-goal
```

A Goal Frame contains intent, observable outcome, scope/non-goals, constraints, success signals, observers, and material decisions. Clear fields come from the request and attributable facts; clarification asks the relevant authority about one highest-impact blocking gap and closes it only when the authorized decision and its material boundaries and execution/evidence consequences are determined. `REFRAME_REQUESTED` is only a lifecycle handoff after the acceptance authority explicitly changes the active goal; it is not a verifier verdict.

`DIRECT` keeps the complete Goal Frame in current context, creates no Alpha Goal state, and does not call `executor` or `verifier`. For `PERSIST`, the only canonical lifecycle artifacts are `goal-contract.md` and `checkpoint.md`; the checkpoint helper also creates atomic-write coordination records: active `.lock`, staged `.pending-*`, and retained `.lock.closed-*` close records.

- `goal-contract.md`: written only by `alpha-goal`; its accepted revision is standard structured input to executor, verifier, and an optional native Goal projection.
- `checkpoint.md`: retains immutable contract epochs, binds the current digest and state, and serializes executor/verifier handoff with atomic revision/owner control.

Routing uses material impact, side effects, recovery needs, and verifiability. Confidence, file count, step count, question count, and estimated duration are not risk proxies.

## Quick start

```bash
bash ./scripts/install.sh
node tools/validate_skills.js .
node tools/validate_skills.js --fixtures
```

The installer copies the three public skills into independent runtime-specific roots and synchronizes the selected user templates. See [INSTALL.md](INSTALL.md) for full behavior and smoke testing.

## Usage examples

```text
$alpha-goal Decide whether this task should discover facts, clarify, write a contract, confirm, or hand off to execution/verification.
$executor Execute or harden the next most useful verifiable bounded slice from an accepted Goal Contract.
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
      <td width="180" align="left"><a href="skills/alpha-goal/"><code>alpha-goal</code></a></td>
      <td align="left">Clarify intent, boundaries, and acceptance evidence, form a Goal Frame, and produce a Goal Contract when persistent closure is required.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/executor/"><code>executor</code></a></td>
      <td align="left">Execute authorized batches inside an accepted contract; <code>goal-contract.md</code> is authoritative and <code>checkpoint.md</code> records mutations, raw execution evidence, and handoff state.</td>
    </tr>
    <tr>
      <td width="180" align="left"><a href="skills/verifier/"><code>verifier</code></a></td>
      <td align="left">Verify fresh evidence independently, update criterion status, and return <code>PASS_TO_FINAL</code>, <code>NEXT_ITERATION</code>, or <code>BLOCKED</code>.</td>
    </tr>
  </tbody>
</table>

## Principles

Alpha Goal keeps agent work explicit, bounded, and accountable to evidence.

- Discover facts before handling material decisions owned by the user or another authority; current code cannot define desired behavior by itself.
- Known infeasibility, an unavailable required observer, an unidentified claim surface, or an unmet prerequisite keeps the Goal Contract `draft`; `BLOCKED` only means an accepted premise was invalidated later by new facts.
- Direct work creates no persistent protocol; persistent work uses the minimum artifacts needed for authority, recovery, and audit.
- Batch work inside one low-risk boundary; invoke verifier only at material risk boundaries and final state.
- PASS binds to the target and delivery state actually observed; a later mutation invalidates it.
- Volatile evidence records observation time and invalidation conditions; unidentified mutable surfaces cannot support an exact-binding claim.
- The Goal Contract is standard structured input; a native Goal is only a capability-conditional lifecycle projection bound to its path/revision/digest.
- `tools/evals/runtime-boundaries.json` preserves 28 static expected-boundary cases; schema validation is not runtime evidence.
