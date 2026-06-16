#!/usr/bin/env -S npx --yes tsx
// Lightweight validation for a local Agent Skills suite.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
  "stage_decision",
  "authorization_status",
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

const SIDECAR_FIXTURE_DIR = "tools/fixtures/schema-sidecars";
const SIDECAR_TASK_SLUG_RE = /^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_ALPHA_GOAL_NON_ARTIFACT_PATHS = new Set(["preflight-check"]);

const SIDECAR_EVIDENCE_BOUNDARIES = [
  "artifact",
  "helper",
  "module",
  "service",
  "user-visible",
  "production",
  "safety",
  "custom",
];

const SIDECAR_AUTHORIZATION_STATUSES = [
  "approved",
  "not-required",
  "pending",
  "blocked",
  "unknown",
];

const SIDECAR_STAGE_DECISIONS = [
  "ROUTE_TO_GOAL_CONTRACT",
  "ROUTE_TO_SYSTEM_MODEL",
  "ROUTE_TO_CONTROL_LOOP",
  "ROUTE_TO_EVIDENCE_VERIFY",
  "ROUTE_TO_USER",
  "CONTRACT_APPROVED",
  "CONTRACT_REFRAME",
  "ITERATION_CONTINUES",
  "ITERATION_HARDEN",
  "ITERATION_READY_FOR_VERIFY",
  "RETURN_TO_ALPHA_GOAL",
  "RETURN_TO_SYSTEM_MODEL",
  "BLOCKED",
  "PASS_TO_FINAL",
  "NARROW_CLAIM_AND_FINAL",
  "NEXT_ITERATION",
  "REFRAME",
  "CONFORMANCE_PASS",
  "CONFORMANCE_FAIL",
];

const STAGE_REQUIRED_SIDECAR_KEYS: Record<string, string[]> = {
  "goal-contract": [
    "reference_id",
    "claim_boundary",
    "evidence_boundary",
    "next_route",
    "stage_decision",
    "authorization_status",
  ],
  "system-model": ["sensor", "evidence_boundary", "next_route", "stage_decision"],
  "iteration-record": [
    "target_error",
    "control_variable",
    "sensor",
    "threshold_or_tolerance",
    "residual_error",
    "next_route",
    "stage_decision",
    "authorization_status",
  ],
  "verification-verdict": [
    "sensor",
    "evidence_boundary",
    "claim_boundary",
    "residual_error",
    "next_route",
    "stage_decision",
  ],
  "conformance-report": [
    "artifact_path",
    "route_state",
    "prior_route",
    "next_route",
    "residual_error",
    "claim_boundary",
    "stage_decision",
  ],
};

const SIDECAR_FIXTURE_TRACE = [
  {
    kind: "decision-synthesis",
    route_state: "decision-synthesis",
    prior_route: "alpha-goal",
    next_route: "system-model",
    stage_decision: "ROUTE_TO_SYSTEM_MODEL",
    authorization_status: "not-required",
  },
  {
    kind: "system-model",
    route_state: "system-model",
    prior_route: "decision-synthesis",
    next_route: "goal-contract",
    stage_decision: "ROUTE_TO_GOAL_CONTRACT",
    authorization_status: "not-required",
  },
  {
    kind: "goal-contract",
    route_state: "goal-contract",
    prior_route: "system-model",
    next_route: "control-loop",
    stage_decision: "CONTRACT_APPROVED",
    authorization_status: "approved",
  },
  {
    kind: "iteration-record",
    route_state: "control-loop",
    prior_route: "goal-contract",
    next_route: "evidence-verify",
    stage_decision: "ITERATION_READY_FOR_VERIFY",
    authorization_status: "approved",
  },
  {
    kind: "verification-verdict",
    route_state: "evidence-verify",
    prior_route: "control-loop",
    next_route: "final",
    stage_decision: "PASS_TO_FINAL",
    authorization_status: "not-required",
  },
  {
    kind: "conformance-report",
    route_state: "evidence-verify",
    prior_route: "control-loop",
    next_route: "final",
    stage_decision: "CONFORMANCE_PASS",
    authorization_status: "not-required",
  },
];

