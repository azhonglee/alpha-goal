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
  const runProfilePath = `${taskDir}run-profile.md`;
  const loopStatePath = `${taskDir}loop-state.md`;
  const memoryPath = `${taskDir}memory.md`;
  const evidencePath = `${taskDir}evidence.md`;
  const verificationPath = `${taskDir}verification.md`;

  section("goal-contract path", goalPath);
  section("goal-contract.md", existsSync(goalPath) ? "present" : "missing");
  ok = existsSync(goalPath) && ok;

  for (const [label, path] of [
    ["run profile path", runProfilePath],
    ["loop-state path", loopStatePath],
    ["memory path", memoryPath],
  ]) {
    section(label, path);
    section(label.replace(" path", ""), existsSync(path) ? "present" : "absent (optional)");
  }

  const latestPath = `${taskDir.replace(/[^/]+\/$/, "")}control-state/latest.md`;
  section("control-state/latest.md", existsSync(latestPath) ? `present: ${latestPath}` : `absent (optional): ${latestPath}`);

  const goalText = readTaskFile(taskDir, "goal-contract.md");
  const runProfile = readTaskFile(taskDir, "run-profile.md");
  const loopState = readTaskFile(taskDir, "loop-state.md");
  const memory = readTaskFile(taskDir, "memory.md");
  const latest = existsSync(latestPath) ? readFileSync(latestPath, "utf8") : "";
  const hasRunProfile = !!runProfile.trim();
  const hasLoopState = !!loopState.trim();
  const hasMemory = !!memory.trim();
  const hasLatest = !!latest.trim();

  if (hasRunProfile) ok = requireFields("run profile", runProfile, ["Goal spec", "Goal Contract", "Run mode", "Trigger event", "Requested action", "Discovery source", "External side effects allowed", "Human checkpoint", "Evaluator route", "Autonomy level"], true) && ok;
  else section("run profile", "absent; plain manual L1-L3 work may execute from Goal Contract");

  if (hasLoopState) {
    ok = requireFields("loop state", loopState, ["Current Objective", "Current Phase"], false) && ok;
    ok = requireFields("loop state ledger", loopState, ["Completed", "Pending", "Known Risks", "Last Verification Gap"], true) && ok;
  } else {
    section("loop state", "absent; no multi-iteration recovery checkpoint");
  }

  if (hasMemory) ok = requireFields("memory", memory, ["Confirmed Facts", "Confirmed Root Causes", "Known Constraints", "Working Strategies", "Failed Strategies"], true) && ok;
  else section("memory", "absent; no reusable learning checkpoint");

  if (hasLatest) ok = requireFields("control-state latest", latest, ["State directory", "Goal Contract", "Updated at"], false) && ok;

  const mode = hasRunProfile ? field(runProfile, "Run mode") : inferRunMode(goalText);
  const action = hasRunProfile ? field(runProfile, "Requested action") : "";
  const autonomy = hasRunProfile ? field(runProfile, "Autonomy level") : field(goalText, "Autonomy Level");
  const phase = field(loopState, "Current Phase");
  const goalContract = field(runProfile, "Goal Contract");
  const nextSlice = field(loopState, "Next Slice");
  const stopCondition = field(loopState, "Stop Condition");
  const runProfileRequired = ["scheduled", "webhook", "verification-triggered"].includes(mode) || actionRequiresProfile(action);

  ok = check("run mode", runModes.has(mode), `invalid: ${mode || "<empty>"}`) && ok;
  if (hasRunProfile) ok = check("requested action", requestedActions.has(action), `invalid: ${action || "<empty>"}`) && ok;
  ok = check("autonomy level", /^L[1-5]\b/.test(autonomy), `invalid: ${autonomy || "<empty>"}`) && ok;
  if (hasRunProfile) ok = check("autonomy action ceiling", actionAllowedByLevel(action, autonomy), `${action || "<empty>"} exceeds ${autonomy || "<empty>"}`) && ok;
  ok = check("run profile required", !runProfileRequired || hasRunProfile, `${mode || "<empty>"} / ${action || "<empty>"} requires run-profile.md`) && ok;
  if (hasLoopState) ok = check("loop phase", loopPhases.has(phase), `invalid: ${phase || "<empty>"}`) && ok;
  if (hasRunProfile) ok = check("goal contract binding", samePath(goalContract, goalPath), "run profile Goal Contract does not match current task") && ok;
  ok = check("trigger contract binding", triggerContractAllowsMode(goalText, mode), `Goal Contract does not authorize ${mode || "<empty>"} trigger`) && ok;
  if (hasLatest) ok = check("latest binding", latestMatchesTask(latest, taskDir, goalPath, runProfilePath, loopStatePath, memoryPath, evidencePath, verificationPath, phase), "latest does not match current task files") && ok;
  if (mode === "verification-triggered") {
    ok = check("verification-triggered binding", verificationMatchesTask(readTaskFile(taskDir, "verification.md"), goalPath, loopStatePath, evidencePath), "verification binding missing or stale") && ok;
  }
  if (hasLoopState) ok = check("loop actionability", !isUnset(nextSlice) && !isNone(nextSlice) || !isUnset(stopCondition) && !isNone(stopCondition), "missing actionable Next Slice or Stop Condition") && ok;
  if (hasRunProfile) ok = check("evaluator route", field(runProfile, "Evaluator route").includes("$goal-verify"), "missing $goal-verify") && ok;
  if (hasMemory) ok = check("memory evidence", memoryAllowsEmpty(memory) || /Evidence:/i.test(memory) && /Confidence:/i.test(memory) && /Invalidation:/i.test(memory), "non-empty memory needs Evidence, Confidence, and Invalidation") && ok;

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

function latestMatchesTask(latest: string, taskDir: string, goalPath: string, runProfilePath: string, loopStatePath: string, memoryPath: string, evidencePath: string, verificationPath: string, phase: string): boolean {
  return samePath(field(latest, "State directory"), taskDir.replace(/\/+$/, "")) &&
    samePath(field(latest, "Goal Contract"), goalPath) &&
    optionalSamePath(field(latest, "Run Profile"), runProfilePath) &&
    optionalSamePath(field(latest, "Loop State"), loopStatePath) &&
    optionalSamePath(field(latest, "Memory"), memoryPath) &&
    optionalSamePath(field(latest, "Evidence"), evidencePath) &&
    optionalSamePath(field(latest, "Verification"), verificationPath) &&
    (!field(latest, "Current Phase") || field(latest, "Current Phase") === phase) &&
    !!field(latest, "Updated at");
}

function optionalSamePath(actual: string, expected: string): boolean {
  return !actual || samePath(actual, expected);
}

function verificationMatchesTask(verification: string, goalPath: string, loopStatePath: string, evidencePath: string): boolean {
  return samePath(field(verification, "- Goal Contract"), goalPath) &&
    optionalSamePath(field(verification, "- Loop State"), loopStatePath) &&
    optionalSamePath(field(verification, "- Evidence"), evidencePath) &&
    !!field(verification, "- Verified at");
}

function triggerContractAllowsMode(goalText: string, mode: string): boolean {
  if (mode === "manual") return /Trigger Contract:[\s\S]*manual/i.test(goalText);
  if (mode === "verification-triggered") return /verification-triggered/i.test(goalText) || /verification\.md/i.test(goalText);
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
