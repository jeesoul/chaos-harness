# Chaos Harness (万物入侵)

> **Chaos demands order. Harness provides it.**
> 
> 混沌需要秩序，Harness 提供秩序。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个为 Claude Code 设计的智能项目入侵系统，实现项目扫描、版本约束、Harness 生成、偷懒检测和全流程工作流管理。

## 功能特性

| 模块 | 功能 | 说明 |
|------|------|------|
| 🔍 **项目扫描器** | Scanner | 检测项目类型 (Java/Node/Python)、环境、依赖，输出置信度评分 |
| 📦 **版本管理器** | Version Manager | 锁定版本号，防止文档混乱，session 内不可更改 |
| 🔧 **环境修复器** | Environment Fixer | 检测问题（JDK 兼容性、私服连通性），提供修复指导 |
| 📋 **Harness 生成器** | Harness Generator | 生成铁律、防绕过规则、Red Flags 检测，5 个预设模板 |
| 🔄 **工作流引擎** | Workflow Engine | 12 阶段工作流，自适应项目规模 (small/medium/large) |
| 🖥️ **MCP Server** | 17 个工具 | 通过 Model Context Protocol 与 Claude Code 集成 |

## 五条铁律

| ID | 铁律 | 说明 |
|----|------|------|
| IL001 | 无版本锁定，不生成文档 | 所有输出必须在版本目录下 |
| IL002 | 无扫描结果，不生成 Harness | Harness 需要项目扫描数据 |
| IL003 | 无验证证据，不声称完成 | 完成声明需要实际验证 |
| IL004 | 无用户同意，不更改版本 | 版本变更需要用户确认 |
| IL005 | 无明确批准，不改高风险配置 | 敏感配置修改需要批准 |

## 偷懒模式检测

系统内置监工机制，自动检测 6 种偷懒模式：

| ID | 模式 | 严重程度 |
|----|------|----------|
| LP001 | 声称完成但无验证证据 | Critical |
| LP002 | 跳过根因分析直接修复 | Critical |
| LP003 | 长时间无产出 | Warning |
| LP004 | 试图跳过测试 | Critical |
| LP005 | 擅自更改版本号 | Critical |
| LP006 | 自动处理高风险配置 | Critical |

---

## 安装

### 方式一：从 GitHub 克隆安装（推荐）

**步骤 1：克隆仓库**

```bash
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
```

**步骤 2：安装依赖并构建**

```bash
npm install
npm run build
```

**步骤 3：运行安装脚本**

**macOS / Linux:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
install.bat
```

**步骤 4：重启 Claude Code**

安装脚本会自动：
- 复制插件到 `~/.claude/plugins/chaos-harness/`
- 配置 MCP Server 到 Claude Code 配置文件

### 方式二：手动配置

如果安装脚本无法运行，可以手动配置：

**步骤 1：克隆并构建**

```bash
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
npm install
npm run build
```

**步骤 2：配置 Claude Code**

编辑 Claude Code 配置文件：
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

添加以下内容：

```json
{
  "mcpServers": {
    "chaos-harness": {
      "command": "node",
      "args": ["/你的路径/chaos-harness/bin/mcp-server.js"],
      "cwd": "/你的路径/chaos-harness"
    }
  }
}
```

**步骤 3：重启 Claude Code**

---

## 使用方式

安装完成后，在 Claude Code 中直接对话即可使用：

### 扫描项目

```
用户: 帮我扫描当前项目
Claude: [调用 chaos_scan 工具]
        项目类型: java-spring
        置信度: 95%
        语言: Java 17
        构建工具: Maven
```

### 生成 Harness

```
用户: 生成这个项目的 Harness
Claude: [调用 chaos_generate_harness 工具]
        已生成 Harness，包含:
        - 5 条铁律
        - 10 条防绕过规则
        - 6 个漏洞封堵模式
```

### 检测偷懒模式

```
用户: 检测 agent-1 是否有偷懒行为
Claude: [调用 chaos_detect_laziness 工具]
        检测到:
        - LP001: 声称完成但无验证证据 (Critical)
        建议: 要求提供验证证据
```

### 检测绕过尝试

```
用户: 这个修复很简单，可以跳过测试吗？
Claude: [调用 chaos_detect_bypass 工具]
        ⚠️ 检测到绕过尝试！
        
        匹配规则: simple-fix
        铁律引用: IL003
        
        反驳理由:
        即使看起来简单的修复也可能引入回归问题。
        铁律 IL003 要求所有完成声明必须有验证证据。
```

---

## MCP 工具列表 (17个)

| 分类 | 工具 | 说明 |
|------|------|------|
| Scanner | `chaos_scan` | 扫描项目 |
| Scanner | `chaos_scan_report` | 生成扫描报告 |
| Version | `chaos_detect_versions` | 检测版本目录 |
| Version | `chaos_create_version` | 创建版本目录 |
| Version | `chaos_lock_version` | 锁定版本 |
| Version | `chaos_validate_version` | 验证版本格式 |
| Harness | `chaos_generate_harness` | 生成 Harness |
| Harness | `chaos_validate_harness` | 验证 Harness |
| Harness | `chaos_list_templates` | 列出模板 |
| Harness | `chaos_find_best_template` | 查找最佳模板 |
| Harness | `chaos_detect_bypass` | 检测绕过尝试 |
| Workflow | `chaos_create_workflow` | 创建工作流 |
| Workflow | `chaos_get_workflow_status` | 获取工作流状态 |
| Workflow | `chaos_detect_laziness` | 检测偷懒模式 |
| Workflow | `chaos_get_stage_definition` | 获取阶段定义 |
| Workflow | `chaos_list_stages` | 列出所有阶段 |
| Workflow | `chaos_list_iron_laws` | 列出铁律 |

---

## 模板

Chaos Harness 包含 5 个预设模板：

| 模板 | 目标技术栈 | 特点 |
|------|------------|------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | 现代Java栈 |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | 兼容历史项目 |
| `node-express` | Node.js Express | REST API 支持 |
| `python-django` | Python Django | Web框架 |
| `generic` | 通用 | 兜底模板 |

---

## 自适应流程

工作流阶段根据项目规模自动调整：

| 规模 | 定义 | 必经阶段 | 可跳过阶段 |
|------|------|---------|-----------|
| Small | ≤5 文件, ≤100 行 | 5 个 | W02, W04, W07 |
| Medium | 5-20 文件, 100-500 行 | 8 个 | W06 |
| Large | ≥20 文件, ≥500 行 | 全部 12 个 | 无 |

---

## API 参考（npm 包使用）

如果你想在代码中直接使用：

```typescript
import {
  scan,
  VersionManager,
  generateHarness,
  createWorkflowExecutor,
  quickDetectLaziness
} from 'chaos-harness';

// 扫描项目
const result = await scan({ projectRoot: './my-project' });

// 版本管理
const vm = new VersionManager('./output');
await vm.initialize({ autoCreate: true, defaultVersion: 'v0.1' });

// 生成 Harness
const harness = await generateHarness({
  scanResult: result,
  outputPath: './output/v0.1/Harness'
});

// 检测偷懒模式
const patterns = quickDetectLaziness('agent-1', {
  claimedCompletion: true,
  ranVerification: false
});
```

---

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

---

## 卸载

**macOS / Linux:**
```bash
./install.sh --uninstall
```

**Windows:**
```cmd
install.bat --uninstall
```

---

## 许可证

[MIT](./LICENSE)

---

*Chaos demands order. Harness provides it.*