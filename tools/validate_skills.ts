#!/usr/bin/env -S npx --yes tsx
// 本地 Alpha Goal 四技能套件校验。

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const FRONTMATTER_RE = /^---\n(.*?)\n---\n/s;
const FIELD_RE = /^([A-Za-z0-9_-]+):\s*(.*?)\s*$/;
const REQUIRED_SKILLS = ["alpha-goal", "system-model", "control-loop", "evidence-verify"];
const REMOVED_SKILL_TERMS = [
  "goal-contract",
  "decision-synthesis",
  "ROUTE_TO_GOAL_CONTRACT",
  "$goal-contract",
  "$decision-synthesis",
  "goal-contract.md",
  "decision-synthesis.md",
  "skills/goal-contract",
  "skills/decision-synthesis",
  "bounded goal contract",
];
const SKILL_DOC_SIZE_LIMIT_BYTES = 30_000;
const SIDECAR_TASK_SLUG_RE = /^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
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
  "confirmation_status",
  "generated_at",
];
const ALPHA_GOAL_CONTRACT_KEYS = [
  "intent",
  "outcome",
  "in_scope",
  "out_of_scope_non_goals",
  "boundaries",
  "context_facts",
  "constraints",
  "acceptance_signals",
  "decision_boundaries",
  "assumptions",
  "risks_tradeoffs",
  "open_questions",
  "pressure_pass",
];
const SIDECAR_ALLOWED_KEY_SET = new Set([...SIDECAR_REQUIRED_KEYS, ...ALPHA_GOAL_CONTRACT_KEYS]);
const SIDECAR_ARTIFACT_KINDS = [
  "alpha-goal",
  "system-model",
  "iteration-record",
  "verification-verdict",
  "conformance-report",
];
const SIDECAR_ROUTE_STATES = [
  "alpha-goal",
  "system-model",
  "control-loop",
  "evidence-verify",
  "final",
  "user",
  "blocker",
];
const ROUTE_TRANSITIONS: Record<string, string[]> = {
  START: ["alpha-goal", "system-model", "evidence-verify"],
  "alpha-goal": ["control-loop", "user", "blocker"],
  "system-model": ["alpha-goal", "blocker"],
  "control-loop": ["control-loop", "evidence-verify", "alpha-goal", "system-model", "blocker"],
  "evidence-verify": ["final", "control-loop", "alpha-goal", "system-model", "blocker"],
};
const STAGE_POLICIES: Record<string, { routeState: string; stageDecisions: string[] }> = {
  "alpha-goal": {
    routeState: "alpha-goal",
    stageDecisions: ["ROUTE_TO_USER", "CONTRACT_CONFIRMED", "BLOCKED"],
  },
  "system-model": {
    routeState: "system-model",
    stageDecisions: ["ROUTE_TO_ALPHA_GOAL", "REFRAME", "BLOCKED"],
  },
  "iteration-record": {
    routeState: "control-loop",
    stageDecisions: [
      "ITERATION_CONTINUES",
      "ITERATION_HARDEN",
      "ITERATION_READY_FOR_VERIFY",
      "RETURN_TO_ALPHA_GOAL",
      "RETURN_TO_SYSTEM_MODEL",
      "BLOCKED",
    ],
  },
  "verification-verdict": {
    routeState: "evidence-verify",
    stageDecisions: [
      "PASS_TO_FINAL",
      "NARROW_CLAIM_AND_FINAL",
      "NEXT_ITERATION",
      "REFRAME",
      "BLOCKED",
    ],
  },
  "conformance-report": {
    routeState: "evidence-verify",
    stageDecisions: ["CONFORMANCE_PASS", "CONFORMANCE_FAIL"],
  },
};
const EVIDENCE_BOUNDARIES = [
  "artifact",
  "helper",
  "module",
  "service",
  "user-visible",
  "production",
  "safety",
  "custom",
];
const CONFIRMATION_STATUSES = ["confirmed", "not-required", "pending", "blocked", "unknown"];
const NEGATIVE_FIXTURE_EXPECTATIONS: Record<string, string[]> = {
  "contract-missing-fields": ["alpha-goal 缺少目标契约字段"],
  "control-loop-without-confirmed-contract": ["control-loop 需要先前已确认的 alpha-goal schema sidecar"],
  "divergent-reference-id": ["运行态 schema sidecar 必须共享同一个 reference_id"],
  "final-with-nonpassing-verdict": ["最终路由需要带 PASS_TO_FINAL 或 NARROW_CLAIM_AND_FINAL"],
  "final-self-verdict": ["最终路由需要明确 prior_route"],
  "final-without-contract": ["最终路由需要先前已确认的 alpha-goal schema sidecar"],
  "final-without-verification": ["最终路由需要带 PASS_TO_FINAL 或 NARROW_CLAIM_AND_FINAL"],
  "late-confirmed-contract": ["已确认 alpha-goal schema sidecar 不得晚于 control-loop 路由"],
  "late-final-verdict": ["verification-verdict schema sidecar 不得晚于最终路由"],
  "missing-artifact-path": ["缺少必填键 artifact_path"],
  "missing-reference-id": ["必须共享一个有意义的 reference_id"],
  "stage-decision-policy": ["alpha-goal stage_decision 不受支持 ITERATION_HARDEN"],
  "system-model-control-loop-without-confirmed-contract": ["next transition 无效 system-model -> control-loop"],
};
const LEGACY_ARTIFACT_PATHS = [
  ".alpha-goal/control-state",
  ".alpha-goal/context",
  ".alpha-goal/models",
  ".alpha-goal/synthesis",
  ".alpha-goal/iterations",
  ".alpha-goal/evidence",
  ".alpha-goal/verification",
];