const ROUTE_TRANSITIONS: Record<string, string[]> = {
  START: ["alpha-goal"],
  "alpha-goal": [
    "decision-synthesis",
    "system-model",
    "goal-contract",
    "control-loop",
    "evidence-verify",
    "user",
    "blocker",
  ],
  "decision-synthesis": [
    "goal-contract",
    "system-model",
    "control-loop",
    "evidence-verify",
    "user",
    "blocker",
  ],
  "system-model": [
    "goal-contract",
    "control-loop",
    "evidence-verify",
    "decision-synthesis",
    "blocker",
  ],
  "goal-contract": ["control-loop", "system-model", "user", "blocker"],
  "control-loop": [
    "control-loop",
    "evidence-verify",
    "alpha-goal",
    "system-model",
    "blocker",
  ],
  "evidence-verify": ["final", "control-loop", "goal-contract", "system-model", "blocker"],
};

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
      "\"stage_decision\"",
      "\"authorization_status\"",
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
  validateInstallSurface(root, errors);
  validateRuntimeArtifactIgnores(root, errors);
  validateLegacyScriptReferences(root, errors);
  validateLegacySkillReferences(root, errors);
  validateLegacyArtifactPathReferences(root, errors);
  validateTaskScopedArtifactPathShape(root, errors);
  validateSchemaSidecarContract(root, errors);
  validateSchemaSidecarFixtures(root, errors);
  validateRuntimeSchemaSidecars(root, errors);
  validateCyberneticRouteConsistency(root, errors);
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
    if (rel.startsWith("tools/fixtures/")) {
      return false;
    }
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

function validateInstallSurface(root: string, errors: string[]): void {
  const installScript = path.join(root, "scripts/install.sh");
  if (!isFile(installScript)) {
    errors.push("missing install script: scripts/install.sh");
  } else {
    runReadOnlyCheck(root, errors, "install script syntax", "bash", ["-n", "scripts/install.sh"]);
  }

  const configTemplate = path.join(root, "templates/config.toml");
  if (!isFile(configTemplate)) {
    errors.push("missing config template: templates/config.toml");
  } else {
    runReadOnlyCheck(root, errors, "config template TOML parse", "python3", [
      "-c",
      "import pathlib,tomllib; tomllib.loads(pathlib.Path('templates/config.toml').read_text())",
    ]);
  }
}

function runReadOnlyCheck(
  root: string,
  errors: string[],
  label: string,
  command: string,
  args: string[],
): void {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.error) {
    errors.push(`${label}: failed to run ${command}: ${result.error.message}`);
    return;
  }
  if (result.status !== 0) {
    const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    errors.push(`${label}: command failed${output ? `: ${output}` : ""}`);
  }
}

function validateRuntimeArtifactIgnores(root: string, errors: string[]): void {
  const gitignore = path.join(root, ".gitignore");
  if (!isFile(gitignore)) {
    errors.push("missing .gitignore with required .alpha-goal/ and .worktrees/ ignores");
    return;
  }

  const lines = fs
    .readFileSync(gitignore, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim());
  if (!lines.includes(".alpha-goal/")) {
    errors.push(".gitignore must include .alpha-goal/ for default ledger and runtime artifacts");
  }
  if (!lines.includes(".worktrees/")) {
    errors.push(".gitignore must include .worktrees/ before repository-local worktrees are used");
  }
}

function documentationFiles(root: string): string[] {
  const rootDocs = [
    "AGENTS.md",
    "README.md",
    "README.zh-CN.md",
    "INSTALL.md",
    "MANIFEST.md",
    "templates/AGENTS.md",
  ];
  const skillDocs = walk(path.join(root, "skills"))
    .filter((file) => {
      if (!isFile(file)) {
        return false;
      }
      const rel = relative(root, file);
      return rel.endsWith(".md") || rel.endsWith("/agents/openai.yaml");
    })
    .map((file) => relative(root, file));
  return [...new Set([...rootDocs, ...skillDocs])].sort();
}

