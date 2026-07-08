#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const SKILLS_COUNT_BUDGET = 15_000;
const CONTRACT_PATH = "tools/validation/alpha-goal.json";
const HOOK_MARKER = "codex-alpha-goal-compact-recovery:v1";
const HOOK_MARKER_FAMILY_RE = /codex-alpha-goal-compact-recovery:v[0-9]+/;
const LEGACY_HOOK_MARKER = "codex-compact-skill-recovery";
const VALIDATOR_COMMAND = "node tools/validate_skills.js .";
const FIXTURE_COMMAND = "node tools/validate_skills.js --fixtures";

const LEGACY_SKILL_REFERENCES = [
  "goal-contract",
  "system-model",
  "decision-synthesis",
  "evidence-verify",
  "control-kernel",
  "loop",
  "verify",
  "meta-synthesis",
  "goal-frame",
  "goal-loop",
  "goal-iterate",
  "goal-review",
];
const LEGACY_SCRIPT_REFERENCES = [
  "tools/validate_skills.ts",
  "tools/validate_skills.py",
  "tools/validate_skillset.py",
  "tools/validate_skillset.ts",
  "scripts/mutation-preflight.sh",
  "mutation-preflight.sh",
  "scripts/repo-sensor-snapshot.sh",
  "repo-sensor-snapshot.sh",
  "scripts/evidence-summary.ts",
  "evidence-summary.ts",
  "scripts/evidence-summary.sh",
  "evidence-summary.sh",
  "scripts/goal-verification-summary.ts",
  "goal-verification-summary.ts",
  "scripts/goal-verification-summary.sh",
  "goal-verification-summary.sh",
];
const LEGACY_RUN_MODE_REFERENCES = ["automation-triggered", "from-verification", "Run mode: manual | automation"];
const LEGACY_RUNTIME_ARTIFACT_REFERENCES = [
  "context.md",
  "interview.md",
  "run-profile.md",
  "loop-state.md",
  "memory.md",
  "iteration.md",
  "evidence.md",
  "verification.md",
];
const RENAMED_LEGACY_SKILLS = [
  { kebab: "control-loop", title: "Control Loop" },
  { kebab: "goal-verify", title: "Goal Verify" },
];
const RENAMED_LEGACY_ALLOWED_FILES = new Set([
  "INSTALL.md",
  "scripts/install.sh",
  "tools/validate_skills.js",
]);
const FORBIDDEN_EVIDENCE_TYPES = ["from-environment", "from-gap"];
const FORBIDDEN_GAP_KINDS = ["verification_complete"];
const LEGACY_EVIDENCE_ALIASES = [
  "from-test-pass",
  "from-test-fail",
  "from-build-pass",
  "from-build-fail",
  "from-runtime-observation",
  "from-code-change",
  "from-user-validation",
  "from-observer",
];

function main(args = process.argv.slice(2)) {
  if (args[0] === "--fixtures") return runFixtures(args.slice(1));

  const root = path.resolve(args[0] || path.join(__dirname, ".."));
  const { errors, warnings } = validateRoot(root);
  printReport(root, errors, warnings);
  return errors.length ? 1 : 0;
}

function validateRoot(root) {
  const errors = [];
  const warnings = [];
  const contract = readContract(root, errors);
  const files = walk(root).filter(isFile);
  const skillFiles = files.filter(file => relative(root, file).startsWith("skills/"));

  validateContract(contract, errors);
  validateSkillDirs(root, contract, errors, warnings);
  validateSkillsCountBudget(skillFiles, errors);
  validateStateRootGuidance(root, contract, errors);
  validateScriptSurface(root, files, errors, warnings);
  validateLegacyReferences(root, contract, skillFiles, errors);
  validateRenamedLegacyReferences(root, files, errors);
  validateAlphaGoal(root, contract, errors);
  validateExecutor(root, contract, errors);
  validateVerifier(root, contract, errors);
  validateNoLegacyEvidenceConcepts(root, errors);
  validateCrossFileContract(root, contract, errors);
  validateHookTemplate(root, errors);
  validateInstallSurface(root, contract, errors);
  validateClaudeTemplateParity(root, errors);
  validateDocs(root, contract, errors);
  validateNoAutoDownloadRunner(root, files, errors);

  return { errors, warnings };
}

