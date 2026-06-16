#!/usr/bin/env -S npx --yes tsx
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

let fullScan = false;
let worktreeCheckPath = process.env.WORKTREE_CHECK_PATH ?? ".worktrees/codex/preflight-check";
let scratchCheckPath = process.env.SCRATCH_CHECK_PATH ?? ".alpha-goal/preflight-check";
let positionalCount = 0;

const USAGE = `用法：mutation-preflight.ts [--full] [WORKTREE_CHECK_PATH] [SCRATCH_CHECK_PATH]

只读 git / 路径快照，用于判断改动是否安全。
默认检查路径只是候选项，不是硬性要求：
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
    process.stderr.write(`未知额外参数：${arg}\n`);
    process.stderr.write(USAGE);
    process.exit(2);
  }
}

const currentDir = process.cwd();

section("当前目录");
console.log(currentDir);

if (!commandSucceeds("git", ["--version"])) {
  section("Git 状态");
  console.log("git: 未找到");
  process.exit(0);
}

if (!commandSucceeds("git", ["rev-parse", "--is-inside-work-tree"])) {
  section("Git 状态");
  console.log("git 工作树: 否");
  process.exit(0);
}

const root = commandOutput("git", ["rev-parse", "--show-toplevel"]).trim();
const branch = commandOutput("git", ["branch", "--show-current"]).trim();

section("git 根目录");
console.log(root || "<未知>");

section("分支");
console.log(branch || "<游离 HEAD 或未知>");

section("默认分支提示");
const remoteHead = commandOutput("git", ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]).trim();
console.log(`远端默认分支: ${remoteHead || "<未知>"}`);
if (["main", "master", "trunk"].includes(branch)) {
  console.log("主分支名风险: 是");
} else if (!branch) {
  console.log("主分支名风险: 未知，当前可能是游离 HEAD");
} else {
  console.log("主分支名风险: 否");
}

section("status --short");
printCommand("git", ["status", "--short"]);

section("worktree 列表");
printWorktreeList();

section("检出目录分类");
const commonDir = commandOutput("git", ["rev-parse", "--git-common-dir"]).trim();
if (root && fs.existsSync(path.join(root, ".git")) && fs.statSync(path.join(root, ".git")).isFile()) {
  console.log("关联 worktree: 是");
} else {
  console.log("关联 worktree: 否");
}
if (root && commonDir) {
  const commonAbs = path.resolve(root, commonDir);
  console.log(`git 公共目录: ${fs.existsSync(commonAbs) ? fs.realpathSync(commonAbs) : commonDir}`);
}
console.log("已声明隔离编辑路径: 从已批准上下文手工记录");
console.log("主检出区风险: 根据分支、关联 worktree、worktree 列表和项目规则推断");
if (/(^|\/)\.worktrees(\/|$)|(^|\/)worktrees(\/|$)/.test(root)) {
  console.log("worktree 路径提示: 当前根路径包含 worktrees 片段");
} else {
  console.log("worktree 路径提示: 未检测到默认 worktrees 片段");
}

section("忽略规则检查");
if (root && isDirectory(root)) {
  for (const candidate of [worktreeCheckPath, scratchCheckPath]) {
    const ignored = commandSucceeds("git", ["check-ignore", "-q", candidate], { cwd: root });
    if (ignored) {
      console.log(`${candidate}: 已忽略`);
    } else if (candidate.startsWith(".alpha-goal/")) {
      console.log(`${candidate}: 未被忽略；写流程产物前先把 .alpha-goal/ 加入仓库根目录 .gitignore`);
    } else {
      console.log(`${candidate}: 未被忽略，或不在忽略规则范围内`);
    }
  }
} else {
  console.log("<未知根目录>");
}

section("祖先规则文件");
if (root && isDirectory(root)) {
  for (const file of ancestorRuleFiles(currentDir, root)) {
    console.log(file);
  }
} else {
  console.log("<未知根目录>");
}

if (fullScan) {
  section("本地规则文件：完整扫描");
  if (root && isDirectory(root)) {
    for (const file of findFiles(root, 100, isRuleFile)) {
      console.log(file);
    }
  } else {
    console.log("<未知根目录>");
  }
} else {
  section("本地规则文件：已跳过完整扫描");
  console.log("如果计划改动会跨越祖先规则未覆盖的目录，使用 --full。");
}

section("根目录附近的嵌套 git 目录");
if (root && isDirectory(root)) {
  for (const file of findFiles(root, 4, (entry) => entry.name === ".git", 2)) {
    console.log(file);
  }
} else {
  console.log("<未知根目录>");
}

section("子模块");
const submodules = commandOutput("git", ["submodule", "status"]).trimEnd();
console.log(submodules || "<无或不可用>");

section("需手工判断的预检缺口");
console.log("主检出区: 根据 worktree 列表、分支 / 默认分支提示和项目规则推断");
console.log("隔离编辑路径: 非主检出区、位于已批准归属边界内、被忽略或外部路径，且改动前已记录时有效");
console.log("变更是否允许: 根据目标契约、系统模型、项目规则、脏状态、归属和证据需求判断");

section("提醒");
console.log("本脚本只读。它报告事实和候选路径检查，不代替安全改动决策。");

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