function validateLegacyScriptReferences(root: string, errors: string[]): void {
  for (const rel of documentationFiles(root)) {
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
  for (const rel of documentationFiles(root)) {
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
  for (const rel of documentationFiles(root)) {
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

function validateTaskScopedArtifactPathShape(root: string, errors: string[]): void {
  const pathPattern = /\.alpha-goal\/([^/`\s),]+)/g;
  for (const rel of documentationFiles(root)) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }

    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(pathPattern)) {
      const segment = match[1];
      if (ALLOWED_ALPHA_GOAL_NON_ARTIFACT_PATHS.has(segment)) {
        continue;
      }
      if (segment.startsWith("\\\\d{8}")) {
        continue;
      }
      if (segment === "YYYYMMDD-<slug>" || SIDECAR_TASK_SLUG_RE.test(segment)) {
        continue;
      }
      errors.push(
        `${rel}: .alpha-goal runtime artifact path must be task-scoped, found .alpha-goal/${segment}`,
      );
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
    errors.push(`${rel}: invalid JSON Schema sidecar block: ${errorMessage(error)}`);
    return;
  }

  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push(`${rel}: schema sidecar must declare JSON Schema draft 2020-12`);
  }
  if (schema.type !== "object") {
    errors.push(`${rel}: schema sidecar root type must be object`);
  }
  if (schema.additionalProperties !== false) {
    errors.push(`${rel}: schema sidecar must set additionalProperties to false`);
  }

  const required = stringArray(schema.required);
  for (const key of SIDECAR_REQUIRED_KEYS) {
    if (!required.includes(key)) {
      errors.push(`${rel}: schema sidecar required list omits ${JSON.stringify(key)}`);
    }
  }

  const properties = objectValue(schema.properties);
  if (!properties) {
    errors.push(`${rel}: schema sidecar missing properties object`);
    return;
  }

  for (const key of SIDECAR_REQUIRED_KEYS) {
    if (!Object.hasOwn(properties, key)) {
      errors.push(`${rel}: schema sidecar properties omit ${JSON.stringify(key)}`);
    }
  }

  validateSchemaEnum(rel, properties, "artifact_kind", SIDECAR_ARTIFACT_KINDS, errors);
  validateSchemaEnum(rel, properties, "route_state", SIDECAR_ROUTE_STATES, errors);
  validateSchemaEnum(rel, properties, "evidence_boundary", SIDECAR_EVIDENCE_BOUNDARIES, errors);
  validateSchemaEnum(rel, properties, "stage_decision", SIDECAR_STAGE_DECISIONS, errors);
  validateSchemaEnum(rel, properties, "authorization_status", SIDECAR_AUTHORIZATION_STATUSES, errors);

  for (const kind of SIDECAR_ARTIFACT_KINDS) {
    if (!text.includes(`- \`${kind}\``)) {
      errors.push(`${rel}: stage-specific required keys omit ${kind}`);
    }
  }
}

function validateSchemaSidecarFixtures(root: string, errors: string[]): void {
  const dir = path.join(root, SIDECAR_FIXTURE_DIR);
  if (!isDirectory(dir)) {
    errors.push(`schema sidecar fixtures: missing ${SIDECAR_FIXTURE_DIR}`);
    return;
  }

  const expectedFiles = new Set(SIDECAR_ARTIFACT_KINDS.map((kind) => `${kind}.json`));
  const fixturesByKind = new Map<string, Record<string, unknown>>();
  const actualFiles = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  for (const name of actualFiles) {
    if (!expectedFiles.has(name)) {
      errors.push(`${SIDECAR_FIXTURE_DIR}/${name}: unexpected schema sidecar fixture`);
    }
  }

  for (const kind of SIDECAR_ARTIFACT_KINDS) {
    const rel = `${SIDECAR_FIXTURE_DIR}/${kind}.json`;
    const file = path.join(root, rel);
    if (!isFile(file)) {
      errors.push(`schema sidecar fixtures: missing ${rel}`);
      continue;
    }

    let fixture: Record<string, unknown>;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        errors.push(`${rel}: schema sidecar fixture must be a JSON object`);
        continue;
      }
      fixture = parsed as Record<string, unknown>;
    } catch (error) {
      errors.push(`${rel}: invalid JSON schema sidecar fixture: ${errorMessage(error)}`);
      continue;
    }

    validateConcreteSidecarFixture(rel, fixture, kind, errors);
    fixturesByKind.set(kind, fixture);
  }

  validateSchemaSidecarFixtureTrace(fixturesByKind, errors);
}

function validateConcreteSidecarFixture(
  rel: string,
  fixture: Record<string, unknown>,
  expectedKind: string,
  errors: string[],
  expectedTaskSlug?: string,
): void {
  for (const key of SIDECAR_REQUIRED_KEYS) {
    if (!Object.hasOwn(fixture, key)) {
      errors.push(`${rel}: schema sidecar missing required key ${JSON.stringify(key)}`);
    }
  }

  const artifactKind = stringValue(fixture.artifact_kind);
  if (!artifactKind) {
    errors.push(`${rel}: artifact_kind must be a non-empty string`);
  } else if (artifactKind !== expectedKind) {
    errors.push(`${rel}: artifact_kind ${JSON.stringify(artifactKind)} must equal ${expectedKind}`);
  }

  const taskSlug = stringValue(fixture.task_slug);
  if (!taskSlug) {
    errors.push(`${rel}: task_slug must be a non-empty string`);
  } else if (expectedTaskSlug && taskSlug !== expectedTaskSlug) {
    errors.push(`${rel}: task_slug ${JSON.stringify(taskSlug)} must match sidecar directory ${expectedTaskSlug}`);
  } else if (!SIDECAR_TASK_SLUG_RE.test(taskSlug)) {
    errors.push(`${rel}: task_slug must match YYYYMMDD-<slug>, got ${JSON.stringify(taskSlug)}`);
  }

  const artifactPath = stringValue(fixture.artifact_path);
  if (!artifactPath) {
    errors.push(`${rel}: artifact_path must be a non-empty string`);
  } else if (taskSlug && !artifactPath.startsWith(`.alpha-goal/${taskSlug}/`)) {
    errors.push(`${rel}: artifact_path must stay under .alpha-goal/${taskSlug}/`);
  } else if (!artifactPath.endsWith(".md")) {
    errors.push(`${rel}: artifact_path must point to the Markdown stage artifact`);
  } else if (taskSlug && artifactKind && !artifactPathMatchesKind(artifactKind, taskSlug, artifactPath)) {
    errors.push(`${rel}: artifact_path does not match artifact_kind ${artifactKind}`);
  }

  const routeState = stringValue(fixture.route_state);
  if (!routeState || !SIDECAR_ROUTE_STATES.includes(routeState)) {
    errors.push(`${rel}: route_state must be one of ${SIDECAR_ROUTE_STATES.join(", ")}`);
  }

  const priorRoute = nullableStringValue(fixture.prior_route);
  if (priorRoute === undefined) {
    errors.push(`${rel}: prior_route must be a route string or null`);
  } else if (priorRoute !== null && !isRouteToken(priorRoute)) {
    errors.push(`${rel}: prior_route has unknown route token ${JSON.stringify(priorRoute)}`);
  }

  const nextRoute = nullableStringValue(fixture.next_route);
  if (!nextRoute) {
    errors.push(`${rel}: next_route must be a non-empty route string`);
  } else if (!isRouteToken(nextRoute)) {
    errors.push(`${rel}: next_route has unknown route token ${JSON.stringify(nextRoute)}`);
  }

  if (priorRoute && routeState && isRouteToken(priorRoute) && !canTransition(priorRoute, routeState)) {
    errors.push(`${rel}: invalid prior transition ${priorRoute} -> ${routeState}`);
  }
  if (routeState && nextRoute && isRouteToken(nextRoute) && !canTransition(routeState, nextRoute)) {
    errors.push(`${rel}: invalid next transition ${routeState} -> ${nextRoute}`);
  }

  const evidenceBoundary = stringValue(fixture.evidence_boundary);
  if (!evidenceBoundary) {
    errors.push(`${rel}: evidence_boundary must be a non-empty string`);
  } else if (!SIDECAR_EVIDENCE_BOUNDARIES.includes(evidenceBoundary)) {
    errors.push(`${rel}: evidence_boundary has unsupported value ${JSON.stringify(evidenceBoundary)}`);
  }

  const stageDecision = stringValue(fixture.stage_decision);
  if (!stageDecision) {
    errors.push(`${rel}: stage_decision must be a non-empty string`);
  } else if (!SIDECAR_STAGE_DECISIONS.includes(stageDecision)) {
    errors.push(`${rel}: stage_decision has unsupported value ${JSON.stringify(stageDecision)}`);
  } else if (nextRoute && !stageDecisionMatchesRoute(stageDecision, nextRoute)) {
    errors.push(`${rel}: stage_decision ${stageDecision} does not support next_route ${nextRoute}`);
  }

  const authorizationStatus = stringValue(fixture.authorization_status);
  if (!authorizationStatus) {
    errors.push(`${rel}: authorization_status must be a non-empty string`);
  } else if (!SIDECAR_AUTHORIZATION_STATUSES.includes(authorizationStatus)) {
    errors.push(`${rel}: authorization_status has unsupported value ${JSON.stringify(authorizationStatus)}`);
  }

  if (
    nextRoute === "control-loop" &&
    routeState !== "control-loop" &&
    authorizationStatus !== "approved"
  ) {
    errors.push(`${rel}: routing into control-loop requires authorization_status=approved`);
  }
  if (routeState === "control-loop" && authorizationStatus !== "approved") {
    errors.push(`${rel}: control-loop sidecar requires authorization_status=approved`);
  }
  if (
    expectedKind === "decision-synthesis" &&
    nextRoute === "control-loop" &&
    !isMeaningfulSidecarValue(fixture.reference_id)
  ) {
    errors.push(`${rel}: decision-synthesis -> control-loop requires an existing reference_id`);
  }
  if (
    expectedKind === "system-model" &&
    nextRoute === "control-loop" &&
    !isMeaningfulSidecarValue(fixture.reference_id)
  ) {
    errors.push(`${rel}: system-model -> control-loop requires an existing reference_id`);
  }

  const generatedAt = stringValue(fixture.generated_at);
  if (!generatedAt) {
    errors.push(`${rel}: generated_at must be a non-empty ISO-8601 string`);
  } else if (Number.isNaN(Date.parse(generatedAt)) || !generatedAt.includes("T")) {
    errors.push(`${rel}: generated_at must parse as ISO-8601, got ${JSON.stringify(generatedAt)}`);
  }

  if (expectedKind === "decision-synthesis") {
    if (!isMeaningfulSidecarValue(fixture.next_route)) {
      errors.push(`${rel}: decision-synthesis sidecar requires next_route`);
    }
    if (
      !isMeaningfulSidecarValue(fixture.reference_id) &&
      !isMeaningfulSidecarValue(fixture.claim_boundary)
    ) {
      errors.push(`${rel}: decision-synthesis sidecar requires reference_id or claim_boundary`);
    }
  } else {
    for (const key of STAGE_REQUIRED_SIDECAR_KEYS[expectedKind] ?? []) {
      if (!isMeaningfulSidecarValue(fixture[key])) {
        errors.push(`${rel}: ${expectedKind} sidecar requires meaningful ${key}`);
      }
    }
  }
}

function validateRuntimeSchemaSidecars(root: string, errors: string[]): void {
  const runtimeRoot = path.join(root, ".alpha-goal");
  if (!isDirectory(runtimeRoot)) {
    return;
  }

  validateRuntimeArtifactTree(root, runtimeRoot, errors);
  const sidecarsByTask = new Map<string, Record<string, unknown>[]>();
  const sidecarFiles = walk(runtimeRoot).filter((file) => {
    if (!isFile(file) || !file.endsWith(".json")) {
      return false;
    }
    const rel = relative(root, file);
    return /^\.alpha-goal\/[^/]+\/schema\/[^/]+\.json$/.test(rel);
  });

  for (const file of sidecarFiles) {
    const rel = relative(root, file);
    let sidecar: Record<string, unknown>;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        errors.push(`${rel}: runtime schema sidecar must be a JSON object`);
        continue;
      }
      sidecar = parsed as Record<string, unknown>;
    } catch (error) {
      errors.push(`${rel}: invalid runtime schema sidecar JSON: ${errorMessage(error)}`);
      continue;
    }

    const artifactKind = stringValue(sidecar.artifact_kind);
    if (!artifactKind || !SIDECAR_ARTIFACT_KINDS.includes(artifactKind)) {
      errors.push(`${rel}: runtime schema sidecar has unknown artifact_kind`);
      continue;
    }

    if (!sidecarFilenameMatchesKind(artifactKind, path.basename(file))) {
      errors.push(`${rel}: runtime schema sidecar filename does not match artifact_kind ${artifactKind}`);
    }

    const taskSlug = rel.match(/^\.alpha-goal\/([^/]+)\//)?.[1];
    validateConcreteSidecarFixture(rel, sidecar, artifactKind, errors, taskSlug);
    if (taskSlug) {
      const group = sidecarsByTask.get(taskSlug) ?? [];
      group.push(sidecar);
      sidecarsByTask.set(taskSlug, group);
    }
  }

  validateRuntimeSidecarTraceGroups(root, sidecarsByTask, errors);
}