function readContract(root, errors) {
  const file = path.join(root, CONTRACT_PATH);
  if (!isFile(file)) {
    errors.push(`missing shared contract: ${CONTRACT_PATH}`);
    return emptyContract();
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${CONTRACT_PATH}: invalid JSON: ${errorMessage(error)}`);
    return emptyContract();
  }
}

function emptyContract() {
  return {
    schemaVersion: 0,
    skills: [],
    artifacts: [],
    routes: [],
    gapKinds: [],
    evidenceTypes: [],
    requiredGates: [],
    clarificationExitRules: [],
    summaryFields: [],
    nativeGoalSync: {},
    technicalDesignRunbook: {},
    checkedFiles: [],
    nodeRequirement: "",
  };
}

function validateContract(contract, errors) {
  if (contract.schemaVersion !== 1) errors.push(`${CONTRACT_PATH}: schemaVersion must be 1`);
  requireArray(contract, "skills", errors);
  requireArray(contract, "artifacts", errors);
  requireArray(contract, "routes", errors);
  requireArray(contract, "gapKinds", errors);
  requireArray(contract, "evidenceTypes", errors);
  requireArray(contract, "requiredGates", errors);
  requireArray(contract, "clarificationExitRules", errors);
  requireArray(contract, "summaryFields", errors);
  const legacyGoalSyncKey = ["codex", "Goal", "Sync"].join("");
  if (legacyGoalSyncKey in contract) errors.push(`${CONTRACT_PATH}: legacy goal-sync field must not be present`);
  if (!contract.nativeGoalSync || typeof contract.nativeGoalSync !== "object" || Array.isArray(contract.nativeGoalSync)) {
    errors.push(`${CONTRACT_PATH}: nativeGoalSync must be an object`);
  } else {
    requireArray(contract.nativeGoalSync, "alphaGoalRequiredTerms", errors, `${CONTRACT_PATH}: nativeGoalSync`);
  }
  if (!contract.technicalDesignRunbook || typeof contract.technicalDesignRunbook !== "object" || Array.isArray(contract.technicalDesignRunbook)) {
    errors.push(`${CONTRACT_PATH}: technicalDesignRunbook must be an object`);
  } else {
    if (typeof contract.technicalDesignRunbook.path !== "string" || !contract.technicalDesignRunbook.path) {
      errors.push(`${CONTRACT_PATH}: technicalDesignRunbook.path must be a non-empty string`);
    }
    requireArray(contract.technicalDesignRunbook, "confirmationTerms", errors, `${CONTRACT_PATH}: technicalDesignRunbook`);
    requireArray(contract.technicalDesignRunbook, "requiredTerms", errors, `${CONTRACT_PATH}: technicalDesignRunbook`);
  }
  const contractText = JSON.stringify(contract);
  for (const legacy of ["\u0043odex Goal Sync", "token_\u0062udget", "active \u0043odex goal"]) {
    if (contractText.includes(legacy)) errors.push(`${CONTRACT_PATH}: legacy native goal sync term remains: ${legacy}`);
  }
  requireArray(contract, "checkedFiles", errors);
  if (typeof contract.nodeRequirement !== "string" || !contract.nodeRequirement) {
    errors.push(`${CONTRACT_PATH}: nodeRequirement must be a non-empty string`);
  }

  for (const artifact of contract.artifacts || []) {
    for (const key of ["path", "kind", "requirement", "condition"]) {
      if (typeof artifact?.[key] !== "string" || !artifact[key]) errors.push(`${CONTRACT_PATH}: artifact missing ${key}`);
    }
    if (!["required", "conditional"].includes(artifact?.requirement)) {
      errors.push(`${CONTRACT_PATH}: artifact ${artifact?.path || "<unknown>"} has invalid requirement`);
    }
  }
  for (const route of contract.routes || []) {
    if (typeof route?.name !== "string" || !route.name) errors.push(`${CONTRACT_PATH}: route missing name`);
    if (typeof route?.condition !== "string" || !route.condition) errors.push(`${CONTRACT_PATH}: route ${route?.name || "<unknown>"} missing condition`);
    if (route?.name === "PASS_TO_FINAL") {
      for (const term of ["zero unmet required acceptance items", "no unresolved blocker", "no authority drift"]) {
        if (!route.condition.includes(term)) errors.push(`${CONTRACT_PATH}: PASS_TO_FINAL route condition missing ${term}`);
      }
    }
  }
  for (const kind of contract.gapKinds || []) {
    if (FORBIDDEN_GAP_KINDS.includes(kind)) errors.push(`${CONTRACT_PATH}: forbidden gap kind remains: ${kind}`);
  }
  for (const evidence of contract.evidenceTypes || []) {
    if (typeof evidence?.name !== "string" || !evidence.name) errors.push(`${CONTRACT_PATH}: evidence type missing name`);
    if (FORBIDDEN_EVIDENCE_TYPES.includes(evidence?.name)) errors.push(`${CONTRACT_PATH}: forbidden evidence type remains: ${evidence.name}`);
    requireArray(evidence, "results", errors, `evidence ${evidence?.name || "<unknown>"}`);
    if ("aliases" in evidence) errors.push(`${CONTRACT_PATH}: evidence ${evidence.name} must not define legacy aliases`);
  }
  for (const gate of contract.requiredGates || []) {
    if (typeof gate !== "string" || !gate) errors.push(`${CONTRACT_PATH}: requiredGates entries must be non-empty strings`);
  }
  for (const rule of contract.clarificationExitRules || []) {
    if (typeof rule !== "string" || !rule) errors.push(`${CONTRACT_PATH}: clarificationExitRules entries must be non-empty strings`);
  }
  for (const [name, values] of Object.entries(contract.nativeGoalSync || {})) {
    if (!Array.isArray(values)) continue;
    for (const value of values) {
      if (typeof value !== "string" || !value) errors.push(`${CONTRACT_PATH}: nativeGoalSync.${name} entries must be non-empty strings`);
    }
  }
  for (const value of contract.technicalDesignRunbook?.requiredTerms || []) {
    if (typeof value !== "string" || !value) errors.push(`${CONTRACT_PATH}: technicalDesignRunbook.requiredTerms entries must be non-empty strings`);
  }
  for (const value of contract.technicalDesignRunbook?.confirmationTerms || []) {
    if (typeof value !== "string" || !value) errors.push(`${CONTRACT_PATH}: technicalDesignRunbook.confirmationTerms entries must be non-empty strings`);
  }
}

function requireArray(object, key, errors, prefix = CONTRACT_PATH) {
  if (!Array.isArray(object?.[key])) errors.push(`${prefix}: ${key} must be an array`);
}

function validateSkillDirs(root, contract, errors, warnings) {
  const skillsRoot = path.join(root, "skills");
  if (!isDirectory(skillsRoot)) {
    errors.push(`missing skills directory: ${skillsRoot}`);
    return;
  }
  const skillDirs = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const name of contract.skills) {
    if (!skillDirs.includes(name)) errors.push(`missing required skill directory: skills/${name}`);
  }
  for (const name of skillDirs) {
    if (!contract.skills.includes(name)) errors.push(`unexpected skill directory: skills/${name}`);
    validateSkillDir(root, path.join(skillsRoot, name), errors, warnings);
  }
}

function validateSkillDir(root, dir, errors, warnings) {
  const skillName = path.basename(dir);
  const md = path.join(dir, "SKILL.md");
  if (!isFile(md)) {
    errors.push(`${skillName}: missing SKILL.md`);
    return;
  }
  if (skillName === "verifier" && isDirectory(path.join(dir, "scripts"))) {
    errors.push("verifier must not depend on runtime scripts");
  }
  const text = fs.readFileSync(md, "utf8");
  try {
    const fm = parseFrontmatter(text);
    if (fm.name !== skillName) errors.push(`${skillName}: frontmatter name ${JSON.stringify(fm.name)} does not match directory`);
    if (!fm.description) errors.push(`${skillName}: SKILL.md frontmatter missing description`);
    if (fm.description && fm.description.length > 500) warnings.push(`${skillName}: description is long (${fm.description.length} chars)`);
    validateDescriptionBoundary(skillName, fm.description, errors);
  } catch (error) {
    errors.push(`${skillName}: invalid SKILL.md frontmatter: ${errorMessage(error)}`);
  }
  const refs = path.join(dir, "references");
  if (isDirectory(refs)) {
    for (const ref of fs.readdirSync(refs).filter(file => isFile(path.join(refs, file))).sort()) {
      const rel = `references/${ref}`;
      if (!text.includes(rel)) errors.push(`${skillName}: reference is not discoverable from SKILL.md: ${rel}`);
    }
  }
}

function parseFrontmatter(text) {
  const match = text.match(FRONTMATTER_RE);
  if (!match) throw new Error("missing YAML frontmatter block");
  const data = {};
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
    const quoted = value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === "\"" || value[0] === "'");
    if (!quoted && /:\s/.test(value)) throw new Error(`line ${offset + 2}: quote frontmatter value containing ': ' `);
    data[key] = quoted ? value.slice(1, -1) : value;
  }
  return data;
}

function validateDescriptionBoundary(skillName, description, errors) {
  const required = {
    "alpha-goal": ["engineering", "design", "implementation"],
    "executor": ["accepted Goal Contract", "implementation", "hardening"],
    "verifier": ["Compare execution evidence", "accepted Goal Contract", "routing verdict"],
  };
  for (const term of required[skillName] || []) {
    if (!description.toLowerCase().includes(term.toLowerCase())) {
      errors.push(`${skillName}: description missing boundary term: ${term}`);
    }
  }
}

function validateSkillsCountBudget(skillFiles, errors) {
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

function countMatches(text, pattern) {
  return text.match(pattern)?.length || 0;
}

function validateStateRootGuidance(root, contract, errors) {
  const required = [
    "Alpha Goal state root",
    "slug(repo_root or Goal Contract target workspace)",
  ];
  const stateRootForm = "$HOME/.alpha-goal/<workspace-slug>/";
  for (const rel of ["AGENTS.md", "MANIFEST.md", "skills/alpha-goal/SKILL.md", "skills/executor/SKILL.md", "skills/verifier/SKILL.md", "templates/AGENTS.md", "templates/CLAUDE.md"]) {
    const text = readIfFile(path.join(root, rel));
    if (!text) {
      errors.push(`${rel}: missing state-root guidance file`);
      continue;
    }
    for (const term of required) {
      if (!text.includes(term)) errors.push(`${rel}: missing state-root guidance: ${term}`);
    }
    if (!text.includes(stateRootForm)) {
      errors.push(`${rel}: missing state-root guidance: ${stateRootForm}`);
    }
  }
  for (const artifact of contract.artifacts) {
    if (artifact.path === "control-state/latest.md") continue;
    if (!allProjectText(root).includes(artifact.path)) errors.push(`runtime artifact is not referenced: ${artifact.path}`);
  }
}

function validateScriptSurface(root, files, errors, warnings) {
  for (const file of files.filter(candidate => relative(root, candidate).startsWith("tools/"))) {
    const rel = relative(root, file);
    const allowedFixture = /^tools\/fixtures\/validate-skills\/[a-z0-9-]+\.json$/.test(rel);
    const allowedValidation = rel === CONTRACT_PATH;
    if (rel !== "tools/validate_skills.js" && !allowedFixture && !allowedValidation) {
      errors.push(`unexpected tools surface: ${rel}`);
    }
    if (fs.readFileSync(file, "utf8").startsWith("#!") && (fs.statSync(file).mode & 0o100) === 0) {
      warnings.push(`${rel} has a shebang but is not user-executable`);
    }
  }
}

function validateLegacyReferences(root, contract, skillFiles, errors) {
  const files = new Set([
    "AGENTS.md",
    "README.md",
    "README.en.md",
    "README.zh-CN.md",
    "INSTALL.md",
    "MANIFEST.md",
    "templates/AGENTS.md",
    "templates/CLAUDE.md",
    "templates/hooks.json",
    "scripts/install.sh",
    ...skillFiles.map(file => relative(root, file)),
  ]);
  for (const rel of files) {
    const file = path.join(root, rel);
    if (!isFile(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const legacy of LEGACY_SCRIPT_REFERENCES) {
      if (text.includes(legacy)) errors.push(`${rel}: legacy script reference remains: ${legacy}`);
    }
    for (const legacy of LEGACY_RUN_MODE_REFERENCES) {
      if (text.includes(legacy)) errors.push(`${rel}: legacy run-mode reference remains: ${legacy}`);
    }
    for (const legacy of LEGACY_RUNTIME_ARTIFACT_REFERENCES) {
      if (text.includes(legacy)) errors.push(`${rel}: split runtime artifact reference remains: ${legacy}`);
    }
    if (rel !== "scripts/install.sh" && /evidence[- ]verify/i.test(text)) errors.push(`${rel}: legacy evidence-verify prose remains`);
    for (const legacy of LEGACY_SKILL_REFERENCES) {
      const patterns = [`$${legacy}`, `skills/${legacy}`, `\`${legacy}\``];
      if (patterns.some(pattern => text.includes(pattern))) errors.push(`${rel}: legacy skill reference remains: ${legacy}`);
    }
  }
}

