#!/usr/bin/env node
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const owners = ["none", "alpha-goal", "executor", "verifier", "caller"];
const routeOwner = { PASS_TO_FINAL: "caller", NEXT_ITERATION: "executor", BLOCKED: "caller" };
const legacyRouteOwner = { ...routeOwner, RETURN_TO_ALPHA_GOAL: "alpha-goal" };
const writerPattern = /^(executor|verifier):[A-Za-z0-9][\w.-]{0,127}$/;
const tokenPattern = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
const revisionPattern = /^(0|[1-9]\d*)$/;
const legacyRevisionPattern = /^\d+$/;
const digestPattern = /^[\da-f]{64}$/;

function fail(error, message, code = 1, extra) {
  const failure = new Error(message); Object.assign(failure, { error, code, extra }); throw failure;
}
function print(value, stream = process.stdout) { stream.write(`${JSON.stringify(value)}\n`); }
function done(action, token, phase) { print({ ok: true, action, token, phase }); }
function usage() { fail("USAGE", "commands: init execute verify terminate status commit abort release recover"); }
function arity(args, size) { if (args.length !== size) usage(); }
function validRevision(value) { return typeof value === "string" && revisionPattern.test(value); }
function nextRevision(value) {
  if (!validRevision(value)) fail("INVALID_REVISION", "invalid revision");
  return (BigInt(value) + 1n).toString();
}
function writerRole(value) {
  if (!writerPattern.test(value || "")) fail("INVALID_WRITER", "invalid writer");
  return value.split(":", 1)[0];
}
function validOwner(value) { if (!owners.includes(value)) fail("INVALID_OWNER", "invalid owner"); }
function validToken(value) { if (!tokenPattern.test(value || "")) fail("INVALID_TOKEN", "invalid token"); }

function transition(t, existing = false) {
  const role = writerRole(t.writer);
  validOwner(t.expectedOwner); validOwner(t.nextOwner);
  let action = null, route = t.route ?? null;
  if (t.expectedRevision === "absent") {
    if (role === "executor" && t.expectedOwner === "none" && t.nextRevision === "0" && t.nextOwner === "executor" && route === null) action = "init";
  } else {
    const next = nextRevision(t.expectedRevision);
    if (t.nextRevision !== next) fail("INVALID_TRANSITION", "revision increment");
    if (existing && role === t.expectedOwner && ["executor", "verifier"].includes(role) && t.nextOwner === "alpha-goal" && route === null) action = "reframe";
    else if (existing && role === "executor" && ["alpha-goal", "caller"].includes(t.expectedOwner) && t.nextOwner === "executor" && route === null) action = "supersede";
    else if (t.nextOwner === "caller" && route === null &&
        ((role === t.expectedOwner && ["executor", "verifier"].includes(role)) ||
         (role === "executor" && t.expectedOwner === "alpha-goal"))) action = "terminate";
    else if (role === "executor" && t.expectedOwner === "executor" && ["executor", "verifier"].includes(t.nextOwner) && route === null) action = "execute";
    else if (role === "verifier" && t.expectedOwner === "verifier") {
      if (route !== null) {
        const routes = existing ? legacyRouteOwner : routeOwner;
        if (!Object.hasOwn(routes, route) || routes[route] !== t.nextOwner) fail("INVALID_TRANSITION", "route mismatch");
      } else if (["executor", "caller"].includes(t.nextOwner)) {
        route = t.nextOwner === "executor" ? "NEXT_ITERATION" : null;
      } else fail("INVALID_TRANSITION", "invalid target");
      action = "verify";
    }
  }
  if (!action || t.nextOwner === "none") fail("INVALID_TRANSITION", "invalid transition");
  return { action, route };
}
function resolveCheckpoint(raw) {
  const checkpoint = path.resolve(raw || "");
  if (path.basename(checkpoint) !== "checkpoint.md") fail("INVALID_CHECKPOINT", "invalid target");
  if (!fs.existsSync(path.dirname(checkpoint))) fail("INVALID_CHECKPOINT", "missing parent");
  return { checkpoint, lock: `${checkpoint}.lock`, ownerFile: `${checkpoint}.lock/owner.json` };
}
function regularFile(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("invalid file");
  return fs.readFileSync(file);
}
function snapshot(c, file = c.checkpoint, canonical = false) {
  if (!fs.existsSync(file)) {
    if (file === c.checkpoint) return { revision: "absent", owner: "none", digest: "absent" };
    throw new Error("missing staged checkpoint");
  }
  const input = regularFile(file), text = input.toString("utf8");
  const revisions = [...text.matchAll(/^checkpoint_revision:\s*(\S+)\s*$/gm)];
  const activeOwners = [...text.matchAll(/^active_owner:\s*(\S+)\s*$/gm)];
  if (revisions.length !== 1 || activeOwners.length !== 1) throw new Error("ambiguous checkpoint");
  const rawRevision = revisions[0][1], owner = activeOwners[0][1];
  if (!legacyRevisionPattern.test(rawRevision) || !owners.includes(owner) || owner === "none") throw new Error("invalid checkpoint state");
  const revision = BigInt(rawRevision).toString();
  if (canonical && revision !== rawRevision) throw new Error("noncanonical staged revision");
  return { revision, owner, digest: crypto.createHash("sha256").update(input).digest("hex") };
}
function same(actual, revision, owner, digest) { return actual.revision === revision && actual.owner === owner && actual.digest === digest; }
function pendingPath(c, token) { return `${c.checkpoint}.pending-${token}`; }
function cleanupOrphanPending(c) {
  const directory = path.dirname(c.checkpoint), prefix = `${path.basename(c.checkpoint)}.pending-`;
  let names;
  try { names = fs.readdirSync(directory); } catch (error) { fail("PENDING_CLEANUP_FAILED", error.message, 1, { nextAction: "retry" }); }
  for (const name of names) {
    if (!name.startsWith(prefix) || !tokenPattern.test(name.slice(prefix.length))) continue;
    try { fs.unlinkSync(path.join(directory, name)); } catch (error) {
      if (error.code !== "ENOENT") fail("PENDING_CLEANUP_FAILED", error.message, 1, { nextAction: "retry" });
    }
  }
}
function cleanupCurrentPending(c, token) {
  try { fs.unlinkSync(pendingPath(c, token)); } catch (error) {
    if (error.code !== "ENOENT") fail("PENDING_CLEANUP_FAILED", error.message, 1, { nextAction: "status" });
  }
}
function close(c, token) {
  const closed = `${c.lock}.closed-${token}`;
  fs.renameSync(c.lock, closed);
  try { fs.rmSync(closed, { recursive: true, force: true }); } catch (_) {}
}

