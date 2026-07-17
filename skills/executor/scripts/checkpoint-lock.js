#!/usr/bin/env node
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const owners = ["none", "alpha-goal", "executor", "verifier", "caller"];
const routeOwner = { PASS_TO_FINAL: "caller", NEXT_ITERATION: "executor", BLOCKED: "caller" };
const revisionPattern = /^(0|[1-9]\d*)$/;
const legacyRevisionPattern = /^\d+$/;

function problem(error, message, code = 1, extra) {
  const failure = new Error(message); Object.assign(failure, { error, code, extra }); return failure;
}
function fail(error, message, code = 1, extra) { throw problem(error, message, code, extra); }
function print(value, stream = process.stdout) { stream.write(`${JSON.stringify(value)}\n`); }
function usage() { fail("USAGE", "commands: init execute verify terminate; provide the complete successor on stdin"); }
function arity(args, size) { if (args.length !== size) usage(); }
function validRevision(value) { return typeof value === "string" && revisionPattern.test(value); }
function nextRevision(value) {
  if (!validRevision(value)) fail("INVALID_REVISION", "invalid revision");
  return (BigInt(value) + 1n).toString();
}

function resolveCheckpoint(raw) {
  const requested = path.resolve(raw || "");
  if (path.basename(requested) !== "checkpoint.md") fail("INVALID_CHECKPOINT", "invalid target");
  if (!fs.existsSync(path.dirname(requested))) fail("INVALID_CHECKPOINT", "missing parent");
  let checkpoint;
  try { checkpoint = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested)); }
  catch (error) { fail("INVALID_CHECKPOINT", error.message); }
  const identity = crypto.createHash("sha256").update(checkpoint).digest("hex").slice(0, 32);
  const uid = typeof process.getuid === "function" ? process.getuid() : "user";
  return { checkpoint, staged: path.join(path.dirname(checkpoint), `.${path.basename(checkpoint)}.successor`),
    legacyLock: `${checkpoint}.lock`, lock: path.join(os.tmpdir(), `alpha-goal-checkpoint-${uid}-${identity}.lock`) };
}
function regularFile(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("invalid file");
  return fs.readFileSync(file);
}
function describe(input, canonical = false) {
  const text = input.toString("utf8");
  const revisions = [...text.matchAll(/^checkpoint_revision:\s*(\S+)\s*$/gm)];
  const activeOwners = [...text.matchAll(/^active_owner:\s*(\S+)\s*$/gm)];
  if (revisions.length !== 1 || activeOwners.length !== 1) throw new Error("ambiguous checkpoint");
  const rawRevision = revisions[0][1], owner = activeOwners[0][1];
  if (!legacyRevisionPattern.test(rawRevision) || !owners.includes(owner) || owner === "none") throw new Error("invalid checkpoint state");
  const revision = BigInt(rawRevision).toString();
  if (canonical && revision !== rawRevision) throw new Error("noncanonical successor revision");
  return { revision, owner, digest: crypto.createHash("sha256").update(input).digest("hex") };
}
function snapshot(file, absent = false) {
  if (!fs.existsSync(file)) {
    if (absent) return { revision: "absent", owner: "none", digest: "absent" };
    throw new Error("missing checkpoint");
  }
  return describe(regularFile(file));
}
function same(left, right) {
  return left.revision === right.revision && left.owner === right.owner && left.digest === right.digest;
}

function transition(args, current) {
  const command = args[0], revision = args[2];
  if (command === "init") {
    arity(args, 2);
    return { action: "init", route: null, expectedRevision: "absent", expectedOwner: "none", nextRevision: "0", nextOwner: "executor" };
  }
  if (command === "execute") {
    arity(args, 4);
    if (!["executor", "verifier"].includes(args[3])) fail("INVALID_OWNER", "invalid execute target");
    return { action: "execute", route: null, expectedRevision: revision, expectedOwner: "executor", nextRevision: nextRevision(revision), nextOwner: args[3] };
  }
  if (command === "verify") {
    arity(args, 4);
    if (!Object.hasOwn(routeOwner, args[3])) fail("INVALID_ROUTE", "invalid route");
    return { action: "verify", route: args[3], expectedRevision: revision, expectedOwner: "verifier", nextRevision: nextRevision(revision), nextOwner: routeOwner[args[3]] };
  }
  if (command === "terminate") {
    arity(args, 3);
    if (!["alpha-goal", "executor", "verifier"].includes(current.owner)) fail("INVALID_TRANSITION", "invalid owner");
    return { action: "terminate", route: null, expectedRevision: revision, expectedOwner: current.owner, nextRevision: nextRevision(revision), nextOwner: "caller" };
  }
  usage();
}