function validateRenamedLegacyReferences(root, files, errors) {
  for (const file of files) {
    const rel = relative(root, file);
    if (rel.startsWith(".git/")) continue;
    if (RENAMED_LEGACY_ALLOWED_FILES.has(rel)) continue;
    if (!/\.(md|js|sh|toml|json)$/.test(rel) && rel !== "AGENTS.md") continue;

    const text = fs.readFileSync(file, "utf8");
    for (const legacy of RENAMED_LEGACY_SKILLS) {
      if (text.includes(legacy.kebab) || text.includes(legacy.title)) {
        errors.push(`${rel}: renamed legacy skill reference remains: ${legacy.kebab}`);
      }
    }
  }
}

function validateAlphaGoal(root, contract, errors) {
  const rel = "skills/alpha-goal/SKILL.md";
  const text = readIfFile(path.join(root, rel));
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }
  requireGateHeadings(rel, text, contract.requiredGates, errors);
  requireHeadings(rel, text, ["Clarification", "Native Goal Sync"], errors);
  const clarificationGate = markdownSection(text, "Clarification Gate");
  for (const rule of contract.clarificationExitRules) {
    if (!clarificationGate.includes(`\`${rule}\``)) errors.push(`${rel}: Clarification Gate missing exit rule ${rule}`);
  }
  const summaryBlock = fencedBlockAfter(text, "TUI Presentation Style:") || fencedBlockAfter(text, "Present this summary before asking for approval:");
  if (!summaryBlock) errors.push(`${rel}: missing Goal Contract Summary fenced summary`);
  for (const field of contract.summaryFields) {
    if (!summaryBlock.includes(`| ${field} |`)) errors.push(`${rel}: summary table missing field: ${field}`);
  }
  const reviewIndex = headingOffset(text, "Review Gate");
  const summaryIndex = text.indexOf("Goal Contract Summary", reviewIndex);
  const confirmationIndex = headingOffset(text, "Confirmation Gate");
  const inputIndex = text.indexOf("request_user_input", confirmationIndex);
  if (!(reviewIndex >= 0 && summaryIndex > reviewIndex && confirmationIndex > summaryIndex && inputIndex > confirmationIndex)) {
    errors.push(`${rel}: Goal Contract Summary must appear before Confirmation Gate request_user_input`);
  }
  const reviewSection = text.slice(reviewIndex, confirmationIndex >= 0 ? confirmationIndex : undefined);
  for (const forbidden of [
    "Produce a visible Review Record",
    "Goal Contract Summary, Review Record",
    "summary or Review Record is missing or incomplete",
  ]) {
    if (reviewSection.includes(forbidden)) errors.push(`${rel}: visible review result display requirement remains: ${forbidden}`);
  }
  const confirmationGate = markdownSection(text, "Confirmation Gate");
  for (const term of ["approve/launch", "refine", "reject", "Contract status: accepted"]) {
    if (!confirmationGate.includes(term)) errors.push(`${rel}: Confirmation Gate missing ${term}`);
  }
  if (!confirmationGate.includes("$executor") && !confirmationGate.includes("executor` skill") && !confirmationGate.includes("executor skill")) {
    errors.push(`${rel}: Confirmation Gate missing executor handoff`);
  }
  if (!confirmationGate.includes("perform Native Goal Sync")) errors.push(`${rel}: Confirmation Gate missing Native Goal Sync handoff`);
  for (const forbidden of ["after each answer", "after every answer", "Update `goal-contract.md` and `technical_design.md` after each answer"]) {
    if (text.includes(forbidden)) errors.push(`${rel}: stale per-answer artifact write rule remains: ${forbidden}`);
  }
  const runbookRef = contract.technicalDesignRunbook?.path;
  if (runbookRef && !text.includes(runbookRef)) errors.push(`${rel}: missing technical design runbook routing: ${runbookRef}`);
  requireTerms(`${rel} Confirmation Gate`, confirmationGate, contract.technicalDesignRunbook?.confirmationTerms || [], errors);
  if (runbookRef && !confirmationGate.includes(runbookRef)) errors.push(`${rel}: technical design runbook must be routed from Confirmation Gate`);
  const standaloneDesignGate = ["## Design", "Choice Gate"].join(" ");
  if (text.includes(standaloneDesignGate)) errors.push(`${rel}: standalone design gate must be folded into Confirmation Gate`);
  if (text.includes("| Design Priority |")) errors.push(`${rel}: design priority table belongs in technical design runbook`);
  const runbookPath = runbookRef ? path.join(root, "skills", "alpha-goal", runbookRef) : "";
  if (runbookRef) {
    const runbook = readIfFile(runbookPath);
    if (!runbook) {
      errors.push(`skills/alpha-goal/${runbookRef}: missing`);
    } else {
      requireTerms(`skills/alpha-goal/${runbookRef}`, runbook, contract.technicalDesignRunbook?.requiredTerms || [], errors);
    }
  }
  requireTerms(`${rel} Native Goal Sync`, markdownSection(text, "Native Goal Sync"), contract.nativeGoalSync?.alphaGoalRequiredTerms || [], errors);
}

