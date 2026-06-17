#!/usr/bin/env -S npx --yes tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const SKILLS_BYTE_BUDGET = 30_000;
const REQUIRED_SKILL_NAMES = ["alpha-goal", "control-loop", "evidence-verify"];
const MERGED_SKILL_NAMES = ["goal-contract", "system-model", "decision-synthesis"];
const LEGACY_SKILL_REFERENCES = [
  ...MERGED_SKILL_NAMES,
  "control-kernel", "loop", "verify", "meta-synthesis",
  "goal-frame", "goal-loop", "goal-iterate", "goal-review", "goal-verify",
];
const LEGACY_SCRIPT_REFERENCES = [
  "tools/validate_skills.py", "tools/validate_skillset.py",
  "scripts/mutation-preflight.sh", "mutation-preflight.sh",
  "scripts/repo-sensor-snapshot.sh", "repo-sensor-snapshot.sh",
  "scripts/evidence-summary.sh", "evidence-summary.sh",
];

const DESCRIPTION_SEMANTIC_CHECKS: Record<string, { required: string[]; forbidden: string[] }> = {
  "alpha-goal": {
    required: ["Unclear or underspecified engineering work router"],
    forbidden: ["execute or probe safely", "completion, correctness, readiness, safety"],
  },
  "control-loop": {
    required: ["Bounded execution controller", "Use only after", "specific read-only probe or mutation boundary", "one observable iteration", "Do not use for ambiguous planning", "final completion/readiness claims"],
    forbidden: ["discover facts before asking", "final evidence verdicts"],
  },
  "evidence-verify": {
    required: ["Independent evidence comparator", "Use only when", "fresh evidence", "explicit Goal Contract or claim boundary", "Do not use to plan or implement changes"],
    forbidden: ["discover facts before asking", "act, sense feedback"],
  },
};

