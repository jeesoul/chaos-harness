# /chaos-harness:ci-gate-check

运行所有质量 Gate 检查，输出 CI 兼容格式的报告。

## 用途

在 CI/CD 流程（GitHub Actions、GitLab CI 等）中执行 Gate 检查，或手动触发全量质量检查。

## 使用方式

```
/chaos-harness:ci-gate-check
/chaos-harness:ci-gate-check --dry-run
/chaos-harness:ci-gate-check --gate gate-quality-tests,gate-quality-format
```

## 参数

| 参数 | 说明 |
|------|------|
| `--dry-run` | 仅列出将要检查的 Gates，不实际执行 |
| `--gate <id,...>` | 只检查指定的 Gate（逗号分隔） |
| `--root <path>` | 指定项目根目录（默认自动检测） |
| `--no-github-actions` | 禁用 GitHub Actions 注解输出格式 |

## 退出码

| 退出码 | 含义 |
|--------|------|
| `0` | 所有 Gate 通过（包括 soft-fail） |
| `1` | 有 hard Gate 失败 |
| `2` | 仅有 soft Gate 失败（不阻断 CI） |

## 在 GitHub Actions 中使用

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  gate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Chaos Harness
        run: npm install -g chaos-harness  # 或通过 devDependencies 安装
      
      - name: Run Gate Check
        run: node scripts/ci-gate-check.mjs
        # exit 1 = hard gate 失败，阻断 CI
        # exit 2 = soft gate 警告，不阻断 CI（可选配置 continue-on-error: true）
```

## 输出示例

```
🔍 Chaos Harness CI Gate 检查
==============================
项目根目录: /workspace/my-project
运行 8 个 Gates...

✅ gate-quality-iron-law       (0ms)
✅ gate-quality-tests          (3421ms, maven-junit)
⚠️  gate-quality-format         soft-fail — ESLint issues
✅ gate-quality-ui             (243ms)
✅ gate-quality-architecture   (89ms)
⚠️  gate-quality-branch         soft-fail — Branch "dev-feature" 不符合规范
✅ gate-w09-code-review        (45ms)
❌ gate-w10-testing            FAILED — Coverage 42.3% < threshold 60%

──────────────────────────────
📊 结果：6 通过 · 1 失败 · 2 软警告
❌ hard Gate 失败，退出码 1
```

## 与 gate-reporter 配合使用

```bash
# 生成详细报告后再运行 CI 检查
node scripts/gate-reporter.mjs
node scripts/ci-gate-check.mjs

# 生成 PR 描述格式报告
node scripts/gate-reporter.mjs --pr-description
```

## 团队配置

在 `chaos-harness.yaml` 中自定义 Gate 行为（该文件可提交到 git，团队共享）：

```yaml
gates:
  coverage-threshold: 75      # 覆盖率阈值
  security-audit: moderate    # 安全审计最低级别
  branch-naming: "^(feature|fix|chore|hotfix|release)/.+"
```

## 相关命令

- `/chaos-harness:gate-manager` — 手动管理 Gate 状态
- `/chaos-harness:overview` — 查看当前项目全览