type Frontmatter = Record<string, string>;

export function main(args = process.argv.slice(2)): number {
  const root = path.resolve(args[0] ?? ".");
  const errors: string[] = [];
  const warnings: string[] = [];

  validateSkillLayout(root, errors);
  validateNoRemovedSkillResidue(root, errors);
  validateRuntimeIgnores(root, errors);
  validateDocSize(root, errors);
  validateSemanticSmoke(root, errors);
  validateTuiTemplates(root, errors);
  validateSidecarFixtures(root, errors);
  validateInstallSurface(root, errors, warnings);

  printReport(root, errors, warnings);
  return errors.length > 0 ? 1 : 0;
}

function validateSkillLayout(root: string, errors: string[]): void {
  const skillsRoot = path.join(root, "skills");
  if (!isDirectory(skillsRoot)) {
    errors.push("缺少 skills/ 目录");
    return;
  }

  const skillDirs = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expected = [...REQUIRED_SKILLS].sort();
  if (skillDirs.join("\n") !== expected.join("\n")) {
    errors.push(`技能集合必须精确为 ${expected.join(", ")}，实际为 ${skillDirs.join(", ")}`);
  }

  for (const skillName of REQUIRED_SKILLS) {
    const skillFile = path.join(skillsRoot, skillName, "SKILL.md");
    if (!isFile(skillFile)) {
      errors.push(`缺少必需技能文件: skills/${skillName}/SKILL.md`);
      continue;
    }
    let frontmatter: Frontmatter;
    try {
      frontmatter = parseFrontmatter(fs.readFileSync(skillFile, "utf8"));
    } catch (error) {
      errors.push(`skills/${skillName}/SKILL.md: ${errorMessage(error)}`);
      continue;
    }
    if (frontmatter.name !== skillName) {
      errors.push(`skills/${skillName}/SKILL.md: frontmatter name 必须是 ${skillName}`);
    }
    if (!frontmatter.description) {
      errors.push(`skills/${skillName}/SKILL.md: 缺少 description`);
    }
  }
}

function validateNoRemovedSkillResidue(root: string, errors: string[]): void {
  for (const rel of textFiles(root)) {
    if (rel === "tools/validate_skills.ts") {
      continue;
    }
    const text = fs.readFileSync(path.join(root, rel), "utf8");
    for (const term of REMOVED_SKILL_TERMS) {
      if (text.includes(term)) {
        errors.push(`${rel}: 仍残留已移除阶段引用 ${term}`);
      }
    }
    for (const legacy of LEGACY_ARTIFACT_PATHS) {
      if (text.includes(legacy)) {
        errors.push(`${rel}: 仍残留旧产物路径 ${legacy}`);
      }
    }
  }
}

function validateRuntimeIgnores(root: string, errors: string[]): void {
  const gitignore = path.join(root, ".gitignore");
  if (!isFile(gitignore)) {
    errors.push("缺少 .gitignore");
    return;
  }
  const lines = fs.readFileSync(gitignore, "utf8").split(/\r?\n/).map((line) => line.trim());
  for (const required of [".alpha-goal/", ".worktrees/"]) {
    if (!lines.includes(required)) {
      errors.push(`.gitignore 必须包含 ${required}`);
    }
  }
}

function validateDocSize(root: string, errors: string[]): void {
  const docs = walk(path.join(root, "skills")).filter((file) => {
    const rel = relative(root, file);
    return isFile(file) && rel.endsWith("/SKILL.md");
  });
  const total = docs.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  if (total > SKILL_DOC_SIZE_LIMIT_BYTES) {
    errors.push(`技能正文超过 30K: ${total} bytes > ${SKILL_DOC_SIZE_LIMIT_BYTES}`);
  }
}

