#!/usr/bin/env -S npx --no-install tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const SKILLS_BYTE_BUDGET = 30_000;
const COMPACT_RECOVERY_HOOK_MARKER = "codex-alpha-goal-compact-recovery:v1";
const HOOKS_TEMPLATE = "templates/hooks.json";
const REQUIRED_SKILL_NAMES = ["alpha-goal", "control-loop", "evidence-verify"];
const MERGED_SKILL_NAMES = ["goal-contract", "system-model", "decision-synthesis"];
const LEGACY_SKILL_REFERENCES = [
  ...MERGED_SKILL_NAMES,
  "control-kernel", "loop", "verify", "meta-synthesis",
  "goal-frame", "goal-loop", "goal-iterate", "goal-review", "goal-verify",
];
const LEGACY_SCRIPT_REFERENCES = [
  "tools/validate_skills.py", "tools/validate_skillset.py", "tools/validate_skillset.ts",
  "scripts/mutation-preflight.sh", "mutation-preflight.sh",
  "scripts/repo-sensor-snapshot.sh", "repo-sensor-snapshot.sh",
  "scripts/evidence-summary.sh", "evidence-summary.sh",
];
const STATE_ROOT_CORE_FILES = [
  "skills/alpha-goal/SKILL.md",
  "skills/control-loop/SKILL.md",
  "skills/evidence-verify/SKILL.md",
  "templates/AGENTS.md",
];
const STATE_ROOT_DOC_FILES = [
  "AGENTS.md",
  "README.md",
  "README.zh-CN.md",
  "MANIFEST.md",
];
const STATE_ROOT_SCRIPT_FILES = [
  "skills/control-loop/scripts/mutation-preflight.ts",
];
const STATE_ROOT_DOC_REQUIRED_TERMS = [
  "${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/",
];
const ENV_STATE_ROOT = "ALPHA_" + "GOAL_STATE_ROOT";
const REPO_LOCAL_STATE = "\\.alpha-" + "goal";
const STATE_ROOT_REQUIRED_TERMS = [
  "Alpha Goal state root",
  "${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/",
  "last directory name of the current session directory path",
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
  [new RegExp("absolute " + "git root", "i"), "old git-root slug rule remains"],
  [new RegExp("strip leading " + "slashes", "i"), "old slug sanitization rule remains"],
  [new RegExp("replace characters " + "outside", "i"), "old slug sanitization rule remains"],
  [new RegExp("keep the last " + "80 characters", "i"), "old slug truncation rule remains"],
];

const DESCRIPTION_SEMANTIC_CHECKS: Record<string, { required: string[]; forbidden: string[] }> = {
  "alpha-goal": {
    required: ["clarify", "intention", "requirements"],
    forbidden: ["execute or probe safely", "completion, correctness, readiness, safety"],
  },
  "control-loop": {
    required: ["Use only after", "explicit goal specification", "specific read-only probe", "implementation", "Do not use for ambiguous planning"],
    forbidden: ["discover facts before asking", "final evidence verdicts"],
  },
  "evidence-verify": {
    required: ["Independent evidence comparator", "Use only when", "fresh evidence", "explicit Goal Contract or claim boundary", "Do not use to plan or implement changes"],
    forbidden: ["discover facts before asking", "act, sense feedback"],
  },
};

