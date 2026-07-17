#!/usr/bin/env node
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const helper = path.join(root, "skills/executor/scripts/checkpoint-lock.js");
const temporaryRoots = [];

function tempCase() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "checkpoint-lock-test-"));
  temporaryRoots.push(dir);
  return { dir, checkpoint: path.join(dir, "checkpoint.md") };
}

function checkpointText(revision, owner, payload = "state") {
  return `checkpoint_revision: ${revision}\nactive_owner: ${owner}\npayload: ${payload}\n`;
}

function invoke(args, input = "", expectedCode = 0) {
  const result = spawnSync(process.execPath, [helper, ...args], { encoding: "utf8", input });
  assert.equal(result.status, expectedCode, `${args.join(" ")}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  const output = expectedCode === 0 ? result.stdout : result.stderr;
  assert.ok(output.trim(), `missing JSON output for ${args.join(" ")}`);
  return JSON.parse(output);
}

function assertClean(checkpoint) {
  assert.ok(!fs.existsSync(`${checkpoint}.lock`));
  assert.ok(!fs.existsSync(path.join(path.dirname(checkpoint), `.${path.basename(checkpoint)}.successor`)));
  const prefix = `${path.basename(checkpoint)}.pending-`;
  assert.deepEqual(fs.readdirSync(path.dirname(checkpoint)).filter(name => name.startsWith(prefix)), []);
}

function systemLockPath(checkpoint) {
  const requested = path.resolve(checkpoint);
  const canonical = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const identity = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 32);
  const uid = typeof process.getuid === "function" ? process.getuid() : "user";
  return path.join(os.tmpdir(), `alpha-goal-checkpoint-${uid}-${identity}.lock`);
}

async function startLockHolder(lock) {
  const hold = "process.stdout.write('locked\\n'); setInterval(() => {}, 1000);";
  const command = process.platform === "darwin" ? "/usr/bin/lockf" : "flock";
  const args = process.platform === "darwin"
    ? ["-t", "0", lock, process.execPath, "-e", hold]
    : ["-E", "75", "-n", lock, process.execPath, "-e", hold];
  const holder = spawn(command, args, { detached: true, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => {
    holder.once("error", reject);
    holder.stdout.once("data", chunk => chunk.toString().includes("locked") ? resolve() : reject(new Error("lock holder did not start")));
  });
  return holder;
}

async function killLockHolder(holder) {
  process.kill(-holder.pid, "SIGKILL");
  await new Promise(resolve => holder.once("close", resolve));
}

function semanticLifecycle() {
  const { checkpoint } = tempCase();
  const init = invoke(["init", checkpoint], checkpointText("0", "executor", "initial"));
  assert.deepEqual(init.from, { revision: "absent", owner: "none" });
  assert.deepEqual(init.to, { revision: "0", owner: "executor" });
  assertClean(checkpoint);

  const sameOwner = invoke(["execute", checkpoint, "0", "executor"], checkpointText("1", "executor", "same-owner"));
  assert.deepEqual(sameOwner.to, { revision: "1", owner: "executor" });
  const handoff = invoke(["execute", checkpoint, "1", "verifier"], checkpointText("2", "verifier", "handoff"));
  assert.deepEqual(handoff.to, { revision: "2", owner: "verifier" });
  const next = invoke(["verify", checkpoint, "2", "NEXT_ITERATION"], checkpointText("3", "executor", "next"));
  assert.equal(next.route, "NEXT_ITERATION");
  const again = invoke(["execute", checkpoint, "3", "verifier"], checkpointText("4", "verifier", "verify-again"));
  assert.equal(again.action, "execute");
  const pass = invoke(["verify", checkpoint, "4", "PASS_TO_FINAL"], checkpointText("5", "caller", "passed"));
  assert.equal(pass.route, "PASS_TO_FINAL");
  assert.equal(fs.readFileSync(checkpoint, "utf8"), checkpointText("5", "caller", "passed"));
  assertClean(checkpoint);
}

function verifierRoutes() {
  for (const [route, owner] of Object.entries({ PASS_TO_FINAL: "caller", NEXT_ITERATION: "executor", BLOCKED: "caller" })) {
    const { checkpoint } = tempCase();
    fs.writeFileSync(checkpoint, checkpointText("9", "verifier"));
    const result = invoke(["verify", checkpoint, "9", route], checkpointText("10", owner, route));
    assert.equal(result.route, route);
    assert.equal(result.to.owner, owner);
    assertClean(checkpoint);
  }
}

function termination() {
  for (const owner of ["alpha-goal", "executor", "verifier"]) {
    const { checkpoint } = tempCase();
    fs.writeFileSync(checkpoint, checkpointText("7", owner));
    const result = invoke(["terminate", checkpoint, "7"], checkpointText("8", "caller", `terminated-${owner}`));
    assert.equal(result.action, "terminate");
    assert.deepEqual(result.from, { revision: "7", owner });
    assert.deepEqual(result.to, { revision: "8", owner: "caller" });
    assertClean(checkpoint);
  }
}

function rejectedWritesLeaveCanonicalUntouched() {
  const { checkpoint } = tempCase();
  const original = checkpointText("7", "verifier", "original");
  fs.writeFileSync(checkpoint, original);
  const rejected = [
    { args: ["execute", checkpoint, "7", "executor"], input: checkpointText("8", "executor"), code: 3, error: "STALE_CHECKPOINT" },
    { args: ["verify", checkpoint, "6", "PASS_TO_FINAL"], input: checkpointText("7", "caller"), code: 3, error: "STALE_CHECKPOINT" },
    { args: ["verify", checkpoint, "7", "RETURN_TO_ALPHA_GOAL"], input: checkpointText("8", "alpha-goal"), code: 1, error: "INVALID_ROUTE" },
    { args: ["verify", checkpoint, "7", "PASS_TO_FINAL"], input: checkpointText("9", "caller"), code: 1, error: "INVALID_SUCCESSOR" },
    { args: ["verify", checkpoint, "7", "PASS_TO_FINAL"], input: checkpointText("08", "caller"), code: 1, error: "INVALID_SUCCESSOR" },
    { args: ["verify", checkpoint, "7", "PASS_TO_FINAL"], input: "", code: 1, error: "INVALID_SUCCESSOR" },
    { args: ["verify", checkpoint, "7", "PASS_TO_FINAL"], input: "checkpoint_revision: 8\npayload: missing-owner\n", code: 1, error: "INVALID_SUCCESSOR" }
  ];
  for (const item of rejected) {
    const result = invoke(item.args, item.input, item.code);
    assert.equal(result.error, item.error);
    assert.equal(fs.readFileSync(checkpoint, "utf8"), original);
    assertClean(checkpoint);
  }

  assert.equal(invoke(["status", checkpoint], "", 1).error, "USAGE");
  assert.equal(invoke(["commit", checkpoint, "token"], "", 1).error, "USAGE");
  assert.equal(invoke(["execute", checkpoint, "7", "caller"], checkpointText("8", "caller"), 1).error, "INVALID_OWNER");
  assert.equal(fs.readFileSync(checkpoint, "utf8"), original);
}

function legacyLockRejectsWithoutMutation() {
  const { checkpoint } = tempCase();
  const original = checkpointText("1", "executor", "locked");
  fs.writeFileSync(checkpoint, original);
  fs.mkdirSync(`${checkpoint}.lock`);
  const result = invoke(["execute", checkpoint, "1", "executor"], checkpointText("2", "executor"), 1);
  assert.equal(result.error, "LEGACY_LOCK_PRESENT");
  assert.equal(fs.readFileSync(checkpoint, "utf8"), original);
  fs.rmdirSync(`${checkpoint}.lock`);
}

function legacyRevisionReadsCanonically() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("03", "executor", "legacy"));
  invoke(["execute", checkpoint, "3", "verifier"], checkpointText("4", "verifier", "normalized"));
  assert.equal(fs.readFileSync(checkpoint, "utf8"), checkpointText("4", "verifier", "normalized"));
  assertClean(checkpoint);
}

function unsafeFixedSuccessorIsRejected() {
  for (const kind of ["symlink", "hardlink"]) {
    const { dir, checkpoint } = tempCase();
    const original = checkpointText("3", "executor", "before-unsafe-successor");
    const victim = path.join(dir, `victim-${kind}`);
    const staged = path.join(dir, ".checkpoint.md.successor");
    fs.writeFileSync(checkpoint, original);
    fs.writeFileSync(victim, `victim-${kind}\n`);
    if (kind === "symlink") fs.symlinkSync(victim, staged);
    else fs.linkSync(victim, staged);
    const result = invoke(["execute", checkpoint, "3", "executor"], checkpointText("4", "executor", kind), 1);
    assert.equal(result.error, "UNSAFE_SUCCESSOR");
    assert.equal(fs.readFileSync(checkpoint, "utf8"), original);
    assert.equal(fs.readFileSync(victim, "utf8"), `victim-${kind}\n`);
    fs.unlinkSync(staged);
    assertClean(checkpoint);
  }
}

function largeStaleInputKeepsItsRealError() {
  const { checkpoint } = tempCase();
  const original = checkpointText("5", "executor", "stale-large");
  fs.writeFileSync(checkpoint, original);
  const large = `checkpoint_revision: 6\nactive_owner: executor\npayload: ${"x".repeat(8 * 1024 * 1024)}\n`;
  const result = invoke(["execute", checkpoint, "4", "executor"], large, 3);
  assert.equal(result.error, "STALE_CHECKPOINT");
  assert.equal(fs.readFileSync(checkpoint, "utf8"), original);
  assertClean(checkpoint);
}

async function concurrentInit() {
  const { checkpoint } = tempCase();
  const attempts = Array.from({ length: 16 }, (_, index) => new Promise(resolve => {
    const child = spawn(process.execPath, [helper, "init", checkpoint], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => resolve({ code, stdout, stderr, index }));
    child.stdin.end(checkpointText("0", "executor", `writer-${index}`));
  }));
  const results = await Promise.all(attempts);
  const winners = results.filter(result => result.code === 0);
  assert.equal(winners.length, 1, JSON.stringify(results));
  assert.ok(results.every(result => [0, 2, 3].includes(result.code)), JSON.stringify(results));
  assert.match(fs.readFileSync(checkpoint, "utf8"), /^checkpoint_revision: 0\nactive_owner: executor\npayload: writer-\d+\n$/);
  assertClean(checkpoint);
}

async function concurrentExecute() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("4", "executor", "before-race"));
  const attempts = Array.from({ length: 16 }, (_, index) => new Promise(resolve => {
    const child = spawn(process.execPath, [helper, "execute", checkpoint, "4", "executor"], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => resolve({ code, stdout, stderr, index }));
    child.stdin.end(checkpointText("5", "executor", `update-${index}`));
  }));
  const results = await Promise.all(attempts);
  assert.equal(results.filter(result => result.code === 0).length, 1, JSON.stringify(results));
  assert.ok(results.every(result => [0, 2, 3].includes(result.code)), JSON.stringify(results));
  assert.match(fs.readFileSync(checkpoint, "utf8"), /^checkpoint_revision: 5\nactive_owner: executor\npayload: update-\d+\n$/);
  assertClean(checkpoint);
}

async function operatingSystemLockReleasesOnKill() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("2", "executor", "before-kill"));
  const holder = await startLockHolder(systemLockPath(checkpoint));
  const blocked = invoke(["execute", checkpoint, "2", "executor"], checkpointText("3", "executor", "blocked"), 2);
  assert.equal(blocked.error, "LOCK_HELD");
  await killLockHolder(holder);
  invoke(["execute", checkpoint, "2", "executor"], checkpointText("3", "executor", "after-kill"));
  assert.equal(fs.readFileSync(checkpoint, "utf8"), checkpointText("3", "executor", "after-kill"));
  assertClean(checkpoint);
}

async function symlinkPathSharesLockAndEnvironmentCannotBypass() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "checkpoint-lock-symlink-test-"));
  temporaryRoots.push(rootDir);
  const realDir = path.join(rootDir, "real"), linkedDir = path.join(rootDir, "linked");
  fs.mkdirSync(realDir);
  fs.symlinkSync(realDir, linkedDir, "dir");
  const realCheckpoint = path.join(realDir, "checkpoint.md");
  const linkedCheckpoint = path.join(linkedDir, "checkpoint.md");
  const original = checkpointText("6", "executor", "symlink-before");
  fs.writeFileSync(realCheckpoint, original);
  const holder = await startLockHolder(systemLockPath(realCheckpoint));
  const args = ["execute", linkedCheckpoint, "6", "executor"];
  const input = checkpointText("7", "executor", "bypass-attempt");
  const result = spawnSync(process.execPath, [helper, ...args], {
    encoding: "utf8", input, env: { ...process.env, ALPHA_GOAL_CHECKPOINT_LOCKED: systemLockPath(realCheckpoint) }
  });
  assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
  assert.equal(JSON.parse(result.stderr).error, "LOCK_HELD");
  assert.equal(fs.readFileSync(realCheckpoint, "utf8"), original);
  await killLockHolder(holder);
  assertClean(realCheckpoint);
}

async function main() {
  try {
    semanticLifecycle();
    verifierRoutes();
    termination();
    rejectedWritesLeaveCanonicalUntouched();
    legacyLockRejectsWithoutMutation();
    legacyRevisionReadsCanonically();
    unsafeFixedSuccessorIsRejected();
    largeStaleInputKeepsItsRealError();
    await concurrentInit();
    await concurrentExecute();
    await operatingSystemLockReleasesOnKill();
    await symlinkPathSharesLockAndEnvironmentCannotBypass();
    console.log("PASS: checkpoint one-shot transitions, CAS rejection, OS-lock release, and concurrency");
  } finally {
    for (const dir of temporaryRoots) fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