function readOwner(c) {
  try {
    if (!fs.lstatSync(c.lock).isDirectory()) throw new Error();
    const raw = JSON.parse(regularFile(c.ownerFile).toString("utf8"));
    const legacy = raw?.schemaVersion === 3;
    const writer = legacy ? `${String(raw.owner).split(":", 1)[0]}:legacy` : raw?.writer;
    if (![3, 4].includes(raw?.schemaVersion)) throw new Error();
    validToken(raw.token);
    if (!(raw.expectedCheckpointSha256 === "absent" || digestPattern.test(raw.expectedCheckpointSha256)) ||
        !(raw.plannedCheckpointSha256 === null || digestPattern.test(raw.plannedCheckpointSha256)) ||
        (raw.expectedRevision === "absent") !== (raw.expectedCheckpointSha256 === "absent")) throw new Error();
    const expectedRevision = legacy && raw.expectedRevision !== "absent" ? BigInt(raw.expectedRevision).toString() : raw.expectedRevision;
    const nextRevision = legacy ? BigInt(raw.nextRevision).toString() : raw.nextRevision;
    const derived = transition({ ...raw, writer, expectedRevision, nextRevision, route: raw.route ?? null }, true);
    return { ...raw, raw, writer: legacy ? raw.owner : writer, expectedRevision, nextRevision, legacy, action: derived.action };
  } catch (error) {
    if (error.error) throw error;
    fail("INVALID_LOCK", "invalid lock metadata");
  }
}
function inspect(c, record) {
  let current;
  try { current = snapshot(c); } catch (_) { return { phase: "invalid-snapshot", recoverableBy: [] }; }
  const before = same(current, record.expectedRevision, record.expectedOwner, record.expectedCheckpointSha256);
  const after = record.plannedCheckpointSha256 !== null && same(current, record.nextRevision, record.nextOwner, record.plannedCheckpointSha256);
  const allowed = new Set(); let phase = "diverged";
  if (before) {
    phase = record.plannedCheckpointSha256 === null ? "pre-commit" : "prepared-pre-rename";
    if (current.owner !== "none") allowed.add(current.owner);
    if (record.writer.startsWith("executor:") && ["none", "alpha-goal", "caller"].includes(current.owner)) allowed.add("executor");
  } else if (after) {
    phase = "post-commit"; allowed.add(current.owner);
    if (current.owner === "alpha-goal" && (record.action === "reframe" || record.route === "RETURN_TO_ALPHA_GOAL")) allowed.add("executor");
  }
  return { phase, recoverableBy: [...allowed] };
}
function requireLock(c, token) {
  if (!fs.existsSync(c.lock)) fail("LOCK_NOT_HELD", "missing lock");
  const record = readOwner(c);
  if (record.token !== token) fail("TOKEN_MISMATCH", "token mismatch");
  return record;
}
function held(c) {
  const record = readOwner(c);
  fail("LOCK_HELD", "locked", 2, { actual: record.writer });
}

