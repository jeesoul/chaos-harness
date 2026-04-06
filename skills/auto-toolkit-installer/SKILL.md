---
name: auto-toolkit-installer
description: 自动检测并安装 Chaos Harness 依赖的自动化工具链 (webapp-testing, skill-creator, Chrome DevTools MCP)，支持镜像加速
---

# Auto Toolkit Installer

自动检测并安装 Chaos Harness 完整自动化工具链。

## 检测的工具

| 工具 | 用途 | 插件ID |
|------|------|--------|
| **skill-creator** | 自动创建业务场景专属 skill | `skill-creator@claude-plugins-official` |
| **superpowers-chrome** | Chrome DevTools MCP (浏览器自动化) | `superpowers-chrome@superpowers-marketplace` |
| **ui-ux-pro-max** | UI/UX 设计评审 + Playwright 集成 | `ui-ux-pro-max@ui-ux-pro-max-skill` |
| **webapp-testing** | Playwright 自动化测试 (可选) | `anthropics/skills:webapp-testing` |

## 使用方法

### 快速检测

```bash
# 使用检测脚本
./scripts/detect-toolkit.sh          # macOS/Linux
scripts\detect-toolkit.bat           # Windows
```

### 安装工具

```bash
# 安装所有缺失工具
./scripts/install-toolkit.sh install          # macOS/Linux (官方源)
./scripts/install-toolkit.sh install --mirror # macOS/Linux (镜像加速)

scripts\install-toolkit.bat install           # Windows
scripts\install-toolkit.bat install --mirror  # Windows (显示镜像方法)
```

### Claude Code 内调用

```
你: 检测工具链状态
你: 安装缺失的工具
你: 使用镜像安装工具链
```

## 镜像加速配置

针对国内网络环境，自动使用以下镜像源：

| 工具 | 官方源 | 镜像源 (国内加速) |
|------|--------|------------------|
| GitHub 仓库 | `github.com` | `gitclone.com` / `hub.fastgit.xyz` / `kgithub.com` |
| npm 包 | `registry.npmjs.org` | `registry.npmmirror.com` (淘宝镜像) |
| Claude Plugins | Claude 官方 marketplace | 直连 (暂无镜像) |

**镜像配置文件：**

```yaml
# ~/.claude/harness/mirror-config.yaml
mirrors:
  github:
    official: "github.com"
    alternatives:
      - "gitclone.com"
      - "hub.fastgit.xyz"
      - "kgithub.com"
      - "ghproxy.com"
      
  npm:
    official: "registry.npmjs.org"
    alternatives:
      - "registry.npmmirror.com"
      - "npm.taobao.org"
      
  playwright:
    browsers:
      official: "playwright.azureedge.net"
      alternatives:
        - "playwright-browser.azureedge.net"  # 直连
```

## 自动安装流程

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 检测已安装插件                                      │
│  → 执行 claude plugins list                                  │
│  → 解析输出，标记已安装/未安装                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 网络环境检测                                        │
│  → 测试 github.com 连通性                                    │
│  → 失败 → 自动切换镜像源                                     │
│  → 记录最优镜像到配置                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 安装缺失工具                                        │
│  → 使用最优镜像源                                            │
│  → 执行 claude plugins install                               │
│  → 失败 → 尝试下一个镜像                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 验证安装                                            │
│  → 再次执行 claude plugins list                              │
│  → 确认所有工具已安装                                        │
│  → 输出安装报告                                              │
└─────────────────────────────────────────────────────────────┘
```

## 安装命令详解

### skill-creator

**用途：** 自动创建业务场景专属 skill，无需手动编写 SKILL.md

```bash
# 官方安装
claude plugins install skill-creator@claude-plugins-official

# GitHub 直连
claude plugins marketplace add https://github.com/anthropics/claude-plugins-official
claude plugins install skill-creator@anthropics/claude-plugins-official

# 镜像安装 (国内加速)
# 先克隆镜像仓库
git clone https://kgithub.com/anthropics/claude-plugins-official.git
claude plugins marketplace add ./claude-plugins-official
claude plugins install skill-creator@claude-plugins-official
```

### superpowers-chrome (Chrome DevTools MCP)

**用途：** 通过 Chrome DevTools Protocol 控制浏览器，实现 DOM 操作、网络监控、性能分析

```bash
# 官方安装
claude plugins install superpowers-chrome@superpowers-marketplace

