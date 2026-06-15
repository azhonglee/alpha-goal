#!/usr/bin/env -S npx --yes tsx
// Lightweight validation for a local Agent Skills suite.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const REQUIRED_SKILL_NAMES = new Set([
  "control-kernel",
  "alpha-goal",
  "system-model",
  "loop",
  "verify",
  "meta-synthesis",
]);

const LEGACY_SCRIPT_REFERENCES = [
  "tools/validate_skills.py",
  "tools/validate_skillset.py",
  "scripts/mutation-preflight.sh",
  "mutation-preflight.sh",
  "scripts/repo-sensor-snapshot.sh",
  "repo-sensor-snapshot.sh",
  "scripts/evidence-summary.sh",
  "evidence-summary.sh",
];

const SEMANTIC_SMOKE_TESTS: Array<[string, string, string[]]> = [
  [
    "ambiguous requirement can become a bounded Goal Contract",
    "skills/alpha-goal/SKILL.md",
    [
      "Goal Contract",
      "reference state",
      "acceptance evidence",
      "claim boundary",
      "decision boundaries",
      "Indicator Handoff",
    ],
  ],
  [
    "unclear system boundary routes through control modeling",
    "skills/system-model/SKILL.md",
    [
      "System boundary",
      "Observability",
      "Controllability",
      "Candidate control laws",
      "Controller Hierarchy",
      "none material",
      "Disturbance Register",
      "none material",
    ],
  ],
  [
    "execution feedback requires control law and ledger state",
    "skills/loop/SKILL.md",
    [
      "Control Law",
      "target error",
      "control variable",
      "sensor threshold",
      "fallback",
      "Adaptive Learning Record",
      "ledger update",
    ],
  ],
  [
    "insufficient evidence routes to next iteration instead of final",
    "skills/verify/SKILL.md",
    [
      "Evidence coverage",
      "NEXT_ITERATION",
      "NARROW_CLAIM_AND_FINAL",
      "Final claim allowed",
    ],
  ],
  [
    "complex multi-party conflict uses human-machine synthesis rounds",
    "skills/meta-synthesis/SKILL.md",
    [
      "Synthesis Round",
      "Indicator Handoff",
      "Qualitative judgments",
      "Quantitative signals",
      "User-owned decisions",
      "Route",
    ],
  ],
  [
    "router preserves closed-loop state and disturbance handling",
    "skills/control-kernel/SKILL.md",
    [
      "Closed-loop Ledger",
      "Control Law",
      "Indicator Handoff",
      "Adaptive Learning",
      "Controller Hierarchy",
      "Disturbance Register",
      "Error signal",
      "Selected skill",
    ],
  ],
  [
    "claim boundary prevents overbroad final claims",
    "skills/verify/SKILL.md",
    [
      "Claim boundary",
      "Highest practical evidence-supported boundary",
      "Gap",
      "Final claim allowed",
    ],
  ],
  [
    "closed-loop ledger records cross-stage control memory",
    "skills/control-kernel/references/closed-loop-ledger.md",
    [
      "Reference",
      "Current state",
      "Last error signal",
      "Control law",
      "Sensor feedback",
      "Route decision",
      "Next state",
      "Adaptive learning",
    ],
  ],
  [
    "disturbance register has robust monitoring and containment fields",
    "skills/system-model/references/disturbance-register.md",
    [
      "Likelihood",
      "Impact",
      "Sensor",
      "Containment",
      "Route trigger",
      "none material",
    ],
  ],
  [
    "synthesis round combines judgment, evidence, metrics, and decisions",
    "skills/meta-synthesis/references/synthesis-round.md",
    [
      "Human/expert judgments",
      "Machine evidence and models",
      "Quantitative indicators",
      "Conflict or contradiction",
      "User-owned decision",
      "Next hypothesis to verify",
      "Indicator handoff candidate",
    ],
  ],
  [
    "indicator handoff turns qualitative goals into evidence signals",
    "skills/alpha-goal/references/indicator-handoff.md",
    [
      "Operational definition",
      "Sensor / evidence source",
      "Measurement timing or frequency",
      "Threshold / tolerance",
      "Evidence boundary",
      "Route trigger",
    ],
  ],
  [
    "controller hierarchy maps local controllers to global objective",
    "skills/system-model/references/controller-hierarchy.md",
    [
      "Global controller",
      "Local controller",
      "Coupling variables",
      "Arbitration rule",
      "Escalation trigger",
      "Recommended coordination route",
      "none material",
    ],
  ],
  [
    "adaptive learning records reusable control corrections",
    "skills/loop/references/adaptive-learning.md",
    [
      "Learning trigger",
      "Observed mismatch",
      "Adjustment",
      "Reuse condition",
      "Invalidation condition",
      "Ledger update",
    ],
  ],
];

