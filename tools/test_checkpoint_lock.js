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

function invoke(args, expectedCode = 0) {
  const result = spawnSync(process.execPath, [helper, ...args], { encoding: "utf8" });
  assert.equal(result.status, expectedCode, `${args.join(" ")}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  const output = expectedCode === 0 ? result.stdout : result.stderr;
  assert.ok(output.trim(), `missing JSON output for ${args.join(" ")}`);
  return JSON.parse(output);
}

function checkpointText(revision, owner, payload = "state") {
  return `checkpoint_revision: ${revision}\nactive_owner: ${owner}\npayload: ${payload}\n`;
}

function stageAndCommit(checkpoint, lease, payload = "state") {
  fs.writeFileSync(lease.pendingPath, checkpointText(lease.to.revision, lease.to.owner, payload));
  const committed = invoke(["commit", checkpoint, lease.token]);
  assert.equal(committed.action, "commit");
  const status = invoke(["status", checkpoint]);
  assert.equal(status.ok, true);
  assert.equal(status.state, "unlocked");
  assert.equal(status.phase, "unlocked");
  assert.ok(!fs.existsSync(`${checkpoint}.lock.closed-${lease.token}`));
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function concurrentInit() {
  const { checkpoint } = tempCase();
  const attempts = Array.from({ length: 16 }, (_, index) => new Promise(resolve => {
    const child = spawn(process.execPath, [helper, "init", checkpoint], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", code => resolve({ code, stdout, stderr, index }));
  }));
  const results = await Promise.all(attempts);
  const winners = results.filter(result => result.code === 0);
  assert.equal(winners.length, 1, JSON.stringify(results));
  const lease = JSON.parse(winners[0].stdout);
  const status = invoke(["status", checkpoint]);
  assert.equal(status.state, "locked");
  assert.ok(status.createdAt);
  invoke(["abort", checkpoint, lease.token]);
}

function semanticLifecycle() {
  const { checkpoint } = tempCase();
  const init = invoke(["init", checkpoint]);
  assert.deepEqual(init.from, { revision: "absent", owner: "none" });
  assert.deepEqual(init.to, { revision: "0", owner: "executor" });
  assert.equal(init.pendingPath, `${checkpoint}.pending-${init.token}`);
  stageAndCommit(checkpoint, init, "initial");

  const sameOwner = invoke(["execute", checkpoint, "0", "executor"]);
  stageAndCommit(checkpoint, sameOwner, "executor-update");
  const handoff = invoke(["execute", checkpoint, "1", "verifier"]);
  stageAndCommit(checkpoint, handoff, "handoff");
  const next = invoke(["verify", checkpoint, "2", "NEXT_ITERATION"]);
  assert.deepEqual(next.to, { revision: "3", owner: "executor" });
  stageAndCommit(checkpoint, next, "next-iteration");

  const backToVerifier = invoke(["execute", checkpoint, "3", "verifier"]);
  stageAndCommit(checkpoint, backToVerifier, "verify-again");
  const reframed = invoke(["reframe", checkpoint, "4"]);
  assert.equal(reframed.route, null);
  assert.deepEqual(reframed.to, { revision: "5", owner: "alpha-goal" });
  stageAndCommit(checkpoint, reframed, "reframe-requested");
  const superseded = invoke(["supersede", checkpoint, "5"]);
  assert.deepEqual(superseded.to, { revision: "6", owner: "executor" });
  stageAndCommit(checkpoint, superseded, "superseded");
}

function routeMapping() {
  const expected = {
    PASS_TO_FINAL: "caller",
    NEXT_ITERATION: "executor",
    BLOCKED: "caller"
  };
  for (const [route, owner] of Object.entries(expected)) {
    const { checkpoint } = tempCase();
    fs.writeFileSync(checkpoint, checkpointText("9", "verifier"));
    const lease = invoke(["verify", checkpoint, "9", route]);
    assert.equal(lease.route, route);
    assert.deepEqual(lease.to, { revision: "10", owner });
    invoke(["abort", checkpoint, lease.token]);
  }
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("9", "verifier"));
  assert.equal(invoke(["verify", checkpoint, "9", "RETURN_TO_ALPHA_GOAL"], 1).error, "INVALID_ROUTE");
  const executorCase = tempCase();
  fs.writeFileSync(executorCase.checkpoint, checkpointText("4", "executor"));
  const reframe = invoke(["reframe", executorCase.checkpoint, "4"]);
  assert.deepEqual(reframe.to, { revision: "5", owner: "alpha-goal" });
  invoke(["abort", executorCase.checkpoint, reframe.token]);
}

function rejectedMisuse() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("7", "verifier"));
  assert.equal(invoke(["execute", checkpoint, "7", "executor"], 3).error, "STALE_CHECKPOINT");
  assert.equal(invoke(["execute", checkpoint, "7", "caller"], 1).error, "INVALID_OWNER");
  assert.equal(invoke(["acquire", checkpoint], 1).error, "USAGE");
  assert.equal(invoke(["status", checkpoint, "extra"], 1).error, "USAGE");
  const stale = invoke(["verify", checkpoint, "6", "PASS_TO_FINAL"], 3);
  assert.equal(stale.error, "STALE_CHECKPOINT");
  assert.deepEqual(stale.actual.owner, "verifier");

  const lease = invoke(["verify", checkpoint, "7", "PASS_TO_FINAL"]);
  assert.equal(invoke(["abort", checkpoint, crypto.randomUUID()], 1).error, "TOKEN_MISMATCH");
  fs.writeFileSync(lease.pendingPath, checkpointText("99", "caller"));
  assert.equal(invoke(["commit", checkpoint, lease.token], 1).error, "INVALID_STAGED_CHECKPOINT");
  invoke(["abort", checkpoint, lease.token]);

  const diverged = tempCase();
  fs.writeFileSync(diverged.checkpoint, checkpointText("2", "executor", "before"));
  const divergedLease = invoke(["execute", diverged.checkpoint, "2", "executor"]);
  fs.writeFileSync(diverged.checkpoint, checkpointText("2", "verifier", "unexpected"));
  assert.equal(invoke(["release", diverged.checkpoint, divergedLease.token], 1).error, "RELEASE_NOT_ALLOWED");
}

function legacyRelease() {
  const { checkpoint } = tempCase();
  const text = checkpointText("1", "executor", "legacy-release");
  fs.writeFileSync(checkpoint, text);
  const token = crypto.randomUUID();
  fs.mkdirSync(`${checkpoint}.lock`);
  fs.writeFileSync(`${checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 3,
    owner: "executor:legacy/release",
    token,
    expectedRevision: "1",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(text),
    nextRevision: "2",
    nextOwner: "executor",
    plannedCheckpointSha256: null
  }));
  invoke(["release", checkpoint, token]);
  const again = invoke(["release", checkpoint, token]);
  assert.equal(again.phase, "none");
}