function validateRuntimeArtifactTree(root: string, runtimeRoot: string, errors: string[]): void {
  const entries = fs.readdirSync(runtimeRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (!SIDECAR_TASK_SLUG_RE.test(entry.name)) {
      errors.push(`.alpha-goal/${entry.name}: runtime artifact directory must be task-scoped`);
    }
  }
}

function validateRuntimeSidecarTraceGroups(
  root: string,
  sidecarsByTask: Map<string, Record<string, unknown>[]>,
  errors: string[],
): void {
  for (const [taskSlug, sidecars] of sidecarsByTask) {
    const relPrefix = `.alpha-goal/${taskSlug}/schema`;
    const referenceIds = new Set(
      sidecars
        .map((sidecar) => stringValue(sidecar.reference_id))
        .filter((value): value is string => Boolean(value)),
    );
    if (referenceIds.size > 1) {
      errors.push(`${relPrefix}: runtime sidecars must share one reference_id`);
    }

    const hasControlLoop = sidecars.some((sidecar) => sidecar.route_state === "control-loop");
    const hasApprovedContract = sidecars.some(
      (sidecar) =>
        sidecar.artifact_kind === "goal-contract" &&
        sidecar.next_route === "control-loop" &&
        sidecar.authorization_status === "approved",
    );
    if (hasControlLoop && !hasApprovedContract) {
      errors.push(`${relPrefix}: control-loop runtime sidecar requires an approved goal-contract sidecar`);
    }

    const hasFinalRoute = sidecars.some((sidecar) => sidecar.next_route === "final");
    const hasVerification = sidecars.some((sidecar) => sidecar.artifact_kind === "verification-verdict");
    if (hasFinalRoute && !hasVerification) {
      errors.push(`${relPrefix}: final route requires a verification-verdict sidecar`);
    }

    for (const sidecar of sidecars) {
      const artifactPath = stringValue(sidecar.artifact_path);
      if (artifactPath && !isFile(path.join(root, artifactPath))) {
        errors.push(`${relPrefix}: sidecar artifact_path does not exist: ${artifactPath}`);
      }

      const priorRoute = nullableStringValue(sidecar.prior_route);
      const routeState = stringValue(sidecar.route_state);
      if (!priorRoute || priorRoute === "alpha-goal" || !routeState) {
        continue;
      }

      const hasIncomingSource = sidecars.some(
        (candidate) => candidate.route_state === priorRoute && candidate.next_route === routeState,
      );
      if (!hasIncomingSource) {
        errors.push(`${relPrefix}: no prior sidecar connects ${priorRoute} -> ${routeState}`);
      }
    }
  }
}

