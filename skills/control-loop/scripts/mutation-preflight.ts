#!/usr/bin/env -S npx --yes tsx
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

let fullScan = false;
let worktreeCheckPath = process.env.WORKTREE_CHECK_PATH ?? ".worktrees/codex/preflight-check";
let scratchCheckPath = process.env.SCRATCH_CHECK_PATH ?? ".alpha-goal/preflight-check";
let positionalCount = 0;

const USAGE = `Usage: mutation-preflight.ts [--full] [WORKTREE_CHECK_PATH] [SCRATCH_CHECK_PATH]

Read-only git/path snapshot for deciding whether mutation is safe.
Default check paths are candidates, not requirements:
  .worktrees/codex/preflight-check
  .alpha-goal/preflight-check
`;

for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg === "--full") {
    fullScan = true;
  } else if (arg === "-h" || arg === "--help") {
    process.stdout.write(USAGE);
    process.exit(0);
  } else if (positionalCount === 0) {
    worktreeCheckPath = arg;
    positionalCount += 1;
  } else if (positionalCount === 1) {
    scratchCheckPath = arg;
    positionalCount += 1;
  } else {
    process.stderr.write(`Unknown extra argument: ${arg}\n`);
    process.stderr.write(USAGE);
    process.exit(2);
  }
}

const currentDir = process.cwd();

section("cwd");
console.log(currentDir);

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

const root = commandOutput("git", ["rev-parse", "--show-toplevel"]).trim();
const branch = commandOutput("git", ["branch", "--show-current"]).trim();

section("git root");
console.log(root || "<unknown>");

section("branch");
console.log(branch || "<detached-or-unknown>");

section("default branch hints");
const remoteHead = commandOutput("git", ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]).trim();
console.log(`origin_head: ${remoteHead || "<unknown>"}`);
if (["main", "master", "trunk"].includes(branch)) {
  console.log("primary_branch_name_risk: yes");
} else if (!branch) {
  console.log("primary_branch_name_risk: unknown-detached");
} else {
  console.log("primary_branch_name_risk: no");
}

section("status --short");
printCommand("git", ["status", "--short"]);

section("worktree list");
printCommand("git", ["worktree", "list"]);

section("checkout classification");
const commonDir = commandOutput("git", ["rev-parse", "--git-common-dir"]).trim();
if (root && fs.existsSync(path.join(root, ".git")) && fs.statSync(path.join(root, ".git")).isFile()) {
  console.log("linked_worktree: yes");
} else {
  console.log("linked_worktree: no");
}
if (root && commonDir) {
  const commonAbs = path.resolve(root, commonDir);
  console.log(`git_common_dir: ${fs.existsSync(commonAbs) ? fs.realpathSync(commonAbs) : commonDir}`);
}
console.log("declared_isolated_edit_path: record manually from approved context");
console.log("primary_checkout_risk: infer from branch, linked_worktree, worktree list, and project rules");
if (/(^|\/)\.worktrees(\/|$)|(^|\/)worktrees(\/|$)/.test(root)) {
  console.log("worktree_path_hint: current root path contains a worktrees segment");
} else {
  console.log("worktree_path_hint: no default worktrees segment detected");
}

section("ignore checks");
if (root && isDirectory(root)) {
  for (const candidate of [worktreeCheckPath, scratchCheckPath]) {
    const ignored = commandSucceeds("git", ["check-ignore", "-q", candidate], { cwd: root });
    console.log(`${candidate}: ${ignored ? "ignored" : "NOT ignored or outside ignore rules"}`);
  }
} else {
  console.log("<unknown root>");
}

section("ancestor rule files");
if (root && isDirectory(root)) {
  for (const file of ancestorRuleFiles(currentDir, root)) {
    console.log(file);
  }
} else {
  console.log("<unknown root>");
}

if (fullScan) {
  section("local rule files: full scan");
  if (root && isDirectory(root)) {
    for (const file of findFiles(root, 100, isRuleFile)) {
      console.log(file);
    }
  } else {
    console.log("<unknown root>");
  }
} else {
  section("local rule files: full scan skipped");
  console.log("Use --full if planned changes cross directories not covered by ancestor rules.");
}

section("nested git directories near root");
if (root && isDirectory(root)) {
  for (const file of findFiles(root, 4, (entry) => entry.name === ".git", 2)) {
    console.log(file);
  }
} else {
  console.log("<unknown root>");
}

section("submodules");
const submodules = commandOutput("git", ["submodule", "status"]).trimEnd();
console.log(submodules || "<none or unavailable>");

section("preflight gaps to decide manually");
console.log("primary_checkout: infer from worktree list, branch/default branch hints, and project rules");
console.log("isolated_edit_path: valid when not primary checkout, inside approved owner boundary, ignored or external, and recorded before mutation");
console.log("mutation_allowed: decide from Goal Contract, system model, project rules, dirty state, ownership, and evidence needs");

section("reminder");
console.log("This script is read-only. It reports facts and candidate path checks; it does not decide whether mutation is safe.");

function section(name: string): void {
  console.log(`\n== ${name} ==`);
}

function printCommand(command: string, args: string[], options: { cwd?: string } = {}): void {
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

function ancestorRuleFiles(start: string, stop: string): string[] {
  const result: string[] = [];
  let current = path.resolve(start);
  const rootPath = path.resolve(stop);
  while (current && (current === rootPath || current.startsWith(`${rootPath}${path.sep}`))) {
    for (const name of ["AGENTS.override.md", "AGENTS.md", "CLAUDE.md", "code_review.md"]) {
      const candidate = path.join(current, name);
      if (isFile(candidate)) {
        result.push(candidate);
      }
    }
    if (current === rootPath) {
      break;
    }
    current = path.dirname(current);
  }
  return [...new Set(result)].sort();
}

function findFiles(
  rootDir: string,
  maxDepth: number,
  predicate: (entry: fs.Dirent, fullPath: string, depth: number) => boolean,
  minDepth = 0,
): string[] {
  const result: string[] = [];
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv"]);

  function visit(dir: string, depth: number): void {
    if (depth > maxDepth) {
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && skipped.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (depth >= minDepth && predicate(entry, fullPath, depth)) {
        result.push(fullPath);
      }
      if (entry.isDirectory()) {
        visit(fullPath, depth + 1);
      }
    }
  }

  visit(rootDir, 0);
  return result.sort();
}

function isRuleFile(entry: fs.Dirent): boolean {
  return ["AGENTS.override.md", "AGENTS.md", "CLAUDE.md", "code_review.md"].includes(entry.name);
}

function isDirectory(file: string): boolean {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function isFile(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
