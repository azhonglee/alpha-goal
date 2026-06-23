import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const requestedActions = new Set(["suggest", "draft", "modify-worktree", "commit", "push", "open-pr", "merge"]);
const loopPhases = new Set(["IMPLEMENTATION", "HARDENING", "VERIFICATION", "FINAL_RESPONSE_READY", "COMPLETE", "BLOCKED"]);
const requiredGoalContractFields = [
  "Contract status",
  "Issued by",
  "Technical Context",
  "Discovery notes",
  "Interview ledger",
  "Intent",
  "Outcome",
  "Scope",
  "Repo surfaces",
  "Constraints",
  "Assumptions + resolutions",
  "Acceptance evidence",
  "Dependency/integration order",
  "Non-goals",
  "Decision boundary",
  "Claim boundary",
  "Trigger Contract",
  "Autonomy Level",
  "Handoff ledger",
];

function section(name, value) {
  console.log(`\n== ${name} ==\n${value}`);
}

function git(cwd, args, stdio = "pipe") {
  return spawnSync("git", args, { cwd, encoding: "utf8", stdio });
}

function gitOutput(cwd, args) {
  const result = git(cwd, args);
  return result.stdout?.trim() || result.stderr?.trim() || "<empty>";
}

function gitOk(cwd, args) {
  return git(cwd, args, "ignore").status === 0;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function field(text, name) {
  const lines = text.split(/\r?\n/);
  const pattern = new RegExp(`^[ \\t]*(?:[-*][ \\t]+)?${escapeRegExp(name)}:[ \\t]*(.*)$`, "i");
  const index = lines.findIndex(line => pattern.test(line));
  if (index < 0) return "";
  const sameLine = lines[index].match(pattern)?.[1]?.trim() || "";
  if (sameLine) return sameLine;

  for (const line of lines.slice(index + 1)) {
    if (/^[ \t]*(?:[-*][ \t]+)?[A-Za-z][A-Za-z0-9 /_-]*:/.test(line)) break;
    if (/^#{1,6}\s+/.test(line)) break;
    const value = line.replace(/^[ \t]*[-*][ \t]*/, "").trim();
    if (value) return value;
  }
  return "";
}

function sectionText(text, heading) {
  const pattern = new RegExp(`^##[ \\t]+${escapeRegExp(heading)}[ \\t]*$`, "im");
  const match = pattern.exec(text);
  if (!match) return "";
  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const next = rest.search(/^##[ \t]+/m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

function topMatter(text) {
  const next = text.search(/^##[ \t]+/m);
  return (next < 0 ? text : text.slice(0, next)).trim();
}

function readTaskFile(taskDir, name) {
  const path = `${taskDir}${name}`;
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function isUnset(value) {
  return !value || /^(unknown|implicit|-|n\/a)$/i.test(value);
}

function isNone(value) {
  return /^(none|none yet)$/i.test(value);
}

function requireFields(label, text, fields, allowNone = false) {
  const missing = fields.filter(name => {
    const value = field(text, name);
    return isUnset(value) || (!allowNone && isNone(value));
  });
  section(label, missing.length ? `missing/empty: ${missing.join(", ")}` : "pass");
  return missing.length === 0;
}

function parseArgs(rawArgs) {
  const take = (name) => {
    const index = rawArgs.indexOf(name);
    return index >= 0 && rawArgs[index + 1] && !rawArgs[index + 1].startsWith("--") ? rawArgs[index + 1] : "";
  };
  const has = (name) => rawArgs.includes(name);
  const consumed = new Set();
  for (const name of ["--task", "--requested-action", "--external-side-effects", "--human-checkpoint"]) {
    const index = rawArgs.indexOf(name);
    if (index >= 0) {
      consumed.add(index);
      if (rawArgs[index + 1] && !rawArgs[index + 1].startsWith("--")) consumed.add(index + 1);
    }
  }
  for (const name of ["--durable-evidence", "--persisted-verification", "--multi-iteration", "--use-latest"]) {
    const index = rawArgs.indexOf(name);
    if (index >= 0) consumed.add(index);
  }
  return {
    task: take("--task"),
    repos: rawArgs.filter((_, index) => !consumed.has(index)),
    requestedAction: take("--requested-action"),
    externalSideEffects: take("--external-side-effects"),
    humanCheckpoint: take("--human-checkpoint"),
    durableEvidence: has("--durable-evidence"),
    persistedVerification: has("--persisted-verification"),
    multiIteration: has("--multi-iteration"),
    useLatest: has("--use-latest"),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const task = options.task;
  const session = process.cwd();
  const stateRoot = `${(process.env.CODEX_HOME || `${process.env.HOME || "~"}/.alphal-goal`).replace(/\/+$/, "")}/${basename(session) || "workspace"}/`;
  const taskDir = task ? `${stateRoot}${task}/` : "";
  const targets = (options.repos.length ? options.repos : [session]).map(repo => resolve(session, repo));
  let blocked = false;

  section("cwd", session);
  section("alpha goal state root", stateRoot);
  section("multi-repo preflight", targets.length > 1 ? `${targets.length} repos` : "single repo");

  if (!task) {
    section("task", "missing; BLOCKED without --task");
    blocked = true;
  } else {
    section("task", task);
    blocked = !checkTaskState(taskDir, stateRoot, options) || blocked;
  }

  for (const [index, target] of targets.entries()) {
    console.log(`\n## repo ${index + 1}: ${target}`);
    blocked = !checkRepo(target) || blocked;
  }

  section("gate", blocked ? "BLOCKED" : "PASS");
  return blocked ? 1 : 0;
}

function checkTaskState(taskDir, stateRoot, options) {
  let ok = true;
  const goalPath = `${taskDir}goal-contract.md`;
  const checkpointPath = `${taskDir}checkpoint.md`;
  const latestPath = `${stateRoot}control-state/latest.md`;

  section("goal-contract path", goalPath);
  section("goal-contract.md", existsSync(goalPath) ? "present" : "missing");
  ok = existsSync(goalPath) && ok;

  section("checkpoint path", checkpointPath);
  section("checkpoint.md", existsSync(checkpointPath) ? "present" : "absent (optional)");
  section("latest pointer path", latestPath);
  section("control-state/latest.md", existsSync(latestPath) ? "present" : "absent (optional)");

  const goalText = readTaskFile(taskDir, "goal-contract.md");
  const checkpoint = readTaskFile(taskDir, "checkpoint.md");
  const latest = existsSync(latestPath) ? readFileSync(latestPath, "utf8") : "";
  const checkpointHeader = topMatter(checkpoint);
  const runProfile = sectionText(checkpoint, "Run Profile");
  const loopState = sectionText(checkpoint, "Loop State");
  const memory = sectionText(checkpoint, "Memory");
  const evidence = sectionText(checkpoint, "Evidence");
  const verification = sectionText(checkpoint, "Verification");
  const hasCheckpoint = !!checkpoint.trim();
  const hasRunProfile = !!runProfile;
  const hasLoopState = !!loopState;
  const hasMemory = !!memory;
  const hasEvidence = !!evidence;
  const hasVerification = !!verification;
  const hasLatest = !!latest.trim();

  ok = requireFields("goal contract", goalText, requiredGoalContractFields, false) && ok;
  ok = check("contract status", /^accepted$/i.test(field(goalText, "Contract status")), `not accepted: ${field(goalText, "Contract status") || "<empty>"}`) && ok;
  ok = check("contract issuer", /^alpha-goal$/i.test(field(goalText, "Issued by")), `invalid issuer: ${field(goalText, "Issued by") || "<empty>"}`) && ok;

  if (hasCheckpoint) ok = requireFields("checkpoint", checkpointHeader, ["Goal Contract", "Updated at"], false) && ok;
  else section("checkpoint", "absent; plain manual L1-L3 work may execute from Goal Contract");

  if (hasRunProfile) ok = requireFields("checkpoint run profile", runProfile, ["Requested action", "Discovery source", "External side effects allowed", "Human checkpoint", "Evaluator route", "Autonomy level"], true) && ok;
  else section("checkpoint run profile", "absent unless action/side-effect requires it");

  if (hasLoopState) {
    ok = requireFields("checkpoint loop state", loopState, ["Current Objective", "Current Phase"], false) && ok;
    ok = requireFields("checkpoint loop state ledger", loopState, ["Completed", "Pending", "Known Risks", "Last Verification Gap"], true) && ok;
  } else {
    section("checkpoint loop state", "absent; no multi-iteration recovery checkpoint");
  }

  if (hasMemory) ok = requireFields("checkpoint memory", memory, ["Confirmed Facts", "Confirmed Root Causes", "Known Constraints", "Working Strategies", "Failed Strategies"], true) && ok;
  else section("checkpoint memory", "absent; no reusable learning checkpoint");

  if (hasEvidence) ok = requireFields("checkpoint evidence", evidence, ["Acceptance-to-evidence", "Command/output references", "Defect/risk sweep surface"], true) && ok;
  if (hasVerification) {
    ok = requireFields("checkpoint verification", verification, ["Goal Contract", "Evidence", "Verified at", "Review mode", "Verdict", "Next route"], false) && ok;
    ok = requireFields("checkpoint verification gap", verification, ["Gap"], true) && ok;
  }
  if (hasLatest) {
    ok = requireFields("latest pointer", latest, ["State directory", "Goal Contract", "Current Phase", "Updated at"], false) && ok;
    ok = requireFields("latest pointer nullable fields", latest, ["Checkpoint", "Next route"], true) && ok;
  }

  const action = hasRunProfile ? field(runProfile, "Requested action") : options.requestedAction;
  const autonomy = hasRunProfile ? field(runProfile, "Autonomy level") : field(goalText, "Autonomy Level");
  const phase = field(loopState, "Current Phase") || field(latest, "Current Phase");
  const goalContract = field(checkpointHeader, "Goal Contract");
  const nextSlice = field(loopState, "Next Slice");
  const stopCondition = field(loopState, "Stop Condition");
  const externalSideEffects = hasRunProfile ? field(runProfile, "External side effects allowed") : options.externalSideEffects;
  const humanCheckpoint = hasRunProfile ? field(runProfile, "Human checkpoint") : options.humanCheckpoint;
  const checkpointRequired = actionRequiresProfile(action) ||
    !isUnset(externalSideEffects) && !isNone(externalSideEffects) ||
    !isUnset(humanCheckpoint) && !isNone(humanCheckpoint) ||
    options.durableEvidence ||
    options.persistedVerification ||
    options.multiIteration;

  if (hasRunProfile) ok = check("requested action", requestedActions.has(action), `invalid: ${action || "<empty>"}`) && ok;
  if (!hasRunProfile && action) ok = check("requested action", requestedActions.has(action), `invalid: ${action || "<empty>"}`) && ok;
  ok = check("autonomy level", /^L[1-5]\b/.test(autonomy), `invalid: ${autonomy || "<empty>"}`) && ok;
  if (action) ok = check("autonomy action ceiling", actionAllowedByLevel(action, autonomy), `${action || "<empty>"} exceeds ${autonomy || "<empty>"}`) && ok;
  ok = check("checkpoint required", !checkpointRequired || hasCheckpoint && hasRunProfile, `${action || "<empty>"} requires checkpoint.md Run Profile`) && ok;
  if (hasLoopState) ok = check("loop phase", loopPhases.has(phase), `invalid: ${phase || "<empty>"}`) && ok;
  if (hasCheckpoint) {
    ok = check("goal contract binding", samePath(goalContract, goalPath), "checkpoint Goal Contract does not match current task") && ok;
  }
  if (hasLatest || options.useLatest) ok = check("latest binding", latestMatchesTask(latest, taskDir, goalPath, checkpointPath, phase, hasCheckpoint), "control-state/latest.md does not match current task") && ok;
  if (hasVerification) ok = check("verification binding", verificationMatchesTask(verification, goalPath), "checkpoint Verification missing, stale, or malformed") && ok;
  if (hasLoopState) ok = check("loop actionability", !isUnset(nextSlice) && !isNone(nextSlice) || !isUnset(stopCondition) && !isNone(stopCondition), "missing actionable Next Slice or Stop Condition") && ok;
  if (hasRunProfile) ok = check("evaluator route", field(runProfile, "Evaluator route").includes("$goal-verify"), "missing $goal-verify") && ok;
  if (hasMemory) ok = check("memory evidence", memoryAllowsEmpty(memory) || /(?:^|\n)[ \t]*(?:[-*][ \t]+)?Evidence:/i.test(memory) && /(?:^|\n)[ \t]*(?:[-*][ \t]+)?Confidence:/i.test(memory) && /(?:^|\n)[ \t]*(?:[-*][ \t]+)?Invalidation:/i.test(memory), "non-empty memory needs Evidence, Confidence, and Invalidation") && ok;

  section("preflight", "checked");
  return ok;
}

function actionRequiresProfile(action) {
  return ["commit", "push", "open-pr", "merge"].includes(action);
}

function actionAllowedByLevel(action, level) {
  const ranks = { suggest: 1, draft: 2, "modify-worktree": 3, commit: 4, push: 4, "open-pr": 4, merge: 5 };
  const match = level.match(/^L([1-5])\b/);
  return !!match && (ranks[action] ?? 99) <= Number(match[1]);
}

function normalizePath(value) {
  return value.replace(/^`|`$/g, "").replace(/\/+$/, "");
}

function samePath(actual, expected) {
  return normalizePath(actual) === normalizePath(expected);
}

function latestMatchesTask(latest, taskDir, goalPath, checkpointPath, phase, hasCheckpoint) {
  if (!latest.trim()) return false;
  const checkpoint = field(latest, "Checkpoint");
  const route = field(latest, "Next route");
  return samePath(field(latest, "State directory"), taskDir.replace(/\/+$/, "")) &&
    samePath(field(latest, "Goal Contract"), goalPath) &&
    (hasCheckpoint ? samePath(checkpoint, checkpointPath) : isNone(checkpoint)) &&
    (!field(latest, "Current Phase") || !phase || field(latest, "Current Phase") === phase) &&
    /^(none|control-loop|alpha-goal|BLOCKED)$/i.test(route);
}

function verificationMatchesTask(verification, goalPath) {
  const verdict = field(verification, "Verdict");
  const nextRoute = field(verification, "Next route");
  const gap = field(verification, "Gap");
  const bound = samePath(field(verification, "Goal Contract"), goalPath) &&
    !isUnset(field(verification, "Evidence")) &&
    !isUnset(field(verification, "Verified at"));
  if (!bound) return false;
  if (/^NEXT_ITERATION$/i.test(verdict)) return /^control-loop$/i.test(nextRoute) && !isUnset(gap) && !isNone(gap);
  if (/^PASS_TO_FINAL$/i.test(verdict)) return /^none$/i.test(nextRoute) && (isUnset(gap) || isNone(gap));
  return false;
}

function checkRepo(target) {
  if (!existsSync(target) || !gitOk(target, ["rev-parse", "--is-inside-work-tree"])) {
    section("git", "missing/not work tree");
    return false;
  }

  const root = gitOutput(target, ["rev-parse", "--show-toplevel"]);
  const branch = gitOutput(root, ["branch", "--show-current"]);
  const diffOk = gitOk(root, ["diff", "--check"]);
  const primary = ["main", "master", "trunk"].includes(branch);
  const worktreesIgnored = gitOk(root, ["check-ignore", "-q", ".worktrees/codex/preflight-check"]);

  section("git root", root);
  section("branch", branch);
  section("primary branch risk", primary ? "BLOCKED" : "no/unknown");
  section("status", gitOutput(root, ["status", "--short"]));
  section("worktrees", gitOutput(root, ["worktree", "list"]));
  section("submodules", gitOutput(root, ["submodule", "status"]));
  console.log(`.worktrees/codex/preflight-check: ${worktreesIgnored ? "ignored" : "NOT ignored"}`);
  section("diff check", diffOk ? "pass" : "fail");
  return diffOk && !primary && worktreesIgnored;
}

function check(label, ok, failure) {
  section(label, ok ? "checked" : failure);
  return ok;
}

function memoryAllowsEmpty(memory) {
  return ["Confirmed Facts", "Confirmed Root Causes", "Known Constraints", "Working Strategies", "Failed Strategies"].every(name => isNone(field(memory, name)));
}

process.exit(main());
