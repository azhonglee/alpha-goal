#!/usr/bin/env -S npx --no-install tsx
import fs from "node:fs";
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
const STATE_ROOT_ALPHA_FILES = [
  "skills/alpha-goal/SKILL.md",
];
const STATE_ROOT_CORE_FILES = [
  "skills/control-loop/SKILL.md",
  "skills/goal-verify/SKILL.md",
  "templates/AGENTS.md",
];
const STATE_ROOT_DOC_FILES = [
  "AGENTS.md",
  "MANIFEST.md",
];
const STATE_ROOT_SCRIPT_FILES: string[] = [];
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
const STATE_ROOT_ALPHA_REQUIRED_TERMS = [
  "Alpha Goal state root",
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
    required: ["engineering", "design", "implementation"],
    forbidden: ["completion, correctness, readiness, safety"],
  },
  "control-loop": {
    required: ["Goal-contract-driven bounded executor", "accepted Goal Contract", "implementation", "hardening", "Do not use for ambiguous planning"],
    forbidden: ["discover facts before asking", "final evidence verdicts"],
  },
  "goal-verify": {
    required: ["Compare execution evidence", "accepted Goal Contract", "routing verdict", "Never redefine authority"],
    forbidden: ["discover facts before asking", "act, sense feedback"],
  },
};