function validateSemanticSmoke(root: string, errors: string[]): void {
  const checks: Array<[string, string, string[]]> = [
    [
      "alpha-goal 澄清真实需求",
      "skills/alpha-goal/SKILL.md",
      [
        "目标契约",
        "真实意图",
        "预期结果",
        "范围内",
        "范围外 / 非目标",
        "边界",
        "上下文事实",
        "约束",
        "验收信号",
        "决策边界",
        "关键假设",
        "风险取舍",
        "苏格拉底式",
        "每轮只问一个最高杠杆问题",
        "pressure pass",
        "模糊度必须 `<= 0.15`",
        "不得输出已确认目标契约",
        "误当成用户真正诉求",
        ".alpha-goal/YYYYMMDD-<slug>/alpha-goal.md",
        ".alpha-goal/YYYYMMDD-<slug>/schema/alpha-goal.json",
        "目标契约摘要",
      ],
    ],
    [
      "system-model 只做条件升级",
      "skills/system-model/SKILL.md",
      [
        "系统边界",
        "可观测性",
        "可控性",
        "候选控制律",
        "控制器层级",
        "扰动记录",
        "执行前先到 `alpha-goal`",
        "不能直接进入 `control-loop`",
        "最终必须回到 `alpha-goal`",
        "形成目标契约",
        ".alpha-goal/YYYYMMDD-<slug>/schema/system-model.json",
      ],
    ],
    [
      "control-loop 必须有已确认目标契约",
      "skills/control-loop/SKILL.md",
      [
        "只在已确认的 `alpha-goal` 目标契约下",
        "真实意图",
        "预期结果",
        "范围外 / 非目标",
        "边界",
        "验收信号",
        "决策边界",
        "返回 `alpha-goal`",
        "只读突变预检快照",
        "执行检查",
        "默认不要在 TUI 打印原始 `控制律:` 块",
        ".alpha-goal/YYYYMMDD-<slug>/schema/iteration-NN.json",
        "自适应学习记录",
      ],
    ],
    [
      "evidence-verify 控制最终声明",
      "skills/evidence-verify/SKILL.md",
      [
        "独立比较器",
        "声明边界",
        "允许的最终声明",
        "NARROW_CLAIM_AND_FINAL",
        "NEXT_ITERATION",
        "返回 `alpha-goal`",
        ".alpha-goal/YYYYMMDD-<slug>/schema/verification-verdict.json",
      ],
    ],
  ];

  for (const [name, rel, terms] of checks) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      errors.push(`语义冒烟测试「${name}」失败：缺少文件 ${rel}`);
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const missing = terms.filter((term) => !text.includes(term));
    if (missing.length > 0) {
      errors.push(`语义冒烟测试「${name}」失败：${rel} 缺少 ${missing.join(", ")}`);
    }
  }
}

