#!/usr/bin/env node
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const helper = path.join(root, "skills/executor/scripts/checkpoint-lock.sh");
const internal = path.join(root, "skills/executor/scripts/checkpoint-update.js");
const legacyHelper = path.join(root, "skills/executor/scripts/checkpoint-lock.js");
const temporaryRoots = [];

function tempDir(prefix = "checkpoint-lock-") {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(directory);
  return directory;
}

function tempCase() {
  const directory = tempDir();
  return {
    directory,
    checkpoint: path.join(directory, "checkpoint.md"),
    mutex: path.join(directory, "checkpoint.md.mutex"),
    tmp: path.join(directory, "checkpoint.md.tmp"),
  };
}

function checkpointText(revision, owner, payload = "state", fields = []) {
  return `checkpoint_revision: ${revision}\nactive_owner: ${owner}\npayload: ${payload}\n${fields.join("\n")}${fields.length ? "\n" : ""}`;
}

function verifyText(revision, owner, route, payload = "verified") {
  return checkpointText(revision, owner, payload, [`route: ${route}`]);
}

function terminateText(revision, route) {
  const fields = ["termination_reason: GOAL_CHANGED"];
  if (route !== undefined) fields.push(`route: ${route}`);
  return checkpointText(revision, "caller", "terminated", fields);
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

function status(checkpoint, options = {}) {
  return invoke(["status", checkpoint], options);
}

function writeCheckpoint(testCase, revision, owner, payload = "state") {
  fs.writeFileSync(testCase.checkpoint, checkpointText(revision, owner, payload), { mode: 0o600 });
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function staticContract() {
  const shell = fs.readFileSync(helper, "utf8");
  const js = fs.readFileSync(internal, "utf8");
  assert.match(shell, /flock -n/);
  assert.match(shell, /exec 9>/);
  assert.match(shell, /checkpoint-update\.js/);
  assert.doesNotMatch(`${shell}\n${js}`, /pendingPath|\bcommit\b|\babort\b|\brecover\b|\brelease\b/);
  assert.equal(
    hash(legacyHelper),
    "286bf0afc6ffee3930d7daf1f51240417545cc56222245e279c259c32d5c53d3",
    "legacy helper must remain available only for transactions it already opened",
  );

  const testCase = tempCase();
  assert.deepEqual(status(testCase.checkpoint), {
    ok: true,
    action: "status",
    revision: "absent",
    owner: "none",
  });
  assert.equal(fs.existsSync(testCase.mutex), false, "status must not create the mutex");

  const direct = spawnSync(process.execPath, [internal, "init", testCase.checkpoint], {
    input: checkpointText("0", "executor"),
    encoding: "utf8",
  });
  assert.equal(direct.status, 1);
  assert.equal(oneJson(direct.stderr, "direct stderr").error, "LOCK_REQUIRED");
}

function lifecycleAndValidation() {
  const testCase = tempCase();
  let result = invoke(["init", testCase.checkpoint], {
    cwd: "/tmp",
    input: checkpointText("0", "executor", "initial"),
  });
  assert.deepEqual(result.to, { revision: "0", owner: "executor" });
  assert.deepEqual(status(testCase.checkpoint), {
    ok: true,
    action: "status",
    revision: "0",
    owner: "executor",
  });

  invoke(["execute", testCase.checkpoint, "0", "executor"], {
    input: checkpointText("1", "executor", "same-owner"),
  });
  invoke(["execute", testCase.checkpoint, "1", "verifier"], {
    input: checkpointText("2", "verifier", "handoff"),
  });
  result = invoke(["verify", testCase.checkpoint, "2", "NEXT_ITERATION"], {
    input: verifyText("3", "executor", "NEXT_ITERATION"),
  });
  assert.equal(result.route, "NEXT_ITERATION");

  invoke(["execute", testCase.checkpoint, "3", "verifier"], {
    input: checkpointText("4", "verifier", "final-check"),
  });
  invoke(["verify", testCase.checkpoint, "4", "PASS_TO_FINAL"], {
    input: verifyText("5", "caller", "PASS_TO_FINAL"),
  });

  const before = hash(testCase.checkpoint);
  assert.equal(invoke(["execute", testCase.checkpoint, "4", "executor"], {
    code: 3,
    input: checkpointText("5", "executor"),
  }).error, "STALE_CHECKPOINT");
  assert.equal(hash(testCase.checkpoint), before);

  const invalidVerify = tempCase();
  writeCheckpoint(invalidVerify, "5", "verifier", "invalid-route");
  const invalidBefore = hash(invalidVerify.checkpoint);
  const invalid = invoke(["verify", invalidVerify.checkpoint, "5", "BLOCKED"], {
    code: 1,
    input: verifyText("6", "caller", "PASS_TO_FINAL"),
  });
  assert.equal(invalid.error, "INVALID_SUCCESSOR");
  assert.equal(hash(invalidVerify.checkpoint), invalidBefore);

  const terminating = tempCase();
  writeCheckpoint(terminating, "7", "executor", "old-goal");
  invoke(["terminate", terminating.checkpoint, "7"], {
    input: terminateText("8", "none"),
  });
  assert.deepEqual(status(terminating.checkpoint), {
    ok: true,
    action: "status",
    revision: "8",
    owner: "caller",
  });

  const badTermination = tempCase();
  writeCheckpoint(badTermination, "0", "verifier");
  assert.equal(invoke(["terminate", badTermination.checkpoint, "0"], {
    code: 1,
    input: checkpointText("1", "caller", "bad"),
  }).error, "INVALID_SUCCESSOR");

  const duplicate = tempCase();
  const duplicateInput = `${checkpointText("0", "executor")}active_owner: verifier\n`;
  assert.equal(invoke(["init", duplicate.checkpoint], {
    code: 1,
    input: duplicateInput,
  }).error, "INVALID_SUCCESSOR");

  const fencedEvidence = tempCase();
  invoke(["init", fencedEvidence.checkpoint], {
    input: checkpointText("0", "executor", "fenced-evidence", [
      "````markdown",
      "```text",
      "checkpoint_revision: 99",
      "active_owner: verifier",
      "```",
      "````",
    ]),
  });

  const legacyAlphaGoal = tempCase();
  fs.writeFileSync(legacyAlphaGoal.checkpoint,
    checkpointText("3", "alpha-goal", "legacy-route", ["route: RETURN_TO_ALPHA_GOAL"]));
  invoke(["terminate", legacyAlphaGoal.checkpoint, "3"], {
    input: terminateText("4", "RETURN_TO_ALPHA_GOAL"),
  });
}

function legacyAndStaleTmp() {
  const orphaned = tempCase();
  fs.writeFileSync(`${orphaned.checkpoint}.pending-00000000-0000-0000-0000-000000000000`, "orphan");
  fs.mkdirSync(`${orphaned.checkpoint}.lock.pending-00000000-0000-0000-0000-000000000000`);
  fs.writeFileSync(orphaned.tmp, "partial");
  invoke(["init", orphaned.checkpoint], {
    input: checkpointText("0", "executor", "pending-does-not-block"),
  });
  assert.equal(fs.existsSync(orphaned.tmp), false);

  const active = tempCase();
  fs.mkdirSync(`${active.checkpoint}.lock`);
  assert.equal(status(active.checkpoint).legacyTransaction, true);
  assert.equal(invoke(["init", active.checkpoint], {
    code: 1,
    input: checkpointText("0", "executor"),
  }).error, "LEGACY_TRANSACTION_PRESENT");
  assert.equal(fs.existsSync(active.checkpoint), false);

  const compatible = tempCase();
  const opened = spawnSync(process.execPath, [legacyHelper, "init", compatible.checkpoint], {
    encoding: "utf8",
  });
  assert.equal(opened.status, 0, opened.stderr);
  const legacyRecord = oneJson(opened.stdout, "legacy open stdout");
  assert.equal(status(compatible.checkpoint).legacyTransaction, true);
  fs.writeFileSync(legacyRecord.pendingPath, checkpointText("0", "executor", "legacy-commit"));
  const committed = spawnSync(process.execPath,
    [legacyHelper, "commit", compatible.checkpoint, legacyRecord.token], { encoding: "utf8" });
  assert.equal(committed.status, 0, committed.stderr);
  assert.equal(Object.hasOwn(status(compatible.checkpoint), "legacyTransaction"), false);
  invoke(["execute", compatible.checkpoint, "0", "executor"], {
    input: checkpointText("1", "executor", "new-helper"),
  });

  const flat = tempCase();
  writeCheckpoint(flat, "0003", "executor", "legacy-revision");
  invoke(["execute", flat.checkpoint, "3", "executor"], {
    input: checkpointText("4", "executor", "normalized"),
  });
  assert.equal(status(flat.checkpoint).revision, "4");

  const obstructed = tempCase();
  writeCheckpoint(obstructed, "0", "executor", "canonical-old");
  fs.mkdirSync(obstructed.tmp);
  assert.equal(invoke(["execute", obstructed.checkpoint, "0", "executor"], {
    code: 1,
    input: checkpointText("1", "executor", "new"),
  }).error, "WRITE_FAILED");
  assert.match(fs.readFileSync(obstructed.checkpoint, "utf8"), /canonical-old/);
  fs.rmSync(obstructed.tmp, { recursive: true });
  invoke(["execute", obstructed.checkpoint, "0", "executor"], {
    input: checkpointText("1", "executor", "recovered"),
  });
}

function spawnInvoke(args, input, customEnv = env()) {
  const child = spawn("/bin/bash", [helper, ...args], {
    cwd: root,
    env: customEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let stdinError = null;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.stdin.on("error", error => {
    if (error.code !== "EPIPE") stdinError = error;
  });
  child.stdin.end(input);
  return new Promise(resolve => {
    child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr, stdinError }));
  });
}

async function concurrency() {
  const testCase = tempCase();
  invoke(["init", testCase.checkpoint], {
    input: checkpointText("0", "executor", "initial"),
  });

  const workers = Number(process.env.CHECKPOINT_LOCK_WORKERS || 16);
  const results = await Promise.all(Array.from({ length: workers }, (_, index) => (
    spawnInvoke(
      ["execute", testCase.checkpoint, "0", "executor"],
      checkpointText("1", "executor", `worker-${index}`),
    )
  )));

  assert.equal(results.filter(result => result.code === 0).length, 1);
  for (const result of results) {
    assert.equal(result.signal, null);
    assert.equal(result.stdinError, null);
    if (result.code === 0) {
      assert.equal(result.stderr, "");
      assert.equal(oneJson(result.stdout, "worker stdout").ok, true);
    } else {
      assert.ok(result.code === 2 || result.code === 3, result.stderr);
      assert.equal(result.stdout, "");
      assert.ok(new Set(["LOCK_HELD", "STALE_CHECKPOINT"]).has(oneJson(result.stderr, "worker stderr").error));
    }
  }
  assert.equal(status(testCase.checkpoint).revision, "1");
}

function waitForFile(file, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (fs.existsSync(file)) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
  throw new Error(`timed out waiting for ${file}`);
}

async function processKillReleasesMutex() {
  const testCase = tempCase();
  invoke(["init", testCase.checkpoint], {
    input: checkpointText("0", "executor", "before-kill"),
  });

  const fakeBin = tempDir("checkpoint-fake-node-");
  const marker = path.join(fakeBin, "ready");
  const fakeNode = path.join(fakeBin, "node");
  fs.writeFileSync(fakeNode, `#!/usr/bin/env bash\nprintf ready > "$CHECKPOINT_TEST_MARKER"\nexec sleep 30\n`, { mode: 0o755 });

  const child = spawn("/bin/bash", [helper, "execute", testCase.checkpoint, "0", "executor"], {
    cwd: root,
    env: env({
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ""}`,
      CHECKPOINT_TEST_MARKER: marker,
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });

  waitForFile(marker);
  assert.equal(invoke(["execute", testCase.checkpoint, "0", "executor"], {
    code: 2,
    input: checkpointText("1", "executor", "contender"),
  }).error, "LOCK_HELD");

  process.kill(child.pid, "SIGKILL");
  const killed = await new Promise(resolve => child.on("close", (code, signal) => resolve({ code, signal })));
  assert.equal(killed.signal, "SIGKILL");
  assert.equal(status(testCase.checkpoint).revision, "0");

  invoke(["execute", testCase.checkpoint, "0", "executor"], {
    input: checkpointText("1", "executor", "after-kill"),
  });
}

function publishBoundaries() {
  const fixtureDir = tempDir("checkpoint-publish-fixture-");
  const preload = path.join(fixtureDir, "kill-boundary.cjs");
  fs.writeFileSync(preload, [
    'const fs = require("node:fs");',
    'const mode = process.env.CHECKPOINT_TEST_KILL_BOUNDARY;',
    'if (mode === "before-rename") {',
    '  const rename = fs.renameSync;',
    '  fs.renameSync = function (from, to) {',
    '    if (String(from).endsWith("checkpoint.md.tmp")) process.kill(process.pid, "SIGKILL");',
    '    return rename.apply(fs, arguments);',
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

  const beforeRename = tempCase();
  invoke(["init", beforeRename.checkpoint], {
    input: checkpointText("0", "executor", "before-rename"),
  });
  const killedBefore = rawInvoke(["execute", beforeRename.checkpoint, "0", "executor"], {
    env: env({
      NODE_OPTIONS: `--require=${preload}`,
      CHECKPOINT_TEST_KILL_BOUNDARY: "before-rename",
    }),
    input: checkpointText("1", "executor", "not-published"),
  });
  assert.equal(killedBefore.signal, "SIGKILL");
  assert.equal(status(beforeRename.checkpoint).revision, "0");
  assert.equal(fs.existsSync(beforeRename.tmp), true);
  invoke(["execute", beforeRename.checkpoint, "0", "executor"], {
    input: checkpointText("1", "executor", "retry-after-reload"),
  });

  const beforeOutput = tempCase();
  invoke(["init", beforeOutput.checkpoint], {
    input: checkpointText("0", "executor", "before-output"),
  });
  const killedAfter = rawInvoke(["execute", beforeOutput.checkpoint, "0", "executor"], {
    env: env({
      NODE_OPTIONS: `--require=${preload}`,
      CHECKPOINT_TEST_KILL_BOUNDARY: "before-success-output",
    }),
    input: checkpointText("1", "executor", "published-without-response"),
  });
  assert.equal(killedAfter.signal, "SIGKILL");
  assert.equal(status(beforeOutput.checkpoint).revision, "1");
  assert.equal(invoke(["execute", beforeOutput.checkpoint, "0", "executor"], {
    code: 3,
    input: checkpointText("1", "executor", "unsafe-retry"),
  }).error, "STALE_CHECKPOINT");

  const uncertainInit = tempCase();
  const killedInit = rawInvoke(["init", uncertainInit.checkpoint], {
    env: env({
      NODE_OPTIONS: `--require=${preload}`,
      CHECKPOINT_TEST_KILL_BOUNDARY: "before-success-output",
    }),
    input: checkpointText("0", "executor", "init-without-response"),
  });
  assert.equal(killedInit.signal, "SIGKILL");
  assert.equal(status(uncertainInit.checkpoint).revision, "0");

  const uncertainTerminate = tempCase();
  invoke(["init", uncertainTerminate.checkpoint], {
    input: checkpointText("0", "executor", "before-terminate"),
  });
  const killedTerminate = rawInvoke(["terminate", uncertainTerminate.checkpoint, "0"], {
    env: env({
      NODE_OPTIONS: `--require=${preload}`,
      CHECKPOINT_TEST_KILL_BOUNDARY: "before-success-output",
    }),
    input: terminateText("1"),
  });
  assert.equal(killedTerminate.signal, "SIGKILL");
  assert.deepEqual(status(uncertainTerminate.checkpoint), {
    ok: true,
    action: "status",
    revision: "1",
    owner: "caller",
  });
}

function flockPrerequisiteAndModuleBoundary() {
  const testCase = tempCase();
  const nodeOnlyPath = tempDir("checkpoint-node-only-");
  fs.symlinkSync(process.execPath, path.join(nodeOnlyPath, "node"));
  assert.equal(invoke(["init", testCase.checkpoint], {
    code: 1,
    env: { ...process.env, PATH: nodeOnlyPath },
    input: checkpointText("0", "executor"),
  }).error, "FLOCK_UNAVAILABLE");
  assert.equal(status(testCase.checkpoint, {
    env: { ...process.env, PATH: nodeOnlyPath },
  }).revision, "absent");

  const moduleRoot = tempDir("checkpoint-module-");
  fs.writeFileSync(path.join(moduleRoot, "package.json"), '{"type":"module"}\n');
  const copiedScripts = path.join(moduleRoot, "installed", "executor", "scripts");
  fs.mkdirSync(copiedScripts, { recursive: true });
  for (const name of ["checkpoint-lock.sh", "checkpoint-update.js", "checkpoint-lock.js", "package.json"]) {
    fs.copyFileSync(path.join(root, "skills/executor/scripts", name), path.join(copiedScripts, name));
  }
  fs.chmodSync(path.join(copiedScripts, "checkpoint-lock.sh"), 0o755);
  fs.chmodSync(path.join(copiedScripts, "checkpoint-update.js"), 0o755);
  const copiedCheckpoint = path.join(moduleRoot, "state", "checkpoint.md");
  fs.mkdirSync(path.dirname(copiedCheckpoint));
  const result = spawnSync("/bin/bash", [path.join(copiedScripts, "checkpoint-lock.sh"), "init", copiedCheckpoint], {
    env: env(),
    input: checkpointText("0", "executor", "installed-copy"),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

async function main() {
  const expectedMajor = process.env.CHECKPOINT_EXPECT_NODE_MAJOR;
  if (expectedMajor) assert.equal(process.versions.node.split(".")[0], expectedMajor);
  try {
    staticContract();
    lifecycleAndValidation();
    legacyAndStaleTmp();
    await concurrency();
    await processKillReleasesMutex();
    publishBoundaries();
    flockPrerequisiteAndModuleBoundary();
    console.log(`PASS: simple checkpoint mutex on Node ${process.versions.node}`);
  } finally {
    for (const directory of temporaryRoots) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
