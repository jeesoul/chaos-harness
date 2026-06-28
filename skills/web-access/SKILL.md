---
name: web-access
description: "所有联网操作必须通过此 skill 处理：搜索、网页抓取、登录态操作、CDP 浏览器自动化。触发词：搜索、网页、CDP、浏览器、抓取、小红书、微博、推特"
license: MIT
github: https://github.com/eze-is/web-access
version: "2.4.3"
---

# Web Access

## 核心思维

**像人一样思考，兼顾高效与适应性地完成任务。**

带着目标进入，边看边判断，遇到阻碍就解决，发现内容不够就深入——全程围绕「我要达成什么」做决策。不提前规划所有步骤，而是根据实时结果调整。

## 前置检查

联网前先检查 CDP 模式可用性：

```bash
node "${CLAUDE_SKILL_DIR}/scripts/check-deps.mjs"
```

未通过时引导用户完成设置：
- **Node.js 22+**：必需（使用原生 WebSocket）。版本低于 22 可用但需安装 `ws` 模块。
- **Chrome remote-debugging**：在 Chrome 地址栏打开 `chrome://inspect/#remote-debugging`，勾选 **"Allow remote debugging for this browser instance"** 即可，可能需要重启浏览器。

检查通过后必须向用户展示以下须知，再启动 CDP Proxy 执行操作：

```
温馨提示：部分站点对浏览器自动化操作检测严格，存在账号封禁风险。已内置防护措施但无法完全避免，Agent 继续操作即视为接受。
```

## 联网工具选择

确保信息真实性：一手信息优于二手信息。搜索引擎和聚合平台是信息发现入口，多次搜索无质的改进时，升级到一手来源。

| 场景 | 工具 |
|------|------|
| 搜索摘要或关键词，发现信息来源 | **WebSearch** |
| URL 已知，需要定向提取特定信息 | **WebFetch** |
| URL 已知，需要原始 HTML 源码 | **curl** |
| 非公开内容、反爬严格的平台 | **浏览器 CDP** |
| 需要登录态、交互操作 | **浏览器 CDP** |

**Jina**（可选预处理层）：`r.jina.ai/example.com`，将网页转为 Markdown 节省 token。适合文章、博客、文档；对数据面板等非文章结构页面可能提取错误。

## 浏览器 CDP 模式

通过 CDP Proxy 直连用户日常 Chrome，天然携带登录态，无需启动独立浏览器。所有操作在自己创建的后台 tab 中进行，保持最小侵入。

### 启动

```bash
node "${CLAUDE_SKILL_DIR}/scripts/check-deps.mjs"
```

### Proxy API

所有操作通过 curl 调用 HTTP API：

```bash
# 列出用户已打开的 tab
curl -s http://localhost:3456/targets

# 创建新后台 tab
curl -s "http://localhost:3456/new?url=https://example.com"

# 执行任意 JS：读写 DOM、提取数据、操控元素、提交表单
curl -s -X POST "http://localhost:3456/eval?target=ID" -d 'document.title'

# 捕获页面渲染状态
curl -s "http://localhost:3456/screenshot?target=ID&file=/tmp/shot.png"

# 导航、后退
curl -s "http://localhost:3456/navigate?target=ID&url=URL"
curl -s "http://localhost:3456/back?target=ID"

# 点击
curl -s -X POST "http://localhost:3456/click?target=ID" -d 'button.submit'

# 真实鼠标点击（CDP Input.dispatchMouseEvent）
curl -s -X POST "http://localhost:3456/clickAt?target=ID" -d 'button.upload'

# 文件上传
curl -s -X POST "http://localhost:3456/setFiles?target=ID" -d '{"selector":"input[type=file]","files":["/path/to/file.png"]}'

# 滚动（触发懒加载）
curl -s "http://localhost:3456/scroll?target=ID&y=3000"

# 关闭 tab
curl -s "http://localhost:3456/close?target=ID"
```

### 操作原则

- **先了解页面结构，再决定下一步**。不需要提前规划所有步骤。
- **站点内交互产生的链接是可靠的**：通过可交互单元自然到达的 URL 携带完整上下文。
- **程序化 vs GUI 交互**：根据目标平台特征选择。GUI 交互也可作为程序化方式的探测。
- **任务结束后关闭自己创建的 tab**，保留用户原有 tab。

### 登录判断

核心问题：**目标内容拿到了吗？**

先尝试获取目标内容。只有确认目标内容无法获取且判断登录能解决时，才告知用户：
> "当前页面在未登录状态下无法获取[具体内容]，请在你的 Chrome 中登录 [网站名]，完成后告诉我继续。"

### 媒体资源提取

判断内容在图片里时，用 `/eval` 从 DOM 直接拿图片 URL，再定向读取——比全页截图精准得多。

## 信息核实

核实目标是一手来源，而非更多二手报道。

| 信息类型 | 一手来源 |
|----------|---------|
| 政策/法规 | 发布机构官网 |
| 企业公告 | 公司官方新闻页 |
| 学术声明 | 原始论文/机构官网 |
| 工具能力/用法 | 官方文档、源码 |

## 站点经验

操作中积累的特定网站经验，按域名存储在 `references/site-patterns/` 下。

确定目标网站后，如果 `references/site-patterns/` 中有匹配的站点文件，必须读取获取先验知识（平台特征、有效模式、已知陷阱）。

CDP 操作成功完成后，如果发现了有必要记录的新经验，主动写入对应的站点经验文件。只写经过验证的事实，不写未确认的猜测。

格式：
```markdown
---
domain: example.com
aliases: [示例, Example]
updated: 2026-03-19
---
## 平台特征
## 有效模式
## 已知陷阱
```

## 并行调研

任务包含多个独立调研目标时，分治给子 Agent 并行执行。

- 子 Agent prompt 中必须写 `必须加载 web-access skill 并遵循指引`
- 描述目标（「获取」「调研」「了解」），避免暗示具体手段的动词（「搜索」「抓取」「爬取」）
- 每个子 Agent 自行创建后台 tab，共享一个 Chrome，通过不同 targetId 操作，无竞态

## 与 Harness 铁律集成

web-access 作为 Harness 参与者，必须遵守铁律约束：

- **IL003**：完成声明必须有验证证据——网页操作完成后必须展示实际获取的内容
- **IL005**：敏感配置操作需要批准——涉及登录态、Cookie 的操作需谨慎

操作上下文会被 `learning-update` hook 自动记录到学习日志，供自学习分析使用。

## 快捷命令

| 你说 | 动作 |
|------|------|
| "搜索 xxx" | 根据内容性质选择 WebSearch/CDP |
| "查看 xxx 网页" | 使用 CDP 浏览器访问 |
| "检查 CDP 状态" | 运行 check-deps.mjs |
| "查看站点经验" | 读取 references/site-patterns/ |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `scripts/cdp-proxy.mjs` | CDP Proxy 主程序，需要查看实现细节时 |
| `scripts/check-deps.mjs` | 前置检查，启动 CDP 前运行 |
| `scripts/match-site.mjs` | 站点经验匹配，确定目标网站后运行 |
| `references/cdp-api.md` | 需要 CDP API 详细参考、JS 提取模式、错误处理时 |
| `references/site-patterns/{domain}.md` | 确定目标网站后，读取对应站点经验 |