function validateTuiTemplates(root: string, errors: string[]): void {
  const checks = [
    {
      name: "目标契约摘要",
      path: "skills/alpha-goal/SKILL.md",
      anchor: "TUI 摘要:",
      end: "持久化路径:",
      terms: [
        "目标契约摘要",
        "| 字段 | 内容 |",
        "| 真实意图 |",
        "| 预期结果 |",
        "| 范围 |",
        "| 非目标 |",
        "| 边界 |",
        "| 约束 |",
        "| 验收信号 |",
        "| 决策边界 |",
        "| 模糊度 |",
        "| 下一步 |",
      ],
    },
    {
      name: "模型摘要",
      path: "skills/system-model/SKILL.md",
      anchor: "TUI 摘要:",
      end: "完整模型:",
      terms: ["模型摘要", "| 字段 | 内容 |", "| 边界 |", "| 可观测性 |", "| 可控性 |", "| 推荐路由 |"],
    },
    {
      name: "执行检查",
      path: "skills/control-loop/SKILL.md",
      anchor: "TUI 执行前检查:",
      end: "只有存在多个独立循环",
      terms: ["执行检查", "| 字段 | 内容 |", "| 问题 |", "| 本轮动作 |", "| 验收证据 |", "| 失败处理 |"],
    },
    {
      name: "迭代摘要",
      path: "skills/control-loop/SKILL.md",
      anchor: "TUI 摘要:",
      end: "不要在迭代记录中作出最终完成声明",
      terms: ["迭代摘要", "| 字段 | 内容 |", "| 动作 |", "| 反馈 |", "| 剩余误差 |", "| 下一步 |"],
    },
    {
      name: "验证摘要",
      path: "skills/evidence-verify/SKILL.md",
      anchor: "TUI 摘要:",
      end: "完整版:",
      terms: ["验证摘要", "| 字段 | 内容 |", "| 结论 |", "| 声明边界 |", "| 证据 |", "| 下一步 |"],
    },
  ];

  for (const check of checks) {
    const file = path.join(root, check.path);
    if (!isFile(file)) {
      errors.push(`TUI 模板检查「${check.name}」失败：缺少 ${check.path}`);
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const section = between(text, check.anchor, check.end);
    if (!section) {
      errors.push(`TUI 模板检查「${check.name}」失败：缺少锚点 ${check.anchor}`);
      continue;
    }
    const codeBlocks = [...section.matchAll(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g)].map((m) => m[1]);
    if (codeBlocks.length !== 1) {
      errors.push(`TUI 模板检查「${check.name}」失败：模板代码块数量必须为 1，实际 ${codeBlocks.length}`);
      continue;
    }
    const missing = check.terms.filter((term) => !codeBlocks[0].includes(term));
    if (missing.length > 0) {
      errors.push(`TUI 模板检查「${check.name}」失败：缺少 ${missing.join(", ")}`);
    }
  }
}

function validateSidecarFixtures(root: string, errors: string[]): void {
  validateFixtureDir(root, "tools/fixtures/schema-sidecars", errors, false);
  validateRuntimeFixtureSets(root, errors);
  validateActualRuntimeSidecars(root, errors);
}

function validateFixtureDir(
  root: string,
  relDir: string,
  errors: string[],
  allowNegative: boolean,
): string[] {
  const dir = path.join(root, relDir);
  const localErrors: string[] = [];
  if (!isDirectory(dir)) {
    localErrors.push(`缺少 fixture 目录: ${relDir}`);
    if (!allowNegative) {
      errors.push(...localErrors);
    }
    return localErrors;
  }
  const files = walk(dir).filter((file) => isFile(file) && file.endsWith(".json")).sort();
  if (files.length === 0) {
    localErrors.push(`${relDir}: 缺少 JSON sidecar`);
  }
  const sidecarsByTask = new Map<string, Record<string, unknown>[]>();
  for (const file of files) {
    validateSidecarFile(root, file, localErrors);
    const sidecar = readJsonObject(file);
    if (sidecar) {
      const taskSlug = stringValue(sidecar.task_slug);
      if (taskSlug) {
        const group = sidecarsByTask.get(taskSlug) ?? [];
        group.push(sidecar);
        sidecarsByTask.set(taskSlug, group);
      }
    }
  }
  validateSidecarTraceGroups(sidecarsByTask, localErrors);
  if (!allowNegative) {
    errors.push(...localErrors);
  }
  return localErrors;
}

function validateRuntimeFixtureSets(root: string, errors: string[]): void {
  const validRoot = path.join(root, "tools/fixtures/runtime-sidecars/valid");
  if (isDirectory(validRoot)) {
    for (const caseDir of childDirectories(validRoot)) {
      const localErrors = validateFixtureDir(root, relative(root, caseDir), [], true);
      if (localErrors.length > 0) {
        errors.push(`${relative(root, caseDir)}: valid fixture 失败: ${localErrors.join("; ")}`);
      }
    }
  }

  const negativeRoot = path.join(root, "tools/fixtures/runtime-sidecars/negative");
  if (isDirectory(negativeRoot)) {
    for (const caseDir of childDirectories(negativeRoot)) {
      const localErrors = validateFixtureDir(root, relative(root, caseDir), [], true);
      if (localErrors.length === 0) {
        errors.push(`${relative(root, caseDir)}: negative fixture 必须触发至少一个错误`);
        continue;
      }
      const caseName = path.basename(caseDir);
      const expectedErrors = NEGATIVE_FIXTURE_EXPECTATIONS[caseName];
      if (!expectedErrors) {
        errors.push(`${relative(root, caseDir)}: negative fixture 缺少期望错误登记`);
        continue;
      }
      const missingExpected = expectedErrors.filter(
        (expected) => !localErrors.some((error) => error.includes(expected)),
      );
      if (missingExpected.length > 0) {
        errors.push(
          `${relative(root, caseDir)}: negative fixture 未命中期望错误 ${missingExpected.join(", ")}；实际错误: ${localErrors.join("; ")}`,
        );
      }
    }
  }
}

function validateActualRuntimeSidecars(root: string, errors: string[]): void {
  const alphaRoot = path.join(root, ".alpha-goal");
  if (!isDirectory(alphaRoot)) {
    return;
  }
  for (const taskDir of childDirectories(alphaRoot)) {
    const schemaDir = path.join(taskDir, "schema");
    if (!isDirectory(schemaDir)) {
      continue;
    }
    const localErrors = validateFixtureDir(root, relative(root, schemaDir), [], true);
    if (localErrors.length > 0) {
      errors.push(`${relative(root, schemaDir)}: 运行态 sidecar 失败: ${localErrors.join("; ")}`);
    }
  }
}

function validateSidecarFile(root: string, file: string, errors: string[]): void {
  const rel = relative(root, file);
  let sidecar: Record<string, unknown>;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      errors.push(`${rel}: sidecar 必须是 JSON object`);
      return;
    }
    sidecar = parsed as Record<string, unknown>;
  } catch (error) {
    errors.push(`${rel}: JSON 无效: ${errorMessage(error)}`);
    return;
  }

  for (const key of SIDECAR_REQUIRED_KEYS) {
    if (!Object.hasOwn(sidecar, key)) {
      errors.push(`${rel}: 缺少必填键 ${key}`);
    }
  }
  for (const key of Object.keys(sidecar)) {
    if (!SIDECAR_ALLOWED_KEY_SET.has(key)) {
      errors.push(`${rel}: 包含不支持的键 ${key}`);
    }
  }

  const kind = stringValue(sidecar.artifact_kind);
  if (!SIDECAR_ARTIFACT_KINDS.includes(kind)) {
    errors.push(`${rel}: artifact_kind 未知 ${JSON.stringify(kind)}`);
    return;
  }
  if (!sidecarFilenameMatchesKind(kind, path.basename(file))) {
    errors.push(`${rel}: 文件名与 artifact_kind ${kind} 不匹配`);
  }

  const taskSlug = stringValue(sidecar.task_slug);
  if (!SIDECAR_TASK_SLUG_RE.test(taskSlug)) {
    errors.push(`${rel}: task_slug 必须匹配 YYYYMMDD-<slug>`);
  }
  const artifactPath = stringValue(sidecar.artifact_path);
  if (!artifactPathMatchesKind(kind, taskSlug, artifactPath)) {
    errors.push(`${rel}: artifact_path 与 artifact_kind ${kind} 不匹配`);
  }

  const routeState = stringValue(sidecar.route_state);
  const priorRoute = nullableStringValue(sidecar.prior_route);
  const nextRoute = stringValue(sidecar.next_route);
  if (!SIDECAR_ROUTE_STATES.includes(routeState)) {
    errors.push(`${rel}: route_state 不受支持 ${routeState}`);
  }
  if (priorRoute !== null && priorRoute !== undefined && !isRouteToken(priorRoute)) {
    errors.push(`${rel}: prior_route 不受支持 ${String(priorRoute)}`);
  }
  if (!isRouteToken(nextRoute)) {
    errors.push(`${rel}: next_route 不受支持 ${nextRoute}`);
  }
  if (priorRoute && routeState && !canTransition(priorRoute, routeState)) {
    errors.push(`${rel}: prior transition 无效 ${priorRoute} -> ${routeState}`);
  }
  if (routeState && nextRoute && !canTransition(routeState, nextRoute)) {
    errors.push(`${rel}: next transition 无效 ${routeState} -> ${nextRoute}`);
  }
  if (!stageDecisionMatchesRoute(stringValue(sidecar.stage_decision), nextRoute)) {
    errors.push(`${rel}: stage_decision ${String(sidecar.stage_decision)} 不支持 next_route ${nextRoute}`);
  }

  const policy = STAGE_POLICIES[kind];
  if (policy) {
    if (routeState !== policy.routeState) {
      errors.push(`${rel}: ${kind} route_state 必须是 ${policy.routeState}`);
    }
    const stageDecision = stringValue(sidecar.stage_decision);
    if (!policy.stageDecisions.includes(stageDecision)) {
      errors.push(`${rel}: ${kind} stage_decision 不受支持 ${stageDecision}`);
    }
  }

  if (!EVIDENCE_BOUNDARIES.includes(stringValue(sidecar.evidence_boundary))) {
    errors.push(`${rel}: evidence_boundary 不受支持`);
  }
  if (!CONFIRMATION_STATUSES.includes(stringValue(sidecar.confirmation_status))) {
    errors.push(`${rel}: confirmation_status 不受支持`);
  }
  validateAlphaGoalContractFields(rel, sidecar, errors);
  if (nextRoute === "control-loop" && stringValue(sidecar.confirmation_status) !== "confirmed") {
    errors.push(`${rel}: 路由进入 control-loop 要求 confirmation_status=confirmed`);
  }
  if (routeState === "control-loop" && stringValue(sidecar.confirmation_status) !== "confirmed") {
    errors.push(`${rel}: control-loop 要求 confirmation_status=confirmed`);
  }
  const generatedAt = stringValue(sidecar.generated_at);
  if (!generatedAt || Number.isNaN(Date.parse(generatedAt)) || !generatedAt.includes("T")) {
    errors.push(`${rel}: generated_at 必须是 ISO-8601 字符串`);
  }
}