function validateExecutor(root, contract, errors) {
  const rel = "skills/executor/SKILL.md";
  const text = readIfFile(path.join(root, rel));
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }
  requireHeadings(rel, text, ["Core Principle", "Acceptance Checklist", "Runtime Flow", "Authority", "Evidence Classification", "Route Rules", "Slice Boundary Gates", "Execution Gates", "Completion Gate", "Checkpoint Policy"], errors);
  requireTerms(rel, text, ["technical_design.md", "hard-blocking", "pending", "failed", "blocked", "deferred-non-goal", "PASS_TO_FINAL", "route is PASS_TO_FINAL"], errors);
  for (const route of contract.routes) {
    if (!text.includes(route.name)) errors.push(`${rel}: missing route ${route.name}`);
  }
  const evidenceSection = markdownSection(text, "Evidence Classification");
  requireCanonicalEvidence(rel, evidenceSection, contract, errors);
  for (const forbidden of ["run-profile.md", "loop-state.md", "memory.md", "iteration.md", "evidence.md", "verification.md"]) {
    if (text.includes(forbidden)) errors.push(`${rel}: split runtime artifact remains: ${forbidden}`);
  }
}

function validateVerifier(root, contract, errors) {
  const rel = "skills/verifier/SKILL.md";
  const text = readIfFile(path.join(root, rel));
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }
  requireHeadings(rel, text, ["Mission", "Verification Model", "Core Principle", "Evidence Classification", "Gap Analysis", "Verification Gates", "Verification Algorithm", "Route Contract", "Before Final Verdict Checklist"], errors);
  for (const route of contract.routes) {
    if (!text.includes(route.name)) errors.push(`${rel}: missing route ${route.name}`);
  }
  for (const kind of contract.gapKinds) {
    if (!text.includes(kind)) errors.push(`${rel}: missing gap kind ${kind}`);
  }
  requireTerms(rel, text, ["Acceptance Checklist Gate", "zero unmet required acceptance items", "technical_design.md"], errors);
  const evidenceSection = markdownSection(text, "Evidence Classification");
  requireCanonicalEvidence(rel, evidenceSection, contract, errors);
}

