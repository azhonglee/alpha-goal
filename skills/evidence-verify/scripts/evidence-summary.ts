#!/usr/bin/env -S npx --yes tsx
import { spawnSync } from "node:child_process";

section("cwd");
console.log(process.cwd());

if (!commandSucceeds("git", ["--version"])) {
  section("git");
  console.log("git: not found");
  process.exit(0);
}

if (!commandSucceeds("git", ["rev-parse", "--is-inside-work-tree"])) {
  section("git");
  console.log("inside_work_tree: no");
  process.exit(0);
}

section("git root");
printCommand("git", ["rev-parse", "--show-toplevel"]);

section("branch");
printCommand("git", ["branch", "--show-current"]);

section("status --short");
printCommand("git", ["status", "--short"]);

section("changed files: unstaged");
printCommand("git", ["diff", "--name-only"]);

section("changed files: staged");
printCommand("git", ["diff", "--cached", "--name-only"]);

section("diff stat: unstaged");
printCommand("git", ["diff", "--stat"]);

section("diff stat: staged");
printCommand("git", ["diff", "--cached", "--stat"]);

section("diff check: unstaged");
if (printCommand("git", ["diff", "--check"]) === 0) {
  console.log("git diff --check: pass");
} else {
  console.log("git diff --check: fail");
}

section("diff check: staged");
if (printCommand("git", ["diff", "--cached", "--check"]) === 0) {
  console.log("git diff --cached --check: pass");
} else {
  console.log("git diff --cached --check: fail");
}

section("worktree and ignore hints");
printCommand("git", ["worktree", "list"]);
const root = commandOutput("git", ["rev-parse", "--show-toplevel"]).trim();
if (root) {
  for (const candidate of [".worktrees/codex/preflight-check", ".alpha-goal/preflight-check"]) {
    const ignored = commandSucceeds("git", ["check-ignore", "-q", candidate], { cwd: root });
    if (ignored) {
      console.log(`${candidate}: ignored`);
    } else if (candidate.startsWith(".alpha-goal/")) {
      console.log(`${candidate}: NOT ignored; add .alpha-goal/ to the repo root .gitignore before writing process artifacts`);
    } else {
      console.log(`${candidate}: NOT ignored or not applicable`);
    }
  }
}

section("recent commits");
printCommand("git", ["log", "--oneline", "-5"]);

section("reminder");
console.log("This script is read-only. It summarizes diff evidence but does not run project tests. Map acceptance to evidence manually.");

function section(name: string): void {
  console.log(`\n== ${name} ==`);
}

function printCommand(command: string, args: string[], options: { cwd?: string } = {}): number {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
  });
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  return result.status ?? 1;
}

function commandOutput(command: string, args: string[], options: { cwd?: string } = {}): string {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout : "";
}

function commandSucceeds(command: string, args: string[], options: { cwd?: string } = {}): boolean {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    stdio: "ignore",
  });
  return result.status === 0;
}