function validateSchemaSidecarFixtureTrace(
  fixturesByKind: Map<string, Record<string, unknown>>,
  errors: string[],
): void {
  const taskSlugs = new Set<string>();
  const referenceIds = new Set<string>();

  for (const step of SIDECAR_FIXTURE_TRACE) {
    const rel = `${SIDECAR_FIXTURE_DIR}/${step.kind}.json`;
    const fixture = fixturesByKind.get(step.kind);
    if (!fixture) {
      continue;
    }

    const taskSlug = stringValue(fixture.task_slug);
    if (taskSlug) {
      taskSlugs.add(taskSlug);
    }

    const referenceId = stringValue(fixture.reference_id);
    if (referenceId) {
      referenceIds.add(referenceId);
    }

    for (const key of ["route_state", "prior_route", "next_route"] as const) {
      const expected = step[key];
      const actual = stringValue(fixture[key]);
      if (actual !== expected) {
        errors.push(`${rel}: fixture trace requires ${key}=${expected}, got ${String(actual)}`);
      }
    }
  }

  if (taskSlugs.size !== 1) {
    errors.push(`schema sidecar fixture trace must use exactly one task_slug, got ${[...taskSlugs].join(", ")}`);
  }
  if (referenceIds.size !== 1) {
    errors.push(
      `schema sidecar fixture trace must use exactly one reference_id, got ${[...referenceIds].join(", ")}`,
    );
  }
}