function acquire(c, t) {
  const derived = transition(t);
  if (fs.existsSync(c.lock)) held(c);
  let before;
  try { before = snapshot(c); } catch (error) { fail("INVALID_CHECKPOINT", error.message); }
  if (before.revision !== t.expectedRevision || before.owner !== t.expectedOwner) {
    fail("STALE_CHECKPOINT", "stale checkpoint", 3, { expected: { revision: t.expectedRevision, owner: t.expectedOwner }, actual: before });
  }
  const token = crypto.randomUUID();
  const record = { schemaVersion: 4, writer: t.writer, token, route: t.route ?? derived.route,
    expectedRevision: t.expectedRevision, expectedOwner: t.expectedOwner, expectedCheckpointSha256: before.digest,
    nextRevision: t.nextRevision, nextOwner: t.nextOwner, plannedCheckpointSha256: null, createdAt: new Date().toISOString() };
  const pending = `${c.lock}.pending-${token}`;
  try {
    fs.mkdirSync(pending, { mode: 0o700 });
    fs.writeFileSync(`${pending}/owner.json`, `${JSON.stringify(record)}\n`, { flag: "wx", mode: 0o600 });
    if (fs.existsSync(c.lock)) throw new Error("lock raced");
    fs.renameSync(pending, c.lock);
  } catch (error) {
    fs.rmSync(pending, { recursive: true, force: true });
    if (fs.existsSync(c.lock)) held(c);
    fail("ACQUIRE_FAILED", error.message);
  }
  try {
    const current = snapshot(c);
    if (!same(current, record.expectedRevision, record.expectedOwner, record.expectedCheckpointSha256)) {
      close(c, token); fail("STALE_CHECKPOINT", "checkpoint changed", 3);
    }
  } catch (error) {
    if (fs.existsSync(c.lock)) try { close(c, token); } catch (_) {}
    if (error.error) throw error;
    fail("STALE_CHECKPOINT", error.message, 3);
  }
  requireLock(c, token);
  try { cleanupOrphanPending(c); } catch (error) {
    try { close(c, token); } catch (closeError) {
      if (error.error) error.extra = { ...error.extra, closeError: closeError.message, nextAction: "status" };
      throw error;
    }
    throw error;
  }
  print({ ok: true, action: derived.action, token, pendingPath: pendingPath(c, token),
    from: { revision: record.expectedRevision, owner: record.expectedOwner },
    to: { revision: record.nextRevision, owner: record.nextOwner }, route: record.route, writer: record.writer });
}
function semantic(args, c) {
  const command = args[0], revision = args[2];
  let role = "executor", expectedOwner, nextOwner, route = null, next;
  if (command === "init") { arity(args, 2); return { writer: `executor:init-${crypto.randomUUID()}`, expectedRevision: "absent", expectedOwner: "none", nextRevision: "0", nextOwner: "executor", route }; }
  arity(args, command === "terminate" ? 3 : 4); next = nextRevision(revision);
  if (command === "execute") {
    if (!["executor", "verifier"].includes(args[3])) fail("INVALID_OWNER", "invalid execute target");
    expectedOwner = "executor"; nextOwner = args[3];
  } else if (command === "verify") {
    if (!Object.hasOwn(routeOwner, args[3])) fail("INVALID_ROUTE", "invalid route");
    role = "verifier"; expectedOwner = "verifier"; route = args[3]; nextOwner = routeOwner[route];
  } else {
    let current;
    try { current = snapshot(c); } catch (error) { fail("INVALID_CHECKPOINT", error.message); }
    if (!["alpha-goal", "executor", "verifier"].includes(current.owner)) fail("INVALID_TRANSITION", "invalid owner");
    role = current.owner === "alpha-goal" ? "executor" : current.owner;
    expectedOwner = current.owner; nextOwner = "caller";
  }
  return { writer: `${role}:${command}-${crypto.randomUUID()}`, expectedRevision: revision, expectedOwner, nextRevision: next, nextOwner, route };
}
function status(c) {
  if (!fs.existsSync(c.lock)) return print({ ok: true, state: "unlocked", phase: "unlocked", recoverableBy: [] });
  let record;
  try { record = readOwner(c); } catch (error) {
    if (error.error) error.extra = { ...error.extra, state: "locked", phase: "invalid-lock", recoverableBy: [] };
    throw error;
  }
  const state = inspect(c, record);
  print({ ok: true, state: "locked", ...state, token: record.token, writer: record.writer, createdAt: record.createdAt });
}
function commit(c, token) {
  validToken(token); const record = requireLock(c, token);
  if (["reframe", "supersede"].includes(record.action) || record.route === "RETURN_TO_ALPHA_GOAL") fail("LEGACY_TRANSITION", "recover or abort obsolete transition lock");
  let before, staged;
  try { before = snapshot(c); } catch (error) { fail("INVALID_CHECKPOINT", error.message); }
  if (!same(before, record.expectedRevision, record.expectedOwner, record.expectedCheckpointSha256)) fail("STALE_CHECKPOINT", "digest CAS failed", 3);
  try { staged = snapshot(c, pendingPath(c, token), !record.legacy); } catch (error) { fail("INVALID_STAGED_CHECKPOINT", error.message); }
  if (staged.revision !== record.nextRevision || staged.owner !== record.nextOwner) fail("INVALID_STAGED_CHECKPOINT", "staged mismatch");
  const prepared = { ...record.raw, plannedCheckpointSha256: staged.digest };
  try {
    fs.writeFileSync(`${c.lock}/.owner.pending-${token}`, `${JSON.stringify(prepared)}\n`, { flag: "wx", mode: 0o600 });
    fs.renameSync(`${c.lock}/.owner.pending-${token}`, c.ownerFile);
    fs.renameSync(pendingPath(c, token), c.checkpoint);
    if (!same(snapshot(c), record.nextRevision, record.nextOwner, staged.digest)) fail("COMMIT_FAILED", "invalid post-write", 3);
    close(c, token);
  } catch (error) {
    if (error.error) throw error;
    fail("COMMIT_FAILED", error.message);
  }
  done("commit", token, "committed");
}
function release(c, token) {
  validToken(token);
  if (!fs.existsSync(c.lock)) return done("release", token, "none");
  const record = requireLock(c, token);
  if (!record.legacy) fail("RELEASE_NOT_ALLOWED", "use abort");
  const phase = inspect(c, record).phase;
  if (!phase.endsWith("commit")) fail("RELEASE_NOT_ALLOWED", "unsafe release");
  cleanupCurrentPending(c, token);
  close(c, token); done("release", token, phase);
}

