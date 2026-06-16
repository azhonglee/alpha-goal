#!/usr/bin/env -S npx --yes tsx
import { spawnSync } from "node:child_process";

section("当前目录");
console.log(process.cwd());

if (!commandSucceeds("git", ["--version"])) {
  section("git");
  console.log("git: 未找到");
  process.exit(0);
}

if (!commandSucceeds("git", ["rev-parse", "--is-inside-work-tree"])) {
  section("git");
  console.log("inside_work_tree: no");
  process.exit(0);
}

section("git 根目录");
printCommand("git", ["rev-parse", "--show-toplevel"]);

section("分支");
printCommand("git", ["branch", "--show-current"]);

section("status --short");
printCommand("git", ["status", "--short"]);

section("已变更文件：未暂存");
printCommand("git", ["diff", "--name-only"]);

section("已变更文件：已暂存");
printCommand("git", ["diff", "--cached", "--name-only"]);

section("diff 统计：未暂存");
printCommand("git", ["diff", "--stat"]);

section("diff 统计：已暂存");
printCommand("git", ["diff", "--cached", "--stat"]);

section("diff check：未暂存");
if (printCommand("git", ["diff", "--check"]) === 0) {
  console.log("git diff --check: 通过");
} else {
  console.log("git diff --check: 失败");
}

section("diff check：已暂存");
if (printCommand("git", ["diff", "--cached", "--check"]) === 0) {
  console.log("git diff --cached --check: 通过");
} else {
  console.log("git diff --cached --check: 失败");
}

section("worktree 与忽略规则提示");
printCommand("git", ["worktree", "list"]);
const root = commandOutput("git", ["rev-parse", "--show-toplevel"]).trim();
if (root) {
  for (const candidate of [".worktrees/codex/preflight-check", ".alpha-goal/preflight-check"]) {
    const ignored = commandSucceeds("git", ["check-ignore", "-q", candidate], { cwd: root });
    if (ignored) {
      console.log(`${candidate}: ignored`);
    } else if (candidate.startsWith(".alpha-goal/")) {
      console.log(`${candidate}: 未被忽略；写流程产物前先把 .alpha-goal/ 加入仓库根目录 .gitignore`);
    } else {
      console.log(`${candidate}: 未被忽略或不适用`);
    }
  }
}

section("最近提交");
printCommand("git", ["log", "--oneline", "-5"]);

section("提醒");
console.log("本脚本只读；它汇总差异证据，但不运行项目测试。请手动把验收标准映射到证据。");

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