function validateCyberneticRouteConsistency(root: string, errors: string[]): void {
  const conformanceRel = "skills/alpha-goal/references/cybernetic-conformance.md";
  const synthesisRel = "skills/decision-synthesis/SKILL.md";
  const synthesisRoundRel = "skills/decision-synthesis/references/synthesis-round.md";
  const conformance = readRequiredText(root, conformanceRel, errors);
  const synthesis = readRequiredText(root, synthesisRel, errors);
  const synthesisRound = readRequiredText(root, synthesisRoundRel, errors);

  if (conformance) {
    for (const [from, targets] of Object.entries(ROUTE_TRANSITIONS)) {
      const transition = `${from} -> ${targets.join(" | ")}`;
      if (!conformance.includes(transition)) {
        errors.push(`${conformanceRel}: missing route transition ${transition}`);
      }
    }

    const requiredGuards = [
      "`decision-synthesis -> control-loop` is valid only when an approved Goal Contract already exists",
      "`decision-synthesis -> evidence-verify` is valid only when synthesis did not authorize mutation",
      "`system-model -> control-loop` is valid only when an approved Goal Contract exists",
    ];
    for (const guard of requiredGuards) {
      if (!conformance.includes(guard)) {
        errors.push(`${conformanceRel}: missing conditional transition guard ${guard}`);
      }
    }
  }

  if (synthesis) {
    const requiredRoutes = [
      "Route to `evidence-verify` only when synthesis did not authorize mutation",
      "Route to `control-loop` only if a valid Goal Contract already exists",
      "Route to `goal-contract` when a stable recommended direction",
      "Route to `system-model` when subsystem boundary or feedback signals remain unclear",
    ];
    for (const route of requiredRoutes) {
      if (!synthesis.includes(route)) {
        errors.push(`${synthesisRel}: missing decision-synthesis route rule ${route}`);
      }
    }
  }

  if (synthesisRound) {
    const routeTrigger =
      "Route trigger: goal-contract | system-model | control-loop | evidence-verify | user | blocker";
    if (!synthesisRound.includes(routeTrigger)) {
      errors.push(`${synthesisRoundRel}: missing complete route trigger list`);
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

function validateSchemaEnum(
  rel: string,
  properties: Record<string, unknown>,
  propertyName: string,
  expectedValues: string[],
  errors: string[],
): void {
  const property = objectValue(properties[propertyName]);
  if (!property) {
    errors.push(`${rel}: schema sidecar property ${propertyName} must be an object`);
    return;
  }
  const actualValues = stringArray(property.enum);
  for (const expected of expectedValues) {
    if (!actualValues.includes(expected)) {
      errors.push(`${rel}: schema sidecar ${propertyName} enum omits ${expected}`);
    }
  }
}

function readRequiredText(root: string, rel: string, errors: string[]): string | undefined {
  const file = path.join(root, rel);
  if (!isFile(file)) {
    errors.push(`missing required text file: ${rel}`);
    return undefined;
  }
  return fs.readFileSync(file, "utf8");
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function nullableStringValue(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  return stringValue(value);
}

function isMeaningfulSidecarValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function isRouteToken(value: string): boolean {
  return value === "START" || SIDECAR_ROUTE_STATES.includes(value);
}

function canTransition(from: string, to: string): boolean {
  return (ROUTE_TRANSITIONS[from] ?? []).includes(to);
}

function stageDecisionMatchesRoute(stageDecision: string, nextRoute: string): boolean {
  switch (stageDecision) {
    case "ROUTE_TO_GOAL_CONTRACT":
      return nextRoute === "goal-contract";
    case "ROUTE_TO_SYSTEM_MODEL":
    case "RETURN_TO_SYSTEM_MODEL":
      return nextRoute === "system-model";
    case "ROUTE_TO_CONTROL_LOOP":
    case "CONTRACT_APPROVED":
    case "ITERATION_CONTINUES":
    case "ITERATION_HARDEN":
    case "NEXT_ITERATION":
      return nextRoute === "control-loop";
    case "ROUTE_TO_EVIDENCE_VERIFY":
    case "ITERATION_READY_FOR_VERIFY":
      return nextRoute === "evidence-verify";
    case "ROUTE_TO_USER":
      return nextRoute === "user";
    case "RETURN_TO_ALPHA_GOAL":
      return nextRoute === "alpha-goal";
    case "PASS_TO_FINAL":
    case "NARROW_CLAIM_AND_FINAL":
    case "CONFORMANCE_PASS":
      return nextRoute === "final";
    case "REFRAME":
    case "CONTRACT_REFRAME":
      return ["goal-contract", "system-model", "alpha-goal", "user"].includes(nextRoute);
    case "CONFORMANCE_FAIL":
      return ["control-loop", "goal-contract", "system-model", "blocker"].includes(nextRoute);
    case "BLOCKED":
      return nextRoute === "blocker";
    default:
      return false;
  }
}

function artifactPathMatchesKind(kind: string, taskSlug: string, artifactPath: string): boolean {
  const root = `.alpha-goal/${taskSlug}/`;
  switch (kind) {
    case "goal-contract":
      return artifactPath === `${root}goal-contract.md`;
    case "system-model":
      return artifactPath === `${root}system-model.md`;
    case "decision-synthesis":
      return artifactPath === `${root}decision-synthesis.md`;
    case "iteration-record":
      return new RegExp(`^${escapeRegex(root)}iterations/[^/]+\\.md$`).test(artifactPath);
    case "verification-verdict":
      return artifactPath === `${root}verification-verdict.md`;
    case "conformance-report":
      return artifactPath === `${root}conformance-report.md`;
    default:
      return false;
  }
}

function sidecarFilenameMatchesKind(kind: string, filename: string): boolean {
  switch (kind) {
    case "goal-contract":
      return filename === "goal-contract.json";
    case "system-model":
      return filename === "system-model.json";
    case "decision-synthesis":
      return filename === "decision-synthesis.json";
    case "iteration-record":
      return /^iteration-(record|\d+|[a-z0-9]+(?:-[a-z0-9]+)*)\.json$/.test(filename);
    case "verification-verdict":
      return filename === "verification-verdict.json";
    case "conformance-report":
      return filename === "conformance-report.json";
    default:
      return false;
  }
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