# 已在本地安装验证 ✅
# 可通过 mcp__plugin_superpowers-chrome_chrome__use_browser 工具调用
```

### ui-ux-pro-max

**用途：** UI/UX 设计评审 + Playwright 测试脚本自动生成

```bash
# 官方安装
claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill

# GitHub 镜像
git clone https://ghproxy.com/https://github.com/NicsterV2/ui-ux-pro-max-skill.git
claude plugins marketplace add ./ui-ux-pro-max-skill
claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill
```

### webapp-testing (可选)

**用途：** Playwright 自动化测试 - 自己写脚本、启动浏览器、跑测试、截屏、自动调试

```bash
# Anthropic Skills 安装
claude plugins marketplace add https://github.com/anthropics/skills
claude plugins install webapp-testing@anthropics/skills

# 镜像安装
git clone https://kgithub.com/anthropics/skills.git
claude plugins marketplace add ./skills
claude plugins install webapp-testing@anthropics/skills
```

## 检测脚本示例

```bash
#!/bin/bash
# detect-toolkit.sh

echo "=== Chaos Harness Toolkit Detection ==="

# 检测 skill-creator
if claude plugins list | grep -q "skill-creator"; then
  echo "✅ skill-creator: 已安装"
else
  echo "❌ skill-creator: 未安装"
  echo "   安装命令: claude plugins install skill-creator@claude-plugins-official"
fi

# 检测 superpowers-chrome
if claude plugins list | grep -q "superpowers-chrome"; then
  echo "✅ superpowers-chrome: 已安装"
else
  echo "❌ superpowers-chrome: 未安装"
  echo "   安装命令: claude plugins install superpowers-chrome@superpowers-marketplace"
fi

# 检测 ui-ux-pro-max
if claude plugins list | grep -q "ui-ux-pro-max"; then
  echo "✅ ui-ux-pro-max: 已安装"
else
  echo "❌ ui-ux-pro-max: 未安装"
  echo "   安装命令: claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill"
fi

# 网络检测
echo ""
echo "=== 网络环境检测 ==="
if curl -s --max-time 5 https://github.com > /dev/null; then
  echo "✅ GitHub 直连: 可用"
else
  echo "⚠️ GitHub 直连: 不可用，将使用镜像"
  echo "   推荐镜像: kgithub.com / ghproxy.com"
fi
```

## 与 Harness 工作流集成

工具链安装后，可自动参与 Harness 工作流：

| 工作流阶段 | 可用工具 | 集成方式 |
|------------|----------|----------|
| W01 需求理解 | skill-creator | 自动生成需求分析 skill |
| W03 架构设计 | ui-ux-pro-max | UI/UX 原型评审 |
| W07 集成测试 | webapp-testing + superpowers-chrome | Playwright 自动化 + DevTools 监控 |
| W06 代码审查 | 所有工具 | 多维度验证 |

## 铁律约束

工具链安装受以下铁律约束：

- **IL-AUTO-001**: NO AUTOMATION WITHOUT TOOLKIT CHECK (自动化测试前必须检测工具链)
- **IL-AUTO-002**: NO BYPASS ON INSTALL FAILURE (安装失败必须报错，不允许静默跳过)

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| GitHub 连接超时 | 国内网络限制 | 使用镜像源 `kgithub.com` |
| 插件安装失败 | marketplace 未注册 | 先执行 `claude plugins marketplace add` |
| Playwright 浏览器下载慢 | Azure Edge 服务器慢 | 设置代理或使用国内 CDN |
| skill-creator 无法使用 | 权限不足 | 检查 `~/.claude/plugins` 目录权限 |

## 代理配置 (可选)

如果使用代理，可配置环境变量：

```bash
# HTTP 代理
export HTTPS_PROXY=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890

# 或在 Claude Code 中配置
# ~/.claude/settings.json
{
  "proxy": {
    "https": "http://127.0.0.1:7890"
  }
}
```