const SEMANTIC_CHECKS: Array<[string, string, string[]]> = [
  ["front controller frames/models/synthesizes/routes", "skills/alpha-goal/SKILL.md", [
    "Discover facts -> Pressure-test -> Confirm one decision", "Discovery interview", "minimum preflight", "never ask the user to summarize discoverable repository facts", "prompt-safe summary", "navigation evidence, not requirements or authority", "do not score, crystallize, or hand off", "repo language as evidence", "Existing patterns are compatibility signals", "treat the answer as a claim to reconcile", "[from-code][auto-confirmed]", "[from-research] external/current fact", "[from-user]", "auto-confirm only descriptive facts", "Current-state facts cannot define desired behavior", "current external best practices", "bounded fresh evidence", "Readiness Gate Checklist", "blocking_gate_count = 0", "one decision variable", "exactly one `questions[]` item", "Pressure-test", "boundary scenario from inspected facts", "materially change execution", "non-goals", "decision boundaries", "mandatory gates", "Do not close on probable intent", "closure evidence", "Safe defaults apply only to reversible operational details", "Generic edit verbs", "read-only/probe authority does not imply mutation authority", "minimal reproducer", "Durable docs", "cannot upgrade", "Why not ask", "Why not execute", "Close the interview only", "Blocking gates", "Goal Contract", "Control Model", "Indicator Handoff", "user-owned decisions", "control-loop", "evidence-verify", "never creates", "Route Summary"
  ]],
  ["contract/model reference preserves pre-action discovery gates", "skills/alpha-goal/references/contract-and-model.md", [
    "Discovery Record:", "Trigger / skip reason", "Task / probable intent", "Prompt-safe context status", "Inspected facts/sources", "Current-state facts", "Desired-state evidence", "Inferences not yet confirmed", "Fact labels", "[from-code][auto-confirmed]", "[from-research] external/current fact", "[from-user]", "Docs/terminology ledger", "discoverable fact", "fact needing confirmation", "user-owned decision", "Readiness Gate Checklist", "Blocking gate count", "First blocking gate", "Pressure pass", "one high-leverage question", "Question type", "Closure state", "Closure evidence", "blocking_gate_count=0", "Closure summary", "route evidence", "current/external facts", "Current-state facts and existing patterns cannot become desired behavior", "user/evidence contradiction", "source-of-truth conflict", "source/authority", "Authorization source", "Goal Contract:", "Control Model:", "Non-goals", "Decision boundaries", "Acceptance evidence", "Claim boundary", "Authorization class", "Disturbance Register", "Controller Hierarchy", "Candidate Control Law"
  ]],
  ["synthesis reference preserves qualitative quantitative integration", "skills/alpha-goal/references/synthesis.md", [
    "Human/expert judgments", "Machine evidence/models", "Quantitative indicators", "Qualitative constraints", "User-owned decision", "Indicator handoff candidate"
  ]],
  ["alpha records cross-stage state", "skills/alpha-goal/SKILL.md", [
    "Latest Control Route:", "Reference", "Current state", "Control law", "Sensor feedback", "User-owned decisions", "Blocked downstream action", "Claim boundary", "Next action"
  ]],
  ["execution has hard safety gates", "skills/control-loop/SKILL.md", [
    "mutation authority", "explicit user/repo instruction", "A vague request is not mutation authorization", "Control Law", "Iteration Summary", "User-owned decisions", "Stop/re-route"
  ]],
  ["verification limits final claims", "skills/evidence-verify/SKILL.md", [
    "NARROW_CLAIM_AND_FINAL", "Final response guard", "Highest practical evidence-supported boundary", "Final wording allowed", "repair-complete", "no risk", "Verification Summary"
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
  const skillDirs = isDirectory(skills) ? fs.readdirSync(skills, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => path.join(skills, e.name)).sort() : [];
  const discovered = skillDirs.map(d => path.basename(d));
  for (const name of REQUIRED_SKILL_NAMES) if (!discovered.includes(name)) errors.push(`missing required skill directory: skills/${name}`);
  for (const name of discovered) if (!REQUIRED_SKILL_NAMES.includes(name)) errors.push(`unexpected skill directory: skills/${name}`);

  for (const dir of skillDirs) validateSkillDir(root, dir, errors, warnings);
  validateByteBudget(skills, errors);
  validateRuntimeArtifactIgnore(root, errors);
  validateScriptSurface(root, errors, warnings);
  validateLegacyReferences(root, errors);
  validateSemanticChecks(root, errors);
  validateSchemaConsistency(root, errors);
  validateInstallDocumentation(root, errors);

  printReport(root, errors, warnings);
  return errors.length ? 1 : 0;
}

function validateSkillDir(root: string, dir: string, errors: string[], warnings: string[]): void {
  const skillName = path.basename(dir);
  const md = path.join(dir, "SKILL.md");
  if (!isFile(md)) { errors.push(`${skillName}: missing SKILL.md`); return; }
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

function validateByteBudget(skills: string, errors: string[]): void {
  let total = 0;
  for (const file of walk(skills)) if (isFile(file)) total += fs.statSync(file).size;
  if (total > SKILLS_BYTE_BUDGET) errors.push(`skills byte budget exceeded: ${total} > ${SKILLS_BYTE_BUDGET}`);
}

function validateRuntimeArtifactIgnore(root: string, errors: string[]): void {
  const gitignore = path.join(root, ".gitignore");
  if (!isFile(gitignore)) { errors.push("missing .gitignore with required .alpha-goal/ runtime artifact ignore"); return; }
  const lines = fs.readFileSync(gitignore, "utf8").split(/\r?\n/).map(l => l.trim());
  if (!lines.includes(".alpha-goal/")) errors.push(".gitignore must include .alpha-goal/");
}

function validateScriptSurface(root: string, errors: string[], warnings: string[]): void {
  for (const file of walk(root).filter(f => isFile(f) && (relative(root, f).startsWith("tools/") || /^skills\/[^/]+\/scripts\//.test(relative(root, f))))) {
    const rel = relative(root, file);
    if (!rel.endsWith(".ts")) errors.push(`script surface must be TypeScript only: ${rel}`);
    if (fs.readFileSync(file, "utf8").startsWith("#!") && (fs.statSync(file).mode & 0o100) === 0) warnings.push(`${rel} has a shebang but is not user-executable`);
  }
}

function validateLegacyReferences(root: string, errors: string[]): void {
  const files = ["AGENTS.md", "README.md", "README.zh-CN.md", "INSTALL.md", "MANIFEST.md", ...walk(path.join(root, "skills")).filter(isFile).map(f => relative(root, f))];
  for (const rel of files) {
    const file = path.join(root, rel); if (!isFile(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const legacy of LEGACY_SCRIPT_REFERENCES) if (text.includes(legacy)) errors.push(`${rel}: legacy non-TypeScript script reference remains: ${legacy}`);
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

function validateSchemaConsistency(root: string, errors: string[]): void {
  const alpha = readIfFile(path.join(root, "skills/alpha-goal/SKILL.md"));
  const fields = ["Reference", "Current state", "Last error signal", "Control law", "Sensor feedback", "Route decision", "Next state", "Artifact registry", "Adaptive learning", "Selected skill", "Boundary", "Disturbance", "User-owned decisions", "Blocked downstream action", "Claim boundary", "Next action"];
  const positions = (text: string) => { const scoped = text.slice(Math.max(0, text.toLowerCase().indexOf("latest control route:"))).toLowerCase(); return fields.map(f => scoped.indexOf(`- ${f.toLowerCase()}:`)); };
  const alphaPos = positions(alpha);
  if (alphaPos.some(v => v < 0) || alphaPos.some((v, i) => i > 0 && v <= alphaPos[i - 1])) errors.push("ledger schema order mismatch: alpha");
  const evSkill = readIfFile(path.join(root, "skills/evidence-verify/SKILL.md"));
  const evRef = readIfFile(path.join(root, "skills/evidence-verify/references/verification-verdict-schema.md"));
  if (evSkill.includes("- Gaps:") || evRef.includes("- Gaps:")) errors.push("evidence verdict schema must use only `Gap:`");
  for (const term of ["PASS_TO_FINAL", "NARROW_CLAIM_AND_FINAL", "NEXT_ITERATION", "REFRAME", "BLOCKED"]) if (!evSkill.includes(term) || !evRef.includes(term)) errors.push(`evidence verdict enum mismatch: ${term}`);
}

function validateInstallDocumentation(root: string, errors: string[]): void {
  const install = readIfFile(path.join(root, "scripts/install.sh"));
  for (const name of REQUIRED_SKILL_NAMES) if (!install.includes(name)) errors.push(`scripts/install.sh missing required skill: ${name}`);
  for (const name of MERGED_SKILL_NAMES) if (!install.includes(name)) errors.push(`scripts/install.sh should clean merged old skill: ${name}`);
  const readme = readIfFile(path.join(root, "README.md"));
  if (!readme.includes("Current code facts describe current state")) errors.push("README.md missing current-state-not-desired-state principle");
  const readmeZh = readIfFile(path.join(root, "README.zh-CN.md"));
  if (!readmeZh.includes("当前代码事实只描述现状")) errors.push("README.zh-CN.md missing current-state-not-desired-state principle");
  const templateAgents = readIfFile(path.join(root, "templates/AGENTS.md"));
  if (!templateAgents.includes("never default target, scope, acceptance, non-goals, side effects, risk acceptance, authority, or final claim")) errors.push("templates/AGENTS.md must not let safe defaults bypass alpha-goal gates");
  for (const doc of ["README.md", "README.zh-CN.md", "INSTALL.md", "MANIFEST.md"]) {
    const text = readIfFile(path.join(root, doc));
    if (/six skills|六技能|六个技能|\$goal-contract|\$system-model|\$decision-synthesis/.test(text)) errors.push(`${doc}: stale six-skill public architecture wording`);
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
