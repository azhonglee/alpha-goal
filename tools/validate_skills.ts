#!/usr/bin/env -S npx --yes tsx
// 本地 Agent Skills 套件的轻量校验。

import fs from "node:fs";
import os from "node:os";
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

const MISLEADING_SEMANTIC_CONTRACTION_TERMS = ["最小语义", "收窄草案", "收窄声明"];

const GOAL_CONTRACT_FORBIDDEN_AMBIGUITY_TERMS = [
  "low / medium / high",
  "`low`",
  "`medium`",
  "`high`",
  "quick",
  "standard",
  "deep",
  "配置档位:",
  "最终模糊度",
  "<= 0.30",
  "<= 0.20",
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
const SIDECAR_REQUIRED_KEY_SET = new Set(SIDECAR_REQUIRED_KEYS);

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
const RUNTIME_SIDECAR_FIXTURE_DIR = "tools/fixtures/runtime-sidecars";
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

const SIDECAR_STAGE_POLICIES: Record<
  string,
  { routeState: string; stageDecisions: string[] }
> = {
  "decision-synthesis": {
    routeState: "decision-synthesis",
    stageDecisions: [
      "ROUTE_TO_GOAL_CONTRACT",
      "ROUTE_TO_SYSTEM_MODEL",
      "ROUTE_TO_EVIDENCE_VERIFY",
      "ROUTE_TO_USER",
      "BLOCKED",
    ],
  },
  "system-model": {
    routeState: "system-model",
    stageDecisions: [
      "ROUTE_TO_GOAL_CONTRACT",
      "ROUTE_TO_EVIDENCE_VERIFY",
      "REFRAME",
      "BLOCKED",
    ],
  },
  "goal-contract": {
    routeState: "goal-contract",
    stageDecisions: ["ROUTE_TO_USER", "CONTRACT_APPROVED", "CONTRACT_REFRAME", "BLOCKED"],
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

const RUNTIME_SIDECAR_NEGATIVE_CASES: Array<[string, string]> = [
  [
    "control-loop-without-approved-contract",
    "control-loop 运行态 schema sidecar 需要已批准的 goal-contract schema sidecar",
  ],
  [
    "final-without-verification",
    "最终路由需要带 PASS_TO_FINAL 或 NARROW_CLAIM_AND_FINAL 的 verification-verdict schema sidecar",
  ],
  ["broken-incoming-edge", "没有先前 schema sidecar 连接 decision-synthesis -> system-model"],
  ["divergent-reference-id", "运行态 schema sidecar 必须共享同一个 reference_id"],
  ["missing-artifact-path", "schema sidecar 缺少必填键 \"artifact_path\""],
  ["missing-reference-id", "到达行动或最终路由的运行态 schema sidecar 必须共享一个有意义的 reference_id"],
  ["stage-decision-policy", "goal-contract schema sidecar stage_decision 必须是下列值之一"],
  [
    "synthesis-control-loop-without-contract",
    "next transition 无效 decision-synthesis -> control-loop",
  ],
  [
    "final-with-nonpassing-verdict",
    "最终路由需要带 PASS_TO_FINAL 或 NARROW_CLAIM_AND_FINAL 的 verification-verdict schema sidecar",
  ],
  [
    "late-approved-contract",
    "已批准的 goal-contract schema sidecar 不得晚于 control-loop 路由",
  ],
  [
    "system-model-control-loop-without-contract",
    "next transition 无效 system-model -> control-loop",
  ],
  [
    "late-final-verdict",
    "最终 verification-verdict schema sidecar 不得晚于最终路由",
  ],
  [
    "late-incoming-edge",
    "前置 schema sidecar 记录不得晚于当前路由",
  ],
  [
    "claim-boundary-mismatch",
    "前置 schema sidecar 记录必须共享 reference_id 或 claim_boundary",
  ],
];

const RUNTIME_SIDECAR_VALID_CASES = [
  "full-trace",
  "no-mutation-evidence-verify",
];

const ROUTE_TRANSITIONS: Record<string, string[]> = {
  START: ["alpha-goal"],
  "alpha-goal": [
    "decision-synthesis",
    "system-model",
    "goal-contract",
    "evidence-verify",
    "user",
    "blocker",
  ],
  "decision-synthesis": [
    "goal-contract",
    "system-model",
    "evidence-verify",
    "user",
    "blocker",
  ],
  "system-model": [
    "goal-contract",
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

type StructuredBlockTest = {
  name: string;
  path: string;
  anchor: string;
  required_terms: string[];
  block_scope?: "first-code-fence" | "section";
  forbidden_terms?: string[];
};

const SEMANTIC_SMOKE_TESTS: Array<[string, string, string[]]> = [
  [
    "模糊需求可以形成有边界的目标契约",
    "skills/goal-contract/SKILL.md",
    [
      "目标契约",
      "参考状态",
      "验收证据",
      "声明边界",
      "决策边界",
      "指标转译",
      "量化模糊度闸门",
      "模糊度必须 `<= 0.15`",
      "分值依据",
      "不使用定性等级",
      "不选择配置档位",
      "候选解释",
      "语义清晰度",
      "唯一的产品 / 工程语义",
      "实现范围、接口或数据来源",
      "误当成用户真正诉求",
      "完整语义候选",
      "选定语义",
      "未选解释",
      "用户裁决依据",
      "待用户确认的候选",
      "不得把执行切片的最小范围当成目标语义",
      "不得把任一候选解释写成选定语义",
      "目标契约默认是草案",
      "待用户确认",
      "stage_decision: ROUTE_TO_USER",
      "authorization_status: pending",
      "stage_decision: CONTRACT_APPROVED",
      "authorization_status: approved",
      ".alpha-goal/YYYYMMDD-<slug>/goal-contract.md",
      ".alpha-goal/YYYYMMDD-<slug>/control-state.md",
      "契约摘要",
      "| 字段 | 内容 |",
      "产物路径",
    ],
  ],
  [
    "不清晰的系统边界会先进入控制建模",
    "skills/system-model/SKILL.md",
    [
      "系统边界",
      "可观测性",
      "可控性",
      "候选控制律",
      "控制器层级",
      "完整语义候选",
      "待确认取舍",
      "目标契约需要固化的语义",
      "不得把目标语义压缩成最小版本",
      "无实质项",
      "扰动记录",
      "无实质项",
      ".alpha-goal/YYYYMMDD-<slug>/system-model.md",
      ".alpha-goal/YYYYMMDD-<slug>/control-state.md",
      "模型摘要",
      "| 字段 | 内容 |",
    ],
  ],
  [
    "执行反馈需要控制律和台账状态",
    "skills/control-loop/SKILL.md",
    [
      "执行检查",
      "默认使用中文标题",
      "明确要求其他语言",
      "问题",
      "本轮动作",
      "验收证据",
      "持久化控制律",
      "默认不要在 TUI 打印原始 `控制律:` 块",
      "用户要求",
      "持久化受阻",
      "高风险",
      "目标误差",
      "控制变量",
      "传感器阈值",
      "失败处理",
      "完整目标语义",
      "不能裁剪契约语义",
      "在完整目标语义下",
      "用户意图解释",
      "产品 / 工程语义",
      "不要任选一种开始实现",
      "当前字段 / 接口能承载的子集",
      "实现语义",
      "最新控制路由",
      "自适应学习记录",
      ".alpha-goal/YYYYMMDD-<slug>/iterations",
      ".alpha-goal/YYYYMMDD-<slug>/evidence",
      "迭代摘要",
      "| 字段 | 内容 |",
      "台账更新",
    ],
  ],
  [
    "证据不足时路由到下一轮而不是最终声明",
    "skills/evidence-verify/SKILL.md",
    [
      "证据覆盖",
      "NEXT_ITERATION",
      "NARROW_CLAIM_AND_FINAL",
      ".alpha-goal/YYYYMMDD-<slug>/verification-verdict.md",
      "验证摘要",
      "| 字段 | 内容 |",
      "允许的最终声明",
    ],
  ],
  [
    "多方复杂冲突使用人机综合轮次",
    "skills/decision-synthesis/SKILL.md",
    [
      "综合轮次",
      "指标转译",
      "定性判断",
      "定量信号",
      "综合研判工作台",
      "用户自有决策",
      ".alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md",
      "综合摘要",
      "| 字段 | 内容 |",
      "路由",
    ],
  ],
  [
    "路由器保留闭环状态和扰动处理",
    "skills/alpha-goal/SKILL.md",
    [
      "闭环台账",
      ".alpha-goal/YYYYMMDD-<slug>/control-state.md",
      "最新控制路由",
      "路由摘要",
      "| 字段 | 内容 |",
      "TUI",
      "控制律",
      "指标转译",
      "自适应学习",
      "控制器层级",
      "扰动记录",
      "误差信号",
      "选定技能",
      "多种合理解释",
      "用户真正要解决的问题",
      "当前接口最容易支持的一种",
      "目标契约已被用户明确接受",
      "下一路由必须是 `user`",
      "不得收缩目标语义",
    ],
  ],
  [
    "声明边界防止最终声明过宽",
    "skills/evidence-verify/SKILL.md",
    [
      "声明边界",
      "证据能支持的最高边界",
      "缺口",
      "允许的最终声明",
    ],
  ],
  [
    "闭环台账记录跨阶段控制记忆",
    "skills/alpha-goal/references/closed-loop-ledger.md",
    [
      "默认行为",
      ".alpha-goal/",
      ".gitignore",
      "流程产物初始化变更",
      ".alpha-goal/YYYYMMDD-<slug>/",
      "最新控制路由",
      "产物登记",
      "路由摘要",
      "| 字段 | 内容 |",
      "事实来源",
      ".alpha-goal/YYYYMMDD-<slug>/goal-contract.md",
      ".alpha-goal/YYYYMMDD-<slug>/system-model.md",
      ".alpha-goal/YYYYMMDD-<slug>/decision-synthesis.md",
      ".alpha-goal/YYYYMMDD-<slug>/iterations",
      ".alpha-goal/YYYYMMDD-<slug>/evidence",
      ".alpha-goal/YYYYMMDD-<slug>/verification-verdict.md",
      "参考状态",
      "当前状态",
      "最近误差信号",
      "控制律",
      "传感器反馈",
      "路由决策",
      "下一状态",
      "自适应学习",
      "执行检查",
      "默认使用带中文标题",
      "不展示多语言模板",
      "原始内部控制律块",
    ],
  ],
  [
    "任务级产物布局明确且完整",
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
    "控制论一致性可由机器检查",
    "skills/alpha-goal/references/cybernetic-conformance.md",
    [
      "状态转移",
      "schema sidecar",
      "旧产物路径",
      "行动前必须有参考状态",
      "声明前必须有传感器",
      "最终结论前必须有比较器",
      "decision-synthesis -> goal-contract",
      "\"artifact_kind\"",
      "\"stage_decision\"",
      "\"authorization_status\"",
      "阶段专用必填键",
    ],
  ],
  [
    "扰动记录包含稳健的监控与约束字段",
    "skills/system-model/references/disturbance-register.md",
    [
      "可能性",
      "影响",
      "传感器",
      "控制措施",
      "路由触发条件",
      "无实质项",
    ],
  ],
  [
    "综合轮次整合判断、证据、指标和决策",
    "skills/decision-synthesis/references/synthesis-round.md",
    [
      "人类 / 专家判断",
      "机器证据与模型",
      "定量指标",
      "冲突或矛盾",
      "用户自有决策",
      "下一个待验证假设",
      "指标转译候选",
    ],
  ],
  [
    "指标转译把定性目标变成证据信号",
    "skills/goal-contract/references/indicator-handoff.md",
    [
      "操作化定义",
      "传感器 / 证据来源",
      "测量时机或频率",
      "阈值 / 容差",
      "证据边界",
      "路由触发条件",
    ],
  ],
  [
    "控制器层级把局部控制器映射到全局目标",
    "skills/system-model/references/controller-hierarchy.md",
    [
      "全局控制器",
      "局部控制器",
      "耦合变量",
      "仲裁规则",
      "升级触发条件",
      "推荐协同路由",
      "无实质项",
    ],
  ],
  [
    "自适应学习记录可复用的控制修正",
    "skills/control-loop/references/adaptive-learning.md",
    [
      "学习触发条件",
      "已观察偏差",
      "调整",
      "复用条件",
      "失效条件",
      "台账更新",
    ],
  ],
  [
    "控制律捕获动态与稳定性保护",
    "skills/control-loop/references/control-law.md",
    [
      "内部结构",
      "界面展示",
      "执行检查",
      "内部产物格式",
      "schema sidecar 是机器可读的摘要与索引",
      "内部产物示例",
      "不是默认 TUI 展示",
      "只有用户要求",
      "持久化受阻",
      "高风险",
      "反馈延迟",
      "信号噪声",
      "置信度",
      "阻尼 / 防振荡",
      "饱和条件 / 约束边界",
    ],
  ],
  [
    "系统模型传递动态控制律字段",
    "skills/system-model/references/control-model-schema.md",
    [
      "反馈延迟",
      "信号噪声",
      "置信度",
      "阻尼 / 防振荡",
      "饱和条件 / 约束边界",
      "完整语义候选",
      "待确认取舍",
      "目标契约需要固化的语义",
    ],
  ],
  [
    "控制循环保留动态控制律字段",
    "skills/control-loop/SKILL.md",
    [
      "执行检查",
      "默认使用中文标题",
      "明确要求其他语言",
      "问题",
      "本轮动作",
      "主要风险",
      "持久化控制律",
      "默认不要在 TUI 打印原始 `控制律:` 块",
      "用户要求",
      "持久化受阻",
      "高风险",
      "反馈延迟",
      "信号噪声",
      "置信度",
      "阻尼 / 防振荡",
      "饱和条件 / 约束边界",
    ],
  ],
  [
    "证据验证检查动态控制律字段",
    "skills/evidence-verify/SKILL.md",
    [
      "反馈延迟",
      "信号噪声",
      "置信度",
      "阻尼 / 防振荡",
      "饱和条件 / 约束边界",
    ],
  ],
  [
    "综合研判工作台把定性判断操作化为量化收敛",
    "skills/decision-synthesis/references/meta-synthesis-hall.md",
    [
      "综合研判工作台",
      "人类角色",
      "机器角色",
      "假设库",
      "模型登记",
      "收敛条件",
      "异议",
    ],
  ],
];

const STRUCTURED_BLOCK_TESTS: StructuredBlockTest[] = [
  {
    name: "目标契约结构保留可执行交接字段",
    path: "skills/goal-contract/SKILL.md",
    anchor: "目标契约结构:",
    required_terms: [
      "- 参考状态:",
      "- 语义对齐:",
      "- 模糊度数值:",
      "- 分值依据:",
      "- 范围:",
      "- 控制模型:",
      "- 指标转译:",
      "- 验收标准:",
      "- 交接:",
      "- 台账更新:",
    ],
  },
  {
    name: "系统模型完整结构保留被控对象、传感器和控制边界",
    path: "skills/system-model/SKILL.md",
    anchor: "完整模型:",
    required_terms: [
      "- 系统边界:",
      "- 被控对象:",
      "- 传感器与证据边界:",
      "- 执行器与授权边界:",
      "- 候选控制律:",
      "- 扰动记录:",
      "- 控制器层级:",
      "- 推荐路由:",
    ],
  },
  {
    name: "迭代记录保留路由词汇",
    path: "skills/control-loop/references/iteration-record-schema.md",
    anchor: "## 结论词汇",
    required_terms: [
      "`ITERATION_CONTINUES`",
      "`ITERATION_HARDEN`",
      "`ITERATION_READY_FOR_VERIFY`",
      "`RETURN_TO_ALPHA_GOAL`",
      "`RETURN_TO_SYSTEM_MODEL`",
      "`BLOCKED`",
    ],
  },
  {
    name: "控制循环执行检查保留面向用户的表格字段",
    path: "skills/control-loop/SKILL.md",
    anchor: "TUI 执行前检查:",
    block_scope: "section",
    required_terms: [
      "执行检查",
      "| 问题 |",
      "| 本轮动作 |",
      "| 保持不变 |",
      "| 验收证据 |",
      "| 主要风险 |",
      "| 失败处理 |",
      "默认使用中文标题",
      "不同时展示多语言模板",
    ],
  },
  {
    name: "控制律 TUI 展示保留本地化表格字段",
    path: "skills/control-loop/references/control-law.md",
    anchor: "## 界面展示",
    block_scope: "section",
    required_terms: [
      "执行检查",
      "| 问题 |",
      "| 本轮动作 |",
      "| 保持不变 |",
      "| 验收证据 |",
      "| 主要风险 |",
      "| 失败处理 |",
      "| 问题 | 目标误差 |",
      "| 本轮动作 | 控制变量、控制动作或探测 |",
      "| 主要风险 | 信号噪声、阻尼 / 防振荡、饱和条件 / 约束边界，或最强实质风险 |",
      "| 失败处理 | 失败处理、停止或重新界定触发条件 |",
    ],
  },
  {
    name: "控制律内部结构区分 schema sidecar 和聊天展示",
    path: "skills/control-loop/references/control-law.md",
    anchor: "## 内部结构",
    block_scope: "section",
    required_terms: [
      "内部产物格式",
      "不是默认 TUI 展示格式",
      "schema sidecar 是机器可读的摘要与索引",
      "不要把 schema sidecar 当成完整控制律",
    ],
  },
  {
    name: "控制律内部示例不是默认 TUI",
    path: "skills/control-loop/references/control-law.md",
    anchor: "## 内部产物示例",
    block_scope: "section",
    required_terms: [
      "持久化产物",
      "不是默认 TUI 展示",
      "不要把它作为默认执行前展示",
      "控制律:",
    ],
  },
  {
    name: "验证结论保留最终比较器词汇",
    path: "skills/evidence-verify/references/verification-verdict-schema.md",
    anchor: "## 结论",
    required_terms: [
      "`PASS_TO_FINAL`",
      "`NARROW_CLAIM_AND_FINAL`",
      "`NEXT_ITERATION`",
      "`REFRAME`",
      "`BLOCKED`",
    ],
  },
  {
    name: "决策综合路由规则保留变更闸门",
    path: "skills/decision-synthesis/SKILL.md",
    anchor: "### 7. 路由",
    required_terms: [
      "路由到 `goal-contract`",
      "路由到 `system-model`",
      "路由到用户",
      "路由到 `evidence-verify`",
      "不能直接路由到 `control-loop`",
    ],
  },
];

const DEFAULT_TUI_PROJECTION_GUARDS = [
  {
    name: "路由摘要 TUI",
    path: "skills/alpha-goal/SKILL.md",
    anchor: "随后只展示适合 TUI 阅读的 Markdown 表格摘要：",
    end_anchor: "摘要应让用户",
    required_template_terms: [
      "路由摘要",
      "| 字段 | 内容 |",
      "| 路由 |",
      "| 下一步 |",
    ],
  },
  {
    name: "目标契约摘要 TUI",
    path: "skills/goal-contract/SKILL.md",
    anchor: "TUI 摘要:",
    end_anchor: "默认持久化路径:",
    required_template_terms: [
      "契约摘要",
      "| 字段 | 内容 |",
      "| 参考 |",
      "| 语义状态 |",
      "| 范围边界 |",
      "| 证据 |",
      "| 产物 |",
      "| 下一步 |",
    ],
  },
  {
    name: "系统模型摘要 TUI",
    path: "skills/system-model/SKILL.md",
    anchor: "TUI 摘要:",
    end_anchor: "完整模型:",
    required_template_terms: [
      "模型摘要",
      "| 字段 | 内容 |",
      "| 边界 |",
      "| 可观测性 |",
      "| 可控性 |",
      "| 产物 |",
      "| 推荐路由 |",
    ],
  },
  {
    name: "控制循环行动前 TUI",
    path: "skills/control-loop/SKILL.md",
    anchor: "TUI 执行前检查:",
    end_anchor: "只有存在多个独立循环",
  },
  {
    name: "控制循环迭代摘要 TUI",
    path: "skills/control-loop/SKILL.md",
    anchor: "TUI 摘要:",
    end_anchor: "不要在迭代记录中作出最终完成声明",
    required_template_terms: [
      "迭代摘要",
      "| 字段 | 内容 |",
      "| 动作 |",
      "| 反馈 |",
      "| 剩余误差 |",
      "| 产物 |",
      "| 下一步 |",
    ],
  },
  {
    name: "决策综合摘要 TUI",
    path: "skills/decision-synthesis/SKILL.md",
    anchor: "TUI 摘要:",
    end_anchor: "完整产物字段:",
    required_template_terms: [
      "综合摘要",
      "| 字段 | 内容 |",
      "| 核心张力 |",
      "| 推荐方向 |",
      "| 用户决策 |",
      "| 产物 |",
      "| 下一步 |",
    ],
  },
  {
    name: "验证摘要 TUI",
    path: "skills/evidence-verify/SKILL.md",
    anchor: "TUI 摘要:",
    end_anchor: "完整版:",
    required_template_terms: [
      "验证摘要",
      "| 字段 | 内容 |",
      "| 结论 |",
      "| 声明边界 |",
      "| 证据 |",
      "| 产物 |",
      "| 下一步 |",
    ],
  },
  {
    name: "控制律 TUI 展示",
    path: "skills/control-loop/references/control-law.md",
    anchor: "## 界面展示",
    end_anchor: "## 内部结构",
  },
];

const RAW_CONTROL_LAW_FIELD_PATTERNS = [
  "control law",
  "target error",
  "control variable",
  "control action or probe",
  "variables held constant",
  "expected effect",
  "sensor",
  "threshold / tolerance",
  "feedback latency",
  "signal noise",
  "confidence",
  "damping / anti-oscillation",
  "saturation / containment",
  "feedback timing",
  "fallback action",
  "stop / reframe trigger",
  "目标误差",
  "控制变量",
  "控制动作或探测",
  "保持不变的变量",
  "预期效果",
  "传感器",
  "阈值 / 容差",
  "反馈延迟",
  "信号噪声",
  "置信度",
  "阻尼 / 防振荡",
  "饱和条件 / 约束边界",
  "反馈时机",
  "停止 / 重新界定触发条件",
];

const USER_VISIBLE_SCRIPT_OUTPUT_TERMS = [
  "Usage:",
  "Options:",
  "Missing value",
  "Unknown option",
  "Alpha Goal skillset",
  "Codex home:",
  "Validation: passed",
  "User templates:",
  "Unsupported TOML value type",
  "Skipped user template sync",
  "section(\"status --short\")",
  "section(\"diff check",
  "console.log(\"status --short:",
  "Refusing to ",
  "Re-run with --force",
];

const MULTILINGUAL_TUI_EXAMPLE_RE =
  /(?:For English conversations|For non-Chinese users|English Check|Execution Check|English version|English variant|bilingual|translation|中英|双语|英文|对照|执行检查\s*\/|\/\s*execution|\| Problem \||\| Issue \||\| Action \||\| Held constant \||\| Evidence \||\| Main risk \||\| Fallback \|)/i;

const DEFAULT_TUI_TEMPLATE_TERMS = [
  "执行检查",
  "| 字段 | 内容 |",
  "| 问题 |",
  "| 本轮动作 |",
  "| 保持不变 |",
  "| 验收证据 |",
  "| 主要风险 |",
  "| 失败处理 |",
];

const LEGACY_OUTPUT_TITLE_TERMS = [
  "Route Summary",
  "Control Route",
  "Latest Control Route",
  "Goal Contract:",
  "Goal Contract schema:",
  "Contract Summary",
  "Control Model:",
  "Model Summary",
  "Decision Synthesis Record:",
  "Synthesis Summary",
  "Iteration Summary",
  "Verification Verdict:",
  "Verification Summary",
  "Control Law:",
  "Internal Schema",
  "TUI Projection",
  "Internal Artifact Example",
  "Closed-loop Ledger:",
  "Adaptive Learning Record:",
  "Disturbance Register:",
  "Indicator Handoff:",
  "Controller Hierarchy:",
  "Synthesis Round:",
  "Debug Receipt:",
  "Coupling Map:",
  "Synthesis Map:",
  "Cybernetic Conformance Report:",
  "Meta-Synthesis Hall",
  "综合集成厅",
  "综合集成研讨厅",
  "指标交接",
  "扰动登记",
  "结构化索引",
  "结构化伴随文件",
  "影响范围上限",
  "影响范围约束",
  "饱和 / 约束边界",
  "饱和 / 影响范围约束",
  "停止 / 重构触发条件",
  "停止或重构触发条件",
  "Schema 辅助索引",
  "Schema 辅助索引路径",
  "代理可决策",
  "持久化规范",
  "绿地模糊度",
  "重新集成",
  "控制器 / actuator",
  "| Field | Value |",
];

const LEGACY_OUTPUT_TITLE_LINE_PATTERNS: Array<[string, RegExp]> = [
  ["Plan Template", /^# Plan Template$/m],
  ["Plan", /^# Plan$/m],
  ["Default path", /^Default path:$/m],
  ["Compact", /^Compact:$/m],
  ["Full", /^Full:$/m],
  ["Routing", /^Routing:$/m],
  ["Stage-specific required keys", /^Stage-specific required keys:$/m],
  ["Compact verdict", /^## Compact verdict$/m],
  ["Full verdict", /^## Full verdict$/m],
  ["Verdict", /^## Verdict$/m],
  ["Acceptance evidence matrix", /^## Acceptance evidence matrix$/m],
  ["Control law review", /^## Control law review$/m],
  ["Indicator handoff review", /^## Indicator handoff review$/m],
  ["Adaptive learning review", /^## Adaptive learning review$/m],
  ["Final claim allowed", /^## Final claim allowed$/m],
  ["Ledger schema", /^## Ledger schema$/m],
  ["Stage responsibilities", /^## Stage responsibilities$/m],
  ["Update rules", /^## Update rules$/m],
  ["Conformance report", /^## Conformance report$/m],
  ["Schema sidecar", /^## Schema sidecar$/m],
  ["Metadata", /^## Metadata$/m],
  ["Current Strategy", /^## Current Strategy$/m],
  ["Active Boundary", /^## Active Boundary$/m],
  ["Triggering Evidence", /^## Triggering Evidence$/m],
  ["Execution Slices", /^## Execution Slices$/m],
  ["Risks and Watchpoints", /^## Risks and Watchpoints$/m],
  ["Verification Route", /^## Verification Route$/m],
  ["Change Log", /^## Change Log$/m],
  ["Open Questions", /^## Open Questions$/m],
  ["Sensor quality", /^Sensor quality:/m],
  ["Control quality", /^Control quality:/m],
  ["Reason", /^Reason:$/m],
  ["Freshness", /^Freshness:$/m],
  ["Boundary crossed", /^Boundary crossed:$/m],
  ["Claim supported", /^Claim supported:$/m],
  ["Allowed actuators", /^\s*-\s*Allowed actuators:|^Allowed actuators:$/m],
  ["Forbidden actuators", /^\s*-\s*Forbidden actuators:|^Forbidden actuators:$/m],
  ["Target error", /^\s*-\s*Target error:/m],
  ["Control variable", /^\s*-\s*Control variable:/m],
  ["Control action or probe", /^\s*-\s*Control action or probe:/m],
  ["Variables held constant", /^\s*-\s*Variables held constant:/m],
  ["Expected effect", /^\s*-\s*Expected effect:/m],
  ["Sensor threshold", /^\s*-\s*Sensor threshold:/m],
  ["Feedback latency", /^\s*-\s*Feedback latency:/m],
  ["Signal noise", /^\s*-\s*Signal noise:/m],
  ["Confidence", /^\s*-\s*Confidence:/m],
  ["Fallback action", /^\s*-\s*Fallback action:/m],
  ["Stop / reframe trigger", /^\s*-\s*Stop \/ reframe trigger:/m],
  ["Next", /^Next:/m],
  ["Diff / scope review", /^\s*-\s*Diff \/ 范围复核:/m],
  ["approved context and boundary", /^\s*-\s*approved context and boundary;/m],
  ["dynamic plan and preflight", /^\s*-\s*dynamic plan and preflight;/m],
  ["fresh evidence and evidence class", /^\s*-\s*fresh evidence and evidence class;/m],
  ["feedback and disturbances", /^\s*-\s*feedback and disturbances;/m],
  ["none material", /none material/],
  ["被控对象 / plant", /被控对象 \/ plant/],
  ["Agent 可决策", /Agent 可决策/],
  ["Schema 辅助索引路径", /Schema 辅助索引路径/],
];

const FIXTURE_CONTRACT_TESTS = [
  {
    name: "复杂迁移冲突使用综合研判和指标转译",
    prompt: "多团队迁移目标、风险、窗口、成功指标冲突，先综合研判。",
    prompt_terms: ["多团队", "目标", "风险", "成功指标", "冲突", "综合研判"],
    expected_route: "goal-contract",
    expected_stage_decision: "ROUTE_TO_GOAL_CONTRACT",
    paths: [
      "skills/decision-synthesis/SKILL.md",
      "skills/decision-synthesis/references/synthesis-round.md",
    ],
    schema_blocks: ["决策综合记录:", "综合轮次:", "指标转译:"],
    route_terms: ["user", "goal-contract", "system-model", "blocker"],
  },
  {
    name: "定性目标转成可测契约证据",
    prompt: "把“用户体验更稳定”转成可验证的目标契约。",
    prompt_terms: ["用户体验", "稳定", "可验证", "目标契约"],
    expected_route: "user",
    expected_stage_decision: "ROUTE_TO_USER",
    paths: [
      "skills/goal-contract/SKILL.md",
      "skills/goal-contract/references/indicator-handoff.md",
    ],
    schema_blocks: ["目标契约:", "指标转译:"],
    route_terms: ["完整语义候选", "接受、拒绝或修改", "ROUTE_TO_USER", "authorization_status: pending", "control-loop"],
  },
  {
    name: "多控制器系统在变更前映射层级",
    prompt: "多个团队和模块都能改变同一上线目标，先建模。",
    prompt_terms: ["多个团队", "模块", "上线目标", "建模"],
    expected_route: "goal-contract",
    expected_stage_decision: "ROUTE_TO_GOAL_CONTRACT",
    paths: [
      "skills/system-model/SKILL.md",
      "skills/system-model/references/controller-hierarchy.md",
    ],
    schema_blocks: ["控制模型:", "控制器层级:"],
    route_terms: ["goal-contract", "decision-synthesis", "blocker"],
  },
  {
    name: "反馈不匹配会在下一轮前生成自适应学习",
    prompt: "上轮控制律阈值没命中，但方向有效，继续下一轮。",
    prompt_terms: ["控制律", "阈值", "没命中", "方向有效", "下一轮"],
    expected_route: "control-loop",
    expected_stage_decision: "ITERATION_HARDEN",
    paths: [
      "skills/control-loop/SKILL.md",
      "skills/control-loop/references/control-law.md",
      "skills/control-loop/references/adaptive-learning.md",
    ],
    schema_blocks: ["执行检查", "自适应学习记录:"],
    route_terms: [
      "ITERATION_CONTINUES",
      "ITERATION_HARDEN",
      "RETURN_TO_SYSTEM_MODEL",
    ],
  },
  {
    name: "验证检查已学习阈值和指标证据",
    prompt: "检查当前声明是否可以最终交付。",
    prompt_terms: ["检查", "声明", "最终交付"],
    expected_route: "final",
    expected_stage_decision: "PASS_TO_FINAL",
    paths: [
      "skills/evidence-verify/SKILL.md",
      "skills/evidence-verify/references/verification-verdict-schema.md",
    ],
    schema_blocks: [
      "验证结论:",
      "指标转译复核",
      "自适应学习复核",
    ],
    route_terms: ["PASS_TO_FINAL", "NEXT_ITERATION", "REFRAME", "BLOCKED"],
  },
];

type Frontmatter = Record<string, string>;

function parseFrontmatter(text: string): Frontmatter {
  const match = text.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error("缺少 YAML frontmatter 块");
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
      throw new Error(`第 ${lineno} 行：不支持的 frontmatter 语法`);
    }

    const [, key, rawValue] = field;
    const value = rawValue.trim();
    if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
      throw new Error(`第 ${lineno} 行：不支持的 frontmatter key ${JSON.stringify(key)}`);
    }
    if (Object.hasOwn(data, key)) {
      throw new Error(`第 ${lineno} 行：重复的 frontmatter key ${JSON.stringify(key)}`);
    }
    if (!value) {
      throw new Error(`第 ${lineno} 行：frontmatter 值为空 ${JSON.stringify(key)}`);
    }

    const quoted =
      value.length >= 2 &&
      value[0] === value[value.length - 1] &&
      (value[0] === "'" || value[0] === '"');
    if (!quoted && /:\s/.test(value)) {
      throw new Error(`第 ${lineno} 行：包含 ': ' 的 frontmatter 值必须加引号`);
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
    errors.push(`缺少 skills 目录: ${skills}`);
    printReport(root, errors, warnings);
    return 1;
  }

  for (const bad of walk(root)) {
    const basename = path.basename(bad);
    if (basename === "__MACOSX" && isDirectory(bad)) {
      errors.push(`发现 macOS 元数据目录: ${relative(root, bad)}`);
    }
    if (basename.startsWith("._") && isFile(bad)) {
      errors.push(`发现 macOS 资源分叉文件: ${relative(root, bad)}`);
    }
  }

  const skillDirs = fs
    .readdirSync(skills, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skills, entry.name))
    .sort();

  if (skillDirs.length === 0) {
    errors.push("未发现技能目录");
  }

  const discoveredSkillNames = new Set(skillDirs.map((dir) => path.basename(dir)));
  for (const name of [...REQUIRED_SKILL_NAMES].sort()) {
    if (!discoveredSkillNames.has(name)) {
      errors.push(`缺少必需技能目录: skills/${name}`);
    }
  }
  for (const name of [...discoveredSkillNames].sort()) {
    if (!REQUIRED_SKILL_NAMES.has(name)) {
      errors.push(`发现非预期技能目录: skills/${name}`);
    }
  }

  const names = new Set<string>();
  for (const dir of skillDirs) {
    const skillName = path.basename(dir);
    const md = path.join(dir, "SKILL.md");
    if (!isFile(md)) {
      errors.push(`${skillName}: 缺少 SKILL.md`);
      continue;
    }

    const text = fs.readFileSync(md, "utf8");
    let frontmatter: Frontmatter;
    try {
      frontmatter = parseFrontmatter(text);
    } catch (error) {
      errors.push(`${skillName}: SKILL.md frontmatter 无效: ${errorMessage(error)}`);
      continue;
    }

    const name = frontmatter.name;
    const desc = frontmatter.description;
    if (!name) {
      errors.push(`${skillName}: SKILL.md frontmatter 缺少 name`);
    }
    if (!desc) {
      errors.push(`${skillName}: SKILL.md frontmatter 缺少 description`);
    }
    if (name && name !== skillName) {
      errors.push(`${skillName}: frontmatter name ${JSON.stringify(name)} 与目录名不匹配`);
    }
    if (name && names.has(name)) {
      errors.push(`技能名重复: ${name}`);
    }
    if (name) {
      names.add(name);
    }
    if (desc && desc.length > 500) {
      warnings.push(
        `${skillName}: description 较长（${desc.length} 字符）；隐式路由可能截断`,
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
        errors.push(`${skillName}: reference 未能从 SKILL.md 发现: ${relRef}`);
      }
    }
  }

  validateTypeScriptScriptSurface(root, errors, warnings);
  validateInstallSurface(root, errors);
  validateRuntimeArtifactIgnores(root, errors);
  validateLegacyScriptReferences(root, errors);
  validateLegacySkillReferences(root, errors);
  validateLegacyArtifactPathReferences(root, errors);
  validateMisleadingSemanticContractions(root, errors);
  validateGoalContractAmbiguityGate(root, errors);
  validateTaskScopedArtifactPathShape(root, errors);
  validateSchemaSidecarContract(root, errors);
  validateSchemaSidecarFixtures(root, errors);
  validateRuntimeSidecarFixtureSets(root, errors);
  validateRuntimeSchemaSidecars(root, errors);
  validateCyberneticRouteConsistency(root, errors);
  validateSemanticSmokeTests(root, errors);
  validateStructuredBlockTests(root, errors);
  validateChineseOutputTitles(root, errors);
  validateUserVisibleScriptOutput(root, errors);
  validateDefaultTuiProjectionGuards(root, errors);
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
      errors.push(`脚本入口必须只使用 TypeScript: ${rel}`);
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    if (text.startsWith("#!")) {
      const mode = fs.statSync(file).mode;
      if ((mode & 0o100) === 0) {
        warnings.push(`${rel} 带有 shebang 但不可由用户直接执行`);
      }
    }
  }
}

function validateInstallSurface(root: string, errors: string[]): void {
  const installScript = path.join(root, "scripts/install.sh");
  if (!isFile(installScript)) {
    errors.push("缺少安装脚本: scripts/install.sh");
  } else {
    runReadOnlyCheck(root, errors, "安装脚本语法", "bash", ["-n", "scripts/install.sh"]);
  }

  const configTemplate = path.join(root, "templates/config.toml");
  if (!isFile(configTemplate)) {
    errors.push("缺少配置模板: templates/config.toml");
  } else {
    runReadOnlyCheck(root, errors, "配置模板 TOML 解析", "python3", [
      "-c",
      "import pathlib,tomllib; tomllib.loads(pathlib.Path('templates/config.toml').read_text())",
    ]);
  }

  validateInstallSmoke(root, errors);
}

function validateInstallSmoke(root: string, errors: string[]): void {
  if (process.env.ALPHA_GOAL_SKIP_INSTALL_SMOKE === "1") {
    return;
  }

  const tmpCodexHome = fs.mkdtempSync(path.join(os.tmpdir(), "alpha-goal-install-"));
  try {
    const result = spawnSync("bash", ["scripts/install.sh", "--codex-home", tmpCodexHome], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        ALPHA_GOAL_SKIP_INSTALL_SMOKE: "1",
      },
      timeout: 120_000,
    });

    if (result.error) {
      errors.push(`安装冒烟测试: 执行 scripts/install.sh 失败: ${result.error.message}`);
      return;
    }
    if (result.status !== 0) {
      const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
      errors.push(`安装冒烟测试: 命令失败${output ? `: ${output}` : ""}`);
      return;
    }

    const installed = path.join(tmpCodexHome, "skills", "alpha-goal");
    if (!isSymlink(installed)) {
      errors.push(`安装冒烟测试: 已安装的 alpha-goal 不是软链接: ${installed}`);
      return;
    }

    const target = fs.realpathSync(installed);
    const expectedTarget = fs.realpathSync(path.join(root, "skills"));
    if (target !== expectedTarget) {
      errors.push(`安装冒烟测试: alpha-goal 软链接指向 ${target}，预期 ${expectedTarget}`);
    }

    for (const skillName of [...REQUIRED_SKILL_NAMES].sort()) {
      if (!isFile(path.join(installed, skillName, "SKILL.md"))) {
        errors.push(`安装冒烟测试: alpha-goal 链接下缺少已安装的 ${skillName}/SKILL.md`);
      }
    }
    if (!isFile(path.join(tmpCodexHome, "AGENTS.md"))) {
      errors.push("安装冒烟测试: 默认安装未从模板创建 AGENTS.md");
    }
    if (!isFile(path.join(tmpCodexHome, "config.toml"))) {
      errors.push("安装冒烟测试: 默认安装未从模板创建 config.toml");
    }
  } finally {
    fs.rmSync(tmpCodexHome, { recursive: true, force: true });
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
    errors.push(`${label}: 执行 ${command} 失败: ${result.error.message}`);
    return;
  }
  if (result.status !== 0) {
    const output = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    errors.push(`${label}: 命令失败${output ? `: ${output}` : ""}`);
  }
}

function validateRuntimeArtifactIgnores(root: string, errors: string[]): void {
  const gitignore = path.join(root, ".gitignore");
  if (!isFile(gitignore)) {
    errors.push("缺少 .gitignore，必须包含 .alpha-goal/ 和 .worktrees/ 忽略规则");
    return;
  }

  const lines = fs
    .readFileSync(gitignore, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim());
  if (!lines.includes(".alpha-goal/")) {
    errors.push(".gitignore 必须包含 .alpha-goal/，用于默认台账和运行期产物");
  }
  if (!lines.includes(".worktrees/")) {
    errors.push(".gitignore 必须包含 .worktrees/，才能使用仓库内 worktree");
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
        errors.push(`${rel}: 仍残留旧的非 TypeScript 脚本引用: ${legacy}`);
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
        errors.push(`${rel}: 仍残留旧技能引用: ${legacy}`);
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
        errors.push(`${rel}: 仍残留旧产物路径: ${legacy}`);
      }
    }
  }
}

function validateMisleadingSemanticContractions(root: string, errors: string[]): void {
  for (const rel of documentationFiles(root)) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    for (const term of MISLEADING_SEMANTIC_CONTRACTION_TERMS) {
      if (text.includes(term)) {
        errors.push(`${rel}: 目标契约语义不能写成 ${term}`);
      }
    }
  }
}

function validateGoalContractAmbiguityGate(root: string, errors: string[]): void {
  const rels = [
    "skills/goal-contract/SKILL.md",
    "skills/goal-contract/references/ambiguity-scoring.md",
    "skills/goal-contract/references/goal-contract-schema.md",
  ];
  for (const rel of rels) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const forbidden = GOAL_CONTRACT_FORBIDDEN_AMBIGUITY_TERMS.filter((term) =>
      text.includes(term),
    );
    if (forbidden.length > 0) {
      errors.push(`${rel}: goal-contract 模糊度闸门残留旧等级或旧档位: ${forbidden.join(", ")}`);
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
        `${rel}: .alpha-goal 运行期产物路径必须限定到任务目录，发现 .alpha-goal/${segment}`,
      );
    }
  }
}

function validateSchemaSidecarContract(root: string, errors: string[]): void {
  const rel = "skills/alpha-goal/references/cybernetic-conformance.md";
  const file = path.join(root, rel);
  if (!isFile(file)) {
    errors.push(`schema sidecar 契约缺少 ${rel}`);
    return;
  }

  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) {
    errors.push(`${rel}: 缺少 JSON Schema schema sidecar 示例块`);
    return;
  }

  let schema: Record<string, unknown>;
  try {
    schema = JSON.parse(match[1]);
  } catch (error) {
    errors.push(`${rel}: JSON Schema schema sidecar 块无效: ${errorMessage(error)}`);
    return;
  }

  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push(`${rel}: schema sidecar 必须声明 JSON Schema draft 2020-12`);
  }
  if (schema.type !== "object") {
    errors.push(`${rel}: schema sidecar 根类型必须是 object`);
  }
  if (schema.additionalProperties !== false) {
    errors.push(`${rel}: schema sidecar 必须把 additionalProperties 设为 false`);
  }

  validateExactStringSet(
    rel,
    "schema sidecar 必填键列表",
    schema.required,
    SIDECAR_REQUIRED_KEYS,
    errors,
  );

  const properties = objectValue(schema.properties);
  if (!properties) {
    errors.push(`${rel}: schema sidecar 缺少 properties 对象`);
    return;
  }

  for (const key of SIDECAR_REQUIRED_KEYS) {
    if (!Object.hasOwn(properties, key)) {
      errors.push(`${rel}: schema sidecar properties 遗漏 ${JSON.stringify(key)}`);
    }
  }
  for (const key of Object.keys(properties)) {
    if (!SIDECAR_REQUIRED_KEY_SET.has(key)) {
      errors.push(`${rel}: schema sidecar properties 包含非预期键 ${JSON.stringify(key)}`);
    }
  }

  validateSchemaEnum(rel, properties, "artifact_kind", SIDECAR_ARTIFACT_KINDS, errors);
  validateSchemaEnum(rel, properties, "route_state", SIDECAR_ROUTE_STATES, errors);
  validateSchemaEnum(rel, properties, "next_route", SIDECAR_ROUTE_STATES, errors);
  validateNullableRouteSchemaEnum(rel, properties, "prior_route", SIDECAR_ROUTE_STATES, errors);
  validateSchemaEnum(rel, properties, "evidence_boundary", SIDECAR_EVIDENCE_BOUNDARIES, errors);
  validateSchemaEnum(rel, properties, "stage_decision", SIDECAR_STAGE_DECISIONS, errors);
  validateSchemaEnum(rel, properties, "authorization_status", SIDECAR_AUTHORIZATION_STATUSES, errors);

  const responsibilityBoundaryTerms = [
    "基础 JSON Schema",
    "紧凑摘要",
    "不替代完整 Markdown 阶段产物",
    "不替代持久化的完整控制律",
    "TypeScript 校验器还会额外检查",
    "运行态追踪连续性",
  ];
  for (const term of responsibilityBoundaryTerms) {
    if (!text.includes(term)) {
      errors.push(`${rel}: schema sidecar 责任边界必须提到 ${JSON.stringify(term)}`);
    }
  }

  for (const kind of SIDECAR_ARTIFACT_KINDS) {
    if (!text.includes(`- \`${kind}\``)) {
      errors.push(`${rel}: 阶段专用必填键遗漏 ${kind}`);
    }
  }
}

function validateSchemaSidecarFixtures(root: string, errors: string[]): void {
  const dir = path.join(root, SIDECAR_FIXTURE_DIR);
  if (!isDirectory(dir)) {
    errors.push(`schema sidecar 样例目录缺失: ${SIDECAR_FIXTURE_DIR}`);
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
      errors.push(`${SIDECAR_FIXTURE_DIR}/${name}: 非预期的 schema sidecar 样例`);
    }
  }

  for (const kind of SIDECAR_ARTIFACT_KINDS) {
    const rel = `${SIDECAR_FIXTURE_DIR}/${kind}.json`;
    const file = path.join(root, rel);
    if (!isFile(file)) {
      errors.push(`schema sidecar 样例缺失: ${rel}`);
      continue;
    }

    let fixture: Record<string, unknown>;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        errors.push(`${rel}: schema sidecar 样例必须是 JSON object`);
        continue;
      }
      fixture = parsed as Record<string, unknown>;
    } catch (error) {
      errors.push(`${rel}: JSON schema sidecar 样例无效: ${errorMessage(error)}`);
      continue;
    }

    validateConcreteSidecarFixture(rel, fixture, kind, errors);
    fixturesByKind.set(kind, fixture);
  }

  validateSchemaSidecarFixtureTrace(fixturesByKind, errors);
}

function validateRuntimeSidecarFixtureSets(root: string, errors: string[]): void {
  const dir = path.join(root, RUNTIME_SIDECAR_FIXTURE_DIR);
  if (!isDirectory(dir)) {
    errors.push(`运行期 schema sidecar 样例目录缺失: ${RUNTIME_SIDECAR_FIXTURE_DIR}`);
    return;
  }

  const validRoot = path.join(dir, "valid");
  if (!isDirectory(validRoot)) {
    errors.push(`运行期 schema sidecar 样例缺少 valid 目录: ${RUNTIME_SIDECAR_FIXTURE_DIR}/valid`);
  } else {
    const validCases = fixtureCaseDirs(validRoot);
    const expectedValidNames = new Set(RUNTIME_SIDECAR_VALID_CASES);
    for (const caseDir of validCases) {
      const name = path.basename(caseDir);
      if (!expectedValidNames.has(name)) {
      errors.push(`${relative(root, caseDir)}: 非预期的 valid 运行期 schema sidecar 样例`);
      }
    }
    for (const caseName of RUNTIME_SIDECAR_VALID_CASES) {
      const caseDir = path.join(validRoot, caseName);
      if (!isDirectory(caseDir)) {
      errors.push(`运行期 schema sidecar 样例缺少 valid case ${caseName}`);
        continue;
      }
      const localErrors = validateRuntimeSidecarFixtureCase(root, caseDir);
      if (localErrors.length > 0) {
        errors.push(
          `${relative(root, caseDir)}: valid 运行期 schema sidecar 样例失败: ${localErrors.join("; ")}`,
        );
      }
    }
  }

  const negativeRoot = path.join(dir, "negative");
  if (!isDirectory(negativeRoot)) {
    errors.push(`运行期 schema sidecar 样例缺少 negative 目录: ${RUNTIME_SIDECAR_FIXTURE_DIR}/negative`);
    return;
  }

  const expectedNegativeNames = new Set(RUNTIME_SIDECAR_NEGATIVE_CASES.map(([name]) => name));
  for (const caseDir of fixtureCaseDirs(negativeRoot)) {
    const name = path.basename(caseDir);
    if (!expectedNegativeNames.has(name)) {
      errors.push(`${relative(root, caseDir)}: 非预期的 negative 运行期 schema sidecar 样例`);
    }
  }

  for (const [caseName, expectedError] of RUNTIME_SIDECAR_NEGATIVE_CASES) {
    const caseDir = path.join(negativeRoot, caseName);
    if (!isDirectory(caseDir)) {
      errors.push(`运行期 schema sidecar 样例缺少 negative case ${caseName}`);
      continue;
    }

    const localErrors = validateRuntimeSidecarFixtureCase(root, caseDir);
    if (!localErrors.some((error) => error.includes(expectedError))) {
      const actual = localErrors.length > 0 ? localErrors.join("; ") : "无错误";
      errors.push(
        `${relative(root, caseDir)}: negative 运行期 schema sidecar 样例应包含错误 ${JSON.stringify(expectedError)}，实际为 ${actual}`,
      );
    }
  }
}

function validateRuntimeSidecarFixtureCase(root: string, caseDir: string): string[] {
  const localErrors: string[] = [];
  const sidecarsByTask = new Map<string, Record<string, unknown>[]>();
  const files = walk(caseDir)
    .filter((file) => isFile(file) && file.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    localErrors.push(`${relative(root, caseDir)}: 运行期样例 case 没有 JSON schema sidecar`);
    return localErrors;
  }

  for (const file of files) {
    const rel = relative(root, file);
    const fixtureRel = relative(caseDir, file);
    const match = fixtureRel.match(/^([^/]+)\/schema\/([^/]+\.json)$/);
    if (!match) {
      localErrors.push(`${rel}: 运行期样例 schema sidecar 必须位于 <task_slug>/schema/ 下`);
      continue;
    }

    const taskSlug = match[1];
    if (!SIDECAR_TASK_SLUG_RE.test(taskSlug)) {
      localErrors.push(`${rel}: 运行期样例任务目录必须匹配 YYYYMMDD-<slug>`);
    }

    let sidecar: Record<string, unknown>;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        localErrors.push(`${rel}: 运行期样例 schema sidecar 必须是 JSON object`);
        continue;
      }
      sidecar = parsed as Record<string, unknown>;
    } catch (error) {
      localErrors.push(`${rel}: 运行期样例 schema sidecar JSON 无效: ${errorMessage(error)}`);
      continue;
    }

    const artifactKind = stringValue(sidecar.artifact_kind);
    if (!artifactKind || !SIDECAR_ARTIFACT_KINDS.includes(artifactKind)) {
      localErrors.push(`${rel}: 运行期样例 schema sidecar 的 artifact_kind 未知`);
      continue;
    }
    if (!sidecarFilenameMatchesKind(artifactKind, path.basename(file))) {
      localErrors.push(`${rel}: 运行期样例文件名与 artifact_kind ${artifactKind} 不匹配`);
    }

    validateConcreteSidecarFixture(rel, sidecar, artifactKind, localErrors, taskSlug);
    const group = sidecarsByTask.get(taskSlug) ?? [];
    group.push(sidecar);
    sidecarsByTask.set(taskSlug, group);
  }

  validateRuntimeSidecarTraceGroups(root, sidecarsByTask, localErrors, {
    checkArtifactFiles: false,
  });
  return localErrors;
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
      errors.push(`${rel}: schema sidecar 缺少必填键 ${JSON.stringify(key)}`);
    }
  }
  for (const key of Object.keys(fixture)) {
    if (!SIDECAR_REQUIRED_KEY_SET.has(key)) {
      errors.push(`${rel}: schema sidecar 包含不支持的键 ${JSON.stringify(key)}`);
    }
  }

  const artifactKind = stringValue(fixture.artifact_kind);
  if (!artifactKind) {
    errors.push(`${rel}: artifact_kind 必须是非空字符串`);
  } else if (artifactKind !== expectedKind) {
    errors.push(`${rel}: artifact_kind ${JSON.stringify(artifactKind)} 必须等于 ${expectedKind}`);
  }

  const taskSlug = stringValue(fixture.task_slug);
  if (!taskSlug) {
    errors.push(`${rel}: task_slug 必须是非空字符串`);
  } else if (expectedTaskSlug && taskSlug !== expectedTaskSlug) {
    errors.push(`${rel}: task_slug ${JSON.stringify(taskSlug)} 必须匹配 schema sidecar 目录 ${expectedTaskSlug}`);
  } else if (!SIDECAR_TASK_SLUG_RE.test(taskSlug)) {
    errors.push(`${rel}: task_slug 必须匹配 YYYYMMDD-<slug>，实际为 ${JSON.stringify(taskSlug)}`);
  }

  const artifactPath = stringValue(fixture.artifact_path);
  if (!artifactPath) {
    errors.push(`${rel}: artifact_path 必须是非空字符串`);
  } else if (taskSlug && !artifactPath.startsWith(`.alpha-goal/${taskSlug}/`)) {
    errors.push(`${rel}: artifact_path 必须位于 .alpha-goal/${taskSlug}/ 下`);
  } else if (!artifactPath.endsWith(".md")) {
    errors.push(`${rel}: artifact_path 必须指向 Markdown 阶段产物`);
  } else if (taskSlug && artifactKind && !artifactPathMatchesKind(artifactKind, taskSlug, artifactPath)) {
    errors.push(`${rel}: artifact_path 与 artifact_kind ${artifactKind} 不匹配`);
  }

  const routeState = stringValue(fixture.route_state);
  if (!routeState || !SIDECAR_ROUTE_STATES.includes(routeState)) {
    errors.push(`${rel}: route_state 必须是下列值之一: ${SIDECAR_ROUTE_STATES.join(", ")}`);
  }

  const priorRoute = nullableStringValue(fixture.prior_route);
  if (priorRoute === undefined) {
    errors.push(`${rel}: prior_route 必须是路由字符串或 null`);
  } else if (priorRoute !== null && !isRouteToken(priorRoute)) {
    errors.push(`${rel}: prior_route 包含未知路由 token ${JSON.stringify(priorRoute)}`);
  }

  const nextRoute = nullableStringValue(fixture.next_route);
  if (!nextRoute) {
    errors.push(`${rel}: next_route 必须是非空路由字符串`);
  } else if (!isRouteToken(nextRoute)) {
    errors.push(`${rel}: next_route 包含未知路由 token ${JSON.stringify(nextRoute)}`);
  }

  if (priorRoute && routeState && isRouteToken(priorRoute) && !canTransition(priorRoute, routeState)) {
    errors.push(`${rel}: prior transition 无效 ${priorRoute} -> ${routeState}`);
  }
  if (routeState && nextRoute && isRouteToken(nextRoute) && !canTransition(routeState, nextRoute)) {
    errors.push(`${rel}: next transition 无效 ${routeState} -> ${nextRoute}`);
  }

  const evidenceBoundary = stringValue(fixture.evidence_boundary);
  if (!evidenceBoundary) {
    errors.push(`${rel}: evidence_boundary 必须是非空字符串`);
  } else if (!SIDECAR_EVIDENCE_BOUNDARIES.includes(evidenceBoundary)) {
    errors.push(`${rel}: evidence_boundary 包含不支持的值 ${JSON.stringify(evidenceBoundary)}`);
  }

  const stageDecision = stringValue(fixture.stage_decision);
  if (!stageDecision) {
    errors.push(`${rel}: stage_decision 必须是非空字符串`);
  } else if (!SIDECAR_STAGE_DECISIONS.includes(stageDecision)) {
    errors.push(`${rel}: stage_decision 包含不支持的值 ${JSON.stringify(stageDecision)}`);
  } else if (nextRoute && !stageDecisionMatchesRoute(stageDecision, nextRoute)) {
    errors.push(`${rel}: stage_decision ${stageDecision} 不支持 next_route ${nextRoute}`);
  }

  const authorizationStatus = stringValue(fixture.authorization_status);
  if (!authorizationStatus) {
    errors.push(`${rel}: authorization_status 必须是非空字符串`);
  } else if (!SIDECAR_AUTHORIZATION_STATUSES.includes(authorizationStatus)) {
    errors.push(`${rel}: authorization_status 包含不支持的值 ${JSON.stringify(authorizationStatus)}`);
  }

  const stagePolicy = SIDECAR_STAGE_POLICIES[expectedKind];
  if (stagePolicy) {
    if (routeState && routeState !== stagePolicy.routeState) {
      errors.push(`${rel}: ${expectedKind} schema sidecar route_state 必须是 ${stagePolicy.routeState}`);
    }
    if (stageDecision && !stagePolicy.stageDecisions.includes(stageDecision)) {
      errors.push(
        `${rel}: ${expectedKind} schema sidecar stage_decision 必须是下列值之一: ${stagePolicy.stageDecisions.join(", ")}`,
      );
    }
  }

  if (
    nextRoute === "control-loop" &&
    routeState !== "control-loop" &&
    authorizationStatus !== "approved"
  ) {
    errors.push(`${rel}: 路由进入 control-loop 要求 authorization_status=approved`);
  }
  if (routeState === "control-loop" && authorizationStatus !== "approved") {
    errors.push(`${rel}: control-loop schema sidecar 要求 authorization_status=approved`);
  }
  const generatedAt = stringValue(fixture.generated_at);
  if (!generatedAt) {
    errors.push(`${rel}: generated_at 必须是非空 ISO-8601 字符串`);
  } else if (Number.isNaN(Date.parse(generatedAt)) || !generatedAt.includes("T")) {
    errors.push(`${rel}: generated_at 必须可解析为 ISO-8601，实际为 ${JSON.stringify(generatedAt)}`);
  }

  if (expectedKind === "decision-synthesis") {
    if (!isMeaningfulSidecarValue(fixture.next_route)) {
      errors.push(`${rel}: decision-synthesis schema sidecar 要求 next_route`);
    }
    if (
      !isMeaningfulSidecarValue(fixture.reference_id) &&
      !isMeaningfulSidecarValue(fixture.claim_boundary)
    ) {
      errors.push(`${rel}: decision-synthesis schema sidecar 要求 reference_id 或 claim_boundary`);
    }
  } else {
    for (const key of STAGE_REQUIRED_SIDECAR_KEYS[expectedKind] ?? []) {
      if (!isMeaningfulSidecarValue(fixture[key])) {
        errors.push(`${rel}: ${expectedKind} schema sidecar 要求有意义的 ${key}`);
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
        errors.push(`${rel}: 运行态 schema sidecar 必须是 JSON object`);
        continue;
      }
      sidecar = parsed as Record<string, unknown>;
    } catch (error) {
      errors.push(`${rel}: 运行态 schema sidecar JSON 无效: ${errorMessage(error)}`);
      continue;
    }

    const artifactKind = stringValue(sidecar.artifact_kind);
    if (!artifactKind || !SIDECAR_ARTIFACT_KINDS.includes(artifactKind)) {
      errors.push(`${rel}: 运行态 schema sidecar 的 artifact_kind 未知`);
      continue;
    }

    if (!sidecarFilenameMatchesKind(artifactKind, path.basename(file))) {
      errors.push(`${rel}: 运行态 schema sidecar 的文件名与 artifact_kind ${artifactKind} 不匹配`);
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
    const rel = `.alpha-goal/${entry.name}`;
    if (!entry.isDirectory()) {
      errors.push(`${rel}: 运行期产物必须放在 .alpha-goal/YYYYMMDD-<slug>/ 任务目录下`);
      continue;
    }
    if (!SIDECAR_TASK_SLUG_RE.test(entry.name)) {
      errors.push(`${rel}: 运行期产物目录必须限定到任务目录`);
    }
  }
}

function validateRuntimeSidecarTraceGroups(
  root: string,
  sidecarsByTask: Map<string, Record<string, unknown>[]>,
  errors: string[],
  options: { checkArtifactFiles?: boolean } = {},
): void {
  const checkArtifactFiles = options.checkArtifactFiles ?? true;
  for (const [taskSlug, sidecars] of sidecarsByTask) {
    const relPrefix = `.alpha-goal/${taskSlug}/schema`;
    const reachesMutation = sidecars.some((sidecar) => {
      const routeState = stringValue(sidecar.route_state);
      const nextRoute = stringValue(sidecar.next_route);
      return routeState === "control-loop" || nextRoute === "control-loop";
    });
    const referenceIds = new Set(
      sidecars
        .map((sidecar) => stringValue(sidecar.reference_id))
        .filter((value): value is string => Boolean(value)),
    );
    if (reachesMutation) {
      const missingReference = sidecars.some((sidecar) => !stringValue(sidecar.reference_id));
      if (missingReference) {
        errors.push(
          `${relPrefix}: 到达行动或最终路由的运行态 schema sidecar 必须共享一个有意义的 reference_id`,
        );
      }
    }
    if (referenceIds.size > 1) {
      errors.push(`${relPrefix}: 运行态 schema sidecar 必须共享同一个 reference_id`);
    }

    const hasControlLoop = sidecars.some((sidecar) => sidecar.route_state === "control-loop");
    const approvedContracts = sidecars.filter(isApprovedControlContractSidecar);
    if (hasControlLoop && approvedContracts.length === 0) {
      errors.push(`${relPrefix}: control-loop 运行态 schema sidecar 需要已批准的 goal-contract schema sidecar`);
    }

    const finalVerifiers = sidecars.filter(isFinalVerificationVerdictSidecar);

    for (const sidecar of sidecars) {
      const artifactPath = stringValue(sidecar.artifact_path);
      if (checkArtifactFiles && artifactPath && !isFile(path.join(root, artifactPath))) {
        errors.push(`${relPrefix}: schema sidecar artifact_path 不存在: ${artifactPath}`);
      }

      const priorRoute = nullableStringValue(sidecar.prior_route);
      const routeState = stringValue(sidecar.route_state);
      const nextRoute = stringValue(sidecar.next_route);

      if (
        nextRoute === "control-loop" &&
        !isApprovedControlContractSidecar(sidecar)
      ) {
        const support = approvedContractSupport(sidecar, approvedContracts);
        if (support === "missing") {
          errors.push(`${relPrefix}: 路由到 control-loop 需要先前已批准的 goal-contract schema sidecar`);
        } else if (support === "late") {
          errors.push(`${relPrefix}: 已批准的 goal-contract schema sidecar 不得晚于 control-loop 路由`);
        }
      }

      if (routeState === "control-loop") {
        const support = approvedContractSupport(sidecar, approvedContracts);
        if (support === "missing") {
          errors.push(`${relPrefix}: control-loop 运行态 schema sidecar 需要已批准的 goal-contract schema sidecar`);
        } else if (support === "late") {
          errors.push(`${relPrefix}: 已批准的 goal-contract schema sidecar 不得晚于 control-loop 路由`);
        }
      }

      if (nextRoute === "final") {
        const support = finalVerifierSupport(sidecar, finalVerifiers);
        if (support === "missing") {
          errors.push(
            `${relPrefix}: 最终路由需要带 PASS_TO_FINAL 或 NARROW_CLAIM_AND_FINAL 的 verification-verdict schema sidecar`,
          );
        } else if (support === "late") {
          errors.push(`${relPrefix}: 最终 verification-verdict schema sidecar 不得晚于最终路由`);
        }
      }

      if (!priorRoute || priorRoute === "alpha-goal" || !routeState) {
        continue;
      }

      const incomingSources = sidecars.filter(
        (candidate) => candidate.route_state === priorRoute && candidate.next_route === routeState,
      );
      if (incomingSources.length === 0) {
        errors.push(`${relPrefix}: 没有先前 schema sidecar 连接 ${priorRoute} -> ${routeState}`);
        continue;
      }

      const compatibleIncomingSources = incomingSources.filter((candidate) =>
        traceAnchorsCompatible(sidecar, candidate),
      );
      if (compatibleIncomingSources.length === 0) {
        errors.push(`${relPrefix}: 前置 schema sidecar 记录必须共享 reference_id 或 claim_boundary`);
      } else if (!hasPriorOrSameGeneratedAt(sidecar, compatibleIncomingSources)) {
        errors.push(`${relPrefix}: 前置 schema sidecar 记录不得晚于当前路由`);
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

    for (const key of [
      "route_state",
      "prior_route",
      "next_route",
      "stage_decision",
      "authorization_status",
    ] as const) {
      const expected = step[key];
      const actual = nullableStringValue(fixture[key]);
      if (actual !== expected) {
        errors.push(`${rel}: 样例轨迹要求 ${key}=${expected}，实际为 ${String(actual)}`);
      }
    }
  }

  if (taskSlugs.size !== 1) {
    errors.push(`schema sidecar 样例轨迹必须只使用一个 task_slug，实际为 ${[...taskSlugs].join(", ")}`);
  }
  if (referenceIds.size !== 1) {
    errors.push(
      `schema sidecar 样例轨迹必须只使用一个 reference_id，实际为 ${[...referenceIds].join(", ")}`,
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
        errors.push(`${conformanceRel}: 缺少路由迁移 ${transition}`);
      }
    }

    const requiredGuards = [
      "`decision-synthesis -> goal-contract` 用于把综合研判和指标转译固化为目标契约",
      "`decision-synthesis -> evidence-verify` 仅在综合研判未授权改动",
      "`system-model -> goal-contract` 用于把被控对象、传感器、执行器、扰动或耦合事实固化为目标契约",
    ];
    for (const guard of requiredGuards) {
      if (!conformance.includes(guard)) {
        errors.push(`${conformanceRel}: 缺少条件迁移守卫 ${guard}`);
      }
    }
  }

  if (synthesis) {
    const requiredRoutes = [
      "路由到 `evidence-verify`",
      "路由到 `goal-contract`",
      "路由到 `system-model`",
    ];
    for (const route of requiredRoutes) {
      if (!synthesis.includes(route)) {
        errors.push(`${synthesisRel}: 缺少 decision-synthesis 路由规则 ${route}`);
      }
    }
  }

  if (synthesisRound) {
    const routeTrigger =
      "路由触发条件: goal-contract | system-model | evidence-verify | user | blocker";
    if (!synthesisRound.includes(routeTrigger)) {
      errors.push(`${synthesisRoundRel}: 缺少完整路由触发条件列表`);
    }
  }
}

function validateSemanticSmokeTests(root: string, errors: string[]): void {
  for (const [scenario, relPath, requiredTerms] of SEMANTIC_SMOKE_TESTS) {
    const file = path.join(root, relPath);
    if (!isFile(file)) {
      errors.push(`语义冒烟测试「${scenario}」失败：缺少文件 ${relPath}`);
      continue;
    }

    const text = fs.readFileSync(file, "utf8").toLowerCase();
    const missing = requiredTerms.filter((term) => !text.includes(term.toLowerCase()));
    if (missing.length > 0) {
      errors.push(
        `语义冒烟测试「${scenario}」失败：${relPath} 缺少 ${missing.join(", ")}`,
      );
    }
  }
}

function validateStructuredBlockTests(root: string, errors: string[]): void {
  for (const fixture of STRUCTURED_BLOCK_TESTS) {
    const file = path.join(root, fixture.path);
    if (!isFile(file)) {
      errors.push(`结构化块测试「${fixture.name}」失败：缺少文件 ${fixture.path}`);
      continue;
    }

    const text = fs.readFileSync(file, "utf8");
    const block =
      fixture.block_scope === "section"
        ? textSectionAfterAnchor(text, fixture.anchor)
        : textBlockAfterAnchor(text, fixture.anchor);
    if (!block) {
      errors.push(
        `结构化块测试「${fixture.name}」失败：${fixture.path} 缺少锚点 ${fixture.anchor}`,
      );
      continue;
    }

    const missing = fixture.required_terms.filter((term) => !block.includes(term));
    if (missing.length > 0) {
      errors.push(
        `结构化块测试「${fixture.name}」失败：${fixture.path} 缺少 ${missing.join(", ")}`,
      );
    }

    const forbidden = (fixture.forbidden_terms ?? []).filter((term) => block.includes(term));
    if (forbidden.length > 0) {
      errors.push(
        `结构化块测试「${fixture.name}」失败：${fixture.path} 包含禁止词 ${forbidden.join(", ")}`,
      );
    }
  }
}

function validateDefaultTuiProjectionGuards(root: string, errors: string[]): void {
  for (const guard of DEFAULT_TUI_PROJECTION_GUARDS) {
    const file = path.join(root, guard.path);
    if (!isFile(file)) {
      errors.push(`默认 TUI 展示检查「${guard.name}」失败：缺少文件 ${guard.path}`);
      continue;
    }

    const text = fs.readFileSync(file, "utf8");
    const section = textBetweenAnchors(text, guard.anchor, guard.end_anchor);
    if (!section) {
      errors.push(
        `默认 TUI 展示检查「${guard.name}」失败：${guard.path} 缺少锚点边界 ${guard.anchor}${guard.end_anchor ? ` -> ${guard.end_anchor}` : ""}`,
      );
      continue;
    }

    const codeFences = codeFenceBlocks(section);
    if (codeFences.length !== 1) {
      errors.push(
        `默认 TUI 展示检查「${guard.name}」失败：${guard.path} 默认 TUI 区块必须只包含一个模板代码块，实际 ${codeFences.length}`,
      );
    } else {
      const requiredTemplateTerms =
        "required_template_terms" in guard
          ? guard.required_template_terms
          : DEFAULT_TUI_TEMPLATE_TERMS;
      const missingTemplateTerms = requiredTemplateTerms.filter(
        (term) => !codeFences[0].content.includes(term),
      );
      if (missingTemplateTerms.length > 0) {
        errors.push(
          `默认 TUI 展示检查「${guard.name}」失败：${guard.path} 默认 TUI 模板缺少 ${missingTemplateTerms.join(", ")}`,
        );
      }
    }

    const rawControlLaw = rawControlLawFieldLeak(section);
    if (rawControlLaw) {
      errors.push(
        `默认 TUI 展示检查「${guard.name}」失败：${guard.path} 默认 TUI 区块包含原始控制律字段 ${JSON.stringify(rawControlLaw)}`,
      );
    }

    const multilingualExample = section.match(MULTILINGUAL_TUI_EXAMPLE_RE);
    if (multilingualExample) {
      errors.push(
        `默认 TUI 展示检查「${guard.name}」失败：${guard.path} 默认 TUI 区块包含单独的非中文示例词 ${JSON.stringify(multilingualExample[0].trim())}`,
      );
    }
  }
}

function validateChineseOutputTitles(root: string, errors: string[]): void {
  for (const rel of documentationFiles(root)) {
    if (!rel.endsWith(".md")) {
      continue;
    }
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    for (const title of LEGACY_OUTPUT_TITLE_TERMS) {
      if (text.includes(title)) {
        errors.push(`${rel}: 残留旧英文输出标题: ${title}`);
      }
    }
    for (const [label, pattern] of LEGACY_OUTPUT_TITLE_LINE_PATTERNS) {
      if (pattern.test(text)) {
        errors.push(`${rel}: 残留旧英文输出标题行: ${label}`);
      }
    }
  }
}

function validateUserVisibleScriptOutput(root: string, errors: string[]): void {
  const scriptFiles = [
    "scripts/install.sh",
    "skills/control-loop/scripts/mutation-preflight.ts",
    "skills/evidence-verify/scripts/evidence-summary.ts",
    "skills/system-model/scripts/repo-sensor-snapshot.ts",
  ];
  for (const rel of scriptFiles) {
    const file = path.join(root, rel);
    if (!isFile(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const forbidden = USER_VISIBLE_SCRIPT_OUTPUT_TERMS.filter((term) => text.includes(term));
    if (forbidden.length > 0) {
      errors.push(`${rel}: 用户可见脚本输出残留旧英文标题或提示: ${forbidden.join(", ")}`);
    }
  }
}

function validateFixtureContractTests(root: string, errors: string[]): void {
  for (const fixture of FIXTURE_CONTRACT_TESTS) {
    const name = fixture.name;
    const prompt = fixture.prompt;
    if (!prompt.trim()) {
      errors.push(`契约样例「${name}」: prompt 为空`);
      continue;
    }
    const missingPromptTerms = fixture.prompt_terms.filter((term) => !prompt.includes(term));
    if (missingPromptTerms.length > 0) {
      errors.push(
        `契约样例「${name}」: prompt 缺少预期词 ${missingPromptTerms.join(", ")}`,
      );
    }
    if (!isRouteToken(fixture.expected_route)) {
      errors.push(
        `契约样例「${name}」: expected_route 不是已知路由 ${fixture.expected_route}`,
      );
    }
    if (!SIDECAR_STAGE_DECISIONS.includes(fixture.expected_stage_decision)) {
      errors.push(
        `契约样例「${name}」: expected_stage_decision 不受支持 ${fixture.expected_stage_decision}`,
      );
    }
    if (
      isRouteToken(fixture.expected_route) &&
      SIDECAR_STAGE_DECISIONS.includes(fixture.expected_stage_decision) &&
      !stageDecisionMatchesRoute(fixture.expected_stage_decision, fixture.expected_route)
    ) {
      errors.push(
        `契约样例「${name}」: expected_stage_decision ${fixture.expected_stage_decision} 不匹配 expected_route ${fixture.expected_route}`,
      );
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
        `契约样例「${name}」: 缺少路径 ${missingPaths.join(", ")}`,
      );
      continue;
    }

    const combined = combinedParts.join("\n");
    const missingBlocks = fixture.schema_blocks.filter((block) => !hasSchemaBlock(combined, block));
    if (missingBlocks.length > 0) {
      errors.push(
        `契约样例「${name}」: 缺少结构块 ${missingBlocks.join(", ")}`,
      );
    }

    const lower = combined.toLowerCase();
    const missingRoutes = fixture.route_terms.filter((term) => !lower.includes(term.toLowerCase()));
    if (!lower.includes(fixture.expected_route.toLowerCase())) {
      missingRoutes.push(fixture.expected_route);
    }
    if (missingRoutes.length > 0) {
      errors.push(
        `契约样例「${name}」: 缺少路由词 ${missingRoutes.join(", ")}`,
      );
    }
  }
}

function hasSchemaBlock(text: string, label: string): boolean {
  const escaped = escapeRegex(label.trim());
  const headingLabel = escapeRegex(label.trim().replace(/:$/, ""));
  const blockPattern = new RegExp("```(?:[A-Za-z0-9_-]+)?\\n(?:(?!```).)*" + escaped, "s");
  const headingPattern = new RegExp("^#{1,6}\\s+" + headingLabel, "m");
  return blockPattern.test(text) || headingPattern.test(text);
}

function textBlockAfterAnchor(text: string, anchor: string): string | undefined {
  const start = text.indexOf(anchor);
  if (start < 0) {
    return undefined;
  }

  const after = text.slice(start);
  const codeFence = after.indexOf("```");
  if (codeFence >= 0 && codeFence < 300) {
    const blockStart = codeFence + 3;
    const blockEnd = after.indexOf("```", blockStart);
    if (blockEnd > blockStart) {
      return after.slice(blockStart, blockEnd);
    }
  }

  const nextHeading = after.slice(1).search(/\n#{1,3}\s+/);
  if (nextHeading >= 0) {
    return after.slice(0, nextHeading + 1);
  }
  return after;
}

function textSectionAfterAnchor(text: string, anchor: string): string | undefined {
  const start = text.indexOf(anchor);
  if (start < 0) {
    return undefined;
  }

  const after = text.slice(start);
  const nextHeading = after.slice(1).search(/\n#{1,3}\s+/);
  if (nextHeading >= 0) {
    return after.slice(0, nextHeading + 1);
  }
  return after;
}

function textBetweenAnchors(
  text: string,
  startAnchor: string,
  endAnchor?: string,
): string | undefined {
  const start = text.indexOf(startAnchor);
  if (start < 0) {
    return undefined;
  }

  const after = text.slice(start);
  if (!endAnchor) {
    return textSectionAfterAnchor(text, startAnchor);
  }

  const end = after.indexOf(endAnchor, startAnchor.length);
  if (end < 0) {
    return undefined;
  }
  return after.slice(0, end);
}

function codeFenceBlocks(text: string): Array<{ language: string; content: string }> {
  const blocks: Array<{ language: string; content: string }> = [];
  const fenceRe = /^```([A-Za-z0-9_-]*)[^\n]*\n([\s\S]*?)^```[ \t]*$/gm;
  for (const match of text.matchAll(fenceRe)) {
    blocks.push({ language: match[1] ?? "", content: match[2] ?? "" });
  }
  return blocks;
}

function rawControlLawFieldLeak(text: string): string | undefined {
  for (const line of normalizeMarkdownControlLines(text)) {
    for (const field of RAW_CONTROL_LAW_FIELD_PATTERNS) {
      const escapedField = escapeRegex(field);
      const fieldRe = new RegExp(`^(?:[-*+]\\s*)?${escapedField}\\s*:`);
      const tableFieldRe = new RegExp(`^\\|\\s*${escapedField}\\s*\\|`);
      if (fieldRe.test(line) || tableFieldRe.test(line)) {
        return line;
      }
    }
  }
  return undefined;
}

function normalizeMarkdownControlLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/[：]/g, ":")
        .replace(/[`*_]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
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
    errors.push(`${rel}: schema sidecar 属性 ${propertyName} 必须是 object`);
    return;
  }
  validateExactStringSet(
    rel,
    `schema sidecar ${propertyName} enum`,
    property.enum,
    expectedValues,
    errors,
  );
}

function validateNullableRouteSchemaEnum(
  rel: string,
  properties: Record<string, unknown>,
  propertyName: string,
  expectedValues: string[],
  errors: string[],
): void {
  const property = objectValue(properties[propertyName]);
  if (!property) {
    errors.push(`${rel}: schema sidecar 属性 ${propertyName} 必须是 object`);
    return;
  }

  validateExactStringOrNullSet(
    rel,
    `schema sidecar ${propertyName} enum`,
    property.enum,
    expectedValues,
    true,
    errors,
  );
}

function readRequiredText(root: string, rel: string, errors: string[]): string | undefined {
  const file = path.join(root, rel);
  if (!isFile(file)) {
    errors.push(`缺少必需文本文件: ${rel}`);
    return undefined;
  }
  return fs.readFileSync(file, "utf8");
}

function fixtureCaseDirs(root: string): string[] {
  if (!isDirectory(root)) {
    return [];
  }
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .sort();
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function validateExactStringSet(
  rel: string,
  label: string,
  value: unknown,
  expectedValues: string[],
  errors: string[],
): string[] {
  return validateExactStringOrNullSet(rel, label, value, expectedValues, false, errors).strings;
}

function validateExactStringOrNullSet(
  rel: string,
  label: string,
  value: unknown,
  expectedValues: string[],
  expectNull: boolean,
  errors: string[],
): { strings: string[]; hasNull: boolean } {
  if (!Array.isArray(value)) {
    errors.push(`${rel}: ${label} 必须是数组`);
    return { strings: [], hasNull: false };
  }

  const actualValues: string[] = [];
  const seen = new Set<string>();
  let hasNull = false;
  for (const [index, item] of value.entries()) {
    if (item === null) {
      if (!expectNull) {
        errors.push(`${rel}: ${label} 第 ${index} 项必须是字符串`);
      }
      if (hasNull) {
        errors.push(`${rel}: ${label} 包含重复值 null`);
      }
      hasNull = true;
      continue;
    }
    if (typeof item !== "string") {
      errors.push(`${rel}: ${label} 第 ${index} 项必须是字符串`);
      continue;
    }
    actualValues.push(item);
    if (seen.has(item)) {
      errors.push(`${rel}: ${label} 包含重复值 ${item}`);
    }
    seen.add(item);
  }

  const expectedSet = new Set(expectedValues);
  for (const expected of expectedValues) {
    if (!seen.has(expected)) {
      errors.push(`${rel}: ${label} 遗漏 ${expected}`);
    }
  }
  for (const actual of actualValues) {
    if (!expectedSet.has(actual)) {
      errors.push(`${rel}: ${label} 包含非预期值 ${actual}`);
    }
  }
  if (expectNull && !hasNull) {
    errors.push(`${rel}: ${label} 遗漏 null`);
  }
  return { strings: actualValues, hasNull };
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

type SupportStatus = "ok" | "missing" | "late";

function isApprovedControlContractSidecar(sidecar: Record<string, unknown>): boolean {
  return (
    sidecar.artifact_kind === "goal-contract" &&
    sidecar.route_state === "goal-contract" &&
    sidecar.next_route === "control-loop" &&
    sidecar.stage_decision === "CONTRACT_APPROVED" &&
    sidecar.authorization_status === "approved" &&
    isMeaningfulSidecarValue(sidecar.reference_id)
  );
}

function isFinalVerificationVerdictSidecar(sidecar: Record<string, unknown>): boolean {
  return (
    sidecar.artifact_kind === "verification-verdict" &&
    sidecar.route_state === "evidence-verify" &&
    sidecar.next_route === "final" &&
    (sidecar.stage_decision === "PASS_TO_FINAL" ||
      sidecar.stage_decision === "NARROW_CLAIM_AND_FINAL") &&
    (isMeaningfulSidecarValue(sidecar.reference_id) ||
      isMeaningfulSidecarValue(sidecar.claim_boundary))
  );
}

function approvedContractSupport(
  sidecar: Record<string, unknown>,
  approvedContracts: Record<string, unknown>[],
): SupportStatus {
  return timeOrderedSupport(sidecar, approvedContracts, ["reference_id"]);
}

function finalVerifierSupport(
  sidecar: Record<string, unknown>,
  finalVerifiers: Record<string, unknown>[],
): SupportStatus {
  return timeOrderedSupport(sidecar, finalVerifiers, ["reference_id", "claim_boundary"]);
}

function timeOrderedSupport(
  sidecar: Record<string, unknown>,
  candidates: Record<string, unknown>[],
  anchorKeys: string[],
): SupportStatus {
  const anchorKey = anchorKeys.find((key) => stringValue(sidecar[key]));
  if (!anchorKey) {
    return "missing";
  }
  const anchorValue = stringValue(sidecar[anchorKey]);

  const sameAnchorCandidates = candidates.filter(
    (candidate) => stringValue(candidate[anchorKey]) === anchorValue,
  );
  if (sameAnchorCandidates.length === 0) {
    return "missing";
  }

  const sidecarTime = sidecarGeneratedAtMillis(sidecar);
  const hasPriorOrSameCandidate = sameAnchorCandidates.some((candidate) => {
    const candidateTime = sidecarGeneratedAtMillis(candidate);
    return sidecarTime === undefined || candidateTime === undefined || candidateTime <= sidecarTime;
  });
  return hasPriorOrSameCandidate ? "ok" : "late";
}

function hasPriorOrSameGeneratedAt(
  sidecar: Record<string, unknown>,
  candidates: Record<string, unknown>[],
): boolean {
  const sidecarTime = sidecarGeneratedAtMillis(sidecar);
  return candidates.some((candidate) => {
    const candidateTime = sidecarGeneratedAtMillis(candidate);
    return sidecarTime === undefined || candidateTime === undefined || candidateTime <= sidecarTime;
  });
}

function traceAnchorsCompatible(
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

function sidecarGeneratedAtMillis(sidecar: Record<string, unknown>): number | undefined {
  const generatedAt = stringValue(sidecar.generated_at);
  if (!generatedAt) {
    return undefined;
  }
  const millis = Date.parse(generatedAt);
  return Number.isNaN(millis) ? undefined : millis;
}

function stageDecisionMatchesRoute(stageDecision: string, nextRoute: string): boolean {
  switch (stageDecision) {
    case "ROUTE_TO_GOAL_CONTRACT":
      return nextRoute === "goal-contract";
    case "ROUTE_TO_SYSTEM_MODEL":
    case "RETURN_TO_SYSTEM_MODEL":
      return nextRoute === "system-model";
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
      return ["goal-contract", "system-model", "decision-synthesis", "alpha-goal", "user"].includes(nextRoute);
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
  console.log("技能套件校验");
  console.log(`根目录: ${root}`);
  if (errors.length > 0) {
    console.log("\n错误:");
    for (const error of errors) {
      console.log(`- ${error}`);
    }
  }
  if (warnings.length > 0) {
    console.log("\n警告:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log("通过: 所有检查通过");
  } else if (errors.length === 0) {
    console.log("通过，但存在警告");
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

function isSymlink(file: string): boolean {
  try {
    return fs.lstatSync(file).isSymbolicLink();
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
