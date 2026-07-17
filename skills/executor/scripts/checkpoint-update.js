#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const owners = new Set(["alpha-goal", "executor", "verifier", "caller"]);
const routeOwner = {
  PASS_TO_FINAL: "caller",
  NEXT_ITERATION: "executor",
  BLOCKED: "caller",
};
const canonicalRevision = /^(0|[1-9]\d*)$/;
const storedRevision = /^\d+$/;

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
  fail("USAGE", "commands: init execute verify terminate status");
}

function requireArity(args, size) {
  if (args.length !== size) usage();
}

function requireRevision(value) {
  if (!canonicalRevision.test(value || "")) fail("INVALID_REVISION", "invalid revision");
}

function validateArgs(args) {
  const command = args[0];
  if (command === "init" || command === "status") {
    requireArity(args, 2);
  } else if (command === "terminate") {
    requireArity(args, 3);
    requireRevision(args[2]);
  } else if (command === "execute") {
    requireArity(args, 4);
    requireRevision(args[2]);
    if (!new Set(["executor", "verifier"]).has(args[3])) {
      fail("INVALID_OWNER", "invalid execute target");
    }
  } else if (command === "verify") {
    requireArity(args, 4);
    requireRevision(args[2]);
    if (!Object.hasOwn(routeOwner, args[3])) fail("INVALID_ROUTE", "invalid route");
  } else {
    usage();
  }
}

function resolveCheckpoint(raw) {
  const checkpoint = path.resolve(raw || "");
  if (path.basename(checkpoint) !== "checkpoint.md") {
    fail("INVALID_CHECKPOINT", "target must be checkpoint.md");
  }
  const directory = path.dirname(checkpoint);
  let stat;
  try {
    stat = fs.statSync(directory);
  } catch (error) {
    fail("INVALID_CHECKPOINT", error.message);
  }
  if (!stat.isDirectory()) fail("INVALID_CHECKPOINT", "checkpoint parent is not a directory");
  return {
    checkpoint,
    tmp: `${checkpoint}.tmp`,
    legacyLock: `${checkpoint}.lock`,
  };
}

function values(input, name) {
  const found = [];
  const pattern = new RegExp(`^${name}:[ \\t]*(\\S+)[ \\t]*\\r?$`);
  let fence = null;
  for (const line of input.toString("utf8").split("\n")) {
    const marker = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
    if (!fence && marker) {
      fence = { character: marker[2][0], length: marker[2].length };
      continue;
    }
    if (fence) {
      if (marker && marker[2][0] === fence.character && marker[2].length >= fence.length && /^\s*$/.test(marker[3])) {
        fence = null;
      }
      continue;
    }
    const match = pattern.exec(line);
    if (match) found.push(match[1]);
  }
  return found;
}

function parseCheckpoint(input, canonical, errorName) {
  const revisions = values(input, "checkpoint_revision");
  const activeOwners = values(input, "active_owner");
  if (revisions.length !== 1 || activeOwners.length !== 1) {
    fail(errorName, "checkpoint must contain one revision and one active_owner");
  }
  if (!storedRevision.test(revisions[0]) || !owners.has(activeOwners[0])) {
    fail(errorName, "invalid checkpoint state");
  }
  const revision = BigInt(revisions[0]).toString();
  if (canonical && revision !== revisions[0]) {
    fail(errorName, "successor revision must be canonical");
  }
  return { revision, owner: activeOwners[0] };
}

function readCheckpoint(c) {
  let input;
  try {
    input = fs.readFileSync(c.checkpoint);
  } catch (error) {
    if (error.code === "ENOENT") return { revision: "absent", owner: "none" };
    fail("INVALID_CHECKPOINT", error.message);
  }
  return parseCheckpoint(input, false, "INVALID_CHECKPOINT");
}

function nextRevision(revision) {
  return (BigInt(revision) + 1n).toString();
}

