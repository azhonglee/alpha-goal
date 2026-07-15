#!/usr/bin/env node
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function usage() {
  fail("usage: checkpoint-lock.js acquire <checkpoint.md> <executor|verifier:operation-id> <expected-revision> <expected-owner> <next-revision> <next-owner> | commit|release <checkpoint.md> <token> | recover <checkpoint.md> <token> <actor> | status <checkpoint.md>");
}

const [command, rawCheckpoint, value, arg4, arg5, arg6, arg7] = process.argv.slice(2);
if (!command || !rawCheckpoint) usage();

const checkpoint = path.resolve(rawCheckpoint);
if (path.basename(checkpoint) !== "checkpoint.md") fail("lock target must be named checkpoint.md");
if (!fs.existsSync(path.dirname(checkpoint))) fail("checkpoint parent directory does not exist");

const lockDir = `${checkpoint}.lock`;
const ownerFile = path.join(lockDir, "owner.json");
const validOwners = new Set(["none", "alpha-goal", "executor", "verifier", "caller"]);

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readCheckpointSnapshot(file = checkpoint) {
  if (!fs.existsSync(file)) return { revision: "absent", owner: "none", digest: "absent" };
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`checkpoint is not a regular file: ${file}`);
  const input = fs.readFileSync(file);
  const text = input.toString("utf8");
  const revisions = [...text.matchAll(/^checkpoint_revision:\s*(\S+)\s*$/gm)].map(match => match[1]);
  const owners = [...text.matchAll(/^active_owner:\s*(\S+)\s*$/gm)].map(match => match[1]);
  if (revisions.length !== 1 || owners.length !== 1) throw new Error(`checkpoint state fields are missing or ambiguous: ${file}`);
  return { revision: revisions[0], owner: owners[0], digest: sha256(input) };
}

function readOwner() {
  try {
    const data = JSON.parse(fs.readFileSync(ownerFile, "utf8"));
    if (!data || data.schemaVersion !== 3 || typeof data.owner !== "string" || typeof data.token !== "string" ||
        typeof data.expectedRevision !== "string" || typeof data.expectedOwner !== "string" ||
        typeof data.expectedCheckpointSha256 !== "string" || typeof data.nextRevision !== "string" ||
        typeof data.nextOwner !== "string" ||
        !(data.plannedCheckpointSha256 === null || /^[a-f0-9]{64}$/.test(data.plannedCheckpointSha256))) {
      fail(`checkpoint lock metadata is malformed: ${ownerFile}`);
    }
    return data;
  } catch (error) {
    fail(`cannot read checkpoint lock metadata: ${error.message}`);
  }
}

function closeLock(token) {
  const closedDir = `${lockDir}.closed-${token}`;
  fs.renameSync(lockDir, closedDir);
}

function sameSnapshot(snapshot, revision, owner, digest) {
  return snapshot.revision === revision && snapshot.owner === owner && snapshot.digest === digest;
}

if (command === "acquire") {
  const writerId = value;
  const expectedRevision = arg4;
  const expectedOwner = arg5;
  const nextRevision = arg6;
  const nextOwner = arg7;
  if (!writerId || !expectedRevision || !expectedOwner || !nextRevision || !nextOwner) usage();
  const writerRole = writerId.split(":", 1)[0];
  if (!new Set(["executor", "verifier"]).has(writerRole) || !writerId.includes(":")) fail("writer id must be executor:<operation-id> or verifier:<operation-id>");
  if (!validOwners.has(expectedOwner) || !validOwners.has(nextOwner) || nextOwner === "none") fail("checkpoint owner is invalid");
  if (expectedRevision === "absent") {
    if (expectedOwner !== "none" || nextRevision !== "0") fail("initial transition must be absent/none -> revision 0");
  } else if (!/^\d+$/.test(expectedRevision) || !/^\d+$/.test(nextRevision) || BigInt(nextRevision) !== BigInt(expectedRevision) + 1n) {
    fail("checkpoint transition must increment revision by one");
  }
  if (fs.existsSync(lockDir)) {
    const current = fs.existsSync(ownerFile) ? readOwner() : { owner: "unknown", createdAt: "unknown" };
    fail(`checkpoint lock is held by ${current.owner} since ${current.createdAt}`, 2);
  }

  let before;
  try {
    before = readCheckpointSnapshot();
  } catch (error) {
    fail(error.message);
  }
  if (before.revision !== expectedRevision || before.owner !== expectedOwner) fail("checkpoint does not match the expected pre-write state", 3);

  const record = {
    schemaVersion: 3,
    owner: writerId,
    token: crypto.randomUUID(),
    expectedRevision,
    expectedOwner,
    expectedCheckpointSha256: before.digest,
    nextRevision,
    nextOwner,
    plannedCheckpointSha256: null,
    createdAt: new Date().toISOString()
  };
  const pendingDir = `${lockDir}.pending-${record.token}`;
  try {
    fs.mkdirSync(pendingDir, { mode: 0o700 });
    fs.writeFileSync(path.join(pendingDir, "owner.json"), `${JSON.stringify(record)}\n`, { flag: "wx", mode: 0o600 });
    if (fs.existsSync(lockDir)) throw Object.assign(new Error("checkpoint lock appeared during acquisition"), { code: "ELOCKED" });
    fs.renameSync(pendingDir, lockDir);
  } catch (error) {
    fs.rmSync(pendingDir, { recursive: true, force: true });
    if (fs.existsSync(lockDir)) {
      const current = fs.existsSync(ownerFile) ? readOwner() : { owner: "unknown", createdAt: "unknown" };
      fail(`checkpoint lock is held by ${current.owner} since ${current.createdAt}`, 2);
    }
    fail(`cannot acquire checkpoint lock: ${error.message}`);
  }

  try {
    const lockedSnapshot = readCheckpointSnapshot();
    if (!sameSnapshot(lockedSnapshot, record.expectedRevision, record.expectedOwner, record.expectedCheckpointSha256)) {
      closeLock(record.token);
      fail("checkpoint changed before lock activation", 3);
    }
  } catch (error) {
    if (fs.existsSync(lockDir)) closeLock(record.token);
    fail(error.message, 3);
  }
  process.stdout.write(`${JSON.stringify(record)}\n`);
  process.exit(0);
}

