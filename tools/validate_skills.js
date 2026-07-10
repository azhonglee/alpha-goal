#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const SKILLS_COUNT_BUDGET = 15_000;
const CONTRACT_PATH = "tools/validation/alpha-goal.json";

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
  validateScriptSurface(root, files, errors, warnings);
  validateAlphaGoal(root, contract, errors);
  validateExecutor(root, contract, errors);
  validateVerifier(root, contract, errors);
  validateCheckedFiles(root, contract, errors);
  validateHookTemplate(root, errors);
  validateInstallSurface(root, errors);
  validateDocs(root, errors);

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
    requiredGates: [],
    claudeAdapter: {},
    technicalDesignRunbook: {},
    checkedFiles: [],
  };
}

function validateContract(contract, errors) {
  if (contract.schemaVersion !== 1) errors.push(`${CONTRACT_PATH}: schemaVersion must be 1`);
  requireArray(contract, "skills", errors);
  requireArray(contract, "artifacts", errors);
  requireArray(contract, "requiredGates", errors);
  if (!contract.claudeAdapter || typeof contract.claudeAdapter !== "object" || Array.isArray(contract.claudeAdapter)) {
    errors.push(`${CONTRACT_PATH}: claudeAdapter must be an object`);
  } else {
    if (typeof contract.claudeAdapter.path !== "string" || !contract.claudeAdapter.path) {
      errors.push(`${CONTRACT_PATH}: claudeAdapter.path must be a non-empty string`);
    }
  }
  if (!contract.technicalDesignRunbook || typeof contract.technicalDesignRunbook !== "object" || Array.isArray(contract.technicalDesignRunbook)) {
    errors.push(`${CONTRACT_PATH}: technicalDesignRunbook must be an object`);
  } else {
    if (typeof contract.technicalDesignRunbook.path !== "string" || !contract.technicalDesignRunbook.path) {
      errors.push(`${CONTRACT_PATH}: technicalDesignRunbook.path must be a non-empty string`);
    }
  }
  requireArray(contract, "checkedFiles", errors);

  for (const artifact of contract.artifacts || []) {
    for (const key of ["path", "kind", "requirement", "condition"]) {
      if (typeof artifact?.[key] !== "string" || !artifact[key]) errors.push(`${CONTRACT_PATH}: artifact missing ${key}`);
    }
    if (!["required", "conditional"].includes(artifact?.requirement)) {
      errors.push(`${CONTRACT_PATH}: artifact ${artifact?.path || "<unknown>"} has invalid requirement`);
    }
  }
  for (const gate of contract.requiredGates || []) {
    if (typeof gate !== "string" || !gate) errors.push(`${CONTRACT_PATH}: requiredGates entries must be non-empty strings`);
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
    validateSkillDir(root, path.join(skillsRoot, name), contract, errors, warnings);
  }
}

function validateSkillDir(root, dir, contract, errors, warnings) {
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
  } catch (error) {
    errors.push(`${skillName}: invalid SKILL.md frontmatter: ${errorMessage(error)}`);
  }
  const refs = path.join(dir, "references");
  if (isDirectory(refs)) {
    for (const ref of fs.readdirSync(refs).filter(file => isFile(path.join(refs, file))).sort()) {
      const rel = `references/${ref}`;
      const installInjectedClaudeAdapter = skillName === "alpha-goal" && rel === contract.claudeAdapter?.path;
      if (!installInjectedClaudeAdapter && !text.includes(rel)) errors.push(`${skillName}: reference is not discoverable from SKILL.md: ${rel}`);
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

function validateAlphaGoal(root, contract, errors) {
  const rel = "skills/alpha-goal/SKILL.md";
  const text = readIfFile(path.join(root, rel));
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }
  requireGateHeadings(rel, text, contract.requiredGates, errors);
  requireHeadings(rel, text, ["Clarification", "Native Goal Sync"], errors);
  const claudeAdapterRef = contract.claudeAdapter?.path;
  const runbookRef = contract.technicalDesignRunbook?.path;
  const runbookPath = runbookRef ? path.join(root, "skills", "alpha-goal", runbookRef) : "";
  if (runbookRef) {
    const runbook = readIfFile(runbookPath);
    if (!runbook) {
      errors.push(`skills/alpha-goal/${runbookRef}: missing`);
    } else {
      requireHeadings(`skills/alpha-goal/${runbookRef}`, runbook, ["Technical Review Gate", "Technical Design Confirmation Gate", "Native Goal Sync"], errors);
    }
  }
  if (claudeAdapterRef) {
    const adapterRel = `skills/alpha-goal/${claudeAdapterRef}`;
    if (!isFile(path.join(root, adapterRel))) errors.push(`${adapterRel}: missing`);
  }
}

function validateExecutor(root, contract, errors) {
  const rel = "skills/executor/SKILL.md";
  const text = readIfFile(path.join(root, rel));
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }
  requireHeadings(rel, text, ["Core Principle", "Acceptance Checklist", "Runtime Flow", "Authority", "Slice Boundary Gates", "Execution Gates", "Completion Gate", "Checkpoint Policy"], errors);
}

function validateVerifier(root, contract, errors) {
  const rel = "skills/verifier/SKILL.md";
  const text = readIfFile(path.join(root, rel));
  if (!text) {
    errors.push(`${rel}: missing`);
    return;
  }
  requireHeadings(rel, text, ["Mission", "Verification Model", "Core Principle", "Evidence Classification", "Gap Analysis", "Verification Gates", "Verification Algorithm", "Route Contract", "Before Final Verdict Checklist"], errors);
}

function validateCheckedFiles(root, contract, errors) {
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

  for (const [event, groups] of Object.entries(data.hooks)) {
    if (!Array.isArray(groups)) {
      errors.push(`${rel}: hooks.${event} must be a JSON array`);
      continue;
    }
    for (const group of groups) {
      if (!group || typeof group !== "object" || Array.isArray(group)) {
        errors.push(`${rel}: hooks.${event} entries must be objects`);
        continue;
      }
      if (!Array.isArray(group.hooks)) errors.push(`${rel}: hooks.${event} group.hooks must be an array`);
    }
  }
}

function validateInstallSurface(root, errors) {
  if (!isFile(path.join(root, "scripts/install.sh"))) errors.push("scripts/install.sh: missing");
  if (!isFile(path.join(root, "templates/CLAUDE.md"))) errors.push("templates/CLAUDE.md: missing");
}

function validateDocs(root, errors) {
  const docs = ["AGENTS.md", "README.md", "README.en.md", "INSTALL.md", "MANIFEST.md"];
  for (const rel of docs) {
    if (!isFile(path.join(root, rel))) errors.push(`${rel}: missing`);
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

function extractHeadings(text, level) {
  const marker = "#".repeat(level);
  const headings = [];
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (isFenceLine(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && line.startsWith(`${marker} `)) headings.push(line.slice(level + 1).trim());
  }
  return headings;
}

function headingOffset(text, heading) {
  let inFence = false;
  let offset = 0;
  for (const line of text.split(/\r?\n/)) {
    if (isFenceLine(line)) {
      inFence = !inFence;
      offset += line.length + 1;
      continue;
    }
    const match = line.match(/^(#{2,6})\s+(.+)$/);
    const title = match?.[2]?.trim();
    if (title && (title === heading || title.startsWith(`${heading} `))) return offset;
    offset += line.length + 1;
  }
  return -1;
}

function isFenceLine(line) {
  return /^\s*```/.test(line);
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
