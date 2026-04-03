# Chaos Harness

<p align="center">
  <strong>确定性 AI Agent 约束框架</strong>
</p>

<p align="center">
  <em>Chaos demands order. Harness provides it.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/Tests-623-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js">
</p>

---

## 为什么需要 Chaos Harness？

AI Agent 在开发中存在**确定性行为缺失**问题：

| 问题 | 表现 | Chaos Harness 解决方案 |
|------|------|----------------------|
| 不可信的完成声明 | "任务完成了" 但无测试输出 | **铁律 IL003**: 必须提供验证证据 |
| 绕过尝试 | "这很简单，跳过测试" | **绕过检测**: 自动识别并反驳 |
| 根因分析缺失 | 直接修复，不调查原因 | **偷懒模式 LP002**: 阻断并要求分析 |
| 约束软化 | 建议性规则被合理化规避 | **铁律替代建议**: 零解释空间 |

---

## 核心特性

### 🏛️ 五条铁律

```
IL001: NO DOCUMENTS WITHOUT VERSION LOCK        # 文档必须在版本目录
IL002: NO HARNESS WITHOUT SCAN RESULTS          # Harness需要扫描数据
IL003: NO COMPLETION CLAIMS WITHOUT VERIFICATION # 完成需要验证证据
IL004: NO VERSION CHANGES WITHOUT USER CONSENT  # 版本变更需用户确认
IL005: NO HIGH-RISK CONFIG WITHOUT APPROVAL     # 敏感配置需审批
```

### 🔄 自纠正机制

| Hook | 触发时机 | 功能 |
|------|---------|------|
| SessionStart | 会话开始 | 注入铁律上下文 |
| PreToolUse | 工具调用前 | 铁律检查 (IL001/IL005) |
| PostToolUse | 工具调用后 | 偷懒检测、学习记录 |
| Stop | 回合结束 | 完成声明验证 (IL003) |
| PreCompact | 对话压缩前 | 保存关键上下文 |

### 🕵️ 偷懒模式检测

| 模式 | 检测条件 | 动作 |
|------|----------|------|
| LP001 | 声称完成但无验证 | 阻断 + 要求验证 |
| LP002 | 跳过根因分析 | 阻断 + 要求分析 |
| LP003 | 长时间无产出 | 施压 + 进度检查 |
| LP004 | 试图跳过测试 | 阻断 + 强制测试 |

---

## 安装

### 方法 1: 双击安装脚本 (推荐)

```bash
# Windows
install.bat          # 双击运行

# macOS/Linux
./install.sh         # 终端运行

# 重启 Claude Code 后使用
/chaos-harness:overview
```

### 方法 2: 手动安装

如果自动安装失败，按以下步骤：

1. **复制文件到插件目录：**
   ```bash
   # Windows
   xcopy /s /e /i "chaos-harness\skills" "%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0\skills\"
   xcopy /s /e /i "chaos-harness\commands" "%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0\commands\"
   xcopy /s /e /i "chaos-harness\.claude-plugin" "%USERPROFILE%\.claude\plugins\cache\chaos-harness\chaos-harness\1.0.0\.claude-plugin\"

   # macOS/Linux
   cp -r skills ~/.claude/plugins/cache/chaos-harness/chaos-harness/1.0.0/
   cp -r commands ~/.claude/plugins/cache/chaos-harness/chaos-harness/1.0.0/
   cp -r .claude-plugin ~/.claude/plugins/cache/chaos-harness/chaos-harness/1.0.0/
   ```

2. **注册插件：**
   编辑 `~/.claude/plugins/installed_plugins.json`，添加：
   ```json
   {
     "chaos-harness@chaos-harness": [{
       "scope": "user",
       "installPath": "~/.claude/plugins/cache/chaos-harness/chaos-harness/1.0.0",
       "version": "1.0.0",
       "installedAt": "2026-04-03T00:00:00.000Z"
     }]
   }
   ```

3. **启用插件：**
   编辑 `~/.claude/settings.json`，添加：
   ```json
   {
     "enabledPlugins": {
       "chaos-harness@chaos-harness": true
     }
   }
   ```

4. **重启 Claude Code**

### 验证安装

运行诊断脚本：
```bash
diagnose-another-machine.bat   # Windows 完整诊断
quick-check.bat                # Windows 快速检查
```

或手动检查：
```bash
# 检查插件是否注册
cat ~/.claude/plugins/installed_plugins.json | grep chaos-harness

# 检查插件是否启用
cat ~/.claude/settings.json | grep chaos-harness

# 检查目录结构
ls ~/.claude/plugins/cache/chaos-harness/chaos-harness/1.0.0/skills/overview/
```

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 命令不显示 | installed_plugins.json 缺少注册 | 运行 install.bat |
| 命令不执行 | settings.json 未启用 | 添加 enabledPlugins |
| 找不到 skill | cache 目录结构不完整 | 检查 skills/ 目录 |
| 用户名不同 | installPath 路径错误 | 手动修正路径 |

### 卸载

```bash
# Windows
install.bat --uninstall

# macOS/Linux
./uninstall.sh
```

---

## 使用

### 自然语言触发

```
扫描当前项目
创建版本 v0.1
生成这个项目的 Harness
列出所有铁律
添加铁律：周五禁止部署
```

### 斜杠命令

```
/chaos-harness:overview             # 主入口
/chaos-harness:project-scanner      # 扫描项目
/chaos-harness:version-locker       # 版本管理
/chaos-harness:harness-generator    # 生成约束
/chaos-harness:workflow-supervisor  # 工作流
/chaos-harness:iron-law-enforcer    # 铁律执行
```

### 示例：完成验证

```
你: 任务完成了

Harness: [IL003] 需要验证证据
         1. 运行测试: npm test / mvn test
         2. 提供输出结果

你: [粘贴测试输出]

Harness: ✓ 验证通过
```

### 示例：绕过检测

```
你: 这是个简单修复，跳过测试？

Harness: 匹配规则: simple-fix
         铁律引用: IL003
         
         简单修改也可能引入回归。所有变更都需要执行测试。
```

---

## 自定义铁律

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "数据库变更前必须创建备份"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE"
        action: block
```

---

## 模板

| 模板 | 技术栈 |
|------|--------|
| `java-spring` | Java 17/21 + Spring Boot 3.x |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x |
| `node-express` | Node.js Express |
| `python-django` | Python Django |
| `generic` | 通用 |

---

## 项目结构

```
chaos-harness/
├── hooks/               # 钩子系统
├── skills/              # Skill 定义
├── commands/            # 命令入口
├── src/core/            # 核心 API
├── templates/           # 配置模板
└── tests/               # 测试套件
```

---

## 开发

```bash
npm install
npm run build
npm test        # 623 测试用例
```

---

## 许可证

[MIT](LICENSE)

---

<p align="center"><strong>Chaos demands order. Harness provides it.</strong></p>