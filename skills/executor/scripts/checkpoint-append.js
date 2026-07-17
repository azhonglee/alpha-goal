#!/usr/bin/env node
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const owners = new Set(["alpha-goal", "executor", "verifier", "caller"]);
const routeOwner = {
  PASS_TO_FINAL: "caller",
  NEXT_ITERATION: "executor",
  BLOCKED: "caller",
};
const MAX_RECORD_BYTES = 1024 * 1024;
const MAX_TAIL_SCAN_BYTES = 2 * MAX_RECORD_BYTES + 2 * 64 * 1024;
const allowedFields = new Set([
  "checkpoint_revision",
  "state_revision",
  "active_owner",
  "action",
  "route",
  "termination_reason",
  "task_id",
  "goal_contract_path",
  "accepted_authority_sha256",
  "execution_context",
  "result",
]);

function failure(error, message, code = 1, extra = {}) {
  return Object.assign(new Error(message), { error, code, extra });
}
function fail(error, message, code = 1, extra) {
  throw failure(error, message, code, extra);
}
function print(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value)}\n`);
}
function usage() {
  fail("USAGE", [
    "commands:",
    "init <checkpoint.jsonl> <repository> <worktree> <branch>",
    "execute <checkpoint.jsonl> <expected-revision> <executor|verifier> <same|next>",
    "verify <checkpoint.jsonl> <expected-revision> <PASS_TO_FINAL|NEXT_ITERATION|BLOCKED>",
    "terminate <checkpoint.jsonl> <expected-revision>",
    "status <checkpoint.jsonl>",
  ].join(" "));
}
function requireArity(args, size) {
  if (args.length !== size) usage();
}
function requireText(value, error, label) {
  if (typeof value !== "string" || value.length === 0) fail(error, `invalid ${label}`);
  return value;
}
function requireRevision(value) {
  if (!/^(0|[1-9]\d*)$/.test(value || "")) fail("INVALID_REVISION", "invalid revision");
  const revision = Number(value);
  if (!Number.isSafeInteger(revision)) fail("INVALID_REVISION", "revision exceeds safe integer range");
  return revision;
}
function validateArgs(args) {
  const command = args[0];
  if (command === "status") {
    requireArity(args, 2);
  } else if (command === "init") {
    requireArity(args, 5);
    for (let index = 2; index < 5; index += 1) requireText(args[index], "USAGE", "execution context");
  } else if (command === "terminate") {
    requireArity(args, 3);
    requireRevision(args[2]);
  } else if (command === "execute") {
    requireArity(args, 5);
    requireRevision(args[2]);
    if (!new Set(["executor", "verifier"]).has(args[3])) fail("INVALID_OWNER", "invalid execute target");
    if (!new Set(["same", "next"]).has(args[4])) fail("INVALID_STATE_MODE", "state mode must be same or next");
  } else if (command === "verify") {
    requireArity(args, 4);
    requireRevision(args[2]);
    if (!Object.hasOwn(routeOwner, args[3])) fail("INVALID_ROUTE", "invalid route");
  } else {
    usage();
  }
}

function resolveLog(raw) {
  const log = path.resolve(raw || "");
  if (path.basename(log) !== "checkpoint.jsonl") fail("INVALID_CHECKPOINT", "target must be checkpoint.jsonl");
  const directory = path.dirname(log);
  let stat;
  try {
    stat = fs.statSync(directory);
  } catch (error) {
    fail("INVALID_CHECKPOINT", error.message);
  }
  if (!stat.isDirectory()) fail("INVALID_CHECKPOINT", "checkpoint parent is not a directory");
  return { log, directory, contract: path.join(directory, "goal-contract.md") };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function validateRecord(record, errorName) {
  if (!isObject(record)) fail(errorName, "record must be a JSON object");
  for (const field of Object.keys(record)) {
    if (!allowedFields.has(field)) fail(errorName, `unknown record field: ${field}`);
  }
  for (const field of ["checkpoint_revision", "state_revision"]) {
    if (!Number.isSafeInteger(record[field]) || record[field] < 0) fail(errorName, `${field} must be a non-negative safe integer`);
  }
  if (!owners.has(record.active_owner)) fail(errorName, "invalid active_owner");
  if (!new Set(["init", "execute", "verify", "terminate"]).has(record.action)) fail(errorName, "invalid action");
  for (const field of ["task_id", "goal_contract_path", "accepted_authority_sha256"]) {
    requireText(record[field], errorName, field);
  }
  if (!/^[0-9a-f]{64}$/.test(record.accepted_authority_sha256)) fail(errorName, "invalid authority digest");
  if (!isObject(record.execution_context)) fail(errorName, "execution_context must be a JSON object");
  const contextFields = ["workspace", "repository", "worktree", "branch"];
  if (Object.keys(record.execution_context).sort().join("\0") !== contextFields.slice().sort().join("\0")) {
    fail(errorName, "execution_context must contain workspace, repository, worktree, and branch");
  }
  for (const field of contextFields) requireText(record.execution_context[field], errorName, `execution_context.${field}`);
  if (!isObject(record.result) || Object.keys(record.result).length !== 1 || typeof record.result.text !== "string") {
    fail(errorName, "result must contain only a text string");
  }
  if (record.route !== undefined && typeof record.route !== "string") fail(errorName, "route must be a string");
  if (record.termination_reason !== undefined && typeof record.termination_reason !== "string") {
    fail(errorName, "termination_reason must be a string");
  }
  const serialized = JSON.stringify(record);
  if (Buffer.byteLength(serialized) > MAX_RECORD_BYTES) fail(errorName, "record exceeds 1 MiB");
  const normalized = JSON.parse(serialized);
  try {
    assert.deepStrictEqual(normalized, record);
  } catch (_) {
    fail(errorName, "record is not JSON round-trip stable");
  }
  return normalized;
}

function parseLine(line) {
  const text = line.toString("utf8").trim();
  if (!text) return null;
  let value;
  try {
    value = JSON.parse(text);
  } catch (_) {
    return null;
  }
  return validateRecord(value, "INVALID_CHECKPOINT");
}

function readLastRecord(c) {
  let fd;
  try {
    fd = fs.openSync(c.log, fs.constants.O_RDONLY);
  } catch (error) {
    if (error.code === "ENOENT") return { record: null, validEnd: 0, fileSize: 0 };
    fail("INVALID_CHECKPOINT", error.message);
  }
  try {
    const fileSize = fs.fstatSync(fd).size;
    let position = fileSize;
    let prefix = Buffer.alloc(0);
    let bytesRead = 0;
    while (position > 0) {
      const length = Math.min(64 * 1024, position);
      position -= length;
      const chunk = Buffer.allocUnsafe(length);
      let offset = 0;
      while (offset < length) {
        let size;
        try {
          size = fs.readSync(fd, chunk, offset, length - offset, position + offset);
        } catch (error) {
          if (error.code === "EINTR") continue;
          throw error;
        }
        if (size === 0) break;
        offset += size;
        bytesRead += size;
      }
      prefix = Buffer.concat([chunk.subarray(0, offset), prefix]);
      if (bytesRead > MAX_TAIL_SCAN_BYTES) fail("INVALID_CHECKPOINT", "no valid record within bounded tail scan");
      let end = prefix.length;
      for (let index = prefix.length - 1; index >= 0; index -= 1) {
        if (prefix[index] !== 0x0a) continue;
        const record = parseLine(prefix.subarray(index + 1, end));
        if (record) {
          const validEnd = position + end + (end < prefix.length && prefix[end] === 0x0a ? 1 : 0);
          return { record, validEnd, fileSize };
        }
        end = index;
      }
      prefix = prefix.subarray(0, end < prefix.length ? end + 1 : end);
      if (prefix.length > MAX_RECORD_BYTES) fail("INVALID_CHECKPOINT", "tail record exceeds 1 MiB");
    }
    const record = parseLine(prefix);
    return { record, validEnd: record ? prefix.length : 0, fileSize };
  } catch (error) {
    if (error.error) throw error;
    fail("INVALID_CHECKPOINT", error.message);
  } finally {
    fs.closeSync(fd);
  }
}

function discardInvalidTail(c, observed) {
  if (observed.validEnd === observed.fileSize) return;
  let fd;
  try {
    fd = fs.openSync(c.log, fs.constants.O_WRONLY);
    fs.ftruncateSync(fd, observed.validEnd);
  } catch (error) {
    fail("WRITE_FAILED", `cannot discard incomplete tail: ${error.message}`);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function oneValue(input, name, pattern) {
  const matches = [];
  for (const line of input.split("\n")) {
    const match = pattern.exec(line);
    if (match) matches.push(match[1]);
  }
  if (matches.length !== 1) fail("INVALID_CONTRACT", `goal contract must contain one ${name}`);
  return matches[0];
}
function initialIdentity(c, args) {
  let contract;
  try {
    contract = fs.readFileSync(c.contract, "utf8");
  } catch (error) {
    fail("INVALID_CONTRACT", error.message);
  }
  oneValue(contract, "accepted status", /^status:[ \t]*(accepted)[ \t]*\r?$/);
  const workspace = oneValue(contract, "workspace_identity", /^workspace_identity:[ \t]*(\S.*?)[ \t]*\r?$/);
  const digest = oneValue(contract, "accepted_authority_sha256",
    /^-?[ \t]*accepted_authority_sha256:[ \t]*([0-9a-f]{64})[ \t]*\r?$/);
  return {
    task_id: path.basename(c.directory),
    goal_contract_path: c.contract,
    accepted_authority_sha256: digest,
    execution_context: {
      workspace,
      repository: args[2],
      worktree: args[3],
      branch: args[4],
    },
  };
}
function readResultText() {
  let input;
  try {
    input = fs.readFileSync(0);
  } catch (error) {
    fail("INVALID_RESULT", error.message);
  }
  if (input.length > MAX_RECORD_BYTES) fail("INVALID_RESULT", "result exceeds 1 MiB");
  const text = input.toString("utf8");
  if (text.trim().length === 0) fail("INVALID_RESULT", "result must not be empty");
  return text;
}
function copyIdentity(current) {
  return {
    task_id: current.task_id,
    goal_contract_path: current.goal_contract_path,
    accepted_authority_sha256: current.accepted_authority_sha256,
    execution_context: current.execution_context,
  };
}
function requireCurrent(current, expectedRevision, owner) {
  if (current === null) fail("STALE_CHECKPOINT", "checkpoint is absent", 3);
  if (current.checkpoint_revision !== expectedRevision) {
    fail("STALE_CHECKPOINT", "stale checkpoint", 3, {
      expectedRevision,
      actualRevision: current.checkpoint_revision,
    });
  }
  if (owner && current.active_owner !== owner) fail("STALE_CHECKPOINT", `${owner} does not own checkpoint`, 3);
}
function buildRecord(args, c, current, resultText) {
  const command = args[0];
  if (command === "init") {
    if (current !== null) fail("STALE_CHECKPOINT", "checkpoint already initialized", 3);
    return validateRecord({
      checkpoint_revision: 0,
      state_revision: 0,
      active_owner: "executor",
      action: "init",
      ...initialIdentity(c, args),
      result: { text: resultText },
    }, "INVALID_RECORD");
  }

  const expectedRevision = requireRevision(args[2]);
  if (command === "execute") {
    requireCurrent(current, expectedRevision, "executor");
    return validateRecord({
      checkpoint_revision: current.checkpoint_revision + 1,
      state_revision: current.state_revision + (args[4] === "next" ? 1 : 0),
      active_owner: args[3],
      action: "execute",
      ...copyIdentity(current),
      result: { text: resultText },
    }, "INVALID_RECORD");
  }
  if (command === "verify") {
    requireCurrent(current, expectedRevision, "verifier");
    return validateRecord({
      checkpoint_revision: current.checkpoint_revision + 1,
      state_revision: current.state_revision,
      active_owner: routeOwner[args[3]],
      action: "verify",
      route: args[3],
      ...copyIdentity(current),
      result: { text: resultText },
    }, "INVALID_RECORD");
  }
  requireCurrent(current, expectedRevision);
  if (!new Set(["alpha-goal", "executor", "verifier"]).has(current.active_owner)) {
    fail("STALE_CHECKPOINT", "current owner cannot terminate", 3);
  }
  return validateRecord({
    checkpoint_revision: current.checkpoint_revision + 1,
    state_revision: current.state_revision,
    active_owner: "caller",
    action: "terminate",
    termination_reason: "GOAL_CHANGED",
    ...copyIdentity(current),
    result: { text: resultText },
  }, "INVALID_RECORD");
}

function writeAll(fd, input) {
  let offset = 0;
  while (offset < input.length) {
    let size;
    try {
      size = fs.writeSync(fd, input, offset, input.length - offset);
    } catch (error) {
      if (error.code === "EINTR") continue;
      throw error;
    }
    if (size <= 0) fail("WRITE_FAILED", "append made no progress");
    offset += size;
  }
}
function appendRecord(c, record) {
  const line = Buffer.from(`\n${JSON.stringify(record)}\n`, "utf8");
  let fd;
  try {
    fd = fs.openSync(c.log, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND, 0o600);
    writeAll(fd, line);
  } catch (error) {
    if (error.error) throw error;
    fail("WRITE_FAILED", error.message);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  const observed = readLastRecord(c).record;
  try {
    assert.deepStrictEqual(observed, record);
  } catch (_) {
    fail("WRITE_VALIDATION_FAILED", "last record does not match appended record");
  }
}

function status(c) {
  const record = readLastRecord(c).record;
  if (record === null) {
    print({ ok: true, action: "status", revision: "absent", owner: "none" });
    return;
  }
  print({
    ok: true,
    action: "status",
    revision: record.checkpoint_revision,
    stateRevision: record.state_revision,
    owner: record.active_owner,
    route: record.route ?? null,
    taskId: record.task_id,
  });
}
function mutate(args, c) {
  const observed = readLastRecord(c);
  const current = observed.record;
  const next = buildRecord(args, c, current, readResultText());
  discardInvalidTail(c, observed);
  appendRecord(c, next);
  print({
    ok: true,
    action: next.action,
    revision: next.checkpoint_revision,
    stateRevision: next.state_revision,
    owner: next.active_owner,
    route: next.route ?? null,
  });
}

function main() {
  const raw = process.argv.slice(2);
  const locked = raw[0] === "--locked";
  const args = locked ? raw.slice(1) : raw;
  validateArgs(args);
  const checkpoint = resolveLog(args[1]);
  if (args[0] === "status") {
    if (locked) usage();
    status(checkpoint);
  } else {
    if (!locked) fail("LOCK_REQUIRED", "mutation must use checkpoint-lock.sh");
    mutate(args, checkpoint);
  }
}

try {
  main();
} catch (error) {
  if (error && error.error) {
    print({ ok: false, error: error.error, message: error.message, ...error.extra }, process.stderr);
    process.exitCode = error.code;
  } else {
    print({ ok: false, error: "INTERNAL_ERROR", message: error.message || String(error) }, process.stderr);
    process.exitCode = 1;
  }
}
