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

function protocolPendingNames(checkpoint) {
  const prefix = `${path.basename(checkpoint)}.pending-`;
  const tokenPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
  return fs.readdirSync(path.dirname(checkpoint))
    .filter(name => name.startsWith(prefix) && tokenPattern.test(name.slice(prefix.length)))
    .sort();
}

function assertNoProtocolPending(checkpoint) {
  assert.deepEqual(protocolPendingNames(checkpoint), []);
}

function writeLock(checkpoint, record) {
  fs.mkdirSync(`${checkpoint}.lock`);
  fs.writeFileSync(`${checkpoint}.lock/owner.json`, JSON.stringify(record));
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
  const terminated = invoke(["terminate", checkpoint, "4"]);
  assert.equal(terminated.action, "terminate");
  assert.equal(terminated.route, null);
  assert.deepEqual(terminated.to, { revision: "5", owner: "caller" });
  stageAndCommit(checkpoint, terminated, "terminated");
}

function executorTerminate() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("4", "executor"));
  const lease = invoke(["terminate", checkpoint, "4"]);
  assert.equal(lease.action, "terminate");
  assert.equal(lease.route, null);
  assert.match(lease.writer, /^executor:terminate-/);
  assert.deepEqual(lease.to, { revision: "5", owner: "caller" });
  const record = JSON.parse(fs.readFileSync(`${checkpoint}.lock/owner.json`, "utf8"));
  assert.equal(record.schemaVersion, 4);
  assert.equal(record.route, null);
  assert.equal(Object.hasOwn(record, "action"), false);
  stageAndCommit(checkpoint, lease, "executor-terminated");
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
}