const FIXTURE_CONTRACT_TESTS = [
  {
    name: "complex migration conflict uses synthesis and indicator handoff",
    prompt: "多团队迁移目标、风险、窗口、成功指标冲突，先综合研判。",
    paths: [
      "skills/meta-synthesis/SKILL.md",
      "skills/meta-synthesis/references/synthesis-round.md",
    ],
    schema_blocks: ["Meta-Synthesis Record:", "Synthesis Round:", "Indicator Handoff:"],
    route_terms: ["user", "alpha-goal", "system-model", "blocker"],
  },
  {
    name: "qualitative objective becomes measurable contract evidence",
    prompt: "把用户体验更稳定转成可验证 Goal Contract。",
    paths: [
      "skills/alpha-goal/SKILL.md",
      "skills/alpha-goal/references/indicator-handoff.md",
    ],
    schema_blocks: ["Goal Contract:", "Indicator Handoff:"],
    route_terms: ["loop", "system-model", "verify", "block"],
  },
  {
    name: "multi-controller system maps hierarchy before mutation",
    prompt: "多个团队和模块都能改变同一上线目标，先建模。",
    paths: [
      "skills/system-model/SKILL.md",
      "skills/system-model/references/controller-hierarchy.md",
    ],
    schema_blocks: ["Control Model:", "Controller Hierarchy:"],
    route_terms: ["alpha-goal", "loop", "meta-synthesis", "blocker"],
  },
  {
    name: "feedback mismatch creates adaptive learning before next loop",
    prompt: "上轮控制律阈值没命中，但方向有效，继续下一轮。",
    paths: [
      "skills/loop/SKILL.md",
      "skills/loop/references/adaptive-learning.md",
    ],
    schema_blocks: ["Control Law:", "Adaptive Learning Record:"],
    route_terms: [
      "ITERATION_CONTINUES",
      "ITERATION_HARDEN",
      "RETURN_TO_SYSTEM_MODEL",
    ],
  },
  {
    name: "verification checks learned thresholds and indicator evidence",
    prompt: "检查当前声明是否可以最终交付。",
    paths: [
      "skills/verify/SKILL.md",
      "skills/verify/references/verification-verdict-schema.md",
    ],
    schema_blocks: [
      "Verification Verdict:",
      "Indicator handoff review",
      "Adaptive learning review",
    ],
    route_terms: ["PASS_TO_FINAL", "NEXT_ITERATION", "REFRAME", "BLOCKED"],
  },
];

type Frontmatter = Record<string, string>;

function parseFrontmatter(text: string): Frontmatter {
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error("missing YAML frontmatter block");
  }

  const data: Frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const [offset, line] of lines.entries()) {
    const lineno = offset + 2;
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) {
      continue;
    }

    const field = line.match(FIELD_RE);
    if (!field) {
      throw new Error(`line ${lineno}: unsupported frontmatter syntax`);
    }

    const [, key, rawValue] = field;
    const value = rawValue.trim();
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
      throw new Error(`line ${lineno}: unsupported frontmatter key ${JSON.stringify(key)}`);
    }
    if (Object.hasOwn(data, key)) {
      throw new Error(`line ${lineno}: duplicate frontmatter key ${JSON.stringify(key)}`);
    }
    if (!value) {
      throw new Error(`line ${lineno}: empty frontmatter value for ${JSON.stringify(key)}`);
    }

    const quoted =
      value.length >= 2 &&
      value[0] === value[value.length - 1] &&
      (value[0] === "'" || value[0] === '"');
    if (!quoted && /:\s/.test(value)) {
      throw new Error(`line ${lineno}: quote frontmatter value containing ': '`);
    }

    data[key] = quoted ? value.slice(1, -1) : value;
  }

  return data;
}

