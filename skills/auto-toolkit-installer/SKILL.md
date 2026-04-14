---
name: auto-toolkit-installer
description: "自动检测并安装 Chaos Harness 依赖的工具链。触发词：工具链、安装工具"
license: MIT
version: "1.3.0"
---

# Auto Toolkit Installer

## 核心思维

**工具链是能力的延伸，不是摆设。**

检测 → 安装 → 验证，三步完成。不兜圈子，不假装复杂。

## 检测工具

| 工具 | 用途 | 插件 ID |
|------|------|--------|
| skill-creator | 创建业务场景专属 skill | `skill-creator@claude-plugins-official` |
| superpowers-chrome | Chrome DevTools MCP 浏览器自动化 | `superpowers-chrome@superpowers-marketplace` |
| ui-ux-pro-max | UI/UX 设计评审 | `ui-ux-pro-max@ui-ux-pro-max-skill` |
| webapp-testing | Playwright 自动化测试 | `webapp-testing@anthropics/skills` |

## 安装流程

1. **检测** — `claude plugins list` 看已安装了什么
2. **安装** — 缺失的逐个安装
3. **验证** — 再次 `claude plugins list` 确认

```bash
# 检测网络
curl -s --max-time 5 https://github.com > /dev/null && echo "GitHub 直连可用" || echo "需要镜像"
```

## 镜像加速（国内用户）

| 类型 | 官方源 | 镜像源 |
|------|--------|--------|
| GitHub | `github.com` | `kgithub.com` / `ghproxy.com` |
| npm | `registry.npmjs.org` | `registry.npmmirror.com` |

## 安装命令

```bash
# skill-creator
claude plugins install skill-creator@claude-plugins-official

# superpowers-chrome
claude plugins install superpowers-chrome@superpowers-marketplace

# ui-ux-pro-max
claude plugins install ui-ux-pro-max@ui-ux-pro-max-skill

# webapp-testing
claude plugins install webapp-testing@anthropics/skills
```

## 与工作流集成

| 阶段 | 工具 | 作用 |
|------|------|------|
| W01 需求 | skill-creator | 生成需求分析 skill |
| W03 架构 | ui-ux-pro-max | UI/UX 评审 |
| W07 测试 | webapp-testing | Playwright 自动化 |

## 快捷命令

| 你说 | 动作 |
|------|------|
| "检测工具链" | 列出已安装和缺失的工具 |
| "安装缺失工具" | 安装所有缺失的 |
| "使用镜像安装" | 用国内镜像源安装 |