function requireTerms(rel, text, terms, errors) {
  for (const term of terms) {
    if (!text.includes(term)) errors.push(`${rel}: missing required term: ${term}`);
  }
}

function requireCanonicalEvidence(rel, text, contract, errors) {
  const lines = text.split(/\r?\n/);
  const expectedNames = new Set(contract.evidenceTypes.map(evidence => evidence.name));
  for (const evidence of contract.evidenceTypes) {
    const evidenceBullet = new RegExp(`^\\s*-\\s+\\[${escapeRegExp(evidence.name)}\\](?:\\s|;|$)`);
    const line = lines.find(candidate => evidenceBullet.test(candidate));
    if (!line) {
      errors.push(`${rel}: missing evidence type [${evidence.name}]`);
      continue;
    }
    const result = line.match(/\bresult=([A-Za-z0-9_|-]+)/);
    if (!result) {
      errors.push(`${rel}: evidence type [${evidence.name}] missing result enum`);
      continue;
    }
    const actualResults = result[1].split("|").filter(Boolean);
    if (!sameStringSet(actualResults, evidence.results)) {
      errors.push(`${rel}: evidence type [${evidence.name}] result enum ${result[1]} does not match contract ${evidence.results.join("|")}`);
    }
  }
  for (const line of lines) {
    const candidate = line.match(/^\s*-\s+\[([a-z0-9-]+)\]\s+result=/);
    if (candidate && !expectedNames.has(candidate[1])) {
      errors.push(`${rel}: unexpected evidence type [${candidate[1]}]`);
    }
  }
}

function validateNoLegacyEvidenceConcepts(root, errors) {
  const allowedFixtures = new Set([
    "tools/fixtures/validate-skills/forbidden-evidence-type.json",
    "tools/fixtures/validate-skills/forbidden-evidence-prose.json",
    "tools/fixtures/validate-skills/forbidden-gap-kind.json",
    "tools/fixtures/validate-skills/legacy-alias-rejected.json",
  ]);
  for (const file of walk(root).filter(isFile)) {
    const rel = relative(root, file);
    if (rel.startsWith(".git/")) continue;
    if (rel === "tools/validate_skills.js") continue;
    if (allowedFixtures.has(rel)) continue;
    if (!/\.(md|js|sh|toml|json)$/.test(rel) && rel !== "AGENTS.md") continue;

    const text = fs.readFileSync(file, "utf8");
    for (const term of [...FORBIDDEN_EVIDENCE_TYPES, ...FORBIDDEN_GAP_KINDS]) {
      if (text.includes(term)) errors.push(`${rel}: forbidden legacy evidence/gap concept remains: ${term}`);
    }
    if (text.includes("Legacy evidence aliases")) errors.push(`${rel}: legacy evidence alias prose remains`);
    for (const term of LEGACY_EVIDENCE_ALIASES) {
      if (text.includes(term)) errors.push(`${rel}: legacy evidence alias remains: ${term}`);
    }
  }
}