function validateSidecarTraceGroups(
  sidecarsByTask: Map<string, Record<string, unknown>[]>,
  errors: string[],
): void {
  for (const [taskSlug, sidecars] of sidecarsByTask) {
    const prefix = `.alpha-goal/${taskSlug}/schema`;
    const confirmedAlpha = sidecars.filter(isConfirmedAlphaGoalSidecar);
    const finalVerdicts = sidecars.filter(isFinalVerificationSidecar);
    const reachesMutation = sidecars.some(
      (sidecar) => sidecar.route_state === "control-loop" || sidecar.next_route === "control-loop",
    );
    const referenceIds = new Set(
      sidecars.map((sidecar) => stringValue(sidecar.reference_id)).filter(Boolean),
    );
    if (reachesMutation && sidecars.some((sidecar) => !stringValue(sidecar.reference_id))) {
      errors.push(`${prefix}: 到达行动或最终路由的运行态 schema sidecar 必须共享一个有意义的 reference_id`);
    }
    if (reachesMutation && referenceIds.size > 1) {
      errors.push(`${prefix}: 运行态 schema sidecar 必须共享同一个 reference_id`);
    }

    for (const sidecar of sidecars) {
      const routeState = stringValue(sidecar.route_state);
      const priorRoute = nullableStringValue(sidecar.prior_route);
      const nextRoute = stringValue(sidecar.next_route);

      if (
        (routeState === "control-loop" || nextRoute === "control-loop") &&
        !isConfirmedAlphaGoalSidecar(sidecar)
      ) {
        const contractSupport = support(sidecar, confirmedAlpha, ["reference_id"]);
        if (contractSupport === "late") {
          errors.push(`${prefix}: 已确认 alpha-goal schema sidecar 不得晚于 control-loop 路由`);
        } else if (contractSupport !== "ok") {
          errors.push(`${prefix}: control-loop 需要先前已确认的 alpha-goal schema sidecar`);
        }
      }

      if (nextRoute === "final") {
        if (!priorRoute) {
          errors.push(`${prefix}: 最终路由需要明确 prior_route，不能由单个 verification-verdict 自行闭合`);
        }
        const contractSupport = support(sidecar, confirmedAlpha, ["reference_id"]);
        if (contractSupport === "late") {
          errors.push(`${prefix}: 已确认 alpha-goal schema sidecar 不得晚于最终路由`);
        } else if (contractSupport !== "ok") {
          errors.push(`${prefix}: 最终路由需要先前已确认的 alpha-goal schema sidecar`);
        }
        if (!isFinalVerificationSidecar(sidecar)) {
          const verifierSupport = support(sidecar, finalVerdicts, ["reference_id", "claim_boundary"]);
          if (verifierSupport === "late") {
            errors.push(`${prefix}: verification-verdict schema sidecar 不得晚于最终路由`);
          } else if (verifierSupport !== "ok") {
            errors.push(`${prefix}: 最终路由需要带 PASS_TO_FINAL 或 NARROW_CLAIM_AND_FINAL 的 verification-verdict schema sidecar`);
          }
        }
      }

      if (!priorRoute || priorRoute === "alpha-goal" || !routeState) {
        continue;
      }
      const incoming = sidecars.filter(
        (candidate) => candidate.route_state === priorRoute && candidate.next_route === routeState,
      );
      if (incoming.length === 0) {
        errors.push(`${prefix}: 没有先前 schema sidecar 连接 ${priorRoute} -> ${routeState}`);
        continue;
      }
      const compatible = incoming.filter((candidate) => anchorsCompatible(sidecar, candidate));
      if (compatible.length === 0) {
        errors.push(`${prefix}: 前置 schema sidecar 记录必须共享 reference_id 或 claim_boundary`);
      } else if (!hasPriorOrSameTime(sidecar, compatible)) {
        errors.push(`${prefix}: 前置 schema sidecar 记录不得晚于当前路由`);
      }
    }
  }
}

