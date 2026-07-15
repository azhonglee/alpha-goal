#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parse: parseToml } = require("../vendor/smol-toml/dist/index.cjs");

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const CONTRACT_PATH = "tools/validation/alpha-goal.json";

function main(args = process.argv.slice(2)) {
  if (args[0] === "--fixtures") return runFixtures();

  const root = path.resolve(args[0] || path.join(__dirname, ".."));
  const result = validateRoot(root);
  printReport(root, result);
  return result.errors.length ? 1 : 0;
}

function validateRoot(root) {
  const errors = [];
  const warnings = [];
  const contract = readContract(root, errors);

  validateContract(contract, errors);
  validateSkills(root, contract, errors, warnings);
  const counts = validateSkillBudget(root, contract, errors);
  validateArtifacts(contract, errors);
  validateDistribution(root, contract, errors);
  validateRuntimeEvals(root, contract, errors);
  validateToolsSurface(root, errors, warnings);
  validateHookTemplate(root, errors);
  validateTomlTemplate(root, errors);

  return { errors, warnings, counts };
}

function readContract(root, errors) {
  const file = path.join(root, CONTRACT_PATH);
  if (!isFile(file)) {
    errors.push(`missing shared contract: ${CONTRACT_PATH}`);
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${CONTRACT_PATH}: invalid JSON: ${errorMessage(error)}`);
    return {};
  }
}

function validateContract(contract, errors) {
  if (contract.schemaVersion !== 5) errors.push(`${CONTRACT_PATH}: schemaVersion must be 5`);
  if (!Number.isInteger(contract.skillBudgetExclusiveMax) || contract.skillBudgetExclusiveMax < 1) {
    errors.push(`${CONTRACT_PATH}: skillBudgetExclusiveMax must be a positive integer`);
  }

  requireArray(contract, "publicSkills", errors);
  requireArray(contract, "artifacts", errors);
  requireObject(contract, "routes", errors);
  requireObject(contract, "distribution", errors);

  const skillNames = [];
  const semanticOwners = new Map();
  let entryCount = 0;
  let entrySkillName;
  for (const skill of contract.publicSkills || []) {
    if (!isObject(skill)) {
      errors.push(`${CONTRACT_PATH}: publicSkills entries must be objects`);
      continue;
    }
    if (!nonEmptyString(skill.name)) errors.push(`${CONTRACT_PATH}: public skill missing name`);
    else skillNames.push(skill.name);
    if (typeof skill.entry !== "boolean") errors.push(`${CONTRACT_PATH}: public skill ${skill.name || "<unknown>"} entry must be boolean`);
    if (skill.entry === true) {
      entryCount += 1;
      entrySkillName = skill.name;
    }
    requireArray(skill, "ownedSemantics", errors, `${CONTRACT_PATH}: public skill ${skill.name || "<unknown>"}`);
    requireArray(skill, "references", errors, `${CONTRACT_PATH}: public skill ${skill.name || "<unknown>"}`);
    requireArray(skill, "scripts", errors, `${CONTRACT_PATH}: public skill ${skill.name || "<unknown>"}`);

    for (const semantic of skill.ownedSemantics || []) {
      if (!nonEmptyString(semantic)) {
        errors.push(`${CONTRACT_PATH}: ownedSemantics entries must be non-empty strings`);
      } else if (semanticOwners.has(semantic)) {
        errors.push(`${CONTRACT_PATH}: semantic ${semantic} has multiple owners: ${semanticOwners.get(semantic)}, ${skill.name}`);
      } else {
        semanticOwners.set(semantic, skill.name);
      }
    }
    requireUniqueStrings(skill.references, `${CONTRACT_PATH}: public skill ${skill.name || "<unknown>"} references`, errors);
    requireUniqueStrings(skill.scripts, `${CONTRACT_PATH}: public skill ${skill.name || "<unknown>"} scripts`, errors);
  }
  requireUniqueStrings(skillNames, `${CONTRACT_PATH}: public skill names`, errors);
  if (entryCount !== 1) errors.push(`${CONTRACT_PATH}: exactly one public skill must have entry=true`);
  if (entryCount === 1 && contract.routes?.entry?.owner !== entrySkillName) {
    errors.push(`${CONTRACT_PATH}: entry route owner must match the public skill with entry=true`);
  }

  const knownOwners = new Set(skillNames);
  for (const [routeName, route] of Object.entries(contract.routes || {})) {
    if (!isObject(route)) {
      errors.push(`${CONTRACT_PATH}: route ${routeName} must be an object`);
      continue;
    }
    if (!knownOwners.has(route.owner)) errors.push(`${CONTRACT_PATH}: route ${routeName} has unknown owner ${JSON.stringify(route.owner)}`);
    requireArray(route, "values", errors, `${CONTRACT_PATH}: route ${routeName}`);
    requireUniqueStrings(route.values, `${CONTRACT_PATH}: route ${routeName} values`, errors);
  }

  for (const key of ["templates", "scripts", "evals", "docs"]) {
    requireArray(contract.distribution || {}, key, errors, `${CONTRACT_PATH}: distribution`);
    requireUniqueStrings(contract.distribution?.[key], `${CONTRACT_PATH}: distribution.${key}`, errors);
  }
}

function validateSkills(root, contract, errors, warnings) {
  const skillsRoot = path.join(root, "skills");
  if (!isDirectory(skillsRoot)) {
    errors.push("missing skills directory: skills");
    return;
  }

  const declared = (contract.publicSkills || []).map(skill => skill.name).filter(nonEmptyString).sort();
  const actual = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  for (const name of declared) if (!actual.includes(name)) errors.push(`missing required skill directory: skills/${name}`);
  for (const name of actual) if (!declared.includes(name)) errors.push(`unexpected skill directory: skills/${name}`);

  for (const skill of contract.publicSkills || []) {
    if (!nonEmptyString(skill.name)) continue;
    const dir = path.join(skillsRoot, skill.name);
    const md = path.join(dir, "SKILL.md");
    if (!isFile(md)) {
      errors.push(`${skill.name}: missing SKILL.md`);
      continue;
    }
    try {
      const fm = parseFrontmatter(fs.readFileSync(md, "utf8"));
      if (fm.name !== skill.name) errors.push(`${skill.name}: frontmatter name ${JSON.stringify(fm.name)} does not match directory`);
      if (!fm.description) errors.push(`${skill.name}: SKILL.md frontmatter missing description`);
      if (fm.description?.length > 500) warnings.push(`${skill.name}: description is long (${fm.description.length} chars)`);
    } catch (error) {
      errors.push(`${skill.name}: invalid SKILL.md frontmatter: ${errorMessage(error)}`);
    }

    for (const reference of skill.references || []) {
      if (!safeRelativePath(reference)) {
        errors.push(`${CONTRACT_PATH}: ${skill.name} reference must be a safe relative path: ${JSON.stringify(reference)}`);
      } else if (!isFile(path.join(dir, reference))) {
        errors.push(`${CONTRACT_PATH}: ${skill.name} reference is missing: ${reference}`);
      }
    }
    for (const script of skill.scripts || []) {
      if (!safeRelativePath(script)) {
        errors.push(`${CONTRACT_PATH}: ${skill.name} script must be a safe relative path: ${JSON.stringify(script)}`);
        continue;
      }
      const file = path.join(dir, script);
      if (!isFile(file)) errors.push(`${CONTRACT_PATH}: ${skill.name} script is missing: ${script}`);
      else if (fs.readFileSync(file, "utf8").startsWith("#!") && (fs.statSync(file).mode & 0o100) === 0) {
        warnings.push(`${skill.name}: ${script} has a shebang but is not user-executable`);
      }
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
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) throw new Error(`line ${offset + 2}: unsupported frontmatter key ${key}`);
    if (Object.hasOwn(data, key)) throw new Error(`line ${offset + 2}: duplicate frontmatter key ${key}`);
    const value = rawValue.trim();
    if (!value) throw new Error(`line ${offset + 2}: empty frontmatter value for ${key}`);
    const quoted = value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === "\"" || value[0] === "'");
    if (!quoted && /:\s/.test(value)) throw new Error(`line ${offset + 2}: quote frontmatter value containing ': '`);
    data[key] = quoted ? value.slice(1, -1) : value;
  }
  return data;
}

function validateSkillBudget(root, contract, errors) {
  const counts = { total: 0, skills: {} };
  const skillsRoot = path.join(root, "skills");
  if (!isDirectory(skillsRoot)) return counts;

  for (const skill of contract.publicSkills || []) {
    if (!nonEmptyString(skill.name)) continue;
    const dir = path.join(skillsRoot, skill.name);
    if (!isDirectory(dir)) continue;
    const files = walk(dir).filter(isFile);
    let skillTotal = 0;
    for (const file of files) skillTotal += countUnits(fs.readFileSync(file, "utf8"));
    counts.skills[skill.name] = skillTotal;
    counts.total += skillTotal;
  }

  if (Number.isInteger(contract.skillBudgetExclusiveMax) && counts.total >= contract.skillBudgetExclusiveMax) {
    errors.push(`skills word+punctuation budget exceeded: ${counts.total} >= ${contract.skillBudgetExclusiveMax}`);
  }
  return counts;
}

function countUnits(text) {
  return countMatches(text, /[\p{L}\p{N}\p{M}]+/gu) + countMatches(text, /[\p{P}\p{S}]/gu);
}

function validateArtifacts(contract, errors) {
  const knownOwners = new Set((contract.publicSkills || []).map(skill => skill.name));
  const paths = [];
  for (const artifact of contract.artifacts || []) {
    if (!isObject(artifact)) {
      errors.push(`${CONTRACT_PATH}: artifacts entries must be objects`);
      continue;
    }
    if (!nonEmptyString(artifact.path)) errors.push(`${CONTRACT_PATH}: artifact missing path`);
    else paths.push(artifact.path);
    if (!nonEmptyString(artifact.condition)) errors.push(`${CONTRACT_PATH}: artifact ${artifact.path || "<unknown>"} missing condition`);
    requireArray(artifact, "sections", errors, `${CONTRACT_PATH}: artifact ${artifact.path || "<unknown>"}`);
    const sectionNames = [];
    for (const section of artifact.sections || []) {
      if (!isObject(section) || !nonEmptyString(section.name)) {
        errors.push(`${CONTRACT_PATH}: artifact ${artifact.path || "<unknown>"} has invalid section`);
        continue;
      }
      sectionNames.push(section.name);
      if (!knownOwners.has(section.owner)) {
        errors.push(`${CONTRACT_PATH}: artifact ${artifact.path || "<unknown>"} section ${section.name} has unknown owner ${JSON.stringify(section.owner)}`);
      }
    }
    requireUniqueStrings(sectionNames, `${CONTRACT_PATH}: artifact ${artifact.path || "<unknown>"} section names`, errors);
  }
  requireUniqueStrings(paths, `${CONTRACT_PATH}: artifact paths`, errors);
}

function validateDistribution(root, contract, errors) {
  for (const key of ["templates", "scripts", "evals", "docs"]) {
    for (const rel of contract.distribution?.[key] || []) {
      if (!safeRelativePath(rel)) errors.push(`${CONTRACT_PATH}: distribution.${key} path is unsafe: ${JSON.stringify(rel)}`);
      else if (!isFile(path.join(root, rel))) errors.push(`${CONTRACT_PATH}: distribution.${key} file is missing: ${rel}`);
    }
  }
}

function validateToolsSurface(root, errors, warnings) {
  const toolsRoot = path.join(root, "tools");
  if (!isDirectory(toolsRoot)) {
    errors.push("missing tools directory: tools");
    return;
  }
  for (const file of walk(toolsRoot).filter(isFile)) {
    const rel = relative(root, file);
    const allowedFixture = /^tools\/fixtures\/validate-skills\/[a-z0-9-]+\.json$/.test(rel);
    const allowedEval = rel === "tools/evals/runtime-boundaries.json";
    if (rel !== "tools/validate_skills.js" && rel !== CONTRACT_PATH && !allowedFixture && !allowedEval) {
      errors.push(`unexpected tools surface: ${rel}`);
    }
    if (fs.readFileSync(file, "utf8").startsWith("#!") && (fs.statSync(file).mode & 0o100) === 0) {
      warnings.push(`${rel} has a shebang but is not user-executable`);
    }
  }
}

function validateRuntimeEvals(root, contract, errors) {
  const rel = "tools/evals/runtime-boundaries.json";
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch (error) {
    errors.push(`${rel}: invalid JSON or missing file: ${errorMessage(error)}`);
    return;
  }

  if (!isObject(data) || data.schemaVersion !== 1) errors.push(`${rel}: schemaVersion must be 1`);
  if (!nonEmptyString(data.claimBoundary)) errors.push(`${rel}: claimBoundary must be a non-empty string`);
  if (!Array.isArray(data.cases) || data.cases.length !== 28) {
    errors.push(`${rel}: cases must contain exactly 28 entries`);
    return;
  }

  const ids = [];
  const entryRoutes = new Set([...(contract.routes?.entry?.values || []), "N/A"]);
  const verificationRoutes = new Set([...(contract.routes?.verification?.values || []), "N/A"]);
  const owners = new Set(["caller", ...(contract.publicSkills || []).map(skill => skill.name)]);
  for (const item of data.cases) {
    if (!isObject(item) || !/^RB[0-9]{2}$/.test(item.id || "")) {
      errors.push(`${rel}: every case requires an id shaped RB00`);
      continue;
    }
    ids.push(item.id);
    if (!nonEmptyString(item.scenario)) errors.push(`${rel}: ${item.id} missing scenario`);
    if (!isObject(item.expected)) {
      errors.push(`${rel}: ${item.id} missing expected object`);
      continue;
    }
    if (!entryRoutes.has(item.expected.entryRoute)) errors.push(`${rel}: ${item.id} invalid entryRoute`);
    if (!verificationRoutes.has(item.expected.verificationRoute)) errors.push(`${rel}: ${item.id} invalid verificationRoute`);
    if (!owners.has(item.expected.nextOwner)) errors.push(`${rel}: ${item.id} invalid nextOwner`);
    if (!nonEmptyString(item.expected.invariant)) errors.push(`${rel}: ${item.id} missing invariant`);
  }
  requireUniqueStrings(ids, `${rel}: case ids`, errors);
}

function validateHookTemplate(root, errors) {
  const rel = "templates/hooks.json";
  const managedMarker = /^: 'codex-alpha-goal-compact-recovery:v3';/;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch (error) {
    errors.push(`${rel}: invalid JSON or missing file: ${errorMessage(error)}`);
    return;
  }
  if (!isObject(data) || !isObject(data.hooks)) {
    errors.push(`${rel}: top-level hooks field must be an object`);
    return;
  }
  if (!Array.isArray(data.hooks.PostCompact) || data.hooks.PostCompact.length === 0) {
    errors.push(`${rel}: hooks.PostCompact must contain at least one group`);
  }
  let managedPostCompactCount = 0;
  let managedOtherEventCount = 0;
  for (const [event, groups] of Object.entries(data.hooks)) {
    if (!Array.isArray(groups)) {
      errors.push(`${rel}: hooks.${event} must be an array`);
      continue;
    }
    for (const group of groups) {
      if (!isObject(group) || !Array.isArray(group.hooks) || group.hooks.length === 0) {
        errors.push(`${rel}: hooks.${event} entries must be objects with hooks arrays`);
        continue;
      }
      if (event === "PostCompact" && Object.hasOwn(group, "matcher")) {
        errors.push(`${rel}: hooks.PostCompact groups must not define matcher`);
      }
      for (const hook of group.hooks) {
        if (!isObject(hook) || hook.type !== "command" || !nonEmptyString(hook.command)) {
          errors.push(`${rel}: hooks.${event} hook entries require type=command and a command string`);
        } else if (managedMarker.test(hook.command.trimStart())) {
          if (event === "PostCompact") managedPostCompactCount += 1;
          else managedOtherEventCount += 1;
        }
      }
    }
  }
  if (managedPostCompactCount !== 1) {
    errors.push(`${rel}: expected exactly one v3 managed recovery hook inside hooks.PostCompact, found ${managedPostCompactCount}`);
  }
  if (managedOtherEventCount !== 0) {
    errors.push(`${rel}: v3 managed recovery hook must not appear outside hooks.PostCompact`);
  }
}

function validateTomlTemplate(root, errors) {
  const rel = "templates/config.toml";
  try {
    const data = parseToml(fs.readFileSync(path.join(root, rel), "utf8"));
    for (const key of ["multi_agent", "default_mode_request_user_input", "child_agents_md"]) {
      if (data?.features?.[key] !== true) errors.push(`${rel}: features.${key} must be true`);
    }
    if (!Number.isInteger(data?.agents?.max_threads) || data.agents.max_threads < 1) errors.push(`${rel}: agents.max_threads must be a positive integer`);
    if (!Number.isInteger(data?.agents?.max_depth) || data.agents.max_depth < 1) errors.push(`${rel}: agents.max_depth must be a positive integer`);
    if (data?.features?.multi_agent_v2?.usage_hint_enabled !== true) errors.push(`${rel}: features.multi_agent_v2.usage_hint_enabled must be true`);
    if (!nonEmptyString(data?.features?.multi_agent_v2?.usage_hint_text)) errors.push(`${rel}: features.multi_agent_v2.usage_hint_text must be a non-empty string`);
  } catch (error) {
    errors.push(`${rel}: invalid TOML or missing file: ${errorMessage(error)}`);
  }
}

function runFixtures() {
  const fixturesRoot = path.join(__dirname, "fixtures", "validate-skills");
  const projectRoot = path.resolve(path.join(__dirname, ".."));
  const errors = [];
  if (!isDirectory(fixturesRoot)) {
    errors.push(`missing fixtures directory: ${relative(process.cwd(), fixturesRoot)}`);
    printFixtureReport(errors);
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
    if (typeof fixture.shouldPass !== "boolean") {
      errors.push(`${fixtureFile}: shouldPass must be boolean`);
      continue;
    }
    if (!fixture.shouldPass && (!Array.isArray(fixture.expectedErrors) || fixture.expectedErrors.length === 0)) {
      errors.push(`${fixtureFile}: failing fixtures must declare expectedErrors`);
      continue;
    }
    if (Array.isArray(fixture.expectedErrors) && fixture.expectedErrors.some(expected => !nonEmptyString(expected))) {
      errors.push(`${fixtureFile}: expectedErrors must contain non-empty strings`);
      continue;
    }
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "alpha-goal-validator-"));
    try {
      if (fixture.inheritRoot) copyTree(projectRoot, tempRoot);
      for (const rel of fixture.removeFiles || []) fs.rmSync(path.join(tempRoot, rel), { recursive: true, force: true });
      for (const replacement of fixture.replacements || []) applyReplacement(tempRoot, fixtureFile, replacement, errors);
      for (const [rel, text] of Object.entries(fixture.files || {})) writeFixtureFile(tempRoot, rel, text);
      if (fixture.setSkillBudgetToActual) setBudgetToActual(tempRoot);

      const result = validateRoot(tempRoot);
      const passed = result.errors.length === 0;
      if (Boolean(fixture.shouldPass) !== passed) {
        errors.push(`${fixtureFile}: expected shouldPass=${fixture.shouldPass}, got errors: ${result.errors.join("; ")}`);
      }
      for (const expected of fixture.expectedErrors || []) {
        if (!result.errors.some(error => error.includes(expected))) {
          errors.push(`${fixtureFile}: expected error containing ${JSON.stringify(expected)}, got: ${result.errors.join("; ")}`);
        }
      }
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
  printFixtureReport(errors);
  return errors.length ? 1 : 0;
}

function applyReplacement(root, fixtureFile, replacement, errors) {
  const target = path.join(root, replacement.file);
  const original = fs.readFileSync(target, "utf8");
  if (!original.includes(replacement.search)) {
    errors.push(`${fixtureFile}: replacement target not found in ${replacement.file}: ${replacement.search}`);
    return;
  }
  fs.writeFileSync(target, original.replace(replacement.search, replacement.replace));
}

function writeFixtureFile(root, rel, text) {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}

function setBudgetToActual(root) {
  const contractPath = path.join(root, CONTRACT_PATH);
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const counts = validateSkillBudget(root, { ...contract, skillBudgetExclusiveMax: Number.MAX_SAFE_INTEGER }, []);
  contract.skillBudgetExclusiveMax = counts.total;
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
}

function copyTree(source, target) {
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv", "__pycache__"]);
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function requireArray(object, key, errors, prefix = CONTRACT_PATH) {
  if (!Array.isArray(object?.[key])) errors.push(`${prefix}: ${key} must be an array`);
}

function requireObject(object, key, errors, prefix = CONTRACT_PATH) {
  if (!isObject(object?.[key])) errors.push(`${prefix}: ${key} must be an object`);
}

function requireUniqueStrings(values, label, errors) {
  if (!Array.isArray(values)) return;
  const seen = new Set();
  for (const value of values) {
    if (!nonEmptyString(value)) {
      errors.push(`${label} must contain non-empty strings`);
    } else if (seen.has(value)) {
      errors.push(`${label} contains duplicate ${JSON.stringify(value)}`);
    } else {
      seen.add(value);
    }
  }
}

function safeRelativePath(value) {
  return nonEmptyString(value) && !path.isAbsolute(value) && !value.split(/[\\/]/).includes("..");
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function countMatches(text, pattern) {
  return text.match(pattern)?.length || 0;
}

function isFile(file) {
  try { return fs.statSync(file).isFile(); } catch { return false; }
}

function isDirectory(file) {
  try { return fs.statSync(file).isDirectory(); } catch { return false; }
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

function printReport(root, { errors, warnings, counts }) {
  console.log("Skill suite validation");
  console.log(`root: ${root}`);
  console.log(`skills units: ${counts.total}`);
  for (const [name, count] of Object.entries(counts.skills).sort()) console.log(`- ${name}: ${count}`);
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

function printFixtureReport(errors) {
  console.log("Skill validator fixtures");
  if (errors.length) {
    console.log("\nERRORS:");
    for (const error of errors) console.log(`- ${error}`);
  } else {
    console.log("PASS: all fixtures behaved as expected");
  }
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { main, validateRoot };
