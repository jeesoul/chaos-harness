# Chaos Harness (万物入侵)

> **Chaos demands order. Harness provides it.**
> 
> 混沌需要秩序，Harness 提供秩序。

[![npm version](https://img.shields.io/npm/v/chaos-harness.svg)](https://www.npmjs.com/package/chaos-harness)
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

```bash
npm install chaos-harness
```

---

## 与 Claude Code 集成

### 方式一：作为 MCP Server 集成（推荐）

MCP (Model Context Protocol) 是 Claude Code 的标准扩展协议。

**步骤 1：安装包**

```bash
npm install -g chaos-harness
```

**步骤 2：配置 Claude Code**

在 Claude Code 配置文件中添加 MCP Server：

**配置文件位置：**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**配置内容：**

```json
{
  "mcpServers": {
    "chaos-harness": {
      "command": "chaos-harness-mcp"
    }
  }
}
```

**步骤 3：重启 Claude Code**

重启后，Claude Code 会自动加载 17 个 Chaos Harness 工具。

**使用示例：**

在 Claude Code 中直接对话：

```
用户: 帮我扫描当前项目
Claude: [调用 chaos_scan 工具]
        项目类型: java-spring
        置信度: 95%
        ...

用户: 生成这个项目的 Harness
Claude: [调用 chaos_generate_harness 工具]
        已生成 Harness，包含 5 条铁律...

用户: 我觉得这个修复很简单，可以跳过测试吗？
Claude: [调用 chaos_detect_bypass 工具]
        ⚠️ 检测到绕过尝试！铁律 IL003：NO COMPLETION CLAIMS WITHOUT VERIFICATION
```

### 方式二：作为 Skill 集成

如果你想创建一个 Claude Code Skill：

**步骤 1：创建 Skill 目录**

```bash
mkdir -p ~/.claude/skills/chaos-harness
```

**步骤 2：创建 SKILL.md**

```markdown
# Chaos Harness Skill

Chaos demands order. Harness provides it.

## 功能

- 项目扫描与类型检测
- 版本锁定与约束
- Harness 生成（铁律、防绕过）
- 偷懒模式检测
- 工作流管理

## 使用

当用户请求以下操作时自动激活：
- 扫描项目
- 生成 Harness
- 检测偷懒
- 创建工作流

## 工具

使用 MCP Server 提供的 17 个工具。
```

**步骤 3：配置 Claude Code**

在项目根目录创建 `.claude/settings.json`：

```json
{
  "skills": ["chaos-harness"]
}
```

---

## 方式三：作为 npm 包使用

直接在代码中导入使用：

```typescript
import {
  scan,
  VersionManager,
  generateHarness,
  createWorkflowExecutor,
  quickDetectLaziness
} from 'chaos-harness';

// 1. 扫描项目
const result = await scan({ projectRoot: './my-project' });
console.log(`项目类型: ${result.projectType.type}`);
console.log(`置信度: ${result.projectType.confidence}`);

// 2. 版本管理
const vm = new VersionManager('./output');
await vm.initialize({ autoCreate: true, defaultVersion: 'v0.1' });

// 3. 生成 Harness
const harness = await generateHarness({
  scanResult: result,
  outputPath: './output/v0.1/Harness'
});

// 4. 创建工作流
const workflow = createWorkflowExecutor({
  projectRoot: './my-project',
  fileCount: 10,
  lineCount: 200,
  enableSupervisor: true
});

// 5. 检测偷懒模式
const patterns = quickDetectLaziness('agent-1', {
  claimedCompletion: true,
  ranVerification: false
});
if (patterns.includes('LP001')) {
  console.log('⚠️ 声称完成但无验证证据！');
}
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

## API 参考

### 扫描器 (Scanner)

```typescript
import { scan, generateScanReport } from 'chaos-harness';

// 扫描项目
const result = await scan({
  projectRoot: './project',
  configFilePriority: ['pom.xml', 'package.json', 'requirements.txt']
});

// 生成报告
const report = generateScanReport(result, 'v0.1');
```

### 版本管理器 (Version Manager)

```typescript
import { VersionManager, parseVersion, validateVersion } from 'chaos-harness';

const vm = new VersionManager('./output');

await vm.initialize({
  autoCreate: true,        // 自动创建版本目录
  defaultVersion: 'v0.1',  // 默认版本
  specifiedVersion: 'v1.0' // 指定版本
});

// 检查锁定状态
const isLocked = await vm.isLocked();

// 获取当前版本
const version = await vm.getCurrentVersion();

// 解析和验证版本号
const parsed = parseVersion('v1.2');
const valid = validateVersion('v1.2');
```

### Harness 生成器

```typescript
import {
  generateHarness,
  validateHarness,
  detectBypassAttempt,
  generateRebuttal
} from 'chaos-harness';

// 生成 Harness
const harness = await generateHarness({
  scanResult: result,
  outputPath: './output/v0.1/Harness',
  template: 'java-spring'
});

// 验证 Harness
const validation = validateHarness(harness);

// 检测绕过尝试
const bypass = detectBypassAttempt('这是一个简单的修复');
if (bypass.detected) {
  const rebuttal = generateRebuttal(bypass.matchedRule);
  console.log(rebuttal);
}
```

### 工作流引擎

```typescript
import {
  createWorkflowExecutor,
  determineProjectScale,
  quickDetectLaziness
} from 'chaos-harness';

// 判断项目规模
const scale = determineProjectScale(10, 300);
// 返回: 'small' | 'medium' | 'large'

// 创建工作流执行器
const workflow = createWorkflowExecutor({
  projectRoot: './project',
  fileCount: 10,
  lineCount: 200,
  enableSupervisor: true
});

// 获取当前阶段
const stage = workflow.getCurrentStage();

// 获取进度
const progress = workflow.getProgress();

// 请求跳过 (必经阶段会被拒绝)
const result = workflow.requestSkip('W08_development', '测试原因');
console.log(result.allowed); // false 对于必经阶段
```

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

## 许可证

[MIT](./LICENSE)

---

*Chaos demands order. Harness provides it.*