function readJsonObject(file: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function validateAlphaGoalContractFields(
  rel: string,
  sidecar: Record<string, unknown>,
  errors: string[],
): void {
  if (sidecar.artifact_kind !== "alpha-goal") {
    return;
  }
  const missing = ALPHA_GOAL_CONTRACT_KEYS.filter((key) => !stringValue(sidecar[key]));
  if (missing.length > 0) {
    errors.push(`${rel}: alpha-goal 缺少目标契约字段 ${missing.join(", ")}`);
  }
}

function hasAlphaGoalContractFields(sidecar: Record<string, unknown>): boolean {
  return ALPHA_GOAL_CONTRACT_KEYS.every((key) => Boolean(stringValue(sidecar[key])));
}

function isConfirmedAlphaGoalSidecar(sidecar: Record<string, unknown>): boolean {
  return (
    sidecar.artifact_kind === "alpha-goal" &&
    sidecar.route_state === "alpha-goal" &&
    sidecar.next_route === "control-loop" &&
    sidecar.stage_decision === "CONTRACT_CONFIRMED" &&
    sidecar.confirmation_status === "confirmed" &&
    Boolean(stringValue(sidecar.reference_id)) &&
    hasAlphaGoalContractFields(sidecar)
  );
}

function isFinalVerificationSidecar(sidecar: Record<string, unknown>): boolean {
  return (
    sidecar.artifact_kind === "verification-verdict" &&
    sidecar.route_state === "evidence-verify" &&
    sidecar.next_route === "final" &&
    (sidecar.stage_decision === "PASS_TO_FINAL" ||
      sidecar.stage_decision === "NARROW_CLAIM_AND_FINAL") &&
    (Boolean(stringValue(sidecar.reference_id)) || Boolean(stringValue(sidecar.claim_boundary)))
  );
}

function support(
  sidecar: Record<string, unknown>,
  candidates: Record<string, unknown>[],
  anchorKeys: string[],
): "ok" | "missing" | "late" {
  const anchorKey = anchorKeys.find((key) => stringValue(sidecar[key]));
  if (!anchorKey) {
    return "missing";
  }
  const anchorValue = stringValue(sidecar[anchorKey]);
  const matching = candidates.filter((candidate) => stringValue(candidate[anchorKey]) === anchorValue);
  if (matching.length === 0) {
    return "missing";
  }
  return hasPriorOrSameTime(sidecar, matching) ? "ok" : "late";
}

function anchorsCompatible(
  sidecar: Record<string, unknown>,
  candidate: Record<string, unknown>,
): boolean {
  const referenceId = stringValue(sidecar.reference_id);
  if (referenceId) {
    return stringValue(candidate.reference_id) === referenceId;
  }
  const claimBoundary = stringValue(sidecar.claim_boundary);
  return Boolean(claimBoundary && stringValue(candidate.claim_boundary) === claimBoundary);
}

function hasPriorOrSameTime(
  sidecar: Record<string, unknown>,
  candidates: Record<string, unknown>[],
): boolean {
  const sidecarTime = generatedAtMillis(sidecar);
  return candidates.some((candidate) => {
    const candidateTime = generatedAtMillis(candidate);
    return sidecarTime === undefined || candidateTime === undefined || candidateTime <= sidecarTime;
  });
}

function generatedAtMillis(sidecar: Record<string, unknown>): number | undefined {
  const generatedAt = stringValue(sidecar.generated_at);
  if (!generatedAt) {
    return undefined;
  }
  const millis = Date.parse(generatedAt);
  return Number.isNaN(millis) ? undefined : millis;
}

function validateInstallSurface(root: string, errors: string[], warnings: string[]): void {
  const errorCountBeforeInstallChecks = errors.length;
  runReadOnlyCheck(root, errors, "安装脚本语法", "bash", ["-n", "scripts/install.sh"]);
  runReadOnlyCheck(root, errors, "配置模板 TOML 解析", "python3", [
    "-c",
    "import pathlib,tomllib; tomllib.loads(pathlib.Path('templates/config.toml').read_text())",
  ]);

  if (process.env.ALPHA_GOAL_SKIP_INSTALL_SMOKE === "1" || errors.length > errorCountBeforeInstallChecks) {
    return;
  }
  if (errorCountBeforeInstallChecks > 0) {
    return;
  }
  const tmpCodexHome = fs.mkdtempSync(path.join(os.tmpdir(), "alpha-goal-install-"));
  try {
    const result = spawnSync("bash", ["scripts/install.sh", "--codex-home", tmpCodexHome], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ALPHA_GOAL_SKIP_INSTALL_SMOKE: "1" },
      timeout: 120_000,
    });
    if (result.error) {
      errors.push(`安装冒烟测试: ${result.error.message}`);
    } else if (result.status !== 0) {
      const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
      errors.push(`安装冒烟测试失败${output ? `: ${output}` : ""}`);
    }
    const installed = path.join(tmpCodexHome, "skills", "alpha-goal");
    if (!isSymlink(installed)) {
      errors.push(`安装冒烟测试: ${installed} 不是软链接`);
    }
    for (const skillName of REQUIRED_SKILLS) {
      if (!isFile(path.join(installed, skillName, "SKILL.md"))) {
        errors.push(`安装冒烟测试: 缺少 ${skillName}/SKILL.md`);
      }
    }
    if (!isFile(path.join(tmpCodexHome, "AGENTS.md"))) {
      errors.push("安装冒烟测试: 默认安装必须创建 AGENTS.md");
    }
    if (!isFile(path.join(tmpCodexHome, "config.toml"))) {
      errors.push("安装冒烟测试: 默认安装必须创建 config.toml");
    }
    const forceResult = spawnSync("bash", ["scripts/install.sh", "--codex-home", tmpCodexHome, "--force"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ALPHA_GOAL_SKIP_INSTALL_SMOKE: "1" },
      timeout: 120_000,
    });
    if (forceResult.error) {
      errors.push(`安装 --force 冒烟测试: ${forceResult.error.message}`);
    } else if (forceResult.status !== 0) {
      const output = [forceResult.stderr, forceResult.stdout].filter(Boolean).join("\n").trim();
      errors.push(`安装 --force 冒烟测试失败${output ? `: ${output}` : ""}`);
    }
  } finally {
    fs.rmSync(tmpCodexHome, { recursive: true, force: true });
  }

  const tmpNoSyncCodexHome = fs.mkdtempSync(path.join(os.tmpdir(), "alpha-goal-install-nosync-"));
  try {
    const result = spawnSync(
      "bash",
      ["scripts/install.sh", "--codex-home", tmpNoSyncCodexHome, "--no-sync-user-templates"],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, ALPHA_GOAL_SKIP_INSTALL_SMOKE: "1" },
        timeout: 120_000,
      },
    );
    if (result.error) {
      errors.push(`安装 --no-sync-user-templates 冒烟测试: ${result.error.message}`);
    } else if (result.status !== 0) {
      const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
      errors.push(`安装 --no-sync-user-templates 冒烟测试失败${output ? `: ${output}` : ""}`);
    }
    if (isFile(path.join(tmpNoSyncCodexHome, "AGENTS.md")) || isFile(path.join(tmpNoSyncCodexHome, "config.toml"))) {
      errors.push("安装 --no-sync-user-templates 冒烟测试: 不应创建用户模板文件");
    }
  } finally {
    fs.rmSync(tmpNoSyncCodexHome, { recursive: true, force: true });
  }

  if (warnings.length > 0) {
    // 保留 warnings 参数，便于以后扩展非阻塞检查。
  }
}