if (command === "status") {
  process.stdout.write(fs.existsSync(lockDir) ? `${JSON.stringify(readOwner())}\n` : "unlocked\n");
  process.exit(0);
}

if (command === "commit") {
  if (!value || !fs.existsSync(lockDir)) usage();
  const current = readOwner();
  if (current.token !== value) fail("checkpoint lock token does not match");
  let before;
  try {
    before = readCheckpointSnapshot();
  } catch (error) {
    fail(error.message);
  }
  if (!sameSnapshot(before, current.expectedRevision, current.expectedOwner, current.expectedCheckpointSha256)) {
    fail("checkpoint changed after lock acquisition");
  }

  const stagedCheckpoint = `${checkpoint}.pending-${value}`;
  let staged;
  try {
    staged = readCheckpointSnapshot(stagedCheckpoint);
  } catch (error) {
    fail(error.message);
  }
  if (staged.revision !== current.nextRevision || staged.owner !== current.nextOwner) {
    fail("staged checkpoint does not match the planned next state");
  }

  const prepared = { ...current, plannedCheckpointSha256: staged.digest };
  const pendingOwner = path.join(lockDir, `.owner.pending-${value}`);
  try {
    fs.writeFileSync(pendingOwner, `${JSON.stringify(prepared)}\n`, { flag: "wx", mode: 0o600 });
    fs.renameSync(pendingOwner, ownerFile);
    fs.renameSync(stagedCheckpoint, checkpoint);
    const committed = readCheckpointSnapshot();
    if (!sameSnapshot(committed, prepared.nextRevision, prepared.nextOwner, prepared.plannedCheckpointSha256)) {
      fail("committed checkpoint failed post-write validation");
    }
  } catch (error) {
    fail(`cannot commit checkpoint: ${error.message}`);
  }
  process.stdout.write("committed\n");
  process.exit(0);
}

if (command === "release" || command === "recover") {
  if (!value || !fs.existsSync(lockDir)) usage();
  const current = readOwner();
  if (current.token !== value) fail("checkpoint lock token does not match");
  if (command === "recover") {
    const actor = arg4;
    if (!actor || !validOwners.has(actor) || actor === "none") usage();
    let snapshot;
    try {
      snapshot = readCheckpointSnapshot();
    } catch (error) {
      fail(error.message);
    }
    const matchesBefore = sameSnapshot(snapshot, current.expectedRevision, current.expectedOwner, current.expectedCheckpointSha256);
    const matchesAfter = current.plannedCheckpointSha256 !== null &&
      sameSnapshot(snapshot, current.nextRevision, current.nextOwner, current.plannedCheckpointSha256);
    const writerRole = current.owner.split(":", 1)[0];
    const supersessionOrInit = matchesBefore && actor === "executor" && writerRole === "executor" &&
      new Set(["none", "alpha-goal", "caller"]).has(snapshot.owner);
    if ((!matchesBefore && !matchesAfter) || (actor !== snapshot.owner && !supersessionOrInit)) {
      fail("checkpoint snapshot or recovery actor does not match the lock transition");
    }
  }
  try {
    closeLock(value);
  } catch (error) {
    fail(`cannot ${command} checkpoint lock: ${error.message}`);
  }
  process.stdout.write(command === "release" ? "released\n" : "recovered\n");
  process.exit(0);
}

usage();
