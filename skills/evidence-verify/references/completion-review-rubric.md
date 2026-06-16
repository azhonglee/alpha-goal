# 完成复核准则

Use for readiness-to-merge, readiness-to-ship, final delivery, safety/correctness claims, or other formal completion judgments.

## 正向结论下限

Return `PASS_TO_FINAL` only when:

- approved context covers acceptance, included/excluded scope, decision boundaries, and claim boundary;
- changed files and artifacts match target and non-goals;
- implementation/evidence history is consistent with current diff/artifacts;
- fresh checks ran after the last material change, or substitute evidence is explicitly sufficient for a narrowed claim;
- feedback is handled, out of scope, or routed elsewhere;
- strongest material risk has matching evidence;
- 实质性定性目标有 指标转译 证据，或最终声明已明确窄化；
- material control actions have sensor feedback that meets the stated 控制律 threshold, or residual error/fallback is reflected in the verdict;
- 实质性的延迟 / 噪声反馈在声明稳定完成前，已把延迟、噪声、置信度、阻尼和影响范围约束反映到验证结论中;
- material 自适应学习记录 are supported by evidence and do not broaden the final claim beyond the observed boundary;
- bug/root-cause claims have valid root-cause evidence;
- final claim does not exceed tested or observed boundary.

## 按风险确定证据下限

Choose evidence by strongest material risk:

- 局部 / 只读 / 低影响范围: 变更差异复核加聚焦检查或直接证据通常足够;
- behavior, API, data, or user-visible change: relevant automated test, runtime probe, integration evidence, or explicit substitute is needed;
- migration, security, compliance, production, tenant, data repair, or irreversible claim: environment-specific or independently reviewable final-state evidence is needed;
- missing environment/tool/data: narrow the claim, return `NEXT_ITERATION`, or return `BLOCKED`.

## 返回 NEXT_ITERATION

Use when acceptance is partially covered, checks/probes/cleanup/edge cases/feedback action remain, implementation direction is valid but evidence is not final-state, or a narrowed claim would not satisfy the user.

## 返回 REFRAME

Use when target/scope, acceptance, non-goals, existing-work relationship, user intent, system model, or claim boundary is wrong or incomplete; or when evidence points to a different entity, interface, submodule, repo, or user-owned decision.

## 返回 BLOCKED

Use when credential, permission, service, data, tooling, environment, or required user risk/scope decision is missing and no meaningful loop progress can be made.

## 窄化声明

When local target is satisfied but user wording is broader, return `NARROW_CLAIM_AND_FINAL` and state:

- widest verified boundary;
- higher boundary not verified;
- final wording the user may receive.
