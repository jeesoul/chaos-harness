---
name: version-locker
description: "版本锁定器。**在任何文档生成前自动检查版本锁定状态**。触发词：创建版本、锁定版本、版本管理、v0.1、版本号、版本目录"
---

<STATE-WRITE-REQUIRED>
**版本创建后必须写入状态：**
1. 使用 Edit 工具更新 `.chaos-harness/state.json` 的 current_version
2. 使用 Write 工具创建 `output/{version}/VERSION-LOCK`
3. 使用 Edit 工具追加到 `~/.claude/harness/workflow-log.json`

调用 `shared/state-helpers.md` 中的函数：
- Update-Project-State({ current_version: version })

不写入状态 = 违反 IL001（无版本锁定不能生成文档）
</STATE-WRITE-REQUIRED>

# 版本锁定器 (Version Locker)

## 铁律

```
NO DOCUMENTS WITHOUT VERSION LOCK
NO VERSION CHANGES WITHOUT USER CONSENT
```

## 执行规则

**加载此 skill 后，你必须执行以下步骤：**

### Step 1: 检查现有版本

使用 Glob 工具检查 `output/` 目录下是否存在版本目录：

```
output/
├── v0.1/
├── v1.0/
└── VERSION-LOG.md
```

### Step 2: 版本处理

**情况 A - 无版本：**
1. 建议使用 `v0.1` 作为初始版本
2. 使用 AskUserQuestion 确认版本号
3. 创建版本目录结构

**情况 B - 有现有版本：**
1. 列出所有版本供用户选择
2. 使用 AskUserQuestion 让用户选择
3. 锁定选择的版本

### Step 3: 创建版本目录结构

使用 Bash 创建目录：

```bash
mkdir -p output/{version}/Harness
mkdir -p output/{version}/docs
```

### Step 4: 生成 VERSION-LOCK 文件

使用 Write 工具创建 `output/{version}/VERSION-LOCK`：

```yaml
# VERSION-LOCK
version: {version}
locked_at: {timestamp}
locked_by: chaos-harness
session_id: {session}

iron_law: IL001 - NO DOCUMENTS WITHOUT VERSION LOCK
```

### Step 5: 更新 VERSION-LOG

使用 Write 或 Edit 工具更新 `output/VERSION-LOG.md`

### Step 6: 确认锁定

输出确认信息：

```
✅ 版本已锁定: {version}

当前 Session 内版本号不可更改。
所有后续文档将生成在 output/{version}/ 目录下。

铁律 IL001 生效：所有文档必须在版本目录下生成。
```

## 版本号格式

```
vX.Y

X = 主版本号 (major)
Y = 次版本号 (minor)
```

**有效：** v0.1, v1.0, v2.3
**无效：** v1, 1.0, v1.0.0

## 版本建议

| 场景 | 建议 |
|------|------|
| 新项目首次 | v0.1 |
| 需求确认后 | v1.0 |
| 大版本重构 | vX.0 |
| 功能增强 | vX.Y+1 |

## 铁律检查

### IL001: 无版本锁定，不生成文档

在生成任何文档之前必须检查：
- 版本是否已锁定
- VERSION-LOCK 文件是否存在
- 当前锁定的版本号

### IL004: 无用户同意，不更改版本

如果版本已锁定且用户要更改：
1. 警告当前版本
2. 询问是否确认更改
3. 等待明确同意

## 交互示例

```
用户: 创建版本 v0.1

Claude: [执行 Step 1-6]

✅ 版本已锁定: v0.1

目录结构：
output/v0.1/
├── Harness/
├── docs/
└── VERSION-LOCK

后续所有文档将在此目录下生成。
```