function parseFrontmatter(text: string): Frontmatter {
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error("缺少 YAML frontmatter");
  }
  const data: Frontmatter = {};
  for (const [offset, line] of match[1].split(/\r?\n/).entries()) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith("#")) {
      continue;
    }
    const field = line.match(FIELD_RE);
    if (!field) {
      throw new Error(`第 ${offset + 2} 行：frontmatter 语法无效`);
    }
    const [, key, raw] = field;
    if (key !== "name" && key !== "description") {
      throw new Error(`第 ${offset + 2} 行：不支持 frontmatter key ${key}`);
    }
    const value = raw.trim();
    const quoted =
      value.length >= 2 &&
      value[0] === value[value.length - 1] &&
      (value[0] === "'" || value[0] === '"');
    data[key] = quoted ? value.slice(1, -1) : value;
  }
  return data;
}

function runReadOnlyCheck(
  root: string,
  errors: string[],
  label: string,
  command: string,
  args: string[],
): void {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.error) {
    errors.push(`${label}: ${result.error.message}`);
  } else if (result.status !== 0) {
    const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    errors.push(`${label}: 命令失败${output ? `: ${output}` : ""}`);
  }
}

function stageDecisionMatchesRoute(stageDecision: string, nextRoute: string): boolean {
  switch (stageDecision) {
    case "ROUTE_TO_ALPHA_GOAL":
    case "RETURN_TO_ALPHA_GOAL":
    case "REFRAME":
      return ["alpha-goal", "system-model", "user"].includes(nextRoute);
    case "ROUTE_TO_SYSTEM_MODEL":
    case "RETURN_TO_SYSTEM_MODEL":
      return nextRoute === "system-model";
    case "ROUTE_TO_EVIDENCE_VERIFY":
    case "ITERATION_READY_FOR_VERIFY":
      return nextRoute === "evidence-verify";
    case "ROUTE_TO_USER":
      return nextRoute === "user";
    case "CONTRACT_CONFIRMED":
    case "ITERATION_CONTINUES":
    case "ITERATION_HARDEN":
    case "NEXT_ITERATION":
      return nextRoute === "control-loop";
    case "PASS_TO_FINAL":
    case "NARROW_CLAIM_AND_FINAL":
    case "CONFORMANCE_PASS":
      return nextRoute === "final";
    case "CONFORMANCE_FAIL":
      return ["control-loop", "alpha-goal", "system-model", "blocker"].includes(nextRoute);
    case "BLOCKED":
      return nextRoute === "blocker";
    default:
      return false;
  }
}

function sidecarFilenameMatchesKind(kind: string, filename: string): boolean {
  switch (kind) {
    case "alpha-goal":
      return filename === "alpha-goal.json";
    case "system-model":
      return filename === "system-model.json";
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

function artifactPathMatchesKind(kind: string, taskSlug: string, artifactPath: string): boolean {
  const root = `.alpha-goal/${taskSlug}/`;
  switch (kind) {
    case "alpha-goal":
      return artifactPath === `${root}alpha-goal.md`;
    case "system-model":
      return artifactPath === `${root}system-model.md`;
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

function isRouteToken(value: string): boolean {
  return value === "START" || SIDECAR_ROUTE_STATES.includes(value);
}

function canTransition(from: string, to: string): boolean {
  return (ROUTE_TRANSITIONS[from] ?? []).includes(to);
}

function textFiles(root: string): string[] {
  return walk(root)
    .filter((file) => {
      if (!isFile(file)) {
        return false;
      }
      const rel = relative(root, file);
      if (rel.startsWith(".git/") || rel.startsWith(".worktrees/") || rel.startsWith("node_modules/")) {
        return false;
      }
      return /\.(md|yaml|yml|json|toml|ts|sh)$/.test(rel);
    })
    .map((file) => relative(root, file))
    .sort();
}

function walk(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }
  const result: string[] = [];
  const stack = [root];
  const skipped = new Set([".git", ".worktrees", "node_modules", "dist", "build", ".venv", "__pycache__"]);
  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    if (!isDirectory(current)) {
      continue;
    }
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && skipped.has(entry.name)) {
        continue;
      }
      stack.push(path.join(current, entry.name));
    }
  }
  return result;
}

function childDirectories(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function between(text: string, start: string, end: string): string | undefined {
  const startIndex = text.indexOf(start);
  if (startIndex < 0) {
    return undefined;
  }
  const bodyStart = startIndex + start.length;
  const endIndex = text.indexOf(end, bodyStart);
  if (endIndex < 0) {
    return undefined;
  }
  return text.slice(bodyStart, endIndex);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableStringValue(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return undefined;
}

function isFile(file: string): boolean {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function isDirectory(dir: string): boolean {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

function isSymlink(file: string): boolean {
  return fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink();
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

function printReport(root: string, errors: string[], warnings: string[]): void {
  console.log("技能套件校验");
  console.log(`根目录: ${root}`);
  if (warnings.length > 0) {
    console.log("\n警告:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
  if (errors.length > 0) {
    console.error("\n错误:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
  } else {
    console.log("通过: 所有检查通过");
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  process.exit(main());
}