function abort(c, token) {
  validToken(token); const record = requireLock(c, token);
  if (record.plannedCheckpointSha256 !== null || inspect(c, record).phase !== "pre-commit") fail("ABORT_NOT_ALLOWED", "not pre-commit");
  cleanupCurrentPending(c, token); close(c, token); done("abort", token, "aborted");
}

function recover(c, token, actor) {
  validToken(token); validOwner(actor); if (actor === "none") fail("INVALID_OWNER", "invalid actor");
  const record = requireLock(c, token), state = inspect(c, record);
  if (!state.recoverableBy.includes(actor)) fail("RECOVERY_NOT_ALLOWED", "recovery failed", 1, { nextAction: "inspect" });
  cleanupCurrentPending(c, token);
  close(c, token); done("recover", token, state.phase);
}

function main() {
  const args = process.argv.slice(2); if (args.length < 2) usage();
  const c = resolveCheckpoint(args[1]), command = args[0];
  if (command === "status") { arity(args, 2); return status(c); }
  if (["init", "execute", "verify", "terminate"].includes(command)) return acquire(c, semantic(args, c));
  if (["commit", "release", "abort"].includes(command)) { arity(args, 3); return { commit, release, abort }[command](c, args[2]); }
  if (command === "recover") { arity(args, 4); return recover(c, args[2], args[3]); }
  usage();
}
try { main(); } catch (error) {
  if (error.error) { print({ ok: false, error: error.error, message: error.message, ...error.extra }, process.stderr); process.exit(error.code); }
  print({ ok: false, error: "INTERNAL_ERROR", message: error.message || String(error) }, process.stderr); process.exit(1);
}
