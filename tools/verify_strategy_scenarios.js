#!/usr/bin/env node
"use strict";

const ROUTES = new Set(["PASS_TO_FINAL", "NEXT_ITERATION", "BLOCKED", "RETURN_TO_ALPHA_GOAL"]);

function routeScenario(s) {
  if (!s.contractAccepted || !s.authorizationSource || !s.taskIdentity || !Number.isInteger(s.contractRevision)) return "RETURN_TO_ALPHA_GOAL";
  if (s.designRequired && (!s.designAccepted || s.designContractRevision !== s.contractRevision || !Number.isInteger(s.designRevision))) return "RETURN_TO_ALPHA_GOAL";
  if (!s.checkpointExists || !s.bindingMatches || !s.allRepoBindingsMatch || !s.sequenceCurrent || !s.targetFingerprintMatches || s.concurrentWrite) return "RETURN_TO_ALPHA_GOAL";
  if (s.scopeDrift || s.authorityDrift || s.claimBoundaryDrift || s.revisionDrift) return "RETURN_TO_ALPHA_GOAL";
  if (s.externalBlocker) return "BLOCKED";
  if (s.stagnant && !s.authorizedAlternative) return s.stagnationCause === "external" ? "BLOCKED" : "RETURN_TO_ALPHA_GOAL";
  if (s.blocked) return "BLOCKED";
  if (!s.evidenceCurrent || !s.evidenceMapped || s.pending || s.failed) return s.authorizedAlternative ? "NEXT_ITERATION" : "RETURN_TO_ALPHA_GOAL";
  if (s.postPassMutation) return "NEXT_ITERATION";
  return "PASS_TO_FINAL";
}

const base = {
  contractAccepted: true,
  authorizationSource: true,
  taskIdentity: "20260712-harden-skill-strategy",
  contractRevision: 1,
  designRequired: false,
  designAccepted: false,
  designContractRevision: null,
  designRevision: null,
  checkpointExists: true,
  bindingMatches: true,
  sequenceCurrent: true,
  targetFingerprintMatches: true,
  concurrentWrite: false,
  allRepoBindingsMatch: true,
  scopeDrift: false,
  authorityDrift: false,
  claimBoundaryDrift: false,
  revisionDrift: false,
  externalBlocker: false,
  stagnant: false,
  authorizedAlternative: true,
  stagnationCause: "authority",
  evidenceCurrent: true,
  evidenceMapped: true,
  pending: false,
  failed: false,
  blocked: false,
  postPassMutation: false,
};

function lifecycleClaim(route, noTargetOrDeliveryMutation, updateSucceeded) {
  if (route !== "PASS_TO_FINAL") return "not-complete";
  if (!noTargetOrDeliveryMutation || !updateSucceeded) return "verified-but-lifecycle-incomplete";
  return "complete";
}

const cases = [
  ["clean final state", {}, "PASS_TO_FINAL"],
  ["pending acceptance", { pending: true }, "NEXT_ITERATION"],
  ["failed evidence", { failed: true }, "NEXT_ITERATION"],
  ["external blocker", { externalBlocker: true }, "BLOCKED"],
  ["blocked checklist dominates pending", { blocked: true, pending: true }, "BLOCKED"],
  ["scope drift", { scopeDrift: true }, "RETURN_TO_ALPHA_GOAL"],
  ["missing authorization", { authorizationSource: false }, "RETURN_TO_ALPHA_GOAL"],
  ["contract revision mismatch", { revisionDrift: true }, "RETURN_TO_ALPHA_GOAL"],
  ["design revision mismatch", { designRequired: true, designAccepted: true, designContractRevision: 0, designRevision: 1 }, "RETURN_TO_ALPHA_GOAL"],
  ["stale evidence with alternative", { evidenceCurrent: false }, "NEXT_ITERATION"],
  ["stale evidence without alternative", { evidenceCurrent: false, authorizedAlternative: false }, "RETURN_TO_ALPHA_GOAL"],
  ["post PASS mutation", { postPassMutation: true }, "NEXT_ITERATION"],
  ["recovery binding mismatch", { bindingMatches: false }, "RETURN_TO_ALPHA_GOAL"],
  ["cross-repo binding mismatch", { allRepoBindingsMatch: false }, "RETURN_TO_ALPHA_GOAL"],
  ["stale sequence", { sequenceCurrent: false }, "RETURN_TO_ALPHA_GOAL"],
  ["concurrent checkpoint write", { concurrentWrite: true }, "RETURN_TO_ALPHA_GOAL"],
  ["terminal external stagnation", { stagnant: true, authorizedAlternative: false, stagnationCause: "external" }, "BLOCKED"],
  ["terminal authority stagnation", { stagnant: true, authorizedAlternative: false, stagnationCause: "authority" }, "RETURN_TO_ALPHA_GOAL"],
];

let failed = 0;
for (const [name, patch, expected] of cases) {
  const actual = routeScenario({ ...base, ...patch });
  if (!ROUTES.has(actual) || actual !== expected) {
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
    failed += 1;
  } else {
    console.log(`PASS ${name}: ${actual}`);
  }
}

const lifecycleCases = [
  ["successful lifecycle completion", ["PASS_TO_FINAL", true, true], "complete"],
  ["native Goal update failure", ["PASS_TO_FINAL", true, false], "verified-but-lifecycle-incomplete"],
  ["target mutation after verdict", ["PASS_TO_FINAL", false, true], "verified-but-lifecycle-incomplete"],
  ["metadata sync after verdict", ["PASS_TO_FINAL", true, true], "complete"],
  ["non-pass route", ["NEXT_ITERATION", true, true], "not-complete"],
];
for (const [name, args, expected] of lifecycleCases) {
  const actual = lifecycleClaim(...args);
  if (actual !== expected) {
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
    failed += 1;
  } else {
    console.log(`PASS ${name}: ${actual}`);
  }
}

if (failed) process.exit(1);
console.log(`PASS: ${cases.length} route scenarios + ${lifecycleCases.length} lifecycle scenarios`);