function transition(args, current) {
  const command = args[0];
  if (command === "init") {
    return {
      action: "init",
      route: null,
      from: { revision: "absent", owner: "none" },
      to: { revision: "0", owner: "executor" },
    };
  }

  const expectedRevision = args[2];
  if (command === "execute") {
    return {
      action: "execute",
      route: null,
      from: { revision: expectedRevision, owner: "executor" },
      to: { revision: nextRevision(expectedRevision), owner: args[3] },
    };
  }
  if (command === "verify") {
    return {
      action: "verify",
      route: args[3],
      from: { revision: expectedRevision, owner: "verifier" },
      to: { revision: nextRevision(expectedRevision), owner: routeOwner[args[3]] },
    };
  }
  if (!new Set(["alpha-goal", "executor", "verifier"]).has(current.owner)) {
    fail("INVALID_TRANSITION", "current owner cannot terminate");
  }
  return {
    action: "terminate",
    route: null,
    from: { revision: expectedRevision, owner: current.owner },
    to: { revision: nextRevision(expectedRevision), owner: "caller" },
  };
}

function sameState(left, right) {
  return left.revision === right.revision && left.owner === right.owner;
}

function validateSuccessor(input, intended) {
  const actual = parseCheckpoint(input, true, "INVALID_SUCCESSOR");
  if (!sameState(actual, intended.to)) {
    fail("INVALID_SUCCESSOR", "successor state mismatch", 1, {
      expected: intended.to,
      actual,
    });
  }

  if (intended.action === "verify") {
    const routes = values(input, "route");
    if (routes.length !== 1 || routes[0] !== intended.route) {
      fail("INVALID_SUCCESSOR", "verify route mismatch");
    }
    if (values(input, "termination_reason").length !== 0) {
      fail("INVALID_SUCCESSOR", "verify successor cannot contain termination_reason");
    }
  }

  if (intended.action === "terminate") {
    const reasons = values(input, "termination_reason");
    if (reasons.length !== 1 || reasons[0] !== "GOAL_CHANGED") {
      fail("INVALID_SUCCESSOR", "termination_reason must be GOAL_CHANGED");
    }
    const routes = values(input, "route");
    if (routes.length > 1 || (routes.length === 1 && !new Set(["none", "NEXT_ITERATION", "RETURN_TO_ALPHA_GOAL"]).has(routes[0]))) {
      fail("INVALID_SUCCESSOR", "invalid termination route");
    }
  }
}

function publish(c, successor, intended) {
  try {
    fs.writeFileSync(c.tmp, successor, { mode: 0o600 });
    validateSuccessor(fs.readFileSync(c.tmp), intended);
    fs.renameSync(c.tmp, c.checkpoint);
  } catch (error) {
    try {
      fs.unlinkSync(c.tmp);
    } catch (_) {
      // A stale tmp never blocks a later write; writeFileSync truncates it.
    }
    if (error.error) throw error;
    fail("WRITE_FAILED", error.message);
  }
}

function status(c) {
  const current = readCheckpoint(c);
  const result = { ok: true, action: "status", ...current };
  if (fs.existsSync(c.legacyLock)) result.legacyTransaction = true;
  print(result);
}

function mutate(args, c) {
  if (fs.existsSync(c.legacyLock)) {
    fail("LEGACY_TRANSACTION_PRESENT", "use checkpoint-lock.js to finish or abandon the legacy transaction first");
  }
  const current = readCheckpoint(c);
  const intended = transition(args, current);
  if (!sameState(current, intended.from)) {
    fail("STALE_CHECKPOINT", "stale checkpoint", 3, {
      expected: intended.from,
      actual: current,
    });
  }
  let successor;
  try {
    successor = fs.readFileSync(0);
  } catch (error) {
    fail("INVALID_SUCCESSOR", error.message);
  }
  validateSuccessor(successor, intended);
  publish(c, successor, intended);
  print({
    ok: true,
    action: intended.action,
    from: intended.from,
    to: intended.to,
    route: intended.route,
  });
}

function main() {
  const raw = process.argv.slice(2);
  const locked = raw[0] === "--locked";
  const args = locked ? raw.slice(1) : raw;
  validateArgs(args);
  const checkpoint = resolveCheckpoint(args[1]);
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