function rejectedMisuse() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("7", "verifier"));
  assert.equal(invoke(["execute", checkpoint, "7", "executor"], 3).error, "STALE_CHECKPOINT");
  assert.equal(invoke(["execute", checkpoint, "7", "caller"], 1).error, "INVALID_OWNER");
  assert.equal(invoke(["acquire", checkpoint], 1).error, "USAGE");
  assert.equal(invoke(["reframe", checkpoint, "7"], 1).error, "USAGE");
  assert.equal(invoke(["supersede", checkpoint, "7"], 1).error, "USAGE");
  assert.equal(invoke(["status", checkpoint, "extra"], 1).error, "USAGE");
  const stale = invoke(["verify", checkpoint, "6", "PASS_TO_FINAL"], 3);
  assert.equal(stale.error, "STALE_CHECKPOINT");
  assert.deepEqual(stale.actual.owner, "verifier");

  const lease = invoke(["verify", checkpoint, "7", "PASS_TO_FINAL"]);
  assert.equal(invoke(["abort", checkpoint, crypto.randomUUID()], 1).error, "TOKEN_MISMATCH");
  fs.writeFileSync(lease.pendingPath, checkpointText("99", "caller"));
  assert.equal(invoke(["commit", checkpoint, lease.token], 1).error, "INVALID_STAGED_CHECKPOINT");
  invoke(["abort", checkpoint, lease.token]);

  const terminated = invoke(["terminate", checkpoint, "7"]);
  invoke(["abort", checkpoint, terminated.token]);
  fs.writeFileSync(checkpoint, checkpointText("8", "caller"));
  assert.equal(invoke(["terminate", checkpoint, "8"], 1).error, "INVALID_TRANSITION");
  fs.writeFileSync(checkpoint, checkpointText("8", "alpha-goal"));
  assert.equal(invoke(["execute", checkpoint, "8", "executor"], 3).error, "STALE_CHECKPOINT");
  assert.equal(invoke(["verify", checkpoint, "8", "NEXT_ITERATION"], 3).error, "STALE_CHECKPOINT");

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
  writeLock(checkpoint, {
    schemaVersion: 3,
    owner: "executor:legacy/release",
    token,
    expectedRevision: "1",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(text),
    nextRevision: "2",
    nextOwner: "executor",
    plannedCheckpointSha256: null
  });
  const currentPending = `${checkpoint}.pending-${token}`;
  fs.mkdirSync(currentPending);
  const oldOrphan = `${checkpoint}.pending-${crypto.randomUUID()}`;
  fs.writeFileSync(oldOrphan, "old orphan");
  assert.equal(invoke(["release", checkpoint, token], 1).error, "PENDING_CLEANUP_FAILED");
  assert.equal(invoke(["status", checkpoint]).state, "locked");
  fs.rmdirSync(currentPending);
  invoke(["release", checkpoint, token]);
  assert.ok(fs.existsSync(oldOrphan), "legacy release must not scan historical orphans");
  const again = invoke(["release", checkpoint, token]);
  assert.equal(again.phase, "none");
  const next = invoke(["execute", checkpoint, "1", "executor"]);
  assert.ok(!fs.existsSync(oldOrphan), "the next validated acquire must migrate old orphans");
  invoke(["abort", checkpoint, next.token]);
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

  const oldReframe = tempCase();
  const oldReframeText = checkpointText("5", "verifier", "old-reframe");
  fs.writeFileSync(oldReframe.checkpoint, oldReframeText);
  const oldReframeToken = crypto.randomUUID();
  fs.mkdirSync(`${oldReframe.checkpoint}.lock`);
  fs.writeFileSync(`${oldReframe.checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 4,
    writer: "verifier:old-reframe",
    token: oldReframeToken,
    route: null,
    expectedRevision: "5",
    expectedOwner: "verifier",
    expectedCheckpointSha256: sha256(oldReframeText),
    nextRevision: "6",
    nextOwner: "alpha-goal",
    plannedCheckpointSha256: null
  }));
  assert.equal(invoke(["status", oldReframe.checkpoint]).phase, "pre-commit");
  fs.writeFileSync(`${oldReframe.checkpoint}.pending-${oldReframeToken}`, checkpointText("6", "alpha-goal", "obsolete-reframe"));
  assert.equal(invoke(["commit", oldReframe.checkpoint, oldReframeToken], 1).error, "LEGACY_TRANSITION");
  invoke(["abort", oldReframe.checkpoint, oldReframeToken]);

  const oldSupersede = tempCase();
  const oldSupersedeText = checkpointText("08", "alpha-goal", "old-supersede");
  fs.writeFileSync(oldSupersede.checkpoint, oldSupersedeText);
  const oldSupersedeToken = crypto.randomUUID();
  fs.mkdirSync(`${oldSupersede.checkpoint}.lock`);
  fs.writeFileSync(`${oldSupersede.checkpoint}.lock/owner.json`, JSON.stringify({
    schemaVersion: 3,
    owner: "executor:old supersede",
    token: oldSupersedeToken,
    expectedRevision: "08",
    expectedOwner: "alpha-goal",
    expectedCheckpointSha256: sha256(oldSupersedeText),
    nextRevision: "09",
    nextOwner: "executor",
    plannedCheckpointSha256: null
  }));
  const oldSupersedeStatus = invoke(["status", oldSupersede.checkpoint]);
  assert.equal(oldSupersedeStatus.phase, "pre-commit");
  assert.ok(oldSupersedeStatus.recoverableBy.includes("alpha-goal"));
  assert.equal(invoke(["commit", oldSupersede.checkpoint, oldSupersedeToken], 1).error, "LEGACY_TRANSITION");
  invoke(["recover", oldSupersede.checkpoint, oldSupersedeToken, "alpha-goal"]);

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

function acquireCleansOnlyProtocolOrphans() {
  const { checkpoint } = tempCase();
  fs.writeFileSync(checkpoint, checkpointText("4", "executor", "before-acquire"));
  const orphanToken = crypto.randomUUID();
  const orphan = `${checkpoint}.pending-${orphanToken}`;
  fs.writeFileSync(orphan, "old orphan");
  const similar = [
    `${checkpoint}.pending-not-a-uuid`,
    `${checkpoint}.pending-${orphanToken}.backup`,
    `${checkpoint}.pending-${orphanToken}-extra`,
    `${checkpoint}.pending-${orphanToken.replaceAll("-", "")}`
  ];
  for (const file of similar) fs.writeFileSync(file, "not protocol pending");

  assert.equal(invoke(["execute", checkpoint, "3", "executor"], 3).error, "STALE_CHECKPOINT");
  assert.ok(fs.existsSync(orphan), "stale acquire must not clean before holding the lock");

  const blockingOrphan = `${checkpoint}.pending-${crypto.randomUUID()}`;
  fs.mkdirSync(blockingOrphan);
  const failed = invoke(["execute", checkpoint, "4", "executor"], 1);
  assert.equal(failed.error, "PENDING_CLEANUP_FAILED");
  assert.ok(!fs.existsSync(`${checkpoint}.lock`), "failed orphan migration must close the new lock");
  fs.rmdirSync(blockingOrphan);

  const lease = invoke(["execute", checkpoint, "4", "executor"]);
  assert.ok(!fs.existsSync(orphan), "validated acquire must clean strict UUID orphans");
  for (const file of similar) assert.ok(fs.existsSync(file), `similar file was removed: ${file}`);

  fs.writeFileSync(lease.pendingPath, checkpointText("5", "executor", "abort-current"));
  invoke(["abort", checkpoint, lease.token]);
  assert.ok(!fs.existsSync(lease.pendingPath));
  assertNoProtocolPending(checkpoint);
  for (const file of similar) assert.ok(fs.existsSync(file), `similar file was removed: ${file}`);
}

function recoveryCleansPending() {
  const preCommit = tempCase();
  const preCommitText = checkpointText("0", "executor", "pre-commit-canonical");
  fs.writeFileSync(preCommit.checkpoint, preCommitText);
  const preCommitLease = invoke(["execute", preCommit.checkpoint, "0", "executor"]);
  fs.writeFileSync(preCommitLease.pendingPath, checkpointText("1", "executor", "unpublished"));
  assert.equal(invoke(["recover", preCommit.checkpoint, preCommitLease.token, "executor"]).phase, "pre-commit");
  assert.equal(fs.readFileSync(preCommit.checkpoint, "utf8"), preCommitText);
  assert.ok(!fs.existsSync(preCommitLease.pendingPath));
  assertNoProtocolPending(preCommit.checkpoint);

  const prepared = tempCase();
  const preparedBefore = checkpointText("03", "executor", "legacy-before");
  const preparedAfter = checkpointText("04", "verifier", "legacy-staged");
  const preparedToken = crypto.randomUUID();
  fs.writeFileSync(prepared.checkpoint, preparedBefore);
  fs.writeFileSync(`${prepared.checkpoint}.pending-${preparedToken}`, preparedAfter);
  writeLock(prepared.checkpoint, {
    schemaVersion: 3,
    owner: "executor:legacy/prepared",
    token: preparedToken,
    expectedRevision: "03",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(preparedBefore),
    nextRevision: "04",
    nextOwner: "verifier",
    plannedCheckpointSha256: sha256(preparedAfter)
  });
  assert.equal(invoke(["status", prepared.checkpoint]).phase, "prepared-pre-rename");
  assert.equal(invoke(["recover", prepared.checkpoint, preparedToken, "executor"]).phase, "prepared-pre-rename");
  assert.equal(fs.readFileSync(prepared.checkpoint, "utf8"), preparedBefore);
  assert.ok(!fs.existsSync(`${prepared.checkpoint}.pending-${preparedToken}`));
  assertNoProtocolPending(prepared.checkpoint);

  const postCommit = tempCase();
  const postCommitBefore = checkpointText("5", "executor", "before-publish");
  const postCommitAfter = checkpointText("6", "verifier", "published-canonical");
  const postCommitToken = crypto.randomUUID();
  fs.writeFileSync(postCommit.checkpoint, postCommitAfter);
  fs.writeFileSync(`${postCommit.checkpoint}.pending-${postCommitToken}`, "duplicate unpublished data");
  writeLock(postCommit.checkpoint, {
    schemaVersion: 4,
    writer: "executor:post-commit-recovery",
    token: postCommitToken,
    route: null,
    expectedRevision: "5",
    expectedOwner: "executor",
    expectedCheckpointSha256: sha256(postCommitBefore),
    nextRevision: "6",
    nextOwner: "verifier",
    plannedCheckpointSha256: sha256(postCommitAfter)
  });
  assert.equal(invoke(["status", postCommit.checkpoint]).phase, "post-commit");
  assert.equal(invoke(["recover", postCommit.checkpoint, postCommitToken, "verifier"]).phase, "post-commit");
  assert.equal(fs.readFileSync(postCommit.checkpoint, "utf8"), postCommitAfter);
  assert.ok(!fs.existsSync(`${postCommit.checkpoint}.pending-${postCommitToken}`));
  assertNoProtocolPending(postCommit.checkpoint);

  const repeated = tempCase();
  const repeatedText = checkpointText("8", "executor", "stable-canonical");
  fs.writeFileSync(repeated.checkpoint, repeatedText);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const lease = invoke(["execute", repeated.checkpoint, "8", "executor"]);
    fs.writeFileSync(lease.pendingPath, checkpointText("9", "executor", `attempt-${attempt}`));
    invoke(["recover", repeated.checkpoint, lease.token, "executor"]);
    assert.equal(fs.readFileSync(repeated.checkpoint, "utf8"), repeatedText);
    assert.ok(!fs.existsSync(lease.pendingPath));
    assertNoProtocolPending(repeated.checkpoint);
  }
}

function cleanupFailureKeepsLock() {
  const { checkpoint } = tempCase();
  const canonical = checkpointText("10", "executor", "cleanup-failure-canonical");
  fs.writeFileSync(checkpoint, canonical);
  const lease = invoke(["execute", checkpoint, "10", "executor"]);
  fs.mkdirSync(lease.pendingPath);

  assert.equal(invoke(["recover", checkpoint, lease.token, "executor"], 1).error, "PENDING_CLEANUP_FAILED");
  assert.equal(invoke(["status", checkpoint]).state, "locked");
  assert.equal(fs.readFileSync(checkpoint, "utf8"), canonical);

  fs.rmdirSync(lease.pendingPath);
  invoke(["recover", checkpoint, lease.token, "executor"]);
  assert.equal(invoke(["status", checkpoint]).state, "unlocked");
  assertNoProtocolPending(checkpoint);
}

function terminalPathsCleanPending() {
  const committed = tempCase();
  fs.writeFileSync(committed.checkpoint, checkpointText("0", "executor", "commit-before"));
  const commitLease = invoke(["execute", committed.checkpoint, "0", "verifier"]);
  const committedText = checkpointText("1", "verifier", "commit-after");
  fs.writeFileSync(commitLease.pendingPath, committedText);
  invoke(["commit", committed.checkpoint, commitLease.token]);
  assert.equal(fs.readFileSync(committed.checkpoint, "utf8"), committedText);
  assert.ok(!fs.existsSync(commitLease.pendingPath));
  assertNoProtocolPending(committed.checkpoint);

  const abortLease = invoke(["verify", committed.checkpoint, "1", "NEXT_ITERATION"]);
  fs.mkdirSync(abortLease.pendingPath);
  assert.equal(invoke(["abort", committed.checkpoint, abortLease.token], 1).error, "PENDING_CLEANUP_FAILED");
  assert.equal(invoke(["status", committed.checkpoint]).state, "locked");
  fs.rmdirSync(abortLease.pendingPath);
  invoke(["abort", committed.checkpoint, abortLease.token]);
  assert.equal(fs.readFileSync(committed.checkpoint, "utf8"), committedText);
  assertNoProtocolPending(committed.checkpoint);
}

function legacyAlphaGoalPostCommitTermination() {
  for (const legacy of [
    { name: "reframe", route: null },
    { name: "return", route: "RETURN_TO_ALPHA_GOAL" }
  ]) {
    const { checkpoint } = tempCase();
    const beforeText = checkpointText("20", "verifier", `${legacy.name}-before`);
    const alphaGoalText = checkpointText("21", "alpha-goal", `${legacy.name}-committed`);
    fs.writeFileSync(checkpoint, alphaGoalText);
    const token = crypto.randomUUID();
    fs.mkdirSync(`${checkpoint}.lock`);
    fs.writeFileSync(`${checkpoint}.lock/owner.json`, JSON.stringify({
      schemaVersion: 4,
      writer: `verifier:old-${legacy.name}`,
      token,
      route: legacy.route,
      expectedRevision: "20",
      expectedOwner: "verifier",
      expectedCheckpointSha256: sha256(beforeText),
      nextRevision: "21",
      nextOwner: "alpha-goal",
      plannedCheckpointSha256: sha256(alphaGoalText)
    }));

    const status = invoke(["status", checkpoint]);
    assert.equal(status.phase, "post-commit");
    assert.ok(status.recoverableBy.includes("alpha-goal"));
    assert.ok(status.recoverableBy.includes("executor"));
    assert.equal(invoke(["commit", checkpoint, token], 1).error, "LEGACY_TRANSITION");
    invoke(["recover", checkpoint, token, "executor"]);
    assert.equal(fs.readFileSync(checkpoint, "utf8"), alphaGoalText);

    const terminated = invoke(["terminate", checkpoint, "21"]);
    assert.equal(terminated.action, "terminate");
    assert.equal(terminated.route, null);
    assert.match(terminated.writer, /^executor:terminate-/);
    assert.deepEqual(terminated.from, { revision: "21", owner: "alpha-goal" });
    assert.deepEqual(terminated.to, { revision: "22", owner: "caller" });
    stageAndCommit(checkpoint, terminated, `${legacy.name}-terminated`);
    assert.match(fs.readFileSync(checkpoint, "utf8"), /active_owner: caller/);
  }
}

async function main() {
  try {
    semanticLifecycle();
    executorTerminate();
    routeMapping();
    rejectedMisuse();
    acquireCleansOnlyProtocolOrphans();
    recoveryCleansPending();
    cleanupFailureKeepsLock();
    terminalPathsCleanPending();
    legacyRelease();
    legacyRecovery();
    legacyAlphaGoalPostCommitTermination();
    await concurrentInit();
    console.log("PASS: checkpoint lock semantic, pending cleanup, terminate, misuse, concurrency, and recovery tests");
  } finally {
    for (const dir of temporaryRoots) fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
