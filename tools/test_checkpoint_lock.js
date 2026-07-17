#!/usr/bin/env node
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const helper = path.join(root, "skills/executor/scripts/checkpoint-lock.sh");
const appendHelper = path.join(root, "skills/executor/scripts/checkpoint-append.js");
const legacyHelper = path.join(root, "skills/executor/scripts/checkpoint-lock.js");
const temporaryRoots = [];
const digest = "a".repeat(64);
const context = {
  repository: "/workspace/alpha-goal",
  worktree: "/workspace/alpha-goal/.worktrees/task",
  branch: "codex/task",
};

function tempDir(prefix = "checkpoint-append-") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(directory);
  return directory;
}
function tempCase() {
  const directory = tempDir();
  const testCase = {
    directory,
    contract: path.join(directory, "goal-contract.md"),
    log: path.join(directory, "checkpoint.jsonl"),
    snapshot: path.join(directory, "checkpoint.md"),
    mutex: path.join(directory, "checkpoint.jsonl.mutex"),
  };
  fs.writeFileSync(testCase.contract, [
    "# Goal Contract",
    "",
    "status: accepted",
    `workspace_identity: /workspace/alpha-goal`,
    "",
    "## Integrity Record",
    `- accepted_authority_sha256: ${digest}`,
    "",
  ].join("\n"));
  return testCase;
}
function identity(testCase) {
  return {
    task_id: path.basename(testCase.directory),
    goal_contract_path: testCase.contract,
    accepted_authority_sha256: digest,
    execution_context: {
      workspace: "/workspace/alpha-goal",
      repository: context.repository,
      worktree: context.worktree,
      branch: context.branch,
    },
  };
}
function record(testCase, revision, stateRevision, owner, action, text, extra = {}) {
  return {
    checkpoint_revision: revision,
    state_revision: stateRevision,
    active_owner: owner,
    action,
    ...identity(testCase),
    result: { text },
    ...extra,
  };
}
function env(extra = {}) {
  return {
    ...process.env,
    PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ""}`,
    ...extra,
  };
}
function rawInvoke(args, options = {}) {
  return spawnSync("/bin/bash", [helper, ...args], {
    cwd: options.cwd || root,
    env: options.env || env(),
    input: options.input,
    encoding: "utf8",
    timeout: options.timeout || 10000,
  });
}
function oneJson(text, label) {
  const lines = text.trim().split("\n").filter(Boolean);
  assert.equal(lines.length, 1, `${label} must contain one JSON line: ${text}`);
  return JSON.parse(lines[0]);
}
function invoke(args, options = {}) {
  const result = rawInvoke(args, options);
  const expectedCode = options.code ?? 0;
  assert.equal(result.signal, null, result.stderr || result.error?.message);
  assert.equal(result.status, expectedCode, result.stderr || result.stdout);
  if (expectedCode === 0) {
    assert.equal(result.stderr, "");
    return oneJson(result.stdout, "stdout");
  }
  assert.equal(result.stdout, "");
  return oneJson(result.stderr, "stderr");
}
function init(testCase, text = "initial handoff") {
  return invoke(["init", testCase.log, context.repository, context.worktree, context.branch], { input: text });
}
function execute(testCase, revision, owner, stateMode, text, options = {}) {
  return invoke(["execute", testCase.log, String(revision), owner, stateMode], { ...options, input: text });
}
function verify(testCase, revision, route, text, options = {}) {
  return invoke(["verify", testCase.log, String(revision), route], { ...options, input: text });
}
function terminate(testCase, revision, text, options = {}) {
  return invoke(["terminate", testCase.log, String(revision)], { ...options, input: text });
}
function status(checkpoint, options = {}) {
  return invoke(["status", checkpoint], options);
}
function validRecords(log) {
  return fs.readFileSync(log, "utf8").split("\n").filter(Boolean).flatMap(line => {
    try { return [JSON.parse(line)]; } catch (_) { return []; }
  });
}
function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function staticContract() {
  const shell = fs.readFileSync(helper, "utf8");
  const append = fs.readFileSync(appendHelper, "utf8");
  assert.match(shell, /checkpoint\.jsonl/);
  assert.match(shell, /checkpoint-append\.js/);
  assert.match(shell, /flock -n/);
  assert.match(append, /O_APPEND/);
  assert.match(append, /readLastRecord/);
  assert.match(append, /result: \{ text: resultText \}/);
  assert.doesNotMatch(append, /\.tmp|renameSync|pendingPath|\bcommit\b|\babort\b|\brecover\b|\brelease\b/);
  assert.equal(hash(legacyHelper), "286bf0afc6ffee3930d7daf1f51240417545cc56222245e279c259c32d5c53d3");

  const testCase = tempCase();
  assert.deepEqual(status(testCase.log), { ok: true, action: "status", revision: "absent", owner: "none" });
  assert.equal(fs.existsSync(testCase.mutex), false);
  const direct = spawnSync(process.execPath, [
    appendHelper,
    "init",
    testCase.log,
    context.repository,
    context.worktree,
    context.branch,
  ], { input: "plain result", encoding: "utf8" });
  assert.equal(direct.status, 1);
  assert.equal(oneJson(direct.stderr, "direct stderr").error, "LOCK_REQUIRED");
}

function lifecycleAndPlainText() {
  const testCase = tempCase();
  init(testCase, "accepted initial handoff");
  execute(testCase, 0, "verifier", "next", "implemented batch\n- changed helper\n- tests passed", { cwd: "/tmp" });
  verify(testCase, 1, "NEXT_ITERATION", "finding: close one remaining gap");
  execute(testCase, 2, "verifier", "same", "final handoff");
  verify(testCase, 3, "PASS_TO_FINAL", "verdict: pass");

  assert.deepEqual(status(testCase.log), {
    ok: true,
    action: "status",
    revision: 4,
    stateRevision: 1,
    owner: "caller",
    route: "PASS_TO_FINAL",
    taskId: path.basename(testCase.directory),
  });
  const records = validRecords(testCase.log);
  assert.equal(records.length, 5);
  assert.deepEqual(records.map(item => item.result.text), [
    "accepted initial handoff",
    "implemented batch\n- changed helper\n- tests passed",
    "finding: close one remaining gap",
    "final handoff",
    "verdict: pass",
  ]);
  for (const item of records) assert.deepEqual(item.execution_context, identity(testCase).execution_context);

  const aiLikeText = tempCase();
  init(aiLikeText, [
    "{not valid JSON}",
    "yes: 2026-01-01",
    "number: 1e400",
    "negative-zero: -0",
    'quote: "unterminated-looking',
  ].join("\n"));
  assert.equal(validRecords(aiLikeText.log)[0].result.text.includes("{not valid JSON}"), true);

  const before = hash(testCase.log);
  assert.equal(execute(testCase, 3, "executor", "same", "stale", { code: 3 }).error, "STALE_CHECKPOINT");
  assert.equal(hash(testCase.log), before);
}

function semanticMatrix() {
  const blocked = tempCase();
  init(blocked);
  execute(blocked, 0, "verifier", "next", "handoff");
  verify(blocked, 1, "BLOCKED", "blocked by dependency");
  assert.equal(status(blocked.log).route, "BLOCKED");
  const terminalHash = hash(blocked.log);
  assert.equal(execute(blocked, 2, "executor", "same", "invalid terminal", { code: 3 }).error, "STALE_CHECKPOINT");
  assert.equal(hash(blocked.log), terminalHash);

  const wrongOwner = tempCase();
  init(wrongOwner);
  const wrongOwnerHash = hash(wrongOwner.log);
  assert.equal(verify(wrongOwner, 0, "PASS_TO_FINAL", "wrong owner", { code: 3 }).error, "STALE_CHECKPOINT");
  assert.equal(hash(wrongOwner.log), wrongOwnerHash);

  for (const [args, error] of [
    [["execute", wrongOwner.log, "0", "caller", "same"], "INVALID_OWNER"],
    [["execute", wrongOwner.log, "0", "executor", "jump"], "INVALID_STATE_MODE"],
    [["verify", wrongOwner.log, "0", "UNKNOWN"], "INVALID_ROUTE"],
  ]) {
    const before = hash(wrongOwner.log);
    assert.equal(invoke(args, { code: 1, input: "invalid command" }).error, error);
    assert.equal(hash(wrongOwner.log), before);
  }

  const verifierTerminate = tempCase();
  init(verifierTerminate);
  execute(verifierTerminate, 0, "verifier", "next", "handoff");
  terminate(verifierTerminate, 1, "user changed goal");
  assert.equal(status(verifierTerminate.log).owner, "caller");
  const callerHash = hash(verifierTerminate.log);
  assert.equal(terminate(verifierTerminate, 2, "invalid terminal", { code: 3 }).error, "STALE_CHECKPOINT");
  assert.equal(hash(verifierTerminate.log), callerHash);

  const empty = tempCase();
  assert.equal(invoke(["init", empty.log, context.repository, context.worktree, context.branch], {
    code: 1,
    input: "   \n",
  }).error, "INVALID_RESULT");
  assert.equal(fs.existsSync(empty.log), false);
}

function tailReadAndPartialRecovery() {
  const testCase = tempCase();
  const rows = [];
  for (let revision = 0; revision < 5000; revision += 1) {
    rows.push(JSON.stringify(record(testCase, revision, revision, "executor",
      revision === 0 ? "init" : "execute", `${revision}:${"x".repeat(512)}`)));
  }
  fs.writeFileSync(testCase.log, `${rows.join("\n")}\n`);

  const fixtureDir = tempDir("checkpoint-read-count-");
  const marker = path.join(fixtureDir, "bytes");
  const preload = path.join(fixtureDir, "count-reads.cjs");
  fs.writeFileSync(preload, [
    'const fs = require("node:fs");',
    'const original = fs.readSync;',
    'let total = 0;',
    'fs.readSync = function () { const size = original.apply(fs, arguments); total += size; return size; };',
    'process.on("exit", () => fs.writeFileSync(process.env.CHECKPOINT_READ_MARKER, String(total)));',
    '',
  ].join("\n"));
  assert.equal(status(testCase.log, {
    env: env({ NODE_OPTIONS: `--require=${preload}`, CHECKPOINT_READ_MARKER: marker }),
  }).revision, 4999);
  const bytesRead = Number(fs.readFileSync(marker, "utf8"));
  assert.ok(bytesRead <= 128 * 1024, `status must stay within two tail chunks, read ${bytesRead}`);

  const partial = tempCase();
  init(partial);
  fs.appendFileSync(partial.log, '\n{"checkpoint_revision":1,"state_revision":1');
  assert.equal(status(partial.log).revision, 0);
  execute(partial, 0, "executor", "next", "retry after partial append");
  assert.equal(status(partial.log).revision, 1);

  const longRecord = tempCase();
  init(longRecord, "y".repeat(100 * 1024));
  assert.equal(status(longRecord.log).revision, 0);

  const oversizedTail = tempCase();
  init(oversizedTail);
  fs.appendFileSync(oversizedTail.log, `\n${"z".repeat(4 * 1024 * 1024)}`);
  const oversizedMarker = path.join(fixtureDir, "oversized-bytes");
  assert.equal(invoke(["status", oversizedTail.log], {
    code: 1,
    env: env({ NODE_OPTIONS: `--require=${preload}`, CHECKPOINT_READ_MARKER: oversizedMarker }),
  }).error, "INVALID_CHECKPOINT");
  assert.ok(Number(fs.readFileSync(oversizedMarker, "utf8")) < fs.statSync(oversizedTail.log).size / 2);

  const invalidComplete = tempCase();
  init(invalidComplete);
  fs.appendFileSync(invalidComplete.log, "\n{}\n");
  assert.equal(invoke(["status", invalidComplete.log], { code: 1 }).error, "INVALID_CHECKPOINT");
}

function spawnExecute(testCase, index) {
  const child = spawn("/bin/bash", [helper, "execute", testCase.log, "0", "executor", "next"], {
    cwd: root,
    env: env(),
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let stdinError = null;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.stdin.on("error", error => { if (error.code !== "EPIPE") stdinError = error; });
  child.stdin.end(`worker ${index}`);
  return new Promise(resolve => child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr, stdinError })));
}

async function contention() {
  const testCase = tempCase();
  init(testCase);
  const workers = Number(process.env.CHECKPOINT_LOCK_WORKERS || 16);
  const results = await Promise.all(Array.from({ length: workers }, (_, index) => spawnExecute(testCase, index)));
  assert.equal(results.filter(result => result.code === 0).length, 1);
  for (const result of results) {
    assert.equal(result.signal, null);
    assert.equal(result.stdinError, null);
    if (result.code === 0) assert.equal(oneJson(result.stdout, "worker stdout").ok, true);
    else assert.ok(new Set(["LOCK_HELD", "STALE_CHECKPOINT"]).has(oneJson(result.stderr, "worker stderr").error));
  }
  assert.equal(status(testCase.log).revision, 1);
  assert.equal(validRecords(testCase.log).length, 2);
}

function waitForFile(file, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(file)) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
  throw new Error(`timed out waiting for ${file}`);
}

async function processKillBoundaries() {
  const fixtureDir = tempDir("checkpoint-kill-");
  const preload = path.join(fixtureDir, "kill.cjs");
  fs.writeFileSync(preload, [
    'const fs = require("node:fs");',
    'const mode = process.env.CHECKPOINT_KILL_MODE;',
    'if (mode === "mid-append") {',
    '  const write = fs.writeSync;',
    '  let killed = false;',
    '  fs.writeSync = function (fd, buffer, offset, length) {',
    '    if (!killed && Buffer.isBuffer(buffer) && String(buffer).includes("checkpoint_revision")) {',
    '      killed = true; write.call(fs, fd, buffer, offset, Math.min(32, length));',
    '      process.kill(process.pid, "SIGKILL");',
    '    }',
    '    return write.apply(fs, arguments);',
    '  };',
    '}',
    'if (mode === "before-success-output") {',
    '  const write = process.stdout.write.bind(process.stdout);',
    '  process.stdout.write = function (chunk) {',
    '    if (String(chunk).includes("\\\"ok\\\":true")) process.kill(process.pid, "SIGKILL");',
    '    return write.apply(process.stdout, arguments);',
    '  };',
    '}',
    '',
  ].join("\n"));

  const mid = tempCase();
  init(mid);
  const killedMid = rawInvoke(["execute", mid.log, "0", "executor", "next"], {
    env: env({ NODE_OPTIONS: `--require=${preload}`, CHECKPOINT_KILL_MODE: "mid-append" }),
    input: "partial result",
  });
  assert.equal(killedMid.signal, "SIGKILL");
  assert.equal(status(mid.log).revision, 0);
  const killedMidAgain = rawInvoke(["execute", mid.log, "0", "executor", "next"], {
    env: env({ NODE_OPTIONS: `--require=${preload}`, CHECKPOINT_KILL_MODE: "mid-append" }),
    input: "second partial result",
  });
  assert.equal(killedMidAgain.signal, "SIGKILL");
  assert.equal(status(mid.log).revision, 0);
  execute(mid, 0, "executor", "next", "retried result");
  assert.equal(validRecords(mid.log).length, 2);

  const after = tempCase();
  init(after);
  const killedAfter = rawInvoke(["execute", after.log, "0", "executor", "next"], {
    env: env({ NODE_OPTIONS: `--require=${preload}`, CHECKPOINT_KILL_MODE: "before-success-output" }),
    input: "published result",
  });
  assert.equal(killedAfter.signal, "SIGKILL");
  assert.equal(status(after.log).revision, 1);
  assert.equal(execute(after, 0, "executor", "next", "unsafe retry", { code: 3 }).error, "STALE_CHECKPOINT");

  const held = tempCase();
  init(held);
  const fakeBin = tempDir("checkpoint-fake-node-");
  const marker = path.join(fakeBin, "ready");
  fs.writeFileSync(path.join(fakeBin, "node"),
    '#!/usr/bin/env bash\nprintf ready > "$CHECKPOINT_MARKER"\nexec sleep 30\n', { mode: 0o755 });
  const child = spawn("/bin/bash", [helper, "execute", held.log, "0", "executor", "next"], {
    env: env({ PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ""}`, CHECKPOINT_MARKER: marker }),
    stdio: ["ignore", "pipe", "pipe"],
  });
  waitForFile(marker);
  assert.equal(execute(held, 0, "executor", "next", "contender", { code: 2 }).error, "LOCK_HELD");
  process.kill(child.pid, "SIGKILL");
  const killed = await new Promise(resolve => child.on("close", (code, signal) => resolve({ code, signal })));
  assert.equal(killed.signal, "SIGKILL");
  execute(held, 0, "executor", "next", "after kill");
}

