import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

type GitStdio = "pipe" | "ignore";

const runModes = new Set(["manual", "scheduled", "webhook", "verification-triggered"]);
const requestedActions = new Set(["suggest", "draft", "modify-worktree", "commit", "push", "open-pr", "merge"]);
const loopPhases = new Set(["DISCOVERY", "IMPLEMENTATION", "HARDENING", "VERIFICATION", "FINAL_RESPONSE_READY", "COMPLETE", "BLOCKED"]);

function section(name: string, value: string): void {
  console.log(`\n== ${name} ==\n${value}`);
}

function git(cwd: string, args: string[], stdio: GitStdio = "pipe") {
  return spawnSync("git", args, { cwd, encoding: "utf8", stdio });
}

function gitOutput(cwd: string, args: string[]): string {
  const result = git(cwd, args);
  return result.stdout?.trim() || result.stderr?.trim() || "<empty>";
}

function gitOk(cwd: string, args: string[]): boolean {
  return git(cwd, args, "ignore").status === 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function field(text: string, name: string): string {
  const lines = text.split(/\r?\n/);
  const pattern = new RegExp(`^${escapeRegExp(name)}:[ \t]*(.*)$`, "i");
  const index = lines.findIndex(line => pattern.test(line));
  if (index < 0) return "";
  const sameLine = lines[index].match(pattern)?.[1]?.trim() || "";
  if (sameLine) return sameLine;

  for (const line of lines.slice(index + 1)) {
    if (/^[A-Za-z][A-Za-z ]+:/.test(line)) break;
    const value = line.replace(/^[ \t]*[-*][ \t]*/, "").trim();
    if (value) return value;
  }
  return "";
}

function readTaskFile(taskDir: string, name: string): string {
  const path = `${taskDir}${name}`;
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function isUnset(value: string): boolean {
  return !value || /^(unknown|implicit|-|n\/a)$/i.test(value);
}

function isNone(value: string): boolean {
  return /^(none|none yet)$/i.test(value);
}

function requireFields(label: string, text: string, fields: string[], allowNone = false): boolean {
  const missing = fields.filter(name => {
    const value = field(text, name);
    return isUnset(value) || (!allowNone && isNone(value));
  });
  section(label, missing.length ? `missing/empty: ${missing.join(", ")}` : "pass");
  return missing.length === 0;
}

function main(): number {
  const rawArgs = process.argv.slice(2);
  const taskIndex = rawArgs.indexOf("--task");
  const task = taskIndex >= 0 && rawArgs[taskIndex + 1] ? rawArgs[taskIndex + 1] : "";
  const repoArgs = taskIndex >= 0 ? rawArgs.filter((_, index) => index !== taskIndex && index !== taskIndex + 1) : rawArgs;
  const session = process.cwd();
  const stateRoot = `${(process.env.CODEX_HOME || `${process.env.HOME || "~"}/.alphal-goal`).replace(/\/+$/, "")}/${basename(session) || "workspace"}/`;
  const taskDir = task ? `${stateRoot}${task}/` : "";
  const targets = (repoArgs.length ? repoArgs : [session]).map(repo => resolve(session, repo));
  let blocked = false;

  section("cwd", session);
  section("alpha goal state root", stateRoot);
  section("multi-repo preflight", targets.length > 1 ? `${targets.length} repos` : "single repo");

  if (!task) {
    section("task", "missing; BLOCKED without --task");
    blocked = true;
  } else {
    section("task", task);
    blocked = !checkTaskState(taskDir) || blocked;
  }

  for (const [index, target] of targets.entries()) {
    console.log(`\n## repo ${index + 1}: ${target}`);
    blocked = !checkRepo(target) || blocked;
  }

  section("gate", blocked ? "BLOCKED" : "PASS");
  return blocked ? 1 : 0;
}

function checkTaskState(taskDir: string): boolean {
  let ok = true;
  const goalPath = `${taskDir}goal-contract.md`;
  const checkpointPath = `${taskDir}checkpoint.md`;

  section("goal-contract path", goalPath);
  section("goal-contract.md", existsSync(goalPath) ? "present" : "missing");
  ok = existsSync(goalPath) && ok;

  section("checkpoint path", checkpointPath);
  section("checkpoint.md", existsSync(checkpointPath) ? "present" : "absent (optional)");

  const goalText = readTaskFile(taskDir, "goal-contract.md");
  const checkpoint = readTaskFile(taskDir, "checkpoint.md");
  const hasCheckpoint = !!checkpoint.trim();
  const hasRunProfile = hasCheckpoint && /## Run Profile/i.test(checkpoint);
  const hasLoopState = hasCheckpoint && /## Loop State/i.test(checkpoint);
  const hasMemory = hasCheckpoint && /## Memory/i.test(checkpoint);
  const hasLatest = hasCheckpoint && /## Latest/i.test(checkpoint);
  const hasVerification = hasCheckpoint && /## Verification/i.test(checkpoint);

  if (hasCheckpoint) ok = requireFields("checkpoint", checkpoint, ["Goal Contract", "Updated at"], false) && ok;
  else section("checkpoint", "absent; plain manual L1-L3 work may execute from Goal Contract");

  if (hasRunProfile) ok = requireFields("checkpoint run profile", checkpoint, ["Run mode", "Trigger event", "Requested action", "Discovery source", "External side effects allowed", "Human checkpoint", "Evaluator route", "Autonomy level"], true) && ok;
  else section("checkpoint run profile", "absent unless trigger/action/side-effect requires it");

  if (hasLoopState) {
    ok = requireFields("checkpoint loop state", checkpoint, ["Current Objective", "Current Phase"], false) && ok;
    ok = requireFields("checkpoint loop state ledger", checkpoint, ["Completed", "Pending", "Known Risks", "Last Verification Gap"], true) && ok;
  } else {
    section("checkpoint loop state", "absent; no multi-iteration recovery checkpoint");
  }

  if (hasMemory) ok = requireFields("checkpoint memory", checkpoint, ["Confirmed Facts", "Confirmed Root Causes", "Known Constraints", "Working Strategies", "Failed Strategies"], true) && ok;
  else section("checkpoint memory", "absent; no reusable learning checkpoint");

  if (hasLatest) ok = requireFields("checkpoint latest", checkpoint, ["State directory", "Current Phase", "Next route"], true) && ok;

  const mode = hasRunProfile ? field(checkpoint, "Run mode") : inferRunMode(goalText);
  const action = hasRunProfile ? field(checkpoint, "Requested action") : "";
  const autonomy = hasRunProfile ? field(checkpoint, "Autonomy level") : field(goalText, "Autonomy Level");
  const phase = field(checkpoint, "Current Phase");
  const goalContract = field(checkpoint, "Goal Contract");
  const nextSlice = field(checkpoint, "Next Slice");
  const stopCondition = field(checkpoint, "Stop Condition");
  const checkpointRequired = ["scheduled", "webhook", "verification-triggered"].includes(mode) || actionRequiresProfile(action);

  ok = check("run mode", runModes.has(mode), `invalid: ${mode || "<empty>"}`) && ok;
  if (hasRunProfile) ok = check("requested action", requestedActions.has(action), `invalid: ${action || "<empty>"}`) && ok;
  ok = check("autonomy level", /^L[1-5]\b/.test(autonomy), `invalid: ${autonomy || "<empty>"}`) && ok;
  if (hasRunProfile) ok = check("autonomy action ceiling", actionAllowedByLevel(action, autonomy), `${action || "<empty>"} exceeds ${autonomy || "<empty>"}`) && ok;
  ok = check("checkpoint required", !checkpointRequired || hasCheckpoint && hasRunProfile, `${mode || "<empty>"} / ${action || "<empty>"} requires checkpoint.md Run Profile`) && ok;
  if (hasLoopState) ok = check("loop phase", loopPhases.has(phase), `invalid: ${phase || "<empty>"}`) && ok;
  if (hasCheckpoint) ok = check("goal contract binding", samePath(goalContract, goalPath), "checkpoint Goal Contract does not match current task") && ok;
  ok = check("trigger contract binding", triggerContractAllowsMode(goalText, mode), `Goal Contract does not authorize ${mode || "<empty>"} trigger`) && ok;
  if (hasLatest) ok = check("latest binding", latestMatchesTask(checkpoint, taskDir, phase), "checkpoint Latest does not match current task") && ok;
  if (mode === "verification-triggered") {
    ok = check("verification-triggered binding", hasVerification && verificationMatchesTask(checkpoint, goalPath), "checkpoint Verification missing or stale") && ok;
  }
  if (hasLoopState) ok = check("loop actionability", !isUnset(nextSlice) && !isNone(nextSlice) || !isUnset(stopCondition) && !isNone(stopCondition), "missing actionable Next Slice or Stop Condition") && ok;
  if (hasRunProfile) ok = check("evaluator route", field(checkpoint, "Evaluator route").includes("$goal-verify"), "missing $goal-verify") && ok;
  if (hasMemory) ok = check("memory evidence", memoryAllowsEmpty(checkpoint) || /Evidence:/i.test(checkpoint) && /Confidence:/i.test(checkpoint) && /Invalidation:/i.test(checkpoint), "non-empty memory needs Evidence, Confidence, and Invalidation") && ok;

  section("trigger event", "checked");
  return ok;
}

function inferRunMode(goalText: string): string {
  if (/verification-triggered/i.test(goalText)) return "verification-triggered";
  if (/webhook/i.test(goalText)) return "webhook";
  if (/scheduled|schedule/i.test(goalText)) return "scheduled";
  return "manual";
}

function actionRequiresProfile(action: string): boolean {
  return ["commit", "push", "open-pr", "merge"].includes(action);
}

function actionAllowedByLevel(action: string, level: string): boolean {
  const ranks: Record<string, number> = { suggest: 1, draft: 2, "modify-worktree": 3, commit: 4, push: 4, "open-pr": 4, merge: 5 };
  const match = level.match(/^L([1-5])\b/);
  return !!match && (ranks[action] ?? 99) <= Number(match[1]);
}

function normalizePath(value: string): string {
  return value.replace(/^`|`$/g, "").replace(/\/+$/, "");
}

function samePath(actual: string, expected: string): boolean {
  return normalizePath(actual) === normalizePath(expected);
}

function latestMatchesTask(checkpoint: string, taskDir: string, phase: string): boolean {
  return samePath(field(checkpoint, "State directory"), taskDir.replace(/\/+$/, "")) &&
    (!field(checkpoint, "Current Phase") || field(checkpoint, "Current Phase") === phase);
}

function verificationMatchesTask(checkpoint: string, goalPath: string): boolean {
  return samePath(field(checkpoint, "Goal Contract"), goalPath) &&
    !!field(checkpoint, "Verified at");
}

function triggerContractAllowsMode(goalText: string, mode: string): boolean {
  if (mode === "manual") return /Trigger Contract:[\s\S]*manual/i.test(goalText);
  if (mode === "verification-triggered") return /verification-triggered/i.test(goalText) || /checkpoint\.md/i.test(goalText);
  if (mode === "scheduled") return /scheduled|schedule/i.test(goalText) && /stale|replay|source|id/i.test(goalText);
  if (mode === "webhook") return /webhook/i.test(goalText) && /dedupe|replay|payload|source|id/i.test(goalText);
  return false;
}

function checkRepo(target: string): boolean {
  if (!existsSync(target) || !gitOk(target, ["rev-parse", "--is-inside-work-tree"])) {
    section("git", "missing/not work tree");
    return false;
  }

  const root = gitOutput(target, ["rev-parse", "--show-toplevel"]);
  const branch = gitOutput(root, ["branch", "--show-current"]);
  const diffOk = gitOk(root, ["diff", "--check"]);

  section("git root", root);
  section("branch", branch);
  section("primary branch risk", ["main", "master", "trunk"].includes(branch) ? "yes" : "no/unknown");
  section("status", gitOutput(root, ["status", "--short"]));
  section("worktrees", gitOutput(root, ["worktree", "list"]));
  section("submodules", gitOutput(root, ["submodule", "status"]));
  console.log(`.worktrees/codex/preflight-check: ${gitOk(root, ["check-ignore", "-q", ".worktrees/codex/preflight-check"]) ? "ignored" : "NOT ignored"}`);
  section("diff check", diffOk ? "pass" : "fail");
  return diffOk;
}

function check(label: string, ok: boolean, failure: string): boolean {
  section(label, ok ? "checked" : failure);
  return ok;
}

function memoryAllowsEmpty(memory: string): boolean {
  return ["Confirmed Facts", "Confirmed Root Causes", "Known Constraints", "Working Strategies", "Failed Strategies"].every(name => isNone(field(memory, name)));
}

process.exit(main());
