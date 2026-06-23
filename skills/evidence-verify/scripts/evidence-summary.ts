import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

function section(name: string, value: string): void {
  console.log(`\n== ${name} ==\n${value}`);
}

function git(args: string[], stdio: "pipe" | "ignore" = "pipe") {
  return spawnSync("git", args, { encoding: "utf8", stdio });
}

function gitOutput(args: string[]): string {
  const result = git(args);
  return result.status === 0 ? result.stdout.trim() || "<empty>" : `<failed:${result.status}>`;
}

function gitOk(args: string[]): boolean {
  return git(args, "ignore").status === 0;
}

function field(text: string, name: string): string {
  return text.match(new RegExp(`^- ${name}:\\s*(.*)$`, "mi"))?.[1]?.trim() || "";
}

function main(): number {
  const rawArgs = process.argv.slice(2);
  const taskIndex = rawArgs.indexOf("--task");
  const task = taskIndex >= 0 && rawArgs[taskIndex + 1] ? rawArgs[taskIndex + 1] : "";
  const stateRoot = `${(process.env.CODEX_HOME || `${process.env.HOME || "~"}/.alphal-goal`).replace(/\/+$/, "")}/${basename(process.cwd()) || "workspace"}/`;
  const taskDir = task ? `${stateRoot}${task}/` : "";
  let gap = false;

  section("cwd", process.cwd());
  if (!gitOk(["rev-parse", "--is-inside-work-tree"])) {
    section("git", "not inside work tree");
    return 1;
  }

  for (const [name, args] of [
    ["git root", ["rev-parse", "--show-toplevel"]],
    ["branch", ["branch", "--show-current"]],
    ["status", ["status", "--short"]],
    ["unstaged", ["diff", "--name-only"]],
    ["staged", ["diff", "--cached", "--name-only"]],
    ["diff stat", ["diff", "--stat"]],
    ["cached stat", ["diff", "--cached", "--stat"]],
    ["recent commits", ["log", "--oneline", "-5"]],
  ] as [string, string[]][]) section(name, gitOutput(args));
  section("diff check", gitOk(["diff", "--check"]) ? "pass" : "fail");

  if (!task) {
    section("task", "missing; durable evidence gap unknown");
    section("durable evidence gate", "GAP");
    return 1;
  }

  section("task", task);
  for (const name of ["goal-contract.md", "run-profile.md", "loop-state.md", "memory.md", "evidence.md", "verification.md"]) {
    const path = `${taskDir}${name}`;
    const present = existsSync(path);
    section(name, present ? `present: ${path}` : `missing: ${path}`);
    gap = !present || gap;
  }

  const verification = existsSync(`${taskDir}verification.md`) ? readFileSync(`${taskDir}verification.md`, "utf8") : "";
  const goalContract = field(verification, "Goal Contract");
  const loopState = field(verification, "Loop State");
  const evidence = field(verification, "Evidence");
  const verifiedAt = field(verification, "Verified at");
  const verdict = field(verification, "Verdict");
  const verificationGap = field(verification, "Gap");
  const nextRoute = field(verification, "Next route");
  section("verification goal contract", goalContract || "<missing>");
  section("verification loop state", loopState || "<missing>");
  section("verification evidence", evidence || "<missing>");
  section("verification verified at", verifiedAt || "<missing>");
  section("verification verdict", verdict || "<missing>");
  section("verification gap", verificationGap || "<missing>");
  section("next route", nextRoute || "<missing>");

  const validVerdict = verdict === "PASS_TO_FINAL" || verdict === "NEXT_ITERATION";
  const validRoute = ["none", "control-loop", "alpha-goal", "BLOCKED"].includes(nextRoute);
  const bindingsPass = samePath(goalContract, `${taskDir}goal-contract.md`) &&
    samePath(loopState, `${taskDir}loop-state.md`) &&
    samePath(evidence, `${taskDir}evidence.md`) &&
    !!verifiedAt;
  gap = !bindingsPass || !validVerdict || !verificationGap || !validRoute || gap;
  if (verdict === "PASS_TO_FINAL" && nextRoute !== "none") gap = true;
  section("durable evidence gate", gap ? "GAP" : "PASS");
  return gap ? 1 : 0;
}

function normalizePath(value: string): string {
  return value.replace(/^`|`$/g, "").replace(/\/+$/, "");
}

function samePath(actual: string, expected: string): boolean {
  return normalizePath(actual) === normalizePath(expected);
}

process.exit(main());