function legacyRecovery() {
  const beforeCase = tempCase();
  const beforeText = checkpointText("03", "executor", "before");
  fs.writeFileSync(beforeCase.checkpoint, beforeText);
  const beforeToken = crypto.randomUUID();
  fs.mkdirSync(`${beforeCase.checkpoint}.lock`);
  fs.writeFileSync(`${beforeCase.checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 3,
    owner: "executor:init/phase-1",
    token: beforeToken,
    expectedRevision: "03",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(beforeText),
    nextRevision: "04",
    nextOwner: "verifier",
    plannedCheckpointSha256: null
  }));
  const beforeStatus = invoke(["status", beforeCase.checkpoint]);
  assert.equal(beforeStatus.phase, "pre-commit");
  assert.ok(beforeStatus.recoverableBy.includes("executor"));
  invoke(["recover", beforeCase.checkpoint, beforeToken, "executor"]);

  const commitCase = tempCase();
  fs.writeFileSync(commitCase.checkpoint, beforeText);
  const commitToken = crypto.randomUUID();
  fs.mkdirSync(`${commitCase.checkpoint}.lock`);
  fs.writeFileSync(`${commitCase.checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 3,
    owner: "executor:legacy commit/phase",
    token: commitToken,
    expectedRevision: "03",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(beforeText),
    nextRevision: "04",
    nextOwner: "verifier",
    plannedCheckpointSha256: null
  }));
  fs.writeFileSync(`${commitCase.checkpoint}.pending-${commitToken}`, checkpointText("04", "verifier", "legacy-commit"));
  invoke(["commit", commitCase.checkpoint, commitToken]);
  assert.equal(invoke(["status", commitCase.checkpoint]).state, "unlocked");
  const continued = invoke(["verify", commitCase.checkpoint, "4", "NEXT_ITERATION"]);
  invoke(["abort", commitCase.checkpoint, continued.token]);

  const afterCase = tempCase();
  const originalText = checkpointText("03", "executor", "original");
  const committedText = checkpointText("4", "verifier", "committed");
  fs.writeFileSync(afterCase.checkpoint, committedText);
  const afterToken = crypto.randomUUID();
  fs.mkdirSync(`${afterCase.checkpoint}.lock`);
  fs.writeFileSync(`${afterCase.checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 3,
    owner: "executor:legacy after",
    token: afterToken,
    expectedRevision: "03",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(originalText),
    nextRevision: "4",
    nextOwner: "verifier",
    plannedCheckpointSha256: sha256(committedText)
  }));
  const afterStatus = invoke(["status", afterCase.checkpoint]);
  assert.equal(afterStatus.phase, "post-commit");
  assert.ok(afterStatus.recoverableBy.includes("verifier"));
  invoke(["recover", afterCase.checkpoint, afterToken, "verifier"]);

  const oldReturn = tempCase();
  const oldReturnText = checkpointText("5", "verifier", "old-return");
  fs.writeFileSync(oldReturn.checkpoint, oldReturnText);
  const oldReturnToken = crypto.randomUUID();
  fs.mkdirSync(`${oldReturn.checkpoint}.lock`);
  fs.writeFileSync(`${oldReturn.checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 4,
    writer: "verifier:old-return",
    token: oldReturnToken,
    route: "RETURN_TO_ALPHA_GOAL",
    expectedRevision: "5",
    expectedOwner: "verifier",
    expectedCheckpointSha256: sha256(oldReturnText),
    nextRevision: "6",
    nextOwner: "alpha-goal",
    plannedCheckpointSha256: null
  }));
  assert.equal(invoke(["status", oldReturn.checkpoint]).phase, "pre-commit");
  fs.writeFileSync(`${oldReturn.checkpoint}.pending-${oldReturnToken}`, checkpointText("6", "alpha-goal", "obsolete-return"));
  assert.equal(invoke(["commit", oldReturn.checkpoint, oldReturnToken], 1).error, "LEGACY_TRANSITION");
  invoke(["recover", oldReturn.checkpoint, oldReturnToken, "verifier"]);
}

async function main() {
  try {
    semanticLifecycle();
    routeMapping();
    rejectedMisuse();
    legacyRelease();
    legacyRecovery();
    await concurrentInit();
    console.log("PASS: checkpoint lock semantic, misuse, concurrency, and recovery tests");
  } finally {
    for (const dir of temporaryRoots) fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