function compatibilityAndRuntime() {
  const testCase = tempCase();
  const snapshot = 'checkpoint_revision: 0\nstate_revision: 0\nactive_owner: executor\npayload: legacy snapshot\n';
  invoke(["init", testCase.snapshot], { input: snapshot });
  invoke(["execute", testCase.snapshot, "0", "verifier"], {
    input: 'checkpoint_revision: 1\nstate_revision: 1\nactive_owner: verifier\npayload: handoff\n',
  });
  invoke(["verify", testCase.snapshot, "1", "NEXT_ITERATION"], {
    input: 'checkpoint_revision: 2\nstate_revision: 1\nactive_owner: executor\nroute: NEXT_ITERATION\npayload: next\n',
  });
  const legacyBefore = hash(testCase.snapshot);
  assert.equal(invoke(["execute", testCase.snapshot, "1", "executor"], {
    code: 3,
    input: 'checkpoint_revision: 2\nstate_revision: 1\nactive_owner: executor\npayload: stale\n',
  }).error, "STALE_CHECKPOINT");
  assert.equal(hash(testCase.snapshot), legacyBefore);
  invoke(["execute", testCase.snapshot, "2", "verifier"], {
    input: 'checkpoint_revision: 3\nstate_revision: 1\nactive_owner: verifier\npayload: final\n',
  });
  invoke(["terminate", testCase.snapshot, "3"], {
    input: 'checkpoint_revision: 4\nstate_revision: 1\nactive_owner: caller\ntermination_reason: GOAL_CHANGED\npayload: terminated\n',
  });

  const oldTransaction = tempCase();
  const opened = spawnSync(process.execPath, [legacyHelper, "init", oldTransaction.snapshot], { encoding: "utf8" });
  assert.equal(opened.status, 0, opened.stderr);
  const openedRecord = oneJson(opened.stdout, "legacy transaction open stdout");
  assert.equal(invoke(["init", oldTransaction.snapshot], { code: 1, input: snapshot }).error,
    "LEGACY_TRANSACTION_PRESENT");
  fs.writeFileSync(openedRecord.pendingPath, snapshot);
  assert.equal(spawnSync(process.execPath,
    [legacyHelper, "commit", oldTransaction.snapshot, openedRecord.token], { encoding: "utf8" }).status, 0);

  const nodeOnlyPath = tempDir("checkpoint-node-only-");
  fs.symlinkSync(process.execPath, path.join(nodeOnlyPath, "node"));
  assert.equal(invoke(["init", testCase.log, context.repository, context.worktree, context.branch], {
    code: 1,
    env: { ...process.env, PATH: nodeOnlyPath },
    input: "initial",
  }).error, "FLOCK_UNAVAILABLE");
  assert.equal(status(testCase.log, { env: { ...process.env, PATH: nodeOnlyPath } }).revision, "absent");

  const moduleRoot = tempDir("checkpoint-module-");
  fs.writeFileSync(path.join(moduleRoot, "package.json"), '{"type":"module"}\n');
  const copiedScripts = path.join(moduleRoot, "installed", "executor", "scripts");
  fs.mkdirSync(copiedScripts, { recursive: true });
  for (const name of ["checkpoint-lock.sh", "checkpoint-append.js", "checkpoint-update.js", "checkpoint-lock.js", "package.json"]) {
    fs.copyFileSync(path.join(root, "skills/executor/scripts", name), path.join(copiedScripts, name));
  }
  fs.chmodSync(path.join(copiedScripts, "checkpoint-lock.sh"), 0o755);
  const copiedState = path.join(moduleRoot, "state");
  fs.mkdirSync(copiedState);
  fs.writeFileSync(path.join(copiedState, "goal-contract.md"), fs.readFileSync(testCase.contract));
  const copiedLog = path.join(copiedState, "checkpoint.jsonl");
  const result = spawnSync("/bin/bash", [
    path.join(copiedScripts, "checkpoint-lock.sh"),
    "init",
    copiedLog,
    context.repository,
    context.worktree,
    context.branch,
  ], { env: env(), input: "installed copy", encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

async function main() {
  const expectedMajor = process.env.CHECKPOINT_EXPECT_NODE_MAJOR;
  if (expectedMajor) assert.equal(process.versions.node.split(".")[0], expectedMajor);
  try {
    staticContract();
    lifecycleAndPlainText();
    semanticMatrix();
    tailReadAndPartialRecovery();
    await contention();
    await processKillBoundaries();
    compatibilityAndRuntime();
    console.log(`PASS: append-only checkpoint log on Node ${process.versions.node}`);
  } finally {
    for (const directory of temporaryRoots) fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