function sameStringSet(actual, expected) {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  if (actualSet.size !== actual.length) return false;
  return expected.every(value => actualSet.has(value));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateCrossFileContract(root, contract, errors) {
  const combined = allProjectText(root);
  for (const artifact of contract.artifacts) {
    if (!combined.includes(artifact.path)) errors.push(`contract artifact not referenced across repo: ${artifact.path}`);
  }
  const manifest = readIfFile(path.join(root, "MANIFEST.md"));
  for (const artifact of contract.artifacts) {
    if (!manifest.includes(artifact.path)) errors.push(`MANIFEST.md missing runtime artifact: ${artifact.path}`);
  }
  const hooks = readIfFile(path.join(root, "templates/hooks.json"));
  for (const artifact of contract.artifacts) {
    if (!hooks.includes(artifact.path)) errors.push(`templates/hooks.json missing recovery artifact: ${artifact.path}`);
  }
  for (const file of contract.checkedFiles) {
    if (!isFile(path.join(root, file))) errors.push(`${CONTRACT_PATH}: checked file is missing: ${file}`);
  }
}

function validateHookTemplate(root, errors) {
  const rel = "templates/hooks.json";
  const file = path.join(root, rel);
  const text = readIfFile(file);
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    errors.push(`${rel}: invalid JSON: ${errorMessage(error)}`);
    return;
  }

  if (!data || typeof data !== "object" || Array.isArray(data) || !data.hooks || typeof data.hooks !== "object" || Array.isArray(data.hooks)) {
    errors.push(`${rel}: top-level hooks field must be a JSON object`);
    return;
  }

  const managedHooks = [];
  for (const [event, groups] of Object.entries(data.hooks)) {
    if (!Array.isArray(groups)) {
      errors.push(`${rel}: hooks.${event} must be a JSON array`);
      continue;
    }
    for (const group of groups) {
      if (!group || typeof group !== "object" || !Array.isArray(group.hooks)) continue;
      for (const hook of group.hooks) {
        const command = typeof hook?.command === "string" ? hook.command : "";
        if (HOOK_MARKER_FAMILY_RE.test(command)) managedHooks.push({ event, group, hook, command });
      }
    }
  }

  const managedSessionStart = managedHooks.filter(entry => entry.event === "SessionStart");
  if (managedSessionStart.length) errors.push(`${rel}: managed compact recovery hook must not remain under SessionStart`);

  const managedPostCompact = managedHooks.filter(entry => entry.event === "PostCompact");
  if (managedPostCompact.length !== 1) {
    errors.push(`${rel}: expected exactly one managed PostCompact compact recovery hook, found ${managedPostCompact.length}`);
    return;
  }

  const [{ group, hook, command }] = managedPostCompact;
  if ("matcher" in group) {
    errors.push(`${rel}: managed PostCompact compact recovery hook must not set matcher`);
  }
  if (hook.type !== "command") errors.push(`${rel}: managed PostCompact hook type must be command`);
  if (!command.trimStart().startsWith(`: '${HOOK_MARKER}';`)) {
    errors.push(`${rel}: managed PostCompact hook command must start with marker ${HOOK_MARKER}`);
  }
  if (!command.includes("Compact recovery policy:")) {
    errors.push(`${rel}: managed PostCompact hook command must print Compact recovery policy`);
  }
  for (const term of ["interface/data-model changes", "material risk", "verification handoff", "acceptance checklist"]) {
    if (!command.includes(term)) errors.push(`${rel}: managed PostCompact hook command missing ${term}`);
  }
}

function validateInstallSurface(root, contract, errors) {
  const install = readIfFile(path.join(root, "scripts/install.sh"));
  if (!install) {
    errors.push("scripts/install.sh: missing");
    return;
  }
  for (const skill of contract.skills) {
    if (!install.includes(skill)) errors.push(`scripts/install.sh missing required skill: ${skill}`);
  }
  for (const legacy of RENAMED_LEGACY_SKILLS) {
    if (!install.includes(legacy.kebab)) errors.push(`scripts/install.sh missing renamed legacy cleanup: ${legacy.kebab}`);
  }
  if (!install.includes("renamed_legacy_skills")) errors.push("scripts/install.sh missing renamed legacy skill list");
  if (!install.includes("same_git_common_dir_skill_path")) errors.push("scripts/install.sh missing same-common-dir renamed legacy cleanup");
  for (const forbidden of ["tomllib", "tools/validate_skills.ts", "run_skillset_validation", "resolve_tsx_runner", "Validation: passed"]) {
    if (install.includes(forbidden)) errors.push(`scripts/install.sh contains forbidden install surface: ${forbidden}`);
  }
  for (const term of ["node", "vendor/smol-toml", "is_symlink", "resolve", "LEGACY_MANAGED_MARKER_RE", "MANAGED_MARKER_RE"]) {
    if (!install.includes(term)) errors.push(`scripts/install.sh missing install hardening term: ${term}`);
  }
  if (!install.includes("--no-sync-user-hooks")) errors.push("scripts/install.sh missing --no-sync-user-hooks option");
  if (!isFile(path.join(root, "templates/CLAUDE.md"))) errors.push("templates/CLAUDE.md: missing");
  for (const term of ["--target", "global", "codex", "claude", "$HOME/.agents/skills", "$HOME/.claude/skills", "templates/CLAUDE.md", "CLAUDE.md"]) {
    if (!install.includes(term)) errors.push(`scripts/install.sh missing multi-target install term: ${term}`);
  }
  for (const term of ["copy_skill_dir", "claude_skill_root", ".alpha-goal-skill-copy", "Copied skill", "Removed installed skill copy", "Removed Claude skill link"]) {
    if (!install.includes(term)) errors.push(`scripts/install.sh missing copied/Claude skill install term: ${term}`);
  }
  for (const term of [
    "render_install_target_menu",
    "menu_supports_color",
    "Use ↑/↓ and Enter",
    "◆ Alpha Goal",
    "●",
    "○",
    "Skills install to:",
    "Choose which app configuration to update.",
    "╭─ Alpha Goal install summary",
    "╭─ Alpha Goal uninstall summary",
    "read -rsn1",
    "git_common_dir_for_path",
    "git_worktree_root_for_path",
    "same_git_worktree_skill_link",
    "rev-parse --git-common-dir",
    "skills/$skill_name",
  ]) {
    if (!install.includes(term)) errors.push(`scripts/install.sh missing interactive/adoption term: ${term}`);
  }
  for (const term of [
    "--uninstall",
    "Uninstall target",
    "remove_markdown_template",
    "remove_config_template",
    "remove_hooks_template",
    "preflight_hooks_template",
    "remove_installed_skill_link",
    "Preserved symlinked",
    "cmp -s",
    "removeManagedHooks(data",
    "uninstall_skill_removed_count",
    "not-found",
  ]) {
    if (!install.includes(term)) errors.push(`scripts/install.sh missing uninstall safety term: ${term}`);
  }
  if (install.includes("json.dumps(group") || install.includes("marker_family in group_text")) {
    errors.push("scripts/install.sh must not detect managed hooks via serialized JSON substring");
  }
  if (install.includes("tmp_path.replace(hooks_path)")) {
    errors.push("scripts/install.sh must not replace symlinked hooks_path directly");
  }
  if (install.includes("read -rsn2 -t 0.")) {
    errors.push("scripts/install.sh must not use fractional read timeouts; macOS bash 3.2 rejects them");
  }
}

