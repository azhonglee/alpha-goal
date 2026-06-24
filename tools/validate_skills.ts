#!/usr/bin/env -S npx --no-install tsx
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const SKILLS_COUNT_BUDGET = 15_000;
const COMPACT_RECOVERY_HOOK_MARKER = "codex-alpha-goal-compact-recovery:v1";
const HOOKS_TEMPLATE = "templates/hooks.json";
const REQUIRED_SKILL_NAMES = ["alpha-goal", "control-loop", "goal-verify"];
const MERGED_SKILL_NAMES = ["goal-contract", "system-model", "decision-synthesis"];
const LEGACY_SKILL_REFERENCES = [
  ...MERGED_SKILL_NAMES,
  "evidence-verify",
  "control-kernel", "loop", "verify", "meta-synthesis",
  "goal-frame", "goal-loop", "goal-iterate", "goal-review",
];
const LEGACY_SCRIPT_REFERENCES = [
  "tools/validate_skills.py", "tools/validate_skillset.py", "tools/validate_skillset.ts",
  "scripts/mutation-preflight.sh", "mutation-preflight.sh",
  "scripts/repo-sensor-snapshot.sh", "repo-sensor-snapshot.sh",
  "scripts/evidence-summary.ts", "evidence-summary.ts",
  "scripts/evidence-summary.sh", "evidence-summary.sh",
  "scripts/goal-verification-summary.ts", "goal-verification-summary.ts",
  "scripts/goal-verification-summary.sh", "goal-verification-summary.sh",
];
const LEGACY_RUN_MODE_REFERENCES = ["automation-triggered", "from-verification", "Run mode: manual | automation"];
const LEGACY_RUNTIME_ARTIFACT_REFERENCES = ["context.md", "interview.md", "run-profile.md", "loop-state.md", "memory.md", "iteration.md", "evidence.md", "verification.md"];
const externalGoalOldPrefix = String.fromCharCode(78, 97, 116, 105, 118, 101);
const externalGoalOldName = String.fromCharCode(71, 111, 97, 108);
const externalGoalOldProduct = String.fromCharCode(67, 111, 100, 101, 120);
const LEGACY_EXTERNAL_GOAL_REFERENCES: Array<[RegExp, string]> = [
  [new RegExp(`${externalGoalOldPrefix} ${externalGoalOldName}`, "i"), "old external-goal lifecycle wording remains"],
  [new RegExp(`${externalGoalOldPrefix.toLowerCase()}[-_ ]${externalGoalOldName.toLowerCase()}`, "i"), "old external-goal lifecycle wording remains"],
  [new RegExp(`${externalGoalOldProduct} ${externalGoalOldPrefix}`, "i"), "old external-goal lifecycle wording remains"],
  [new RegExp("create_" + "goal"), "old external-goal lifecycle tool reference remains"],
  [new RegExp("update_" + "goal"), "old external-goal lifecycle tool reference remains"],
];
const STATE_ROOT_CORE_FILES = [
  "skills/alpha-goal/SKILL.md",
  "skills/control-loop/SKILL.md",
  "skills/goal-verify/SKILL.md",
  "templates/AGENTS.md",
];
const STATE_ROOT_DOC_FILES = [
  "AGENTS.md",
  "MANIFEST.md",
];
const STATE_ROOT_SCRIPT_FILES = [
  "skills/control-loop/scripts/mutation-preflight.ts",
];
const STATE_ROOT_DOC_REQUIRED_TERMS = [
  "${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/",
];
const ENV_STATE_ROOT = "ALPHA_" + "GOAL_STATE_ROOT";
const REPO_LOCAL_STATE = "\\.alpha-" + "goal";
const STATE_ROOT_REQUIRED_TERMS = [
  "Alpha Goal state root",
  "${CODEX_HOME:-$HOME/.alpha-goal}/<workspace-slug>/",
  "slug(repo_root or Goal Contract target workspace)",
];
const STATE_ROOT_FORBIDDEN_PATTERNS: Array<[RegExp, string]> = [
  [new RegExp(ENV_STATE_ROOT), "state-root environment override remains"],
  [new RegExp("\\$\\{CODEX_HOME:-\\$HOME/\\.codex\\}/state/alpha-goal/<workspace-slug>/"), "old Codex-home state root remains"],
  [new RegExp(`${REPO_LOCAL_STATE}/YYYYMMDD-<TaskName>`), "hard-coded repo-local task artifact path"],
  [new RegExp(`default runtime .*write.*${REPO_LOCAL_STATE}/`, "i"), "default runtime writes to repo-local state"],
  [new RegExp(`default runtime .*under \`?${REPO_LOCAL_STATE}/`, "i"), "default runtime lives under repo-local state"],
  [new RegExp(`if .*${REPO_LOCAL_STATE}/.*missing.*\\.gitignore.*add`, "i"), "repo .gitignore required before state writes"],
  [new RegExp(`\\.gitignore.*must include .*${REPO_LOCAL_STATE}/`, "i"), "repo .gitignore hard requirement"],
  [new RegExp(`missing \\.gitignore with required ${REPO_LOCAL_STATE}`, "i"), "validator requires repo .gitignore for state"],
  [new RegExp(`repo-local .*${REPO_LOCAL_STATE}`, "i"), "repo-local state fallback remains"],
  [new RegExp(`compatibility[^\\n]*${REPO_LOCAL_STATE}[^\\n]*override`, "i"), "repo-local compatibility override wording remains"],
  [new RegExp(`explicit[^\\n]*policy[^\\n]*${REPO_LOCAL_STATE}[^\\n]*override`, "i"), "repo-local explicit policy override wording remains"],
  [new RegExp("absolute " + "git root", "i"), "old absolute-path slug rule remains"],
  [new RegExp("strip leading " + "slashes", "i"), "old slug sanitization rule remains"],
  [new RegExp("replace characters " + "outside", "i"), "old slug sanitization rule remains"],
  [new RegExp("keep the last " + "80 characters", "i"), "old slug truncation rule remains"],
];

const DESCRIPTION_SEMANTIC_CHECKS: Record<string, { required: string[]; forbidden: string[] }> = {
  "alpha-goal": {
    required: ["clarify", "intention", "requirements"],
    forbidden: ["execute safely", "completion, correctness, readiness, safety"],
  },
  "control-loop": {
    required: ["Goal-contract-driven bounded executor", "accepted Goal Contract", "implementation", "hardening", "Do not use for ambiguous planning"],
    forbidden: ["discover facts before asking", "final evidence verdicts"],
  },
  "goal-verify": {
    required: ["Independent goal verifier", "defect/risk reviewer", "review", "audit", "loophole-finding", "Goal Contract", "Do not plan or implement changes"],
    forbidden: ["discover facts before asking", "act, sense feedback"],
  },
};

