#!/usr/bin/env node
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const helper = path.join(root, "skills/alpha-goal/scripts/authority-digest.js");
const START = "<!-- authority-payload:start -->";
const END = "<!-- authority-payload:end -->";
const temporaryRoots = [];

function tempFile(contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "authority-digest-test-"));
  const file = path.join(dir, "goal-contract.md");
  temporaryRoots.push(dir);
  fs.writeFileSync(file, contents);
  return file;
}

function invoke(args) {
  return spawnSync(process.execPath, [helper, ...args], { encoding: "utf8" });
}

function assertSuccess(contents, expectedDigest) {
  const result = invoke([tempFile(contents)]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, `${expectedDigest}\n`);
  assert.equal(result.stderr, "");
}

function assertFailure(args, expectedError) {
  const result = invoke(args);
  assert.equal(result.status, 1, `stdout: ${result.stdout}\nstderr: ${result.stderr}`);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, "");
  if (expectedError instanceof RegExp) assert.match(result.stderr, expectedError);
  else assert.equal(result.stderr, `${expectedError}\n`);
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function goldenDigest() {
  const contract = [
    "preamble",
    START,
    "scope: alpha-goal",
    "criterion: deterministic bytes",
    END,
    "epilogue",
    ""
  ].join("\n");
  assertSuccess(contract, "99ec1de715a7ae67cdbd401e31d6fb83542fd1821c7cbb308fb8adaa462a5ab4");
}

function exactMarkerLines() {
  const payload = [
    `quoted ${END}`,
    `${START} trailing text`,
    "payload",
    ""
  ].join("\n");
  assertSuccess(`before\n${START}\n${payload}${END}\nafter\n`, sha256(payload));
}

function markerFailures() {
  const pairError = "contract must contain exactly one authority payload marker pair";
  assertFailure([tempFile("no markers\n")], pairError);
  assertFailure([tempFile(`${START}\npayload\n`)], pairError);
  assertFailure([tempFile(`payload\n${END}\n`)], pairError);
  assertFailure([tempFile(`${START}\n${START}\npayload\n${END}\n`)], pairError);
  assertFailure([tempFile(`${START}\npayload\n${END}\n${END}\n`)], pairError);
  assertFailure([tempFile(`${END}\npayload\n${START}\n`)], "authority payload markers are out of order");
}

function lineEndings() {
  const cases = [
    {
      newline: "\n",
      digest: "e49c81e2d2f84e259d40e2fb8192f3bcd198b355184845d76d8f58807d0d78ee"
    },
    {
      newline: "\r\n",
      digest: "98ab4d3aeab1e120560e942e2df6a0db1147bf94bafcf1590000ffb3c2b6fc80"
    }
  ];
  for (const { newline, digest } of cases) {
    assertSuccess(["before", START, "alpha", "beta", END, "after", ""].join(newline), digest);
  }
}

function errorStreams() {
  assertFailure([], "usage: authority-digest.js <goal-contract.md>");
  assertFailure(["one", "two"], "usage: authority-digest.js <goal-contract.md>");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "authority-digest-missing-"));
  temporaryRoots.push(dir);
  const missing = path.join(dir, "goal-contract.md");
  assertFailure([missing], /^cannot read contract: .+\n$/);
}

function main() {
  try {
    goldenDigest();
    exactMarkerLines();
    markerFailures();
    lineEndings();
    errorStreams();
    console.log("PASS: authority digest golden, marker, line-ending, and error-stream tests");
  } finally {
    for (const dir of temporaryRoots) fs.rmSync(dir, { recursive: true, force: true });
  }
}

main();
