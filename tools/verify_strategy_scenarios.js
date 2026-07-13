#!/usr/bin/env node
"use strict";

const ROUTES = new Set(["PASS_TO_FINAL", "NEXT_ITERATION", "BLOCKED", "RETURN_TO_ALPHA_GOAL"]);

function routeScenario(s) {
  if (!s.contractAccepted || !s.authorizationSource) return "RETURN_TO_ALPHA_GOAL";
  if (s.designRequired && !s.designAccepted) return "RETURN_TO_ALPHA_GOAL";
  if (!s.checkpointExists || !s.executionContextMatches || !s.allRepoContextsMatch || s.concurrentExecution) return "RETURN_TO_ALPHA_GOAL";
  if (s.scopeDrift || s.authorityDrift || s.claimBoundaryDrift) return "RETURN_TO_ALPHA_GOAL";
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
  designRequired: false,
  designAccepted: false,
  checkpointExists: true,
  executionContextMatches: true,
  allRepoContextsMatch: true,
  concurrentExecution: false,
  scopeDrift: false,
  authorityDrift: false,
  claimBoundaryDrift: false,
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


function recoverTask(explicitPath, candidates) {
  if (explicitPath) return "USE_EXPLICIT";
  const eligible = candidates.filter(item => item.accepted && item.active && item.workspaceMatches);
  return eligible.length === 1 ? "USE_SOLE_CANDIDATE" : "STOP";
}

function lifecycleClaim(route, noTargetOrDeliveryMutation, adapter, lifecycleSucceeded) {
  if (route !== "PASS_TO_FINAL") return "not-complete";
  if (!noTargetOrDeliveryMutation) return "verified-but-lifecycle-incomplete";
  if (adapter === "codex") return lifecycleSucceeded ? "complete" : "verified-but-lifecycle-incomplete";
  if (adapter === "evaluator") return lifecycleSucceeded ? "complete" : "verified-but-lifecycle-incomplete";
  return "verified-but-lifecycle-incomplete";
}

const cases = [
  ["clean final state", {}, "PASS_TO_FINAL"],
  ["pending acceptance", { pending: true }, "NEXT_ITERATION"],
  ["failed evidence", { failed: true }, "NEXT_ITERATION"],
  ["external blocker", { externalBlocker: true }, "BLOCKED"],
  ["blocked checklist dominates pending", { blocked: true, pending: true }, "BLOCKED"],
  ["scope drift", { scopeDrift: true }, "RETURN_TO_ALPHA_GOAL"],
  ["missing authorization", { authorizationSource: false }, "RETURN_TO_ALPHA_GOAL"],
  ["stale evidence with alternative", { evidenceCurrent: false }, "NEXT_ITERATION"],
  ["stale evidence without alternative", { evidenceCurrent: false, authorizedAlternative: false }, "RETURN_TO_ALPHA_GOAL"],
  ["post PASS mutation", { postPassMutation: true }, "NEXT_ITERATION"],
  ["recovery execution-context mismatch", { executionContextMatches: false }, "RETURN_TO_ALPHA_GOAL"],
  ["cross-repo context mismatch", { allRepoContextsMatch: false }, "RETURN_TO_ALPHA_GOAL"],
  ["concurrent execution observed", { concurrentExecution: true }, "RETURN_TO_ALPHA_GOAL"],
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

const recoveryCases = [
  ["explicit task path", "/state/task/goal-contract.md", [], "USE_EXPLICIT"],
  ["sole eligible candidate", null, [{ accepted: true, active: true, workspaceMatches: true }], "USE_SOLE_CANDIDATE"],
  ["zero candidates", null, [], "STOP"],
  ["multiple eligible candidates", null, [{ accepted: true, active: true, workspaceMatches: true }, { accepted: true, active: true, workspaceMatches: true }], "STOP"],
  ["rejected candidate", null, [{ accepted: false, active: true, workspaceMatches: true }], "STOP"],
  ["completed candidate", null, [{ accepted: true, active: false, workspaceMatches: true }], "STOP"],
  ["workspace mismatch", null, [{ accepted: true, active: true, workspaceMatches: false }], "STOP"],
];
for (const [name, explicitPath, candidates, expected] of recoveryCases) {
  const actual = recoverTask(explicitPath, candidates);
  if (actual !== expected) {
    console.error(`FAIL ${name}: expected ${expected}, got ${actual}`);
    failed += 1;
  } else {
    console.log(`PASS ${name}: ${actual}`);
  }
}

const lifecycleCases = [
  ["successful Codex lifecycle completion", ["PASS_TO_FINAL", true, "codex", true], "complete"],
  ["Codex native Goal update failure", ["PASS_TO_FINAL", true, "codex", false], "verified-but-lifecycle-incomplete"],
  ["successful evaluator-driven completion", ["PASS_TO_FINAL", true, "evaluator", true], "complete"],
  ["evaluator rejects completion", ["PASS_TO_FINAL", true, "evaluator", false], "verified-but-lifecycle-incomplete"],
  ["target mutation after verdict", ["PASS_TO_FINAL", false, "codex", true], "verified-but-lifecycle-incomplete"],
  ["non-pass route", ["NEXT_ITERATION", true, "codex", true], "not-complete"],
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
console.log(`PASS: ${cases.length} route scenarios + ${recoveryCases.length} recovery scenarios + ${lifecycleCases.length} lifecycle scenarios`);