const SEMANTIC_CHECKS: Array<[string, string, string[]]> = [
  ["front controller discovers, frames, designs, and routes", "skills/alpha-goal/SKILL.md", [
    "Trigger Discovery",
    "minimum preflight",
    "one high-leverage question",
    "one decision variable",
    "navigation evidence, not requirements or authority",
    "Current-state facts cannot define desired behavior",
    "Readiness Gate Check",
    "non-goals",
    "decision boundaries",
    "pressure-test",
    "Design Content Must Include",
    "Acceptance evidence",
    "Claim boundary",
    "Trigger Contract",
    "Match the task state",
    "Contract status",
    "Discovery notes",
    "Interview ledger",
    "goal-contract.md",
    "canonical",
    "Artifact policy",
    "writes only `goal-contract.md`",
    "request_user_input",
    "$control-loop",
    "Design Summary"
  ]],
  ["alpha records interview and design state", "skills/alpha-goal/SKILL.md", [
    "Alpha Goal state root",
    "YYYYMMDD-<TaskName>/goal-contract.md",
    "Discovery notes",
    "Interview ledger",
    "docs/specs/YYYYMMDD-<TaskName>.md",
    "Design Summary"
  ]],
  ["execution has hard safety gates", "skills/control-loop/SKILL.md", [
    "Goal Contract driven bounded executor and hardener",
    "not task discovery or scheduling",
    "useful target-state movement",
    "State artifacts support execution and recovery",
    "writing them is never the objective",
    "Use `checkpoint.md` only when",
    "Run the loop as behavior, not paperwork",
    "function control_loop(goal_contract)",
    "read_accepted_goal_contract(goal_contract)",
    "assert_goal_boundaries(goal, checkpoint)",
    "plan_most_useful_verifiable_slice",
    "choose_highest_value_bounded_action_verifiable_now",
    "slice.has_authorized_executable_action",
    "slice.evidence_defined_before_acting",
    "slice.validation_observer_available",
    "slice.names_risks_assumptions_side_effects_cleanup_rollback_containment_stop_conditions",
    "material_contradiction",
    "make_one_targeted_change_unless_coordinated_edits_required",
    "failing_outputs",
    "requires_embedded_review_or_audit_or_loophole_finding",
    "standalone_final_judgment_without_goal_verify",
    "review_slice_outcome",
    "evidence.is_fresh",
    "slice.complete only_if",
    "material_defect_risk_surface",
    "authorized_acceptance_equivalent_fallback",
    "direction_valid_and_weak",
    "goal_verify_before_final_or_route",
    "control-loop never creates or derives it",
    "goal.has_required_fields",
    "Do not mutate primary",
    "repo-local worktree",
    "unrelated user changes",
    "slice.surface within goal.repo_surfaces",
    "integration_evidence_covers_each_repo_boundary",
    "checkpoint.run_profile when present",
    "checkpoint.md",
    "Goal Contract",
    "control-state/latest.md",
    "global recovery index",
    "canonical",
    "Read Checkpoint",
    "Reference Routing",
    "State writes are checkpoints, not progress",
    "references/state-artifacts.md",
    "references/completion-gates.md",
    "Loop State",
    "Memory",
    "Evidence",
    "Verification",
    "outcome",
    "claim boundary",
    "## Boundaries",
    "## Slice Execution",
    "## Routes",
    "PASS_TO_FINAL",
    "verification.Next_route == control-loop",
    "$goal-verify",
    "RETURN_TO_ALPHA_GOAL",
    "BLOCKED",
    "Stop/re-route"
  ]],
  ["control loop state artifacts schema", "skills/control-loop/references/state-artifacts.md", [
    "State writes are checkpoints, not progress",
    "Loop I/O",
    "Use the matching task files as loop I/O",
    "checkpoint.md",
    "control-state/latest.md",
    "## Checkpoint",
    "Run Profile",
    "Loop State",
    "Current Phase: IMPLEMENTATION | HARDENING | VERIFICATION | FINAL_RESPONSE_READY | COMPLETE | BLOCKED",
    "Memory",
    "Confirmed Facts",
    "Iteration",
    "Evidence",
    "Verification",
    "Verification Verdict",
    "## Latest Pointer",
    "Evidence, Confidence, and Invalidation"
  ]],
  ["control loop completion gates", "skills/control-loop/references/completion-gates.md", [
    "Universal Completion Gates",
    "Scope Gate",
    "Assertion Gate",
    "Replacement/Prohibition Gate",
    "Evidence Boundary Gate",
    "Raw Evidence Gate",
    "FINAL_RESPONSE_READY",
    "MR-ready",
    "Same-goal fixable gap -> `HARDENING`",
    "Scope/authority/decision change -> `RETURN_TO_ALPHA_GOAL`",
    "Missing permission/data/environment -> `BLOCKED`"
  ]],
  ["goal verification checks claims and defects", "skills/goal-verify/SKILL.md", [
    "PASS_TO_FINAL",
    "NEXT_ITERATION",
    "fixable evidence",
    "same-goal fixable",
    "outcome, scope, authority",
    "permission, tool, data, environment, credential",
    "checkpoint",
    "execution context only",
    "checkpoint `Loop State`",
    "required Loop State updates",
    "required Memory updates",
    "required defect/risk sweep",
    "verification-gap hardening",
    "Review mode",
    "Goal satisfaction review",
    "Defect/risk sweep",
    "Unclaimed issues found",
    "Negative/abuse cases checked",
    "material unclaimed",
    "no material issue found in checked surface",
    "not checked",
    "Gap must be specific enough",
    "Do not narrow the claim as a successful outcome",
    "Final response guard",
    "Highest practical evidence-supported boundary",
    "Final wording allowed",
    "Verification Summary"
  ]],
  ["multi-repo preflight script", "skills/control-loop/scripts/mutation-preflight.ts", [
    "process.argv.slice(2)",
    "parseArgs",
    "sectionText",
    "multi-repo preflight",
    "targets",
    ".worktrees/codex/preflight-check",
    "BLOCKED without --task",
    "checkpoint.md",
    "control-state/latest.md",
    "contract status",
    "goal contract binding",
    "NEXT_ITERATION",
    "loop actionability",
    "checkpoint required",
    "latest binding",
    "checkpoint path",
    "verification binding",
    "preflight",
    "requested action",
    "checkpoint loop state",
    "checkpoint memory",
    "evaluator route"
  ]],
];

function parseFrontmatter(text: string): Record<string, string> {
  const match = text.match(FRONTMATTER_RE);
  if (!match) throw new Error("missing YAML frontmatter block");
  const data: Record<string, string> = {};
  for (const [offset, line] of match[1].split(/\r?\n/).entries()) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) continue;
    const field = line.match(FIELD_RE);
    if (!field) throw new Error(`line ${offset + 2}: unsupported frontmatter syntax`);
    const [, key, rawValue] = field;
    const value = rawValue.trim();
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) throw new Error(`line ${offset + 2}: unsupported frontmatter key ${key}`);
    if (Object.hasOwn(data, key)) throw new Error(`line ${offset + 2}: duplicate frontmatter key ${key}`);
    if (!value) throw new Error(`line ${offset + 2}: empty frontmatter value for ${key}`);
    const quoted = value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'");
    if (!quoted && /:\s/.test(value)) throw new Error(`line ${offset + 2}: quote frontmatter value containing ': ' `);
    data[key] = quoted ? value.slice(1, -1) : value;
  }
  return data;
}