const SEMANTIC_CHECKS: Array<[string, string, string[]]> = [
  ["front controller discovers, frames, designs, and routes", "skills/alpha-goal/SKILL.md", [
    "Trigger Discovery", "minimum preflight", "never ask the user to summarize discoverable repository facts", "navigation evidence, not requirements or authority", "repo language as evidence", "Existing patterns are compatibility signals", "treat the answer as a claim to reconcile", "[from-code][auto-confirmed]", "[from-research] external/current fact", "[from-user]", "auto-confirm only descriptive facts", "Current-state facts cannot define desired behavior", "current external best practices", "bounded fresh evidence", "Readiness Gate Check", "one high-leverage question", "one decision variable", "exactly one `questions[]` item", "pressure-test", "boundary scenario from inspected facts", "materially change execution", "non-goals", "decision boundaries", "Indicator Handoff", "user-owned decisions", "Cross-repo framing", "single task-level Alpha Goal state root", "repo manifest", "Repo surfaces", "Dependency/integration order", "Design template", "Acceptance evidence", "Claim boundary", "Self-review", "Independent-review", "request_user_input", "$control_loop", "Design Summary"
  ]],
  ["alpha records interview and design state", "skills/alpha-goal/SKILL.md", [
    "Alpha Goal state root", "YYYYMMDD-<TaskName>/interview.md", "docs/specs/YYYYMMDD-<TaskName>.md", "Design Summary", "Blocking gates", "Ledger", "Next"
  ]],
  ["execution has hard safety gates", "skills/control-loop/SKILL.md", [
    "Do not mutate primary", "repo-local worktree", "Unrelated user changes", "Alpha Goal state root", "${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/", "mutation-preflight", "multi-repo preflight", "<repo-a> <repo-b>", "repo manifest", "per-repo", "integration evidence", "delivery boundary", "approved target", "authorization", "claim boundary", "### 1. Plan slice", "### 2. Act or probe", "### 3. Sense and compare", "### 4. Record and route", "Act/probe", "read-only/probe slice", "Preserve unrelated user changes", "root cause", "Iteration Summary", "ITERATION_READY_FOR_VERIFY", "$evidence-verify", "verification.md", "acceptance-to-evidence", "persisted evidence", "RETURN_TO_ALPHA_GOAL", "BLOCKED", "Stop/re-route"
  ]],
  ["verification limits final claims", "skills/evidence-verify/SKILL.md", [
    "PASS_TO_FINAL", "NEXT_ITERATION", "fixable evidence", "target, scope, authority", "permission, tool, data, environment, credential", "Alpha Goal state root", "${CODEX_HOME:-$HOME/.alphal-goal}/<workspace-slug>/", "repo manifest", "Repo surface coverage", "cross-repo claims", "integrated behavior", "Do not narrow the claim as a successful outcome", "Final response guard", "Highest practical evidence-supported boundary", "Final wording allowed", "repair-complete", "no risk", "Verification Summary"
  ]],
  ["multi-repo preflight script", "skills/control-loop/scripts/mutation-preflight.ts", [
    "process.argv.slice(2)", "multi-repo preflight", "targets", "repo ${i+1}", ".worktrees/codex/preflight-check", "repo manifest", "integration evidence"
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
  validateRuntimeArtifactState(root, errors, warnings);
  validateScriptSurface(root, errors, warnings);
  validateLegacyReferences(root, errors);
  validateSemanticChecks(root, errors);
  validateSchemaConsistency(root, errors);
  validateInstallDocumentation(root, errors);
  validateNoAutoDownloadRunner(root, errors);

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
    if (!text.includes("last directory name of the current session directory path") && !text.includes("当前会话目录路径最后一个目录名")) errors.push(`${rel}: missing last-directory workspace slug guidance`);
  }
  for (const rel of STATE_ROOT_SCRIPT_FILES) {
    const text = readIfFile(path.join(root, rel));
    if (!text) { errors.push(`${rel}: missing state-root script`); continue; }
    if (!text.includes(".alphal-goal")) errors.push(`${rel}: missing .alphal-goal default state root`);
    if (!text.includes("process.cwd()")) errors.push(`${rel}: state root must derive from process.cwd()`);
    if (!text.includes("basename(session)")) errors.push(`${rel}: state root must use the session directory basename`);
    if (/state\s*=\s*.*root/.test(text)) errors.push(`${rel}: state root must not derive from git root`);
  }
  const scanned = [...new Set([...STATE_ROOT_CORE_FILES, ...STATE_ROOT_DOC_FILES, ...STATE_ROOT_SCRIPT_FILES, "tools/validate_skills.ts"])];
  for (const rel of scanned) {
    const text = readIfFile(path.join(root, rel));
    for (const [pattern, label] of STATE_ROOT_FORBIDDEN_PATTERNS) if (pattern.test(text)) errors.push(`${rel}: forbidden state-root dependency remains: ${label}`);
  }
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
  const designFields = ["Intent", "Outcome", "Scope", "Constraints", "Acceptance evidence", "Non-goals", "Decision boundary", "Claim boundary", "Blocking gates", "Ledger", "Next"];
  const designStart = Math.max(0, alpha.toLowerCase().indexOf("design summary"));
  const designScoped = alpha.slice(designStart).toLowerCase();
  const designPos = designFields.map(field => designScoped.indexOf(`| ${field.toLowerCase()} |`));
  if (designPos.some(v => v < 0) || designPos.some((v, i) => i > 0 && v <= designPos[i - 1])) errors.push("design summary schema order mismatch: alpha");
  const evSkill = readIfFile(path.join(root, "skills/evidence-verify/SKILL.md"));
  const evRef = readIfFile(path.join(root, "skills/evidence-verify/references/verification-verdict-schema.md"));
  if (evSkill.includes("- Gaps:") || evRef.includes("- Gaps:")) errors.push("evidence verdict schema must use only `Gap:`");
  for (const term of ["PASS_TO_FINAL", "NEXT_ITERATION"]) if (!evSkill.includes(term) || !evRef.includes(term)) errors.push(`evidence verdict enum mismatch: ${term}`);
  for (const term of ["NARROW_CLAIM", "REFRAME"]) if (evSkill.includes(term) || evRef.includes(term)) errors.push(`evidence verdict enum must not include: ${term}`);
  for (const term of ["control-loop / alpha-goal / BLOCKED"]) if (!evSkill.includes(term) || !evRef.includes(term)) errors.push(`evidence next-route options mismatch: ${term}`);
}

function validateInstallDocumentation(root: string, errors: string[]): void {
  const install = readIfFile(path.join(root, "scripts/install.sh"));
  for (const name of REQUIRED_SKILL_NAMES) if (!install.includes(name)) errors.push(`scripts/install.sh missing required skill: ${name}`);
  for (const name of MERGED_SKILL_NAMES) if (!install.includes(name)) errors.push(`scripts/install.sh should clean merged old skill: ${name}`);
  if (install.includes(COMPACT_RECOVERY_HOOK_MARKER)) errors.push("scripts/install.sh must not hard-code compact recovery hook marker; keep hook policy in templates/hooks.json");
  if (!install.includes("--no-sync-user-hooks")) errors.push("scripts/install.sh missing --no-sync-user-hooks option");
  if (!install.includes("hooks_template")) errors.push("scripts/install.sh missing hooks template sync");
  const hooksTemplate = readIfFile(path.join(root, HOOKS_TEMPLATE));
  if (!hooksTemplate) errors.push(`${HOOKS_TEMPLATE}: missing hooks template`);
  else {
    try {
      const parsed = JSON.parse(hooksTemplate);
      if (!parsed?.hooks?.SessionStart) errors.push(`${HOOKS_TEMPLATE}: missing hooks.SessionStart`);
    } catch (error) {
      errors.push(`${HOOKS_TEMPLATE}: invalid JSON: ${errorMessage(error)}`);
    }
    for (const term of [COMPACT_RECOVERY_HOOK_MARKER, "^compact$", "${CODEX_HOME:-$HOME/.codex}", "alpha-goal/SKILL.md", "control-loop/SKILL.md", "evidence-verify/SKILL.md"]) {
      if (!hooksTemplate.includes(term)) errors.push(`${HOOKS_TEMPLATE}: missing compact recovery hook term: ${term}`);
    }
  }
  const readme = readIfFile(path.join(root, "README.md"));
  if (!readme.includes("Current code facts describe current state")) errors.push("README.md missing current-state-not-desired-state principle");
  const readmeZh = readIfFile(path.join(root, "README.zh-CN.md"));
  if (!readmeZh.includes("当前代码事实只描述现状")) errors.push("README.zh-CN.md missing current-state-not-desired-state principle");
  const installDoc = readIfFile(path.join(root, "INSTALL.md"));
  if (!installDoc.includes("--no-sync-user-hooks")) errors.push("INSTALL.md missing --no-sync-user-hooks option");
  if (!installDoc.includes(HOOKS_TEMPLATE)) errors.push("INSTALL.md missing hooks template behavior");
  const manifest = readIfFile(path.join(root, "MANIFEST.md"));
  if (!manifest.includes(HOOKS_TEMPLATE) || !manifest.includes(COMPACT_RECOVERY_HOOK_MARKER)) errors.push("MANIFEST.md missing hooks template marker");
  const templateAgents = readIfFile(path.join(root, "templates/AGENTS.md"));
  if (!templateAgents.includes("never default target, scope, acceptance, non-goals, side effects, risk acceptance, authority, or final claim")) errors.push("templates/AGENTS.md must not let safe defaults bypass alpha-goal gates");
  for (const doc of ["README.md", "README.zh-CN.md", "INSTALL.md", "MANIFEST.md"]) {
    const text = readIfFile(path.join(root, doc));
    if (/six skills|六技能|六个技能|成帧、建模、综合|\$goal-contract|\$system-model|\$decision-synthesis/.test(text)) errors.push(`${doc}: stale six-skill public architecture wording`);
  }
}

function validateNoAutoDownloadRunner(root: string, errors: string[]): void {
  const autoDownloadTsx = /npx\s+--yes\s+tsx/;
  for (const file of walk(root).filter(isFile)) {
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