function validateClaudeTemplateParity(root, errors) {
  const agentsRel = "templates/AGENTS.md";
  const claudeRel = "templates/CLAUDE.md";
  const agents = readIfFile(path.join(root, agentsRel));
  const claude = readIfFile(path.join(root, claudeRel));
  if (!agents) {
    errors.push(`${agentsRel}: missing`);
    return;
  }
  if (!claude) {
    errors.push(`${claudeRel}: missing`);
    return;
  }

  const normalizedClaude = claude
    .replaceAll("CLAUDE.md", "AGENTS.md")
    .replaceAll("`AskUserQuestion`", "`request_user_input`")
    .replaceAll("generate-with-template:claude-md", "generate-with-template:agents-md");
  if (normalizedClaude !== agents) {
    errors.push(`${claudeRel}: must match ${agentsRel} except Claude file/tool semantics`);
  }
}

function validateDocs(root, contract, errors) {
  const docs = ["AGENTS.md", "README.md", "README.en.md", "INSTALL.md", "MANIFEST.md"];
  for (const rel of docs) {
    const text = readIfFile(path.join(root, rel));
    if (!text) {
      errors.push(`${rel}: missing`);
      continue;
    }
    if (text.includes("npx --no-install tsx") || text.includes("tools/validate_skills.ts")) {
      errors.push(`${rel}: stale validator command remains`);
    }
  }
  for (const rel of ["AGENTS.md", "README.md", "README.en.md", "INSTALL.md"]) {
    const text = readIfFile(path.join(root, rel));
    if (!text.includes(VALIDATOR_COMMAND)) errors.push(`${rel}: missing validator command ${VALIDATOR_COMMAND}`);
  }
  for (const rel of ["AGENTS.md", "README.en.md", "INSTALL.md"]) {
    const text = readIfFile(path.join(root, rel));
    if (!text.includes(contract.nodeRequirement)) errors.push(`${rel}: missing node requirement ${contract.nodeRequirement}`);
  }
  const installDoc = readIfFile(path.join(root, "INSTALL.md"));
  for (const term of ["--target", "$HOME/.agents/skills", "$HOME/.claude/skills", "templates/CLAUDE.md", "--no-sync-user-hooks", "templates/hooks.json", "PostCompact", "must not set matcher", LEGACY_HOOK_MARKER, "temporary CODEX_HOME", FIXTURE_COMMAND, "interface/data-model changes", "material risk", "verification handoff", "acceptance checklist"]) {
    if (!installDoc.includes(term)) errors.push(`INSTALL.md missing install term: ${term}`);
  }
  for (const term of [
    "arrow-key menu",
    "color+Unicode",
    "`codex` is selected by default",
    "number keys do not select",
    "ANSI color",
    "Unicode selected state",
    "grouped summary",
    "omits skipped lines",
    "same Git common directory",
    "git worktree add --detach",
    "tmp_worktree_link",
    "tmp_external_link",
    "tmp_wrong_path_link",
    "tmp_real_dir",
    "tmp_file_path",
    "target menu timed out",
    "scripts/install.sh --uninstall --target global",
    "scripts/install.sh --uninstall --target codex",
    "scripts/install.sh --uninstall --target claude",
    "configuration symlinks are not followed",
    "byte-for-byte matches `templates/config.toml`",
    "tmp_uninstall_global",
    "tmp_uninstall_target",
    "tmp_uninstall_noninteractive",
    "tmp_uninstall_toml",
    "tmp_uninstall_blank_toml",
    "tmp_uninstall_safety",
    "tmp_uninstall_skip",
    "tmp_uninstall_invalid_hooks",
    "config.toml preserved",
    "--no-sync-user-templates",
    "--no-sync-user-hooks",
  ]) {
    if (!installDoc.includes(term)) errors.push(`INSTALL.md missing uninstall term: ${term}`);
  }
  const readme = readIfFile(path.join(root, "README.md"));
  const readmeEn = readIfFile(path.join(root, "README.en.md"));
  const manifest = readIfFile(path.join(root, "MANIFEST.md"));
  for (const [rel, text] of [["README.en.md", readmeEn], ["MANIFEST.md", manifest]]) {
    for (const term of ["--uninstall", "$HOME/.agents/skills", "$HOME/.claude/skills", "configuration symlinks", "legacy Codex skills"]) {
      if (!text.includes(term)) errors.push(`${rel} missing uninstall boundary term: ${term}`);
    }
  }
  for (const skill of contract.skills) {
    if (!readme.includes(`skills/${skill}/`)) errors.push(`README.md missing skill path: ${skill}`);
    if (!readmeEn.includes(`skills/${skill}/`)) errors.push(`README.en.md missing skill path: ${skill}`);
  }
  if (!readme.includes("当前代码事实只描述现状")) errors.push("README.md missing current-state-not-desired-state principle");
  if (!readmeEn.includes("Current code facts describe current state")) errors.push("README.en.md missing current-state-not-desired-state principle");
}