export function main(args = process.argv.slice(2)): number {
  const root = path.resolve(args[0] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const skills = path.join(root, "skills");
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isDirectory(skills)) errors.push(`missing skills directory: ${skills}`);
  const allFiles = walk(root).filter(isFile);
  const skillFiles = allFiles.filter(file => relative(root, file).startsWith("skills/"));
  const skillDirs = isDirectory(skills) ? fs.readdirSync(skills, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => path.join(skills, e.name)).sort() : [];
  const discovered = skillDirs.map(d => path.basename(d));
  for (const name of REQUIRED_SKILL_NAMES) if (!discovered.includes(name)) errors.push(`missing required skill directory: skills/${name}`);
  for (const name of discovered) if (!REQUIRED_SKILL_NAMES.includes(name)) errors.push(`unexpected skill directory: skills/${name}`);

  for (const dir of skillDirs) validateSkillDir(root, dir, errors, warnings);
  validateSkillsCountBudget(skillFiles, errors);
  validateRuntimeArtifactState(root, errors, warnings);
  validateScriptSurface(root, allFiles, errors, warnings);
  validateLegacyReferences(root, skillFiles, errors);
  validateSemanticChecks(root, errors);
  validateControlLoopStructure(root, errors);
  validateSchemaConsistency(root, errors);
  validateInstallDocumentation(root, errors);
  validateRuntimeScriptBehavior(root, errors);
  validateNoAutoDownloadRunner(root, allFiles, errors);

  printReport(root, errors, warnings);
  return errors.length ? 1 : 0;
}

function validateSkillDir(root: string, dir: string, errors: string[], warnings: string[]): void {
  const skillName = path.basename(dir);
  const md = path.join(dir, "SKILL.md");
  if (!isFile(md)) { errors.push(`${skillName}: missing SKILL.md`); return; }
  if (skillName === "goal-verify" && isDirectory(path.join(dir, "scripts"))) errors.push("goal-verify must not depend on runtime scripts");
  const text = fs.readFileSync(md, "utf8");
  try {
    const fm = parseFrontmatter(text);
    if (fm.name !== skillName) errors.push(`${skillName}: frontmatter name ${JSON.stringify(fm.name)} does not match directory`);
    if (!fm.description) errors.push(`${skillName}: SKILL.md frontmatter missing description`);
    if (fm.description && fm.description.length > 500) warnings.push(`${skillName}: description is long (${fm.description.length} chars)`);
    validateDescriptionBoundary(skillName, fm.description, errors);
  } catch (error) { errors.push(`${skillName}: invalid SKILL.md frontmatter: ${errorMessage(error)}`); }
  const refs = path.join(dir, "references");
  if (isDirectory(refs)) for (const ref of fs.readdirSync(refs).filter(f => isFile(path.join(refs, f))).sort()) {
    const rel = `references/${ref}`;
    if (!text.includes(rel)) errors.push(`${skillName}: reference is not discoverable from SKILL.md: ${rel}`);
  }
}

function validateDescriptionBoundary(skillName: string, description: string, errors: string[]): void {
  const check = DESCRIPTION_SEMANTIC_CHECKS[skillName];
  if (!check) return;
  const lower = description.toLowerCase();
  for (const term of check.required) if (!lower.includes(term.toLowerCase())) errors.push(`${skillName}: description missing boundary term: ${term}`);
  for (const term of check.forbidden) if (lower.includes(term.toLowerCase())) errors.push(`${skillName}: description overlaps another skill trigger: ${term}`);
}

