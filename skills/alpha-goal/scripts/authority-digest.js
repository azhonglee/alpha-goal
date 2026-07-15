#!/usr/bin/env node
const crypto = require("node:crypto");
const fs = require("node:fs");

const START = "<!-- authority-payload:start -->";
const END = "<!-- authority-payload:end -->";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (process.argv.length !== 3) fail("usage: authority-digest.js <goal-contract.md>");

let input;
try {
  input = fs.readFileSync(process.argv[2]);
} catch (error) {
  fail(`cannot read contract: ${error.message}`);
}

let payloadStart = -1;
let payloadEnd = -1;
let startCount = 0;
let endCount = 0;
let offset = 0;

while (offset < input.length) {
  const newline = input.indexOf(0x0a, offset);
  const next = newline === -1 ? input.length : newline + 1;
  let contentEnd = newline === -1 ? input.length : newline;
  if (contentEnd > offset && input[contentEnd - 1] === 0x0d) contentEnd -= 1;
  const line = input.subarray(offset, contentEnd).toString("utf8");

  if (line === START) {
    startCount += 1;
    payloadStart = next;
  } else if (line === END) {
    endCount += 1;
    payloadEnd = offset;
  }
  offset = next;
}

if (startCount !== 1 || endCount !== 1) fail("contract must contain exactly one authority payload marker pair");
if (payloadStart < 0 || payloadEnd < payloadStart) fail("authority payload markers are out of order");

process.stdout.write(`${crypto.createHash("sha256").update(input.subarray(payloadStart, payloadEnd)).digest("hex")}\n`);
