# Claim Boundary Check

完成声明必须被证据边界支撑。

```yaml
Claim Boundary:
  User wording:
  Implemented boundary:
  Tested boundary:
  Highest practical boundary:
  Gap:
  Final claim:
```

## 判断规则

- 用户说产品行为，证据只覆盖局部函数：不要 `PASS_TO_FINAL`。
- 用户说修复完成，但只做了源码静态检查：不要 `PASS_TO_FINAL`。
- 用户说 comparison-only，证据可以是 diff、源码、测试和 artifact 对比，但最终 claim 必须写成比较结论。
- 证据能证明局部目标但不能证明宽目标：使用 `NARROW_CLAIM_AND_FINAL`。
- 证据方向正确但 acceptance 未覆盖：使用 `NEXT_ITERATION`。
- 发现目标、仓库、已有工作关系或验收边界错误：使用 `REFRAME`。

## Final Claim

最终声明应写成证据能证明的最大真实范围，而不是用户原话的最大解释。无法证明的范围必须列为 unresolved gap 或 remaining risk。