const SEMANTIC_CHECKS: Array<[string, string, string[]]> = [
  ["front controller defines goals before execution", "skills/alpha-goal/SKILL.md", [
    "owns goal definition and design clarification",
    "run Loop Q&A to clarify intent, outcome, boundaries, non-goals, success criteria, acceptance evidence, and key technical design",
    "before modification, implementation, repair, refactor, or hardening",
    "Use inspection facts as entry evidence",
    "Entry Gate",
    "Skip only for concrete read-only work",
    "Check Point:",
    "Inspect the relevant files, docs, recent commits, and existing patterns",
    "Identify facts, conflicts, unknowns, dependencies, and source-of-truth conflicts",
    "Inspection is entry evidence, not permission to modify",
    "Clarification Gate",
    "coverage matrix has no blocking gap",
    "Goal Contract coverage: Intent, Outcome, Scope, Constraints, Non-goals, Decision boundary, Claim boundary, Authorization source, Success Criteria, Acceptance evidence",
    "Technical Design coverage: Architecture, Components, Interfaces, Data Models, Data Flow, Test Plans, Risks",
    "Material assumptions have been pressure-tested",
    "A dimension is not covered by one answer by default",
    "Planned questions, unanswered questions, and hypothetical answers do not reduce coverage",
    "Do not use confidence alone as exit evidence",
    "Do not use round count as completion evidence",
    "Do not propose implementation, code edits, or `$control-loop` handoff while any blocking goal or design gap remains",
    "Clarification",
    "Record inspection results",
    "Discovery notes",
    "Loop Q&A",
    "Anti-Pattern",
    "Every project MUST go through the workflow below",
    "user-confirmed",
    "Write Artifacts",
    "one high-leverage question",
    "one decision variable",
    "Do not ask for discoverable facts",
    "Revisit the same dimension",
    "Ask one round, wait for the answer",
    "Do not pre-generate a complete questionnaire",
    "Cross-check user claims against code/docs",
    "Current-state facts cannot define desired behavior",
    "actuator boundary -> `Decision boundary`",
    "sensor/observer boundary -> `Claim boundary`",
    "Follow-up policy",
    "coverage chain",
    "Prefer depth over breadth",
    "technical_design.md",
    "coverage matrix gaps",
    "blocking",
    "non-material",
    "deferred non-goal",
    "Assumption Stress Test",
    "Contract status",
    "Issued by = alpha-goal",
    "references/technical-design-book.md",
    "Write artifacts only from answered, auto-confirmed, or cited facts",
    "Keep unresolved required fields as `[blocking]`",
    "Self-check the Goal Contract and Technical Design",
    "Run independent review",
    "raw artifacts and the user request",
    "visible Review Record",
    "approval request message must include, in order",
    "Key design decisions",
    "If the summary or Review Record is missing or incomplete, stay in Review Gate",
    "Discovery notes",
    "Interview ledger",
    "goal-contract.md",
    "request_user_input",
    "$control-loop",
    "Design Summary",
    "Goal Contract Summary"
  ]],
  ["alpha records interview and design state", "skills/alpha-goal/SKILL.md", [
    "Alpha Goal state root",
    "YYYYMMDD-<TaskName>/goal-contract.md",
    "Discovery notes",
    "Interview ledger",
    "Goal Contract Summary"
  ]],
  ["goal contract book defines required content", "skills/alpha-goal/references/goal-contract-book.md", [
    "state-root `goal-contract.md` is canonical",
    "Required Content",
    "Contract status",
    "Technical Context",
    "Intent",
    "Outcome",
    "Scope",
    "Success Criteria",
    "Acceptance evidence",
    "Non-goals",
    "Execution boundary",
    "Decision boundary",
    "Claim boundary",
    "Authorization Source"
  ]],
  ["technical design book defines required content", "skills/alpha-goal/references/technical-design-book.md", [
    "state-root `technical_design.md` is canonical",
    "Required Content",
    "Goal Contract link",
    "Design status",
    "Architecture",
    "Components",
    "Data Flow",
    "Interfaces",
    "Data Models",
    "Test Plans",
    "Risks",
    "Acceptance evidence mapping"
  ]],
  ["execution has hard safety gates", "skills/control-loop/SKILL.md", [
    "Goal Contract is authority",
    "Execution is actuator output",
    "Evidence is sensor input",
    "`$goal-verify` is comparator",
    "`control-loop` may implement, repair, harden",
    "Run the loop as behavior, not paperwork",
    "function control_loop(goal_contract)",
    "read_accepted_goal_contract(goal_contract)",
    "plan_highest_value_verifiable_slice",
    "assert_slice_within_goal_contract",
    "changed_goal_authority",
    "same_goal_fixable_gap",
    "run_goal_verify_before_completion_claim",
    "Slice Boundary Gates",
    "Slice target is inside Goal Contract target",
    "Execution Gates",
    "Accepted Goal Contract loaded",
    "Worktree / branch safety checked",
    "Primary branch mutation denied",
    "Completion Gate",
    "Acceptance evidence collected",
    "No unresolved same-goal fixable gap remains",
    "Stop / Return Rules",
    "Return to $alpha-goal",
    "Continue next iteration",
    "checkpoint.md",
    "$goal-verify",
    "RETURN_TO_ALPHA_GOAL",
    "BLOCKED"
  ]],
  ["goal verification routes evidence gaps", "skills/goal-verify/SKILL.md", [
    "verification authority",
    "compares collected evidence against an accepted Goal Contract",
    "PASS_TO_FINAL",
    "NEXT_ITERATION",
    "BLOCKED",
    "RETURN_TO_ALPHA_GOAL",
    "Evidence Classification",
    "Gap Analysis",
    "same_goal_fixable",
    "scope_change",
    "authority_change",
    "external_blocker",
    "verification_complete",
    "Contract Gate",
    "Evidence Gate",
    "Authority Gate",
    "Blocker Gate",
    "function goal_verify(goal, evidence)",
    "Route Contract",
    "Before Final Verdict Checklist"
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
  validateAlphaGoalStructure(root, errors);
  validateControlLoopStructure(root, errors);
  validateSchemaConsistency(root, errors);
  validateInstallDocumentation(root, errors);
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
  for (const rel of STATE_ROOT_ALPHA_FILES) {
    const text = readIfFile(path.join(root, rel));
    if (!text) { errors.push(`${rel}: missing state-root file`); continue; }
    for (const term of STATE_ROOT_ALPHA_REQUIRED_TERMS) if (!text.includes(term)) errors.push(`${rel}: missing state-root guidance: ${term}`);
  }
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
  const scanned = [...new Set([...STATE_ROOT_ALPHA_FILES, ...STATE_ROOT_CORE_FILES, ...STATE_ROOT_DOC_FILES, ...STATE_ROOT_SCRIPT_FILES, "tools/validate_skills.ts"])];
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

function validateAlphaGoalStructure(root: string, errors: string[]): void {
  const text = readIfFile(path.join(root, "skills/alpha-goal/SKILL.md"));
  requireOrderedTerms("alpha-goal top-level order", text, [
    "## Entry Gate",
    "## Clarification Gate",
    "## Clarification",
    "## Confirmation Gate",
  ], errors);
  requireOrderedTerms("alpha-goal review-to-confirmation handoff", text, [
    "### Review Gate",
    "After Review Gate completes, present the Goal Contract Summary first",
    "The approval request message must include, in order: Goal Contract Summary, Review Record",
    "If the summary or Review Record is missing or incomplete, stay in Review Gate",
    "## Confirmation Gate",
  ], errors);
  requireOrderedTerms("alpha-goal entry gate", markdownSection(text, "Entry Gate"), [
    "Enter `alpha-goal`",
    "Skip only for concrete read-only work",
    "Anti-Pattern",
    "Every project MUST go through the workflow below",
    "user-confirmed",
    "Check Point:",
    "Inspect the relevant files, docs, recent commits, and existing patterns",
    "Identify facts, conflicts, unknowns, dependencies, and source-of-truth conflicts",
    "Record inspection results",
    "Inspection is entry evidence, not permission to modify",
  ], errors);
  const entryGate = markdownSection(text, "Entry Gate").toLowerCase();
  for (const forbidden of ["after you have inspected", "after inspecting", "after inspection"]) {
    if (entryGate.includes(forbidden)) errors.push(`alpha-goal entry gate must not use inspect-after trigger wording: ${forbidden}`);
  }
  requireOrderedTerms("alpha-goal clarification gate", markdownSection(text, "Clarification Gate"), [
    "Do not leave `Clarification`",
    "coverage matrix has no blocking gap",
    "Goal Contract coverage: Intent, Outcome, Scope, Constraints, Non-goals, Decision boundary, Claim boundary, Authorization source, Success Criteria, Acceptance evidence",
    "Technical Design coverage: Architecture, Components, Interfaces, Data Models, Data Flow, Test Plans, Risks",
    "Every unresolved unknown is classified",
    "At least one design-detail probe and one acceptance-evidence probe are complete",
    "Material assumptions have been pressure-tested",
    "A dimension is not covered by one answer by default",
    "The highest-risk goal dimension and highest-risk design dimension each receive follow-up",
    "Planned questions, unanswered questions, and hypothetical answers do not reduce coverage",
    "Do not use confidence alone as exit evidence",
    "Do not use round count as completion evidence",
    "Do not propose implementation, code edits, or `$control-loop` handoff while any blocking goal or design gap remains",
  ], errors);
  requireOrderedTerms("alpha-goal clarification", markdownSection(text, "Clarification"), [
    "Evaluate:",
    "Problem validity",
    "Context sufficiency",
    "Hidden issues",
    "Loop Q&A until the user-owned decisions and technical design are explicit enough",
    "Loop Q&A",
    "one high-leverage question",
    "one decision variable",
    "Do not ask for discoverable facts",
    "request_user_input",
    "Update `goal-contract.md` and `technical_design.md` after each answer",
    "Interview ledger",
    "Revisit the same dimension",
    "Ask one round, wait for the answer",
    "Do not pre-generate a complete questionnaire",
    "Original request and probable intent",
    "Current coverage matrix gaps",
    "Target dimensions step by step",
    "intent, outcome, scope, execution boundary, non-goals",
    "Design Priority",
    "architecture, components, data flow, interfaces, data models",
    "test plans, scalability, risks, rollback",
    "Round {n} | Target: {dimension} | Gap: {blocking|non-material|deferred}",
    "Classify each answer before updating artifacts",
    "Cross-check user claims against code/docs",
    "Current-state facts cannot define desired behavior",
    "Boundary mapping",
    "actuator boundary -> `Decision boundary`",
    "sensor/observer boundary -> `Claim boundary`",
    "Pressure-test the answer",
    "architecture, component, interface, data model, data flow, test, or risk decision follows",
    "Follow-up policy",
    "Do not mark a dimension `covered` after the first answer",
    "Do not rotate to the next dimension",
    "Record the coverage chain",
    "Prefer depth over breadth",
    "Evaluate coverage",
    "`covered`",
    "`blocking`",
    "`non-material`",
    "`deferred non-goal`",
    "If any blocking gap remains, continue Loop Q&A",
    "Round count never closes Clarification",
    "Assumption Stress Test",
    "Write Artifacts",
    "references/goal-contract-book.md",
    "Issued by = alpha-goal",
    "references/technical-design-book.md",
    "Link the Goal Contract and Technical Design to each other",
    "Write artifacts only from answered, auto-confirmed, or cited facts",
    "Keep unresolved required fields as `[blocking]`",
    "Review Gate",
    "Self-check the Goal Contract and Technical Design",
    "No required field relies on current-state facts as desired behavior",
    "No blocking goal or design gap remains",
    "Each success criterion maps to acceptance evidence and a validation observer",
    "Key design decisions cover architecture, components, interfaces, data models, data flow, tests, and risks",
    "Run independent review",
    "Pass raw artifacts and the user request",
    "Require the reviewer to check shallow Q&A, missing design detail, missing acceptance evidence, and premature implementation risk",
    "Record self-check and independent review results",
    "Produce a visible Review Record",
  ], errors);
  requireOrderedTerms("alpha-goal confirmation gate", markdownSection(text, "Confirmation Gate"), [
    "Use `request_user_input`",
    "approve/launch, refine, or reject",
    "Contract status: accepted",
    "hand off to `$control-loop`",
  ], errors);
}

function validateControlLoopStructure(root: string, errors: string[]): void {
  const text = readIfFile(path.join(root, "skills/control-loop/SKILL.md"));
  const sectionOrder = [
    "## Core Principle",
    "## Runtime Flow",
    "## Authority",
    "## Evidence Classification",
    "## Slice Boundary Gates",
    "## Execution Gates",
    "## Completion Gate",
    "## Stop / Return Rules",
    "## Checkpoint Policy",
    "## Before Final Response Checklist",
  ];
  requireOrderedTerms("control-loop section order", text, sectionOrder, errors);
  requireOrderedTerms("control-loop runtime flow", markdownSection(text, "Runtime Flow"), [
    "Run the loop as behavior, not paperwork",
    "function control_loop(goal_contract):",
    "goal = read_accepted_goal_contract(goal_contract)",
    "checkpoint = read_checkpoint_if_present_or_needed(goal)",
    "assert_goal_contract_valid(goal)",
    "assert_execution_environment_safe(goal)",
    "slice = plan_highest_value_verifiable_slice(goal, checkpoint)",
    "assert_slice_within_goal_contract(slice, goal)",
    "outcome = execute_slice(slice)",
    "evidence = collect_execution_evidence(slice, outcome)",
    "classified = classify_execution_evidence(evidence, goal)",
    "if classified.changed_goal_authority:",
    "return RETURN_TO_ALPHA_GOAL",
    "if classified.blocked:",
    "return BLOCKED",
    "if classified.same_goal_fixable_gap:",
    "continue",
    "verification = run_goal_verify_before_completion_claim(classified, goal)",
    "route = route_after_verification(verification, goal)",
    "return route",
  ], errors);
  requireOrderedTerms("control-loop authority rules", markdownSection(text, "Authority"), [
    "The Goal Contract defines",
    "target",
    "scope",
    "constraints",
    "acceptance evidence",
    "non-goals",
    "decision boundary",
    "claim boundary",
    "authorization source",
    "control-loop may not change any of them",
    "RETURN_TO_ALPHA_GOAL",
  ], errors);
  requireOrderedTerms("control-loop execution gates", markdownSection(text, "Execution Gates"), [
    "Accepted Goal Contract loaded",
    "Issued by = alpha-goal",
    "Worktree / branch safety checked",
    "Primary branch mutation denied",
    "Unrelated user changes identified and preserved",
    "Relevant repo rules inspected",
    "Required dependencies/tools available",
    "Rollback or recovery path understood",
  ], errors);
  requireOrderedTerms("control-loop stop rules", markdownSection(text, "Stop / Return Rules"), [
    "Return to $alpha-goal when:",
    "Target changes",
    "Scope changes",
    "Acceptance evidence changes",
    "Authorization source changes",
    "Return BLOCKED when:",
    "Permission missing",
    "Credential missing",
    "Environment unavailable",
    "Continue next iteration when:",
    "Gap is fixable",
    "Finish only when:",
    "Goal Contract acceptance evidence is satisfied",
    "goal-verify passes",
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
}

function markdownSection(text: string, heading: string): string {
  const lines = text.split(/\r?\n/);
  const marker = `## ${heading}`;
  const start = lines.findIndex(line => line.trim() === marker);
  if (start < 0) return "";
  const next = lines.slice(start + 1).findIndex(line => /^##\s+/.test(line));
  const end = next < 0 ? lines.length : start + 1 + next;
  return lines.slice(start, end).join("\n");
}

function markdownSubsection(text: string, heading: string): string {
  const marker = `### ${heading}`;
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const rest = text.slice(start + marker.length);
  const next = rest.search(/\n#{2,3} /);
  return text.slice(start, next < 0 ? undefined : start + marker.length + next);
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
  const goalContractBook = readIfFile(path.join(root, "skills/alpha-goal/references/goal-contract-book.md"));
  const technicalDesignBook = readIfFile(path.join(root, "skills/alpha-goal/references/technical-design-book.md"));
  const goalContractSpec = `${alpha}\n${goalContractBook}`;
  const goalContractFields = ["Contract status", "Issued by", "Technical Context", "Intent", "Outcome", "Scope", "Constraints", "Success Criteria", "Acceptance evidence", "Non-goals", "Execution boundary", "Decision boundary", "Claim boundary", "Authorization Source"];
  for (const term of goalContractFields) if (!goalContractSpec.includes(term)) errors.push(`alpha Goal Contract content missing field: ${term}`);
  for (const term of ["Goal Contract link", "Design status", "Architecture", "Components", "Data Flow", "Interfaces", "Data Models", "Test Plans", "Risks", "Acceptance evidence mapping"]) {
    if (!technicalDesignBook.includes(term)) errors.push(`alpha Technical Design content missing field: ${term}`);
  }
  requireOrderedTerms("alpha design summary presentation", alpha, [
    "After Review Gate completes, present the Goal Contract Summary first",
    "The approval request message must include, in order: Goal Contract Summary, Review Record",
    "Goal Contract Summary",
    "Design Summary",
    "| Field | Value |",
    "| --- | --- |",
    "| Goal | ... |",
    "| Non-goals | ... |",
    "| Execution boundary | ... |",
    "| Key design decisions | ... |",
    "## Confirmation Gate",
    "Use `request_user_input`",
  ], errors);
  const evSkill = readIfFile(path.join(root, "skills/goal-verify/SKILL.md"));
  for (const term of ["PASS_TO_FINAL", "NEXT_ITERATION", "BLOCKED", "RETURN_TO_ALPHA_GOAL"]) if (!evSkill.includes(term)) errors.push(`goal verification verdict enum mismatch: ${term}`);
  for (const term of ["same_goal_fixable", "scope_change", "authority_change", "external_blocker", "verification_complete"]) if (!evSkill.includes(term)) errors.push(`goal verification gap kind missing: ${term}`);
  for (const term of ["NARROW_CLAIM", "REFRAME"]) if (evSkill.includes(term)) errors.push(`goal verification verdict enum must not include: ${term}`);
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
    for (const term of [COMPACT_RECOVERY_HOOK_MARKER, "^compact$", "$alpha-goal", "$control-loop", "$goal-verify", "draft or accepted goal-contract.md first", "accepted status gates only control-loop execution handoff", "control-state/latest.md", "checkpoint.md", "Verification", "Evidence", "defect/risk", "unclaimed"]) {
      if (!hooksTemplate.includes(term)) errors.push(`${HOOKS_TEMPLATE}: missing compact recovery hook term: ${term}`);
    }
    for (const term of ["$control-loop: use for bounded implementation or hardening after an accepted Goal Contract authorizes it", "$goal-verify: use for goal completion/readiness/review/audit verification"]) {
      if (!hooksTemplate.includes(term)) errors.push(`${HOOKS_TEMPLATE}: missing candidate skill semantic guard: ${term}`);
    }
    if (/evidence[- ]verify/i.test(hooksTemplate)) errors.push(`${HOOKS_TEMPLATE}: legacy evidence-verify hook prose remains`);
    if (hooksTemplate.includes(`[${COMPACT_RECOVERY_HOOK_MARKER}]`)) errors.push(`${HOOKS_TEMPLATE}: compact recovery marker must not be printed to model context`);
  }
  const readme = readIfFile(path.join(root, "README.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!readme.includes(`skills/${name}/`) || !(readme.includes(`\`${name}\``) || readme.includes(`<code>${name}</code>`))) errors.push(`README.md missing public skill entry: ${name}`);
  if (!readme.includes("当前代码事实只描述现状")) errors.push("README.md missing current-state-not-desired-state principle");
  if (!readme.includes("执行或加固已授权 slice")) errors.push("README.md must describe control-loop as execution-first");
  if (!readme.includes("Act -> Evidence -> $goal-verify -> Gap?")) errors.push("README.md workflow must include evidence and goal-verify");
  for (const term of ["goal-contract.md", "checkpoint.md", "Technical Design"]) if (!readme.includes(term)) errors.push(`README.md missing persistent-loop term: ${term}`);
  const readmeEn = readIfFile(path.join(root, "README.en.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!readmeEn.includes(`skills/${name}/`) || !(readmeEn.includes(`\`${name}\``) || readmeEn.includes(`<code>${name}</code>`))) errors.push(`README.en.md missing public skill entry: ${name}`);
  if (!readmeEn.includes("Current code facts describe current state")) errors.push("README.en.md missing current-state-not-desired-state principle");
  if (!readmeEn.includes("Execute or harden an authorized slice")) errors.push("README.en.md must describe control-loop as execution-first");
  if (!readmeEn.includes("Act -> Evidence -> $goal-verify -> Gap?")) errors.push("README.en.md workflow must include evidence and goal-verify");
  for (const term of ["goal-contract.md", "checkpoint.md", "Technical Design"]) if (!readmeEn.includes(term)) errors.push(`README.en.md missing persistent-loop term: ${term}`);
  const installDoc = readIfFile(path.join(root, "INSTALL.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!installDoc.includes(name)) errors.push(`INSTALL.md missing public skill: ${name}`);
  if (!installDoc.includes("--no-sync-user-hooks")) errors.push("INSTALL.md missing --no-sync-user-hooks option");
  if (!installDoc.includes(HOOKS_TEMPLATE)) errors.push("INSTALL.md missing hooks template behavior");
  if (!installDoc.includes("codex-compact-skill-recovery")) errors.push("INSTALL.md missing legacy hook migration behavior");
  if (/tmp_codex_home\/skills\/[^"`\s]+\/scripts\//.test(installDoc)) errors.push("INSTALL.md smoke test must not require runtime skill scripts");
  if (!installDoc.includes("git rev-parse --show-toplevel")) errors.push("INSTALL.md smoke test must derive workspace slug from repo root");
  if (/basename "\$PWD"|\$\(basename "\$PWD"\)/.test(installDoc)) errors.push("INSTALL.md smoke test must not derive state root from current session directory");
  for (const term of ["set -euo pipefail", "export CODEX_HOME", "Contract status: accepted", "Discovery notes", "Interview ledger", "goal-contract", "draft or accepted goal-contract.md first", "accepted status gates only control-loop execution handoff", "checkpoint", "control-state/latest.md", "verification-triggered recovery", "15,000 word+punctuation units", "without over-compressing", "without requiring runtime skill scripts", "Run Profile, Loop State, Verification, and Evidence"]) if (!installDoc.includes(term)) errors.push(`INSTALL.md missing persistent-loop term: ${term}`);
  const manifest = readIfFile(path.join(root, "MANIFEST.md"));
  for (const name of REQUIRED_SKILL_NAMES) if (!manifest.includes(`skills/${name}/`)) errors.push(`MANIFEST.md missing public skill directory: ${name}`);
  if (!manifest.includes(HOOKS_TEMPLATE) || !manifest.includes(COMPACT_RECOVERY_HOOK_MARKER)) errors.push("MANIFEST.md missing hooks template marker");
  if (!manifest.includes("marker family") || !manifest.includes("codex-compact-skill-recovery")) errors.push("MANIFEST.md missing hook upgrade strategy");
  if (!manifest.includes("act or harden authorized slices")) errors.push("MANIFEST.md must describe control-loop as execution-first");
  for (const term of ["goal-contract.md", "draft or accepted", "accepted status", "checkpoint.md", "control-state/latest.md", "global recovery index", "invalidation", "15,000 word+punctuation units"]) if (!manifest.includes(term)) errors.push(`MANIFEST.md missing persistent-loop term: ${term}`);
  const templateAgents = readIfFile(path.join(root, "templates/AGENTS.md"));
  if (/clearified/i.test(templateAgents)) errors.push("templates/AGENTS.md contains misspelling: clearified");
  if (!templateAgents.includes("only after user confirm gates")) errors.push("templates/AGENTS.md missing user confirm gate wording");
  for (const term of [
    "Operating Contract",
    "top-level operating contract for the workspace",
    "Must fully understand the requirements before proceeding",
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