export function main(args = process.argv.slice(2)): number {
  const root = path.resolve(
    args[0] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
  );
  const skills = path.join(root, "skills");
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isDirectory(skills)) {
    errors.push(`missing skills directory: ${skills}`);
    printReport(root, errors, warnings);
    return 1;
  }

  for (const bad of walk(root)) {
    const basename = path.basename(bad);
    if (basename === "__MACOSX" && isDirectory(bad)) {
      errors.push(`macOS metadata directory found: ${relative(root, bad)}`);
    }
    if (basename.startsWith("._") && isFile(bad)) {
      errors.push(`macOS resource fork file found: ${relative(root, bad)}`);
    }
  }

  const skillDirs = fs
    .readdirSync(skills, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skills, entry.name))
    .sort();

  if (skillDirs.length === 0) {
    errors.push("no skill directories found");
  }

  const discoveredSkillNames = new Set(skillDirs.map((dir) => path.basename(dir)));
  for (const name of [...REQUIRED_SKILL_NAMES].sort()) {
    if (!discoveredSkillNames.has(name)) {
      errors.push(`missing required skill directory: skills/${name}`);
    }
  }
  for (const name of [...discoveredSkillNames].sort()) {
    if (!REQUIRED_SKILL_NAMES.has(name)) {
      errors.push(`unexpected skill directory: skills/${name}`);
    }
  }

  const names = new Set<string>();
  for (const dir of skillDirs) {
    const skillName = path.basename(dir);
    const md = path.join(dir, "SKILL.md");
    if (!isFile(md)) {
      errors.push(`${skillName}: missing SKILL.md`);
      continue;
    }

    const text = fs.readFileSync(md, "utf8");
    let frontmatter: Frontmatter;
    try {
      frontmatter = parseFrontmatter(text);
    } catch (error) {
      errors.push(`${skillName}: invalid SKILL.md frontmatter: ${errorMessage(error)}`);
      continue;
    }

    const name = frontmatter.name;
    const desc = frontmatter.description;
    if (!name) {
      errors.push(`${skillName}: SKILL.md frontmatter missing name`);
    }
    if (!desc) {
      errors.push(`${skillName}: SKILL.md frontmatter missing description`);
    }
    if (name && name !== skillName) {
      errors.push(`${skillName}: frontmatter name ${JSON.stringify(name)} does not match directory`);
    }
    if (name && names.has(name)) {
      errors.push(`duplicate skill name: ${name}`);
    }
    if (name) {
      names.add(name);
    }
    if (desc && desc.length > 500) {
      warnings.push(
        `${skillName}: description is long (${desc.length} chars); implicit routing may truncate it`,
      );
    }

    const referencesDir = path.join(dir, "references");
    const references = isDirectory(referencesDir)
      ? fs
          .readdirSync(referencesDir, { withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => path.join(referencesDir, entry.name))
          .sort()
      : [];
    for (const ref of references) {
      const relRef = `references/${path.basename(ref)}`;
      if (!text.includes(relRef)) {
        errors.push(`${skillName}: reference is not discoverable from SKILL.md: ${relRef}`);
      }
    }
  }

  validateTypeScriptScriptSurface(root, errors, warnings);
  validateLegacyScriptReferences(root, errors);
  validateSemanticSmokeTests(root, errors);
  validateFixtureContractTests(root, errors);

  printReport(root, errors, warnings);
  return errors.length > 0 ? 1 : 0;
}