function validateSkillsCountBudget(skillFiles: string[], errors: string[]): void {
  let words = 0;
  let punctuation = 0;
  for (const file of skillFiles) {
    const text = fs.readFileSync(file, "utf8");
    words += countMatches(text, /[\p{L}\p{N}\p{M}]+/gu);
    punctuation += countMatches(text, /[\p{P}\p{S}]/gu);
  }
  const total = words + punctuation;
  if (total > SKILLS_COUNT_BUDGET) {
    errors.push(`skills word+punctuation budget exceeded: ${total} > ${SKILLS_COUNT_BUDGET} (words=${words}, punctuation=${punctuation})`);
  }
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function validateRuntimeArtifactState(root: string, errors: string[], warnings: string[]): void {
  for (const rel of STATE_ROOT_CORE_FILES) {
    const text = readIfFile(path.join(root, rel));
    if (!text) { errors.push(`${rel}: missing state-root file`); continue; }
    for (const term of STATE_ROOT_REQUIRED_TERMS) if (!text.includes(term)) errors.push(`${rel}: missing state-root guidance: ${term}`);
  }
  for (const rel of STATE_ROOT_DOC_FILES) {
    const text = readIfFile(path.join(root, rel));
    if (!text) { errors.push(`${rel}: missing state-root doc`); continue; }
    for (const term of STATE_ROOT_DOC_REQUIRED_TERMS) if (!text.includes(term)) errors.push(`${rel}: missing state-root doc guidance: ${term}`);
    if (!text.includes("slug(repo_root or Goal Contract target workspace)")) errors.push(`${rel}: missing stable workspace slug guidance`);
  }
  for (const rel of STATE_ROOT_SCRIPT_FILES) {
    const text = readIfFile(path.join(root, rel));
    if (!text) { errors.push(`${rel}: missing state-root script`); continue; }
    if (!text.includes(".alpha-goal")) errors.push(`${rel}: missing .alpha-goal default state root`);
    if (!text.includes("process.cwd()")) errors.push(`${rel}: state root must derive from process.cwd()`);
    if (!text.includes("repoRoot(session)") || !text.includes("slugWorkspace(workspaceRoot)")) errors.push(`${rel}: state root must use stable repo/workspace slug`);
    if (/basename\(session\)/.test(text)) errors.push(`${rel}: state root must not use the session directory basename`);
  }
  const scanned = [...new Set([...STATE_ROOT_CORE_FILES, ...STATE_ROOT_DOC_FILES, ...STATE_ROOT_SCRIPT_FILES, "tools/validate_skills.ts"])];
  for (const rel of scanned) {
    const text = readIfFile(path.join(root, rel));
    for (const [pattern, label] of STATE_ROOT_FORBIDDEN_PATTERNS) if (pattern.test(text)) errors.push(`${rel}: forbidden state-root dependency remains: ${label}`);
  }
}

function validateScriptSurface(root: string, files: string[], errors: string[], warnings: string[]): void {
  for (const file of files.filter(f => {
    const rel = relative(root, f);
    return rel.startsWith("tools/") || /^skills\/[^/]+\/scripts\//.test(rel);
  })) {
    const rel = relative(root, file);
    if (!rel.endsWith(".ts")) errors.push(`script surface must be TypeScript only: ${rel}`);
    if (fs.readFileSync(file, "utf8").startsWith("#!") && (fs.statSync(file).mode & 0o100) === 0) warnings.push(`${rel} has a shebang but is not user-executable`);
  }
}

function validateLegacyReferences(root: string, skillFiles: string[], errors: string[]): void {
  const files = new Set(["AGENTS.md", "README.md", "README.en.md", "README.zh-CN.md", "INSTALL.md", "MANIFEST.md", "templates/AGENTS.md", "templates/hooks.json", ...skillFiles.map(f => relative(root, f))]);
  for (const rel of files) {
    const file = path.join(root, rel); if (!isFile(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const legacy of LEGACY_SCRIPT_REFERENCES) if (text.includes(legacy)) errors.push(`${rel}: legacy non-TypeScript script reference remains: ${legacy}`);
    for (const legacy of LEGACY_RUN_MODE_REFERENCES) if (text.includes(legacy)) errors.push(`${rel}: legacy run-mode reference remains: ${legacy}`);
    for (const legacy of LEGACY_RUNTIME_ARTIFACT_REFERENCES) if (text.includes(legacy)) errors.push(`${rel}: split runtime artifact reference remains: ${legacy}`);
    for (const [pattern, label] of LEGACY_EXTERNAL_GOAL_REFERENCES) if (pattern.test(text)) errors.push(`${rel}: ${label}`);
    if (/evidence[- ]verify/i.test(text)) errors.push(`${rel}: legacy evidence-verify prose remains`);
    for (const legacy of LEGACY_SKILL_REFERENCES) {
      const patterns = [`$${legacy}`, `skills/${legacy}`, `\`${legacy}\``];
      if (patterns.some(p => text.includes(p))) errors.push(`${rel}: legacy skill reference remains: ${legacy}`);
    }
  }
}

function validateSemanticChecks(root: string, errors: string[]): void {
  for (const [name, rel, terms] of SEMANTIC_CHECKS) {
    const file = path.join(root, rel);
    if (!isFile(file)) { errors.push(`semantic check ${JSON.stringify(name)}: missing ${rel}`); continue; }
    const lower = fs.readFileSync(file, "utf8").toLowerCase();
    for (const term of terms) if (!lower.includes(term.toLowerCase())) errors.push(`semantic check ${JSON.stringify(name)} failed in ${rel}: missing ${term}`);
  }
}

function validateControlLoopStructure(root: string, errors: string[]): void {
  const text = readIfFile(path.join(root, "skills/control-loop/SKILL.md"));
  const sectionOrder = [
    "## Execution Loop",
    "## Boundaries",
    "## Slice Execution",
    "## Reference Routing",
    "## Routes",
  ];
  requireOrderedTerms("control-loop section order", text, sectionOrder, errors);
  requireOrderedTerms("control-loop execution pseudocode", markdownSection(text, "Execution Loop"), [
    "Run the loop as behavior, not paperwork",
    "function control_loop(goal_contract):",
    "goal = read_accepted_goal_contract(goal_contract)",
    "checkpoint = read_checkpoint_when_present_or_required(goal)",
    "assert_goal_boundaries(goal, checkpoint)",
    "slice = plan_most_useful_verifiable_slice(goal, checkpoint)",
    "assert_slice_boundaries(slice, goal, checkpoint)",
    "if slice.kind == repair and not root_cause_confirmed:",
    "return RETURN_TO_ALPHA_GOAL",
    "if slice.kind not_in [implementation, hardening, repair]:",
    "return BLOCKED",
    "outcome = execute_slice(slice, goal, checkpoint)",
    "if outcome.material_contradiction:",
    "route_material_contradiction_without_patching_around_it(outcome, goal, checkpoint)",
    "evidence = collect_raw_evidence(outcome, slice)",
    "review = review_slice_outcome(slice, outcome, evidence, goal, checkpoint)",
    "gap = compare_to_goal(evidence, review, goal.acceptance_evidence, goal.claim_boundary, material_defect_risk_surface(slice, goal))",
    "return RETURN_TO_ALPHA_GOAL",
    "return BLOCKED",
    "if gap.harden:",
    "verification = goal_verify_before_final_or_route",
    "route = route_after_verification(verification)",
    "return route",
  ], errors);
  requireOrderedTerms("control-loop boundary rules", markdownSection(text, "Boundaries"), [
    "accepted Goal Contract is canonical",
    "goal.has_required_fields",
    "control-loop never creates or derives it",
    "Do not mutate primary",
    "$goal-verify",
    "function assert_slice_boundaries(slice, goal, checkpoint)",
    "slice.surface within goal.repo_surfaces",
    "checkpoint.run_profile when present",
    "integration_evidence_covers_each_repo_boundary",
  ], errors);
  requireOrderedTerms("control-loop slice execution rules", markdownSection(text, "Slice Execution"), [
    "function plan_most_useful_verifiable_slice(goal, checkpoint):",
    "slice = choose_highest_value_bounded_action_verifiable_now(goal, checkpoint)",
    "slice.has_authorized_executable_action",
    "slice.evidence_defined_before_acting",
    "slice.validation_observer_available",
    "slice.names_risks_assumptions_side_effects_cleanup_rollback_containment_stop_conditions",
    "slice.follows_repo_integration_order when cross_repo_goal",
    "return slice",
    "function execute_slice(slice, goal, checkpoint):",
    "material_contradiction",
    "stop_without_patching_around_it",
    "outcome(material_contradiction)",
    "make_one_targeted_change_unless_coordinated_edits_required",
    "requires_embedded_review_or_audit_or_loophole_finding",
    "slice.kind in [implementation, hardening, repair]",
    "standalone_final_judgment_without_goal_verify",
    "preserve(failing_outputs)",
    "deny(hiding_failed_outputs or rerunning_failures_away or summarizing_intentions_as_success)",
    "record(external_side_effects and cleanup_or_rollback_containment_actions)",
    "function review_slice_outcome(slice, outcome, evidence, goal, checkpoint):",
    "evidence.is_fresh",
    "slice.complete only_if evidence.changes_or_confirms(goal.outcome)",
    "deny(slice_complete_or_success_claim)",
    "inspect(material_defect_risk_surface(slice, goal))",
    "limit_claim_to_strongest_direct_evidence_and_checked_surface",
    "function compare_to_goal(evidence, review, acceptance_evidence, claim_boundary, risk_surface):",
    "authorized_acceptance_equivalent_fallback",
    "direction_valid_and_weak(evidence or edge or compatibility or cleanup or verification_gap)",
    "return gap.harden",
  ], errors);
  requireOrderedTerms("control-loop routes", markdownSection(text, "Routes"), [
    "PASS_TO_FINAL",
    "NEXT_ITERATION",
    "verification.Next_route == control-loop",
    "verification.Next_route == alpha-goal",
    "verification.Next_route == BLOCKED",
    "unrecognized verifier route cannot drive execution",
    "if missing(permission or tool or data or environment or credential or user_owned_decision):",
    "return BLOCKED",
    "Stop/re-route",
    "changed_or_unclear(outcome or scope or authority or source_reference or acceptance_evidence or non_goal or decision_boundary or Trigger_Contract or claim_boundary)",
    "changed_or_unclear(run_profile or risk or assumption or stop_condition or user_owned_decision or new_subsystem_or_skill or edits_beyond_approved_boundary)",
    "if user_or_goal_decision_required:",
    "return RETURN_TO_ALPHA_GOAL",
    "return BLOCKED",
    "unrecognized verifier output cannot support progress",
  ], errors);
  for (const forbidden of [
    "Goal Contract, `run-profile.md`, `loop-state.md`, and `memory.md` exist or can be initialized only from authorized task records",
    "verification." + "Gap" + ".kind",
    "verification." + "gap",
    "same_" + "goal_gap",
    "changed_target_scope_" + "authority_or_claim",
    "Before `ITERATION_READY_FOR_VERIFY`, update:",
    "## Trigger Contract",
    "## " + "Auton" + "omy " + "Ladder",
    "## Universal Completion Gates",
    "## State I/O Contract",
    "## Artifact Schemas",
    "# Loop Run Profile",
    "# Loop State",
    "# Loop Memory",
    "# Control State Latest",
    "Iteration Summary",
  ]) {
    if (text.includes(forbidden)) errors.push(`control-loop reverted to unsafe wording: ${forbidden}`);
  }
  const stateRef = readIfFile(path.join(root, "skills/control-loop/references/state-artifacts.md"));
  requireOrderedTerms("control-loop state artifact schemas", stateRef, [
    "## Loop I/O",
    "## Checkpoint",
    "## Run Profile",
    "## Loop State",
    "## Memory",
    "## Iteration",
    "## Evidence",
    "## Verification",
    "## Latest Pointer",
  ], errors);
  requireOrderedTerms("control-loop completion gates reference", readIfFile(path.join(root, "skills/control-loop/references/completion-gates.md")), [
    "## Universal Completion Gates",
    "Scope Gate",
    "Assertion Gate",
    "Replacement/Prohibition Gate",
    "Evidence Boundary Gate",
    "Raw Evidence Gate",
  ], errors);
}

function markdownSection(text: string, heading: string): string {
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const next = text.indexOf("\n## ", start + marker.length);
  return text.slice(start, next < 0 ? undefined : next);
}

function requireOrderedTerms(label: string, text: string, terms: string[], errors: string[]): void {
  let cursor = -1;
  const lower = text.toLowerCase();
  for (const term of terms) {
    const index = lower.indexOf(term.toLowerCase(), cursor + 1);
    if (index < 0) {
      errors.push(`${label}: missing or out of order: ${term}`);
      return;
    }
    cursor = index;
  }
}

function validateSchemaConsistency(root: string, errors: string[]): void {
  const alpha = readIfFile(path.join(root, "skills/alpha-goal/SKILL.md"));
  if (alpha.includes("discovery.route == RETURN_TO_ALPHA_GOAL")) errors.push("alpha Discovery must not self-route to RETURN_TO_ALPHA_GOAL");
  if (/discovery\.route[^\n]*\[[^\]]*RETURN_TO_ALPHA_GOAL[^\]]*\]/.test(alpha)) errors.push("alpha Discovery route list must not include RETURN_TO_ALPHA_GOAL");
  if (/discovery\.route[\s\S]{0,120}return discovery\.route/.test(alpha)) errors.push("alpha Discovery must not return discovery.route");
  if (alpha.includes("return RETURN_TO_ALPHA_GOAL")) errors.push("alpha must use internal transitions instead of returning RETURN_TO_ALPHA_GOAL");
  if (alpha.includes("RETURN_TO_CLARIFY")) errors.push("alpha must use internal Clarify transition instead of RETURN_TO_CLARIFY token");
  for (const term of ["Clarify:", "discovery.route == BLOCKED", "discovery.route != READY_TO_CLARIFY", "goto Clarify"]) if (!alpha.includes(term)) errors.push(`alpha state machine missing internal-route guard: ${term}`);
  const goalContractFields = ["Contract status", "Issued by", "Technical Context", "Discovery notes", "Interview ledger", "Intent", "Outcome", "Scope", "Repo surfaces", "Acceptance evidence", "Non-goals", "Decision boundary", "Claim boundary", "Trigger Contract"];
  for (const term of goalContractFields) if (!alpha.includes(term)) errors.push(`alpha Goal Contract content missing field: ${term}`);
  const designFields = ["Contract status", "Intent", "Root Cause", "Outcome", "Scope", "Repo surfaces", "Constraints", "Acceptance evidence", "Dependency/integration order", "Non-goals", "Decision boundary", "Claim boundary", "Trigger contract", "Blocking gates", "Ledger", "Next"];
  const designStart = Math.max(0, alpha.toLowerCase().indexOf("design summary"));
  const designScoped = alpha.slice(designStart).toLowerCase();
  const designPos = designFields.map(field => designScoped.indexOf(`| ${field.toLowerCase()} |`));
  if (designPos.some(v => v < 0) || designPos.some((v, i) => i > 0 && v <= designPos[i - 1])) errors.push("design summary schema order mismatch: alpha");
  const evSkill = readIfFile(path.join(root, "skills/goal-verify/SKILL.md"));
  const evRef = readIfFile(path.join(root, "skills/goal-verify/references/verification-verdict-schema.md"));
  if (evSkill.includes("- Gaps:") || evRef.includes("- Gaps:")) errors.push("goal verification schema must use only `Gap:`");
  for (const term of ["PASS_TO_FINAL", "NEXT_ITERATION"]) if (!evSkill.includes(term) || !evRef.includes(term)) errors.push(`goal verification verdict enum mismatch: ${term}`);
  for (const term of ["Goal Contract", "Evidence", "Verified at", "Review mode", "Goal satisfaction review", "Defect/risk sweep", "Unclaimed issues found", "Conditional sections", "Loop state review", "Memory review", "Final claim allowed"]) {
    if (!evSkill.includes(term) || !evRef.includes(term)) errors.push(`goal verification schema missing field: ${term}`);
  }
  for (const term of ["NARROW_CLAIM", "REFRAME"]) if (evSkill.includes(term) || evRef.includes(term)) errors.push(`goal verification verdict enum must not include: ${term}`);
  for (const term of ["none / control-loop / alpha-goal / BLOCKED"]) if (!evSkill.includes(term) || !evRef.includes(term)) errors.push(`goal verification next-route options mismatch: ${term}`);
}