function validateNoAutoDownloadRunner(root, files, errors) {
  const autoDownloadTsx = /npx\s+--yes\s+tsx/;
  for (const file of files) {
    const rel = relative(root, file);
    if (rel.startsWith(".git/")) continue;
    if (!/\.(md|js|sh|toml|json)$/.test(rel) && rel !== "AGENTS.md") continue;
    if (autoDownloadTsx.test(fs.readFileSync(file, "utf8"))) errors.push(`${rel}: must not auto-download tsx with npx --yes`);
  }
}

function runFixtures() {
  const fixturesRoot = path.join(__dirname, "fixtures", "validate-skills");
  const projectRoot = path.resolve(path.join(__dirname, ".."));
  const errors = [];
  const warnings = [];
  if (!isDirectory(fixturesRoot)) {
    errors.push(`missing fixtures directory: ${relative(process.cwd(), fixturesRoot)}`);
    printFixtureReport(errors, warnings);
    return 1;
  }
  for (const fixtureFile of fs.readdirSync(fixturesRoot).filter(file => file.endsWith(".json")).sort()) {
    const fixturePath = path.join(fixturesRoot, fixtureFile);
    let fixture;
    try {
      fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
    } catch (error) {
      errors.push(`${fixtureFile}: invalid fixture JSON: ${errorMessage(error)}`);
      continue;
    }
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alpha-goal-validator-"));
    try {
      if (fixture.inheritRoot) copyTree(projectRoot, tempRoot);
      for (const rel of fixture.removeFiles || []) {
        fs.rmSync(path.join(tempRoot, rel), { recursive: true, force: true });
      }
      for (const replacement of fixture.replacements || []) {
        const target = path.join(tempRoot, replacement.file);
        const original = fs.readFileSync(target, "utf8");
        if (!original.includes(replacement.search)) {
          errors.push(`${fixtureFile}: replacement target not found in ${replacement.file}: ${replacement.search}`);
          continue;
        }
        fs.writeFileSync(target, original.replace(replacement.search, replacement.replace));
      }
      for (const [rel, text] of Object.entries(fixture.files || {})) {
        const target = path.join(tempRoot, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, text);
      }
      const result = validateRoot(tempRoot);
      const passed = result.errors.length === 0;
      if (Boolean(fixture.shouldPass) !== passed) {
        errors.push(`${fixtureFile}: expected shouldPass=${fixture.shouldPass}, got errors: ${result.errors.join("; ")}`);
      }
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
  printFixtureReport(errors, warnings);
  return errors.length ? 1 : 0;
}

function copyTree(source, target) {
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv", "__pycache__"]);
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

function printFixtureReport(errors, warnings) {
  console.log("Skill validator fixtures");
  if (warnings.length) {
    console.log("\nWARNINGS:");
    for (const warning of warnings) console.log(`- ${warning}`);
  }
  if (errors.length) {
    console.log("\nERRORS:");
    for (const error of errors) console.log(`- ${error}`);
  } else {
    console.log("PASS: all fixtures behaved as expected");
  }
}

function requireHeadings(rel, text, headings, errors) {
  const present = extractHeadings(text, 2);
  for (const heading of headings) {
    if (!present.includes(heading)) errors.push(`${rel}: missing section heading: ${heading}`);
  }
}

function requireGateHeadings(rel, text, gates, errors) {
  for (const gate of gates) {
    if (headingOffset(text, gate) < 0) errors.push(`${rel}: missing gate heading: ${gate}`);
  }
}

function requireSubheading(rel, text, heading, errors) {
  if (!extractHeadings(text, 3).includes(heading)) errors.push(`${rel}: missing subsection heading: ${heading}`);
}

function extractHeadings(text, level) {
  const marker = "#".repeat(level);
  return text.split(/\r?\n/)
    .filter(line => line.startsWith(`${marker} `))
    .map(line => line.slice(level + 1).trim());
}

function headingOffset(text, heading) {
  const pattern = /^(#{2,6})\s+(.+)$/gm;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const title = match[2].trim();
    if (title === heading || title.startsWith(`${heading} `)) return match.index;
  }
  return -1;
}

function markdownSection(text, heading) {
  const lines = text.split(/\r?\n/);
  const marker = `## ${heading}`;
  const start = lines.findIndex(line => line.trim() === marker);
  if (start < 0) return "";
  const next = lines.slice(start + 1).findIndex(line => /^##\s+/.test(line));
  const end = next < 0 ? lines.length : start + 1 + next;
  return lines.slice(start, end).join("\n");
}

function fencedBlockAfter(text, marker) {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return "";
  const firstFence = text.indexOf("```", markerIndex);
  if (firstFence < 0) return "";
  const firstFenceEnd = text.indexOf("\n", firstFence);
  if (firstFenceEnd < 0) return "";
  const secondFence = text.indexOf("```", firstFenceEnd + 1);
  if (secondFence < 0) return "";
  return text.slice(firstFenceEnd + 1, secondFence);
}

function allProjectText(root) {
  return walk(root)
    .filter(isFile)
    .filter(file => !relative(root, file).startsWith(".git/"))
    .map(file => fs.readFileSync(file, "utf8"))
    .join("\n");
}

function readIfFile(file) {
  return isFile(file) ? fs.readFileSync(file, "utf8") : "";
}

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function isDirectory(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function walk(root) {
  const result = [];
  if (!fs.existsSync(root)) return result;
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv", "__pycache__"]);
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && skipped.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      result.push(full);
      if (entry.isDirectory()) visit(full);
    }
  }
  visit(root);
  return result.sort();
}

function relative(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function printReport(root, errors, warnings) {
  console.log("Skill suite validation");
  console.log(`root: ${root}`);
  if (warnings.length) {
    console.log("\nWARNINGS:");
    for (const warning of warnings) console.log(`- ${warning}`);
  }
  if (errors.length) {
    console.log("\nERRORS:");
    for (const error of errors) console.log(`- ${error}`);
  } else {
    console.log("PASS: all checks passed");
  }
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { main, validateRoot };
