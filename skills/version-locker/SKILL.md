---
name: version-locker
description: "版本锁定器。**在任何文档生成前自动检查版本锁定状态**。触发词：创建版本、锁定版本、版本管理、v0.1、版本号、版本目录"
license: MIT
---

# 版本锁定哲学

## 核心思维

**版本散乱 = 无法追溯 = 团队混乱。**

在生成任何文档之前，必须回答：文档输出到哪里？

## 铁律

```
NO DOCUMENTS WITHOUT VERSION LOCK
NO VERSION CHANGES WITHOUT USER CONSENT
```

## 锁定流程

1. **检查现有版本** — Glob 检查 `output/vX.Y/` 和 `output/VERSION-LOG.md`
2. **版本处理**：
   - 无版本 → 建议 `v0.1`，用户确认后创建
   - 有版本 → 列出供用户选择
3. **创建目录结构** — `output/{version}/Harness/`、`output/{version}/docs/`
4. **生成 VERSION-LOCK** — YAML 格式，包含版本号、锁定时间、会话 ID

## VERSION-LOCK 格式

```yaml
# VERSION-LOCK
version: {version}
locked_at: {timestamp}
locked_by: chaos-harness

iron_law: IL001 - NO DOCUMENTS WITHOUT VERSION LOCK
```

## 版本号格式

`vX.Y` — X = 主版本号，Y = 次版本号。有效：v0.1, v1.0, v2.3。无效：v1, 1.0, v1.0.0。

## 版本建议

| 场景 | 建议 |
|------|------|
| 新项目首次 | v0.1 |
| 需求确认后 | v1.0 |
| 大版本重构 | vX.0 |
| 功能增强 | vX.Y+1 |

## 铁律检查

**IL001** — 生成任何文档前检查：版本是否已锁定？VERSION-LOCK 文件是否存在？

**IL004** — 版本已锁定且用户要更改时：警告当前版本 → 询问确认 → 等待明确同意。

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `.chaos-harness/state.json` | 读取当前版本锁状态时 |
| `output/VERSION-LOG.md` | 查看版本变更历史时 |