function validateInstallDocumentation(root: string, errors: string[]): void {
  const install = readIfFile(path.join(root, "scripts/install.sh"));
  for (const name of REQUIRED_SKILL_NAMES) if (!install.includes(name)) errors.push(`scripts/install.sh missing required skill: ${name}`);
  for (const name of MERGED_SKILL_NAMES) if (!install.includes(name)) errors.push(`scripts/install.sh should clean merged old skill: ${name}`);
  if (!install.includes("evidence-verify")) errors.push("scripts/install.sh should clean old evidence-verify skill link");
  for (const forbidden of ["tools/validate_skills.ts", "run_skillset_validation", "validate_installed_links", "resolve_tsx_runner", "Validation: passed"]) {
    if (install.includes(forbidden)) errors.push(`scripts/install.sh must not run install-time skill validation: ${forbidden}`);
  }
  if (install.includes(COMPACT_RECOVERY_HOOK_MARKER)) errors.push("scripts/install.sh must not hard-code compact recovery hook marker; keep hook policy in templates/hooks.json");
  if (!install.includes("--no-sync-user-hooks")) errors.push("scripts/install.sh missing --no-sync-user-hooks option");
  if (!install.includes("hooks_template")) errors.push("scripts/install.sh missing hooks template sync");
  if (!install.includes("LEGACY_MANAGED_MARKER_FAMILIES")) errors.push("scripts/install.sh missing legacy managed hook migration");
  if (!install.includes("marker_family")) errors.push("scripts/install.sh missing version-independent marker family handling");
  const hooksTemplate = readIfFile(path.join(root, HOOKS_TEMPLATE));
  if (!hooksTemplate) errors.push(`${HOOKS_TEMPLATE}: missing hooks template`);
  else {
    try {
      const parsed = JSON.parse(hooksTemplate);
      if (!parsed?.hooks?.SessionStart) errors.push(`${HOOKS_TEMPLATE}: missing hooks.SessionStart`);
    } catch (error) {
      errors.push(`${HOOKS_TEMPLATE}: invalid JSON: ${errorMessage(error)}`);
    }
    for (const term of [COMPACT_RECOVERY_HOOK_MARKER, "^compact$", "$alpha-goal", "$control-loop", "$goal-verify", "goal-contract.md first", "control-state/latest.md", "checkpoint.md", "Verification", "Evidence", "defect/risk", "unclaimed"]) {
      if (!hooksTemplate.includes(term)) errors.push(`${HOOKS_TEMPLATE}: missing compact recovery hook term: ${term}`);
    }
    for (const term of ["$control-loop: use for bounded implementation or hardening after an accepted Goal Contract authorizes it", "$goal-verify: use for goal completion/readiness/review/audit verification"]) {
      if (!hooksTemplate.includes(term)) errors.push(`${HOOKS_TEMPLATE}: missing candidate skill semantic guard: ${term}`);
    }
    if (/evidence[- ]verify/i.test(hooksTemplate)) errors.push(`${HOOKS_TEMPLATE}: legacy evidence-verify hook prose remains`);
    if (hooksTemplate.includes(`[${COMPACT_RECOVERY_HOOK_MARKER}]`)) errors.push(`${HOOKS_TEMPLATE}: compact recovery marker must not be printed to model context`);
  }
  const readme = readIfFile(path.join(root, "README.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!readme.includes(`skills/${name}/`) || !readme.includes(`\`${name}\``)) errors.push(`README.md missing public skill entry: ${name}`);
  if (!readme.includes("当前代码事实只描述现状")) errors.push("README.md missing current-state-not-desired-state principle");
  if (!readme.includes("执行或加固已授权 slice")) errors.push("README.md must describe control-loop as execution-first");
  if (!readme.includes("Act -> Evidence -> $goal-verify -> Gap?")) errors.push("README.md workflow must include evidence and goal-verify");
  for (const term of ["goal-contract.md", "checkpoint.md", "control-state/latest.md", "15,000 word+punctuation units", "失效条件"]) if (!readme.includes(term)) errors.push(`README.md missing persistent-loop term: ${term}`);
  const readmeEn = readIfFile(path.join(root, "README.en.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!readmeEn.includes(`skills/${name}/`) || !readmeEn.includes(`\`${name}\``)) errors.push(`README.en.md missing public skill entry: ${name}`);
  if (!readmeEn.includes("Current code facts describe current state")) errors.push("README.en.md missing current-state-not-desired-state principle");
  if (!readmeEn.includes("Execute or harden an authorized slice")) errors.push("README.en.md must describe control-loop as execution-first");
  if (!readmeEn.includes("Act -> Evidence -> $goal-verify -> Gap?")) errors.push("README.en.md workflow must include evidence and goal-verify");
  for (const term of ["goal-contract.md", "checkpoint.md", "control-state/latest.md", "discovery notes", "interview ledger", "15,000 word+punctuation units", "invalidation"]) if (!readmeEn.includes(term)) errors.push(`README.en.md missing persistent-loop term: ${term}`);
  const installDoc = readIfFile(path.join(root, "INSTALL.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!installDoc.includes(name)) errors.push(`INSTALL.md missing public skill: ${name}`);
  if (!installDoc.includes("--no-sync-user-hooks")) errors.push("INSTALL.md missing --no-sync-user-hooks option");
  if (!installDoc.includes(HOOKS_TEMPLATE)) errors.push("INSTALL.md missing hooks template behavior");
  if (!installDoc.includes("codex-compact-skill-recovery")) errors.push("INSTALL.md missing legacy hook migration behavior");
  if (/tmp_codex_home\/skills\/[^"`\s]+\/scripts\//.test(installDoc)) errors.push("INSTALL.md smoke test must not require runtime skill scripts");
  if (!installDoc.includes("git rev-parse --show-toplevel")) errors.push("INSTALL.md smoke test must derive workspace slug from repo root");
  if (/basename "\$PWD"|\$\(basename "\$PWD"\)/.test(installDoc)) errors.push("INSTALL.md smoke test must not derive state root from current session directory");
  for (const term of ["set -euo pipefail", "export CODEX_HOME", "Contract status: accepted", "Discovery notes", "Interview ledger", "Trigger Contract:", "goal-contract", "checkpoint", "control-state/latest.md", "verification-triggered recovery", "15,000 word+punctuation units", "without over-compressing", "without requiring runtime skill scripts", "Run Profile, Loop State, Verification, and Evidence"]) if (!installDoc.includes(term)) errors.push(`INSTALL.md missing persistent-loop term: ${term}`);
  const manifest = readIfFile(path.join(root, "MANIFEST.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!manifest.includes(`skills/${name}/`)) errors.push(`MANIFEST.md missing public skill directory: ${name}`);
  if (!manifest.includes(HOOKS_TEMPLATE) || !manifest.includes(COMPACT_RECOVERY_HOOK_MARKER)) errors.push("MANIFEST.md missing hooks template marker");
  if (!manifest.includes("marker family") || !manifest.includes("codex-compact-skill-recovery")) errors.push("MANIFEST.md missing hook upgrade strategy");
  if (!manifest.includes("act or harden authorized slices")) errors.push("MANIFEST.md must describe control-loop as execution-first");
  for (const term of ["goal-contract.md", "checkpoint.md", "control-state/latest.md", "Trigger Contract", "global recovery index", "invalidation", "15,000 word+punctuation units"]) if (!manifest.includes(term)) errors.push(`MANIFEST.md missing persistent-loop term: ${term}`);
  const templateAgents = readIfFile(path.join(root, "templates/AGENTS.md"));
  if (/clearified/i.test(templateAgents)) errors.push("templates/AGENTS.md contains misspelling: clearified");
  if (!templateAgents.includes("explicit user answers, accepted contracts, or source-backed task records")) errors.push("templates/AGENTS.md missing autonomous execution clarity sources");
  for (const term of [
    "Operating Contract",
    "top-level operating contract for the workspace",
    "Must understand the requirements fully before proceeding",
    "Do not modify, refactor, or alter behavior without fully understanding requirements, failure modes, or approved designs",
    "Do not bypass repo workflows, skill gates, phase rules, validation gates, or explicit user instructions",
  ]) {
    if (!templateAgents.includes(term)) errors.push(`templates/AGENTS.md missing operating contract term: ${term}`);
  }
  for (const doc of ["README.md", "README.en.md", "INSTALL.md", "MANIFEST.md"]) {
    const text = readIfFile(path.join(root, doc));
    if (/six skills|六技能|六个技能|成帧、建模、综合|\$goal-contract|\$system-model|\$decision-synthesis/.test(text)) errors.push(`${doc}: stale six-skill public architecture wording`);
  }
}

function validateRuntimeScriptBehavior(root: string, errors: string[]): void {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "alpha-goal-validate-"));
  const env = { ...process.env, CODEX_HOME: tmp };
  try {
    expectExit("mutation-preflight without --task blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "valid-minimal", { runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: false });
    expectExit("mutation-preflight minimal task passes", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "valid-minimal"), 0, errors);

    writeTaskFixture(tmp, path.basename(root), "draft-contract", { contractStatus: "draft", runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: false });
    expectExit("mutation-preflight draft Goal Contract blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "draft-contract"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "incomplete-contract", { completeGoalFields: false, runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: false });
    expectExit("mutation-preflight incomplete Goal Contract blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "incomplete-contract"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "latest-none-valid", { runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: true });
    expectExit("mutation-preflight latest Checkpoint none passes", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "latest-none-valid"), 0, errors);
    writeTaskFixture(tmp, path.basename(root), "open-pr-no-checkpoint", { runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: false });
    expectExit("mutation-preflight open-pr action without checkpoint blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "open-pr-no-checkpoint", "--requested-action", "open-pr"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "side-effect-no-checkpoint", { runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: false });
    expectExit("mutation-preflight side effect without checkpoint blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "side-effect-no-checkpoint", "--external-side-effects", "deploy"), 1, errors);

    writeTaskFixture(tmp, path.basename(root), "stale-contract-binding", { runProfileGoalContract: false });
    expectExit("mutation-preflight stale Goal Contract binding blocks when run-profile exists", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "stale-contract-binding"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "stale-latest", { latestTarget: "valid" });
    expectExit("mutation-preflight stale latest binding blocks when latest exists", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "stale-latest"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "latest-missing-checkpoint", {});
    removeLatestCheckpointField(tmp, path.basename(root));
    expectExit("mutation-preflight latest missing Checkpoint blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "latest-missing-checkpoint"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "stale-verification-section", { verificationTarget: "other-task", verificationVerdict: "NEXT_ITERATION", verificationNextRoute: "control-loop", verificationGap: "same-goal fixable fixture gap" });
    expectExit("mutation-preflight stale Verification binding blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "stale-verification-section"), 1, errors);
    writeTaskFixture(tmp, path.basename(root), "discovery-loop-phase", { loopPhase: "DISCOVERY" });
    expectExit("mutation-preflight discovery loop phase blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "discovery-loop-phase"), 1, errors);
    const primaryRepo = makePrimaryBranchRepo(tmp);
    writeTaskFixture(tmp, path.basename(root), "primary-branch-target", { runProfile: false, loopState: false, memory: false, evidence: false, verification: false, latest: false });
    expectExit("mutation-preflight primary branch target blocks", runTsx(root, env, "skills/control-loop/scripts/mutation-preflight.ts", "--task", "primary-branch-target", primaryRepo), 1, errors);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function runTsx(root: string, env: NodeJS.ProcessEnv, rel: string, ...args: string[]) {
  return spawnSync("npx", ["--no-install", "tsx", rel, ...args], { cwd: root, env, encoding: "utf8" });
}

function expectExit(label: string, result: ReturnType<typeof spawnSync>, expected: number, errors: string[]): void {
  if (result.status !== expected) {
    const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    errors.push(`${label}: expected exit ${expected}, got ${result.status}; output: ${out.slice(0, 800)}`);
  }
}

function writeTaskFixture(tmp: string, workspace: string, task: string, options: { goalContract?: boolean; contractStatus?: string; issuedBy?: string; completeGoalFields?: boolean; runProfile?: boolean; loopState?: boolean; memory?: boolean; evidence?: boolean; verification?: boolean; latest?: boolean; runProfileGoalContract?: boolean; verificationFields?: boolean; requestedAction?: string; loopPhase?: string; latestTarget?: string; verificationTarget?: string; verificationGap?: string; verificationVerdict?: string; verificationNextRoute?: string; defectRiskSweep?: string; unclaimedIssues?: string; negativeCases?: string; goalSatisfaction?: string; finalClaimAllowed?: string }): void {
  const dir = path.join(tmp, workspace || "workspace", task);
  fs.mkdirSync(dir, { recursive: true });
  const goalPath = path.join(dir, "goal-contract.md");
  const goalContract = options.goalContract ?? true;
  const contractStatus = options.contractStatus ?? "accepted";
  const issuedBy = options.issuedBy ?? "alpha-goal";
  const completeGoalFields = options.completeGoalFields ?? true;
  const runProfileEnabled = options.runProfile ?? true;
  const loopStateEnabled = options.loopState ?? true;
  const memoryEnabled = options.memory ?? true;
  const evidenceEnabled = options.evidence ?? true;
  const verificationEnabled = options.verification ?? true;
  const latestEnabled = options.latest ?? true;
  const runProfileGoalContract = options.runProfileGoalContract ?? true;
  const verificationFields = options.verificationFields ?? true;
  const requestedAction = options.requestedAction ?? "modify-worktree";
  const goalContractLines = [
    `Contract status: ${contractStatus}`,
    `Issued by: ${issuedBy}`,
    "Discovery notes: fixture",
    "Interview ledger: fixture",
  ];
  if (completeGoalFields) goalContractLines.splice(4, 0,
    "Technical Context: fixture context",
    "Intent: fixture intent",
    "Outcome: fixture outcome",
    "Scope: fixture scope",
    "Repo surfaces: fixture repo surfaces",
    "Constraints: fixture constraints",
    "Assumptions + resolutions: fixture assumptions",
    "Acceptance evidence: fixture acceptance",
    "Dependency/integration order: fixture order",
    "Non-goals: fixture non-goals",
    "Decision boundary: fixture decision boundary",
    "Claim boundary: fixture claim boundary",
    "Trigger Contract: manual",
    "Handoff ledger: fixture handoff",
  );
  if (goalContract) fs.writeFileSync(goalPath, [...goalContractLines, ""].join("\n"));
  const verificationDir = path.join(tmp, workspace || "workspace", options.verificationTarget ?? task);
  const verificationGap = options.verificationGap ?? "None";
  const goalSatisfaction = options.goalSatisfaction ?? "fixture goal evidence covers explicit contract";
  const defectRiskSweep = options.defectRiskSweep ?? "no material issue found in checked surface";
  const unclaimedIssues = options.unclaimedIssues ?? "None material in checked surface";
  const negativeCases = options.negativeCases ?? "not applicable for fixture";
  const finalClaimAllowed = options.finalClaimAllowed ?? "yes";
  const verificationVerdict = options.verificationVerdict ?? "PASS_TO_FINAL";
  const verificationNextRoute = options.verificationNextRoute ?? "none";
  const loopPhase = options.loopPhase ?? "VERIFICATION";
  const checkpointEnabled = runProfileEnabled || loopStateEnabled || memoryEnabled || evidenceEnabled || verificationEnabled;
  if (!checkpointEnabled) {
    if (latestEnabled) writeLatestPointer(tmp, workspace, task, goalPath, "none", "IMPLEMENTATION", "none", options.latestTarget);
    return;
  }

  const checkpoint: string[] = [
    "# Goal Checkpoint",
    runProfileGoalContract ? `Goal Contract: ${goalPath}` : "Goal Contract:",
    "Updated at: 2026-06-23T00:00:00Z",
    "",
  ];
  if (runProfileEnabled) checkpoint.push(
    "## Run Profile",
    "Rule: Controls execution only; must not expand, narrow, reinterpret, waive, or replace the Goal Contract.",
    `Requested action: ${requestedAction}`,
    "Discovery source: goal-spec-only",
    "External side effects allowed: none",
    "Human checkpoint: none",
    "Evaluator route: $goal-verify before final claim",
    "",
  );
  if (loopStateEnabled) checkpoint.push(
    "## Loop State",
    "Current Objective: fixture",
    `Current Phase: ${loopPhase}`,
    "Completed: None yet",
    "Pending: None yet",
    "Known Risks: None yet",
    "Last Verification Gap: None yet",
    "Next Slice: run validation",
    "Stop Condition: validation complete",
    "",
  );
  if (memoryEnabled) checkpoint.push(
    "## Memory",
    "Confirmed Facts: None yet",
    "Confirmed Root Causes: None yet",
    "Known Constraints: None yet",
    "Working Strategies: None yet",
    "Failed Strategies: None yet",
    "",
  );
  if (evidenceEnabled) checkpoint.push(
    "## Evidence",
    "Acceptance-to-evidence: fixture",
    "Command/output references: fixture",
    "Defect/risk sweep surface: fixture",
    "Residual risks: None",
    "Unsupported or not-run checks: None",
    "",
  );
  if (verificationEnabled) checkpoint.push(...(verificationFields ? [
    "## Verification",
    "Verification Verdict:",
    `- Goal Contract: ${path.join(verificationDir, "goal-contract.md")}`,
    "- Evidence: checkpoint Evidence section",
    "- Verified at: 2026-06-23T00:00:00Z",
    "- Review mode: completion",
    "- Original claim: fixture",
    "- Claim checked: fixture",
    `- Goal satisfaction review: ${goalSatisfaction}`,
    `- Defect/risk sweep: ${defectRiskSweep}`,
    `- Unclaimed issues found: ${unclaimedIssues}`,
    "- Repo surface coverage: fixture",
    "- Evidence coverage: fixture",
    "- Unresolved user-owned decisions: None",
    `- Gap: ${verificationGap}`,
    "- Highest practical evidence-supported boundary: fixture",
    "- Highest supported claim: fixture",
    "- Unsupported portions: None",
    "- Final wording allowed: fixture",
    `- Final claim allowed: ${finalClaimAllowed}`,
    `- Verdict: ${verificationVerdict}`,
    `- Next route: ${verificationNextRoute}`,
    "",
  ] : [
    "## Verification",
    "Verdict:",
    "Gap:",
    "Next route:",
    "",
  ]));
  fs.writeFileSync(path.join(dir, "checkpoint.md"), checkpoint.join("\n"));
  const latestRoute = "none";
  const latestPhase = loopPhase;
  if (latestEnabled) writeLatestPointer(tmp, workspace, task, goalPath, path.join(dir, "checkpoint.md"), latestPhase, latestRoute, options.latestTarget);
}

function writeLatestPointer(tmp: string, workspace: string, task: string, goalPath: string, checkpointPath: string, phase: string, route: string, latestTarget?: string): void {
  const root = path.join(tmp, workspace || "workspace");
  const latestDir = path.join(root, "control-state");
  fs.mkdirSync(latestDir, { recursive: true });
  const latestTask = latestTarget ?? task;
  const stateDir = path.join(root, latestTask);
  fs.writeFileSync(path.join(latestDir, "latest.md"), [
    "# Control State Latest",
    `State directory: ${stateDir}`,
    `Goal Contract: ${path.join(stateDir, "goal-contract.md")}`,
    `Checkpoint: ${checkpointPath === "none" ? "none" : path.join(stateDir, "checkpoint.md")}`,
    `Current Phase: ${phase}`,
    `Next route: ${route}`,
    "Updated at: 2026-06-23T00:00:00Z",
    "",
  ].join("\n"));
}

function removeLatestCheckpointField(tmp: string, workspace: string): void {
  const latest = path.join(tmp, workspace || "workspace", "control-state", "latest.md");
  const text = fs.readFileSync(latest, "utf8");
  fs.writeFileSync(latest, text.split(/\r?\n/).filter(line => !/^[ \t]*Checkpoint:/i.test(line)).join("\n"));
}

function makePrimaryBranchRepo(tmp: string): string {
  const repo = path.join(tmp, "primary-branch-repo");
  fs.mkdirSync(repo, { recursive: true });
  spawnSync("git", ["init", "-b", "main"], { cwd: repo, encoding: "utf8" });
  fs.writeFileSync(path.join(repo, ".gitignore"), ".worktrees/\n");
  return repo;
}

function validateNoAutoDownloadRunner(root: string, files: string[], errors: string[]): void {
  const autoDownloadTsx = /npx\s+--yes\s+tsx/;
  for (const file of files) {
    const rel = relative(root, file);
    if (rel.startsWith(".alpha-goal/")) continue;
    if (!/\.(md|ts|sh|toml)$/.test(rel) && rel !== "AGENTS.md") continue;
    if (autoDownloadTsx.test(fs.readFileSync(file, "utf8"))) errors.push(`${rel}: must not auto-download tsx with npx --yes`);
  }
}

function readIfFile(file: string): string { return isFile(file) ? fs.readFileSync(file, "utf8") : ""; }
function isFile(file: string): boolean { try { return fs.statSync(file).isFile(); } catch { return false; } }
function isDirectory(file: string): boolean { try { return fs.statSync(file).isDirectory(); } catch { return false; } }
function walk(root: string): string[] {
  const result: string[] = [];
  if (!fs.existsSync(root)) return result;
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv", "__pycache__"]);
  function visit(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && skipped.has(entry.name)) continue;
      const full = path.join(dir, entry.name); result.push(full); if (entry.isDirectory()) visit(full);
    }
  }
  visit(root); return result.sort();
}
function relative(root: string, file: string): string { return path.relative(root, file).split(path.sep).join("/"); }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function printReport(root: string, errors: string[], warnings: string[]): void {
  console.log("Skill suite validation"); console.log(`root: ${root}`);
  if (warnings.length) { console.log("\nWARNINGS:"); for (const w of warnings) console.log(`- ${w}`); }
  if (errors.length) { console.log("\nERRORS:"); for (const e of errors) console.log(`- ${e}`); }
  else console.log("PASS: all checks passed");
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
