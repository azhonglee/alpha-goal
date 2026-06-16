#!/usr/bin/env -S npx --yes tsx
// Lightweight validation for a local Agent Skills suite.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const ALLOWED_FRONTMATTER_KEYS = new Set(["name", "description"]);
const REQUIRED_SKILL_NAMES = new Set([
  "alpha-goal",
  "goal-contract",
  "system-model",
  "control-loop",
  "evidence-verify",
  "decision-synthesis",
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

const LEGACY_SKILL_REFERENCES = [
  "$control-kernel",
  "$loop",
  "$verify",
  "$meta-synthesis",
  "`control-kernel`",
  "`loop`",
  "`verify`",
  "`meta-synthesis`",
  "skills/control-kernel",
  "skills/loop",
  "skills/verify",
  "skills/meta-synthesis",
];

const LEGACY_ARTIFACT_PATH_REFERENCES = [
  ".alpha-goal/control-state",
  ".alpha-goal/context",
  ".alpha-goal/models",
  ".alpha-goal/synthesis",
  ".alpha-goal/iterations",
  ".alpha-goal/evidence",
  ".alpha-goal/verification",
  ".alpha-goal/interviews",
];

const SIDECAR_REQUIRED_KEYS = [
  "artifact_kind",
  "task_slug",
  "artifact_path",
  "reference_id",
  "route_state",
  "prior_route",
  "next_route",
  "target_error",
  "control_variable",
  "sensor",
  "threshold_or_tolerance",
  "evidence_boundary",
  "residual_error",
  "claim_boundary",
  "generated_at",
];

const SIDECAR_ARTIFACT_KINDS = [
  "goal-contract",
  "system-model",
  "decision-synthesis",
  "iteration-record",
  "verification-verdict",
  "conformance-report",
];

const SIDECAR_ROUTE_STATES = [
  "alpha-goal",
  "decision-synthesis",
  "system-model",
  "goal-contract",
  "control-loop",
  "evidence-verify",
  "final",
  "user",
  "blocker",
];

const SEMANTIC_SMOKE_TESTS: Array<[string, string, string[]]> = [
  [
    "ambiguous requirement can become a bounded Goal Contract",
    "skills/goal-contract/SKILL.md",
    [
      "Goal Contract",
      "reference state",
      "acceptance evidence",
      "claim boundary",
      "decision boundaries",
      "Indicator Handoff",
      ".alpha-goal/YYYYMMDD-<slug>/goal-contract.md",
      ".alpha-goal/YYYYMMDD-<slug>/control-state.md",
      "Contract Summary",
      "| Field | Value |",
      "artifact path",
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
      ".alpha-goal/YYYYMMDD-<slug>/system-model.md",
      ".alpha-goal/YYYYMMDD-<slug>/control-state.md",
      "Model Summary",
      "| Field | Value |",
    ],
  ],
  [
    "execution feedback requires control law and ledger state",
    "skills/control-loop/SKILL.md",
    [
      "Control Law",
      "target error",
      "control variable",
      "sensor threshold",
      "fallback",
      "Latest Control Route",
      "Adaptive Learning Record",
      ".alpha-goal/YYYYMMDD-<slug>/iterations",
      ".alpha-goal/YYYYMMDD-<slug>/evidence",
      "Iteration Summary",
      "| Field | Value |",
      "ledger update",
    ],
  ],
  [
    "insufficient evidence routes to next iteration instead of final",
    "skills/evidence-verify/SKILL.md",
    [
      "Evidence coverage",
      "NEXT_ITERATION",
      "NARROW_CLAIM_AND_FINAL",
      ".alpha-goal/YYYYMMDD-<slug>/verification-verdict.md",
      "Verification Summary",
      "| Field | Value |",
      "Final claim allowed",
    ],
  ],
  [
    "complex multi-party conflict uses human-machine synthesis rounds",
    "skills/decision-synthesis/SKILL.md",
    [
      "Synthesis Round",
      "Indicator Handoff",
      "Qualitative judgments",
      "Quantitative signals",
      "Meta-Synthesis Hall",
      "User-owned decisions",
      ".alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md",
      "Synthesis Summary",
      "| Field | Value |",
      "Route",
    ],
  ],
  [
    "router preserves closed-loop state and disturbance handling",
    "skills/alpha-goal/SKILL.md",
    [
      "Closed-loop Ledger",
      ".alpha-goal/YYYYMMDD-<slug>/control-state.md",
      "Latest Control Route",
      "Route Summary",
      "| Field | Value |",
      "TUI",
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
    "skills/evidence-verify/SKILL.md",
    [
      "Claim boundary",
      "Highest practical evidence-supported boundary",
      "Gap",
      "Final claim allowed",
    ],
  ],
  [
    "closed-loop ledger records cross-stage control memory",
    "skills/alpha-goal/references/closed-loop-ledger.md",
    [
      "Default behavior",
      ".alpha-goal/",
      ".gitignore",
      "process-artifact setup mutation",
      ".alpha-goal/YYYYMMDD-<slug>/",
      "Latest Control Route",
      "Artifact registry",
      "Route Summary",
      "| Field | Value |",
      "source of truth",
      ".alpha-goal/YYYYMMDD-<slug>/goal-contract.md",
      ".alpha-goal/YYYYMMDD-<slug>/system-model.md",
      ".alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md",
      ".alpha-goal/YYYYMMDD-<slug>/iterations",
      ".alpha-goal/YYYYMMDD-<slug>/evidence",
      ".alpha-goal/YYYYMMDD-<slug>/verification-verdict.md",
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
    "task-scoped artifact layout is explicit and complete",
    "skills/alpha-goal/references/artifact-layout.md",
    [
      ".alpha-goal/YYYYMMDD-<slug>/",
      "control-state.md",
      "goal-contract.md",
      "system-model.md",
      "decision-synthesis.md",
      "plan.md",
      "iterations/",
      "evidence/",
      "verification-verdict.md",
      "schema/",
      "conformance-report.md",
      "interviews.md",
    ],
  ],
  [
    "cybernetic conformance is machine-checkable",
    "skills/alpha-goal/references/cybernetic-conformance.md",
    [
      "State transition",
      "Schema sidecar",
      "legacy artifact path",
      "reference before action",
      "sensor before claim",
      "comparator before final",
      "decision-synthesis -> control-loop",
      "\"artifact_kind\"",
      "Stage-specific required keys",
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
    "skills/decision-synthesis/references/synthesis-round.md",
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
    "skills/goal-contract/references/indicator-handoff.md",
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
    "skills/control-loop/references/adaptive-learning.md",
    [
      "Learning trigger",
      "Observed mismatch",
      "Adjustment",
      "Reuse condition",
      "Invalidation condition",
      "Ledger update",
    ],
  ],
  [
    "control law captures dynamics and stability guards",
    "skills/control-loop/references/control-law.md",
    [
      "Feedback latency",
      "Signal noise",
      "Confidence",
      "Damping / anti-oscillation",
      "Saturation / containment",
    ],
  ],
  [
    "system model propagates dynamic control law fields",
    "skills/system-model/references/control-model-schema.md",
    [
      "Feedback latency",
      "Signal noise",
      "Confidence",
      "Damping / anti-oscillation",
      "Saturation / containment",
    ],
  ],
  [
    "control loop preserves dynamic control law fields",
    "skills/control-loop/SKILL.md",
    [
      "feedback latency",
      "signal noise",
      "confidence",
      "damping / anti-oscillation",
      "saturation / containment",
    ],
  ],
  [
    "evidence verify checks dynamic control law fields",
    "skills/evidence-verify/SKILL.md",
    [
      "feedback latency",
      "signal noise",
      "confidence",
      "damping / anti-oscillation",
      "saturation / containment",
    ],
  ],
  [
    "meta-synthesis hall operationalizes qualitative to quantitative convergence",
    "skills/decision-synthesis/references/meta-synthesis-hall.md",
    [
      "Meta-Synthesis Hall",
      "Human role",
      "Machine role",
      "Hypothesis bank",
      "Model registry",
      "Convergence condition",
      "Dissent",
    ],
  ],
];

const FIXTURE_CONTRACT_TESTS = [
  {
    name: "complex migration conflict uses synthesis and indicator handoff",
    prompt: "多团队迁移目标、风险、窗口、成功指标冲突，先综合研判。",
    paths: [
      "skills/decision-synthesis/SKILL.md",
      "skills/decision-synthesis/references/synthesis-round.md",
    ],
    schema_blocks: ["Decision Synthesis Record:", "Synthesis Round:", "Indicator Handoff:"],
    route_terms: ["user", "goal-contract", "system-model", "blocker"],
  },
  {
    name: "qualitative objective becomes measurable contract evidence",
    prompt: "把用户体验更稳定转成可验证 Goal Contract。",
    paths: [
      "skills/goal-contract/SKILL.md",
      "skills/goal-contract/references/indicator-handoff.md",
    ],
    schema_blocks: ["Goal Contract:", "Indicator Handoff:"],
    route_terms: ["control-loop", "system-model", "evidence-verify", "block"],
  },
  {
    name: "multi-controller system maps hierarchy before mutation",
    prompt: "多个团队和模块都能改变同一上线目标，先建模。",
    paths: [
      "skills/system-model/SKILL.md",
      "skills/system-model/references/controller-hierarchy.md",
    ],
    schema_blocks: ["Control Model:", "Controller Hierarchy:"],
    route_terms: ["goal-contract", "control-loop", "decision-synthesis", "blocker"],
  },
  {
    name: "feedback mismatch creates adaptive learning before next loop",
    prompt: "上轮控制律阈值没命中，但方向有效，继续下一轮。",
    paths: [
      "skills/control-loop/SKILL.md",
      "skills/control-loop/references/adaptive-learning.md",
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
      "skills/evidence-verify/SKILL.md",
      "skills/evidence-verify/references/verification-verdict-schema.md",
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
  validateRuntimeArtifactIgnore(root, errors);
  validateLegacyScriptReferences(root, errors);
  validateLegacySkillReferences(root, errors);
  validateLegacyArtifactPathReferences(root, errors);
  validateSchemaSidecarContract(root, errors);
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

function validateRuntimeArtifactIgnore(root: string, errors: string[]): void {
  const gitignore = path.join(root, ".gitignore");
  if (!isFile(gitignore)) {
    errors.push("missing .gitignore with required .alpha-goal/ runtime artifact ignore");
    return;
  }

  const lines = fs
    .readFileSync(gitignore, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim());
  if (!lines.includes(".alpha-goal/")) {
    errors.push(".gitignore must include .alpha-goal/ for default ledger and runtime artifacts");
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

function validateLegacySkillReferences(root: string, errors: string[]): void {
  const checkedFiles = [
    "AGENTS.md",
    "README.md",
    "INSTALL.md",
    "MANIFEST.md",
    ...walk(path.join(root, "skills"))
      .filter((file) => {
        if (!isFile(file)) {
          return false;
        }
        const rel = relative(root, file);
        return rel.endsWith(".md") || rel.endsWith("/agents/openai.yaml");
      })
      .map((file) => relative(root, file)),
  ];

  for (const rel of checkedFiles) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    for (const legacy of LEGACY_SKILL_REFERENCES) {
      if (text.includes(legacy)) {
        errors.push(`${rel}: legacy skill reference remains: ${legacy}`);
      }
    }
  }
}

function validateLegacyArtifactPathReferences(root: string, errors: string[]): void {
  const checkedFiles = [
    "AGENTS.md",
    "README.md",
    "README.zh-CN.md",
    "INSTALL.md",
    "MANIFEST.md",
    "templates/AGENTS.md",
    ...walk(path.join(root, "skills"))
      .filter((file) => {
        if (!isFile(file)) {
          return false;
        }
        const rel = relative(root, file);
        return rel.endsWith(".md") || rel.endsWith("/agents/openai.yaml");
      })
      .map((file) => relative(root, file)),
  ];

  for (const rel of checkedFiles) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    for (const legacy of LEGACY_ARTIFACT_PATH_REFERENCES) {
      if (text.includes(legacy)) {
        errors.push(`${rel}: legacy artifact path remains: ${legacy}`);
      }
    }
  }
}

function validateSchemaSidecarContract(root: string, errors: string[]): void {
  const rel = "skills/alpha-goal/references/cybernetic-conformance.md";
  const file = path.join(root, rel);
  if (!isFile(file)) {
    errors.push(`schema sidecar contract: missing ${rel}`);
    return;
  }

  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    errors.push(`${rel}: missing JSON Schema sidecar example block`);
    return;
  }

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(match[1]);
  } catch (error) {
    errors.push(`${rel}: invalid JSON Schema sidecar example: ${errorMessage(error)}`);
    return;
  }

  for (const key of SIDECAR_REQUIRED_KEYS) {
    if (!Object.hasOwn(schema, key)) {
      errors.push(`${rel}: schema sidecar missing required key ${JSON.stringify(key)}`);
    }
  }

  const artifactKind = String(schema.artifact_kind ?? "");
  for (const kind of SIDECAR_ARTIFACT_KINDS) {
    if (!artifactKind.includes(kind)) {
      errors.push(`${rel}: schema sidecar artifact_kind omits ${kind}`);
    }
  }

  const routeState = String(schema.route_state ?? "");
  for (const state of SIDECAR_ROUTE_STATES) {
    if (!routeState.includes(state)) {
      errors.push(`${rel}: schema sidecar route_state omits ${state}`);
    }
  }

  for (const kind of SIDECAR_ARTIFACT_KINDS) {
    if (!text.includes(`- \`${kind}\``)) {
      errors.push(`${rel}: stage-specific required keys omit ${kind}`);
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