function clearStaged(c) {
  if (!fs.existsSync(c.staged)) return;
  const stat = fs.lstatSync(c.staged);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) fail("UNSAFE_SUCCESSOR", "unsafe fixed successor");
  fs.unlinkSync(c.staged);
}

function update(args, c, input) {
  let before;
  try { before = snapshot(c.checkpoint, true); } catch (error) { fail("INVALID_CHECKPOINT", error.message); }
  const change = transition(args, before);
  if (before.revision !== change.expectedRevision || before.owner !== change.expectedOwner) {
    fail("STALE_CHECKPOINT", "stale checkpoint", 3, {
      expected: { revision: change.expectedRevision, owner: change.expectedOwner },
      actual: { revision: before.revision, owner: before.owner, digest: before.digest }
    });
  }
  if (input.length === 0) fail("INVALID_SUCCESSOR", "empty stdin");
  let successor;
  try { successor = describe(input, true); } catch (error) { fail("INVALID_SUCCESSOR", error.message); }
  if (successor.revision !== change.nextRevision || successor.owner !== change.nextOwner) {
    fail("INVALID_SUCCESSOR", "successor transition mismatch", 1, {
      expected: { revision: change.nextRevision, owner: change.nextOwner },
      actual: { revision: successor.revision, owner: successor.owner }
    });
  }
  let current;
  try { current = snapshot(c.checkpoint, true); } catch (error) { fail("INVALID_CHECKPOINT", error.message); }
  if (!same(current, before)) fail("STALE_CHECKPOINT", "digest CAS failed", 3);
  let descriptor, stagedOwned = false;
  try {
    clearStaged(c);
    descriptor = fs.openSync(c.staged, "wx", 0o600);
    stagedOwned = true;
    fs.writeFileSync(descriptor, input);
    fs.closeSync(descriptor); descriptor = undefined;
    fs.renameSync(c.staged, c.checkpoint);
    const published = snapshot(c.checkpoint);
    if (!same(published, successor)) fail("WRITE_FAILED", "invalid published checkpoint", 3);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (stagedOwned) fs.rmSync(c.staged, { force: true });
  }
  print({ ok: true, action: change.action, route: change.route,
    from: { revision: before.revision, owner: before.owner },
    to: { revision: successor.revision, owner: successor.owner } });
}

function runWithSystemLock(c, action) {
  let command, lockArgs;
  const holder = "process.stdout.write('LOCKED\\n'); process.stdin.resume();";
  if (process.platform === "darwin") {
    command = "/usr/bin/lockf";
    lockArgs = ["-t", "0", c.lock, process.execPath, "-e", holder];
  } else if (process.platform === "linux") {
    command = "flock";
    lockArgs = ["-E", "75", "-n", c.lock, process.execPath, "-e", holder];
  } else {
    fail("UNSUPPORTED_PLATFORM", "checkpoint locking requires lockf on macOS or flock on Linux");
  }
  return new Promise((resolve, reject) => {
    const child = spawn(command, lockArgs, { stdio: ["pipe", "pipe", "pipe"] });
    let ready = false, stdout = "", stderr = "", actionError = null;
    child.once("error", error => reject(problem("LOCK_FAILED", error.message)));
    child.stdin.on("error", error => { if (!actionError) actionError = problem("LOCK_FAILED", error.message); });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.stdout.on("data", chunk => {
      stdout += chunk;
      if (ready || !stdout.includes("LOCKED")) return;
      ready = true;
      try { action(); } catch (error) { actionError = error; }
      child.stdin.end();
    });
    child.once("close", code => {
      if (actionError) return reject(actionError);
      if (code === 75) return reject(problem("LOCK_HELD", "checkpoint writer active", 2));
      if (!ready || code !== 0) return reject(problem("LOCK_FAILED", stderr.trim() || `lock holder exited ${code}`));
      resolve();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) usage();
  const checkpoint = resolveCheckpoint(args[1]);
  if (fs.existsSync(checkpoint.legacyLock)) fail("LEGACY_LOCK_PRESENT", "resolve the legacy checkpoint lock with the previous helper before retrying");
  const input = fs.readFileSync(0);
  await runWithSystemLock(checkpoint, () => update(args, checkpoint, input));
}

function report(error) {
  if (error.error) { print({ ok: false, error: error.error, message: error.message, ...error.extra }, process.stderr); process.exit(error.code); }
  print({ ok: false, error: "INTERNAL_ERROR", message: error.message || String(error) }, process.stderr); process.exit(1);
}
if (require.main === module) main().catch(report);
