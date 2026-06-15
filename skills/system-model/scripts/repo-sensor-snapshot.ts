#!/usr/bin/env -S npx --yes tsx
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

section("cwd");
console.log(process.cwd());

section("git");
if (commandSucceeds("git", ["--version"]) && commandSucceeds("git", ["rev-parse", "--is-inside-work-tree"])) {
  console.log("inside_work_tree: yes");
  console.log(`root: ${commandOutput("git", ["rev-parse", "--show-toplevel"]).trim()}`);
  console.log(`branch: ${commandOutput("git", ["branch", "--show-current"]).trim()}`);
  console.log("status_short:");
  printCommand("git", ["status", "--short"]);
  console.log("worktrees:");
  printCommand("git", ["worktree", "list"]);
  console.log("submodules:");
  const submodules = commandOutput("git", ["submodule", "status"]).trimEnd();
  console.log(submodules || "<none or unavailable>");
} else {
  console.log("inside_work_tree: no or git unavailable");
}

section("top-level structure");
for (const entry of find(".", 2, () => true).slice(0, 200)) {
  console.log(entry);
}

section("rule and instruction files");
for (const entry of find(".", 4, (candidate) => {
  const name = path.basename(candidate);
  return [
    "AGENTS.md",
    "AGENTS.override.md",
    "CLAUDE.md",
    "code_review.md",
    "README.md",
  ].includes(name) || name.startsWith("README.");
}).slice(0, 200)) {
  console.log(entry);
}

section("project manifest hints");
for (const entry of find(".", 3, (candidate) => [
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "Makefile",
  "justfile",
].includes(path.basename(candidate))).slice(0, 200)) {
  console.log(entry);
}

section("reminder");
console.log("This script is read-only. Interpret output manually before any mutation.");

function section(name: string): void {
  console.log(`\n== ${name} ==`);
}

function printCommand(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    encoding: "utf8",
  });
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

function commandOutput(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout : "";
}

function commandSucceeds(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, {
    stdio: "ignore",
  });
  return result.status === 0;
}

function find(root: string, maxDepth: number, predicate: (candidate: string) => boolean): string[] {
  const result: string[] = [];
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv"]);

  function visit(dir: string, depth: number): void {
    if (depth > maxDepth) {
      return;
    }
    if (predicate(dir)) {
      result.push(normalizeRelative(dir));
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
      if (entry.isDirectory()) {
        visit(fullPath, depth + 1);
      } else if (depth + 1 <= maxDepth && predicate(fullPath)) {
        result.push(normalizeRelative(fullPath));
      }
    }
  }

  visit(root, 0);
  return [...new Set(result)].sort();
}

function normalizeRelative(candidate: string): string {
  const normalized = candidate.split(path.sep).join("/");
  return normalized === "." ? "." : normalized.startsWith("./") ? normalized : `./${normalized}`;
}