function validateTypeScriptScriptSurface(root: string, errors: string[], warnings: string[]): void {
  const scriptFiles = walk(root).filter((file) => {
    if (!isFile(file)) {
      return false;
    }
    const rel = relative(root, file);
    return (
      rel.startsWith("tools/") ||
      /^skills\/[^/]+\/scripts\//.test(rel)
    );
  });

  for (const file of scriptFiles) {
    const rel = relative(root, file);
    if (rel.includes("/__pycache__/") || rel.endsWith(".pyc")) {
      continue;
    }
    if (!rel.endsWith(".ts")) {
      errors.push(`script surface must be TypeScript only: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    if (text.startsWith("#!")) {
      const mode = fs.statSync(file).mode;
      if ((mode & 0o100) === 0) {
        warnings.push(`${rel} has a shebang but is not user-executable`);
      }
    }
  }
}

function validateLegacyScriptReferences(root: string, errors: string[]): void {
  const checkedFiles = [
    "AGENTS.md",
    "README.md",
    "INSTALL.md",
    "MANIFEST.md",
    ...walk(path.join(root, "skills"))
      .filter((file) => isFile(file) && path.basename(file) === "SKILL.md")
      .map((file) => relative(root, file)),
  ];

  for (const rel of checkedFiles) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    for (const legacy of LEGACY_SCRIPT_REFERENCES) {
      if (text.includes(legacy)) {
        errors.push(`${rel}: legacy non-TypeScript script reference remains: ${legacy}`);
      }
    }
  }
}

function validateSemanticSmokeTests(root: string, errors: string[]): void {
  for (const [scenario, relPath, requiredTerms] of SEMANTIC_SMOKE_TESTS) {
    const file = path.join(root, relPath);
    if (!isFile(file)) {
      errors.push(`semantic smoke test ${JSON.stringify(scenario)}: missing ${relPath}`);
      continue;
    }

    const text = fs.readFileSync(file, "utf8").toLowerCase();
    const missing = requiredTerms.filter((term) => !text.includes(term.toLowerCase()));
    if (missing.length > 0) {
      errors.push(
        `semantic smoke test ${JSON.stringify(scenario)} failed in ${relPath}: missing ${missing.join(", ")}`,
      );
    }
  }
}

function validateFixtureContractTests(root: string, errors: string[]): void {
  for (const fixture of FIXTURE_CONTRACT_TESTS) {
    const name = fixture.name;
    const prompt = fixture.prompt;
    if (!prompt.trim()) {
      errors.push(`fixture contract ${JSON.stringify(name)}: empty prompt`);
      continue;
    }

    const combinedParts: string[] = [];
    const missingPaths: string[] = [];
    for (const relPath of fixture.paths) {
      const file = path.join(root, relPath);
      if (!isFile(file)) {
        missingPaths.push(relPath);
        continue;
      }
      combinedParts.push(fs.readFileSync(file, "utf8"));
    }

    if (missingPaths.length > 0) {
      errors.push(
        `fixture contract ${JSON.stringify(name)}: missing paths ${missingPaths.join(", ")}`,
      );
      continue;
    }

    const combined = combinedParts.join("\n");
    const missingBlocks = fixture.schema_blocks.filter((block) => !hasSchemaBlock(combined, block));
    if (missingBlocks.length > 0) {
      errors.push(
        `fixture contract ${JSON.stringify(name)}: missing schema blocks ${missingBlocks.join(", ")}`,
      );
    }

    const lower = combined.toLowerCase();
    const missingRoutes = fixture.route_terms.filter((term) => !lower.includes(term.toLowerCase()));
    if (missingRoutes.length > 0) {
      errors.push(
        `fixture contract ${JSON.stringify(name)}: missing route terms ${missingRoutes.join(", ")}`,
      );
    }
  }
}

function hasSchemaBlock(text: string, label: string): boolean {
  const escaped = escapeRegex(label.trim());
  const headingLabel = escapeRegex(label.trim().replace(/:$/, ""));
  const blockPattern = new RegExp("```(?:text)?\\n(?:(?!```).)*" + escaped, "s");
  const headingPattern = new RegExp("^#{1,6}\\s+" + headingLabel, "m");
  return blockPattern.test(text) || headingPattern.test(text);
}

function printReport(root: string, errors: string[], warnings: string[]): void {
  console.log("Skill suite validation");
  console.log(`root: ${root}`);
  if (errors.length > 0) {
    console.log("\nERRORS:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  }
  if (warnings.length > 0) {
    console.log("\nWARNINGS:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log("PASS: all checks passed");
  } else if (errors.length === 0) {
    console.log("PASS with warnings");
  }
}

function walk(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  const result: string[] = [];
  const stack = [root];
  const skippedDirs = new Set([
    ".git",
    ".worktrees",
    "node_modules",
    "dist",
    "build",
    ".venv",
    "__pycache__",
  ]);

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.reverse()) {
      if (entry.isDirectory() && skippedDirs.has(entry.name)) {
        continue;
      }
      stack.push(path.join(current, entry.name));
    }
  }

  return result;
}

function isDirectory(file: string): boolean {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

function isFile(file: string): boolean {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function relative(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entrypoint === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
