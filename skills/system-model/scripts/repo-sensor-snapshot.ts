#!/usr/bin/env -S npx --yes tsx
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

section("当前目录");
console.log(process.cwd());

section("Git 状态");
if (commandSucceeds("git", ["--version"]) && commandSucceeds("git", ["rev-parse", "--is-inside-work-tree"])) {
  console.log("git 工作树: 是");
  console.log(`根目录: ${commandOutput("git", ["rev-parse", "--show-toplevel"]).trim()}`);
  console.log(`分支: ${commandOutput("git", ["branch", "--show-current"]).trim()}`);
  console.log("status --short:");
  printCommand("git", ["status", "--short"]);
  console.log("worktree 列表:");
  printWorktreeList();
  console.log("子模块:");
  const submodules = commandOutput("git", ["submodule", "status"]).trimEnd();
  console.log(submodules || "<无或不可用>");
} else {
  console.log("git 工作树: 否或 git 不可用");
}

section("顶层结构");
for (const entry of find(".", 2, () => true).slice(0, 200)) {
  console.log(entry);
}

section("规则与说明文件");
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

section("项目清单线索");
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

section("提醒");
console.log("本脚本只读。任何变更前都要先人工解读这些输出。");

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

function printWorktreeList(): void {
  const output = commandOutput("git", ["worktree", "list"]);
  process.stdout.write(localizeGitWorktreeList(output));
}

function localizeGitWorktreeList(output: string): string {
  return output
    .replace(/ prunable/g, " 可清理")
    .replace(/\(detached HEAD\)/g, "(游离 HEAD)")
    .replace(/\(bare\)/g, "(裸仓库)");
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
