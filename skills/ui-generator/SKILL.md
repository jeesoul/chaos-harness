---
name: ui-generator
description: "从需求直接生成可运行的前端界面。触发词：生成界面、UI生成、生成组件、生成页面"
license: MIT
version: "1.3.2"
---

# UI Generator

## 核心思维

**UI 生成不是画图，而是生成可运行代码。**

生成的每一行代码都必须通过前端铁律检查（类型定义、响应式约束、错误处理），生成结果必须可在浏览器中预览验证（通过 web-access CDP）。

## 前置检查

1. **项目扫描检查**（IL002）：读取 `.chaos-harness/scan-result.json`，确认存在扫描结果。如无，停止并提示先运行 `node <plugin-root>/scripts/project-scanner.mjs`。
2. **框架检测**：读取项目根目录 `package.json`，识别前端框架：
   - `"vue": "^3."` → Vue3
   - `"vue": "^2."` → Vue2
   - `"react"` → React
   - 无匹配 → 回退到静态 HTML
3. **PRD 检查**：确认 `output/{version}/docs/PRD.md` 存在且包含用户故事章节。如无 PRD，先执行 P02。

## 核心流程

### 1. 推导页面清单

读取 PRD 中的用户故事，每个用户故事推导至少一个页面组件：

```
用户故事: "作为用户，我可以登录系统" → LoginPage
用户故事: "作为管理员，我可以查看用户列表" → UserManagementPage
```

页面清单写入 `output/{version}/design/prototypes/README.md`。

### 2. 生成组件代码

对每个页面，根据检测到的框架生成组件：

**Vue3** (`<script setup lang="ts">`):
```vue
<script setup lang="ts">
// 类型定义、响应式声明
</script>

<template>
  <!-- 结构 -->
</template>

<style scoped>
/* 样式 */
</style>
```

**Vue2** (Options API):
```vue
<script>
export default {
  name: 'ComponentName',
  props: {},
  data() { return {} },
  methods: {}
}
</script>
```

**React** (Functional + TS):
```tsx
interface Props { /* 类型定义 */ }

export const ComponentName: React.FC<Props> = ({ ... }) => {
  // hooks、state、副作用
  return ( /* JSX */ );
};
```

**无框架** (静态 HTML):
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>页面标题</title></head>
<body><!-- 内容 --></body>
</html>
```

### 3. 注入铁律约束

每个生成的组件必须内建以下约束：

| 铁律 | 注入方式 |
|------|---------|
| IL-FE001 | 类型定义：Vue3 `lang="ts"`、React `interface Props` |
| IL-FE002 | 关键路径注释：标注需要测试的交互点 |
| IL-FE003 | 错误处理：API 调用包裹 try-catch，显示错误状态 |
| IL-VUE001 | Vue ref 必须标注 `.value` 使用位置 |
| IL-VUE002 | Props 声明为 readonly，不可直接修改 |
| IL-REACT001 | React 组件中 state 不可变 |
| IL-REACT002 | Effect 必须有清理函数（return cleanup） |

### 4. 写入输出

每个页面组件写入 `output/{version}/design/prototypes/{page-name}/`:

```
output/{version}/design/prototypes/
├── README.md               # 页面清单
├── login-page/
│   ├── LoginPage.vue       # Vue 组件
│   └── index.html           # 无框架回退
├── user-management-page/
│   ├── UserManagementPage.vue
│   └── index.html
└── ...
```

### 5. 启动预览

```bash
# 检测 dev server 命令（以下为示意代码，实际实现应通过读取 vite.config.ts
# 等配置文件获取真实端口，或解析 dev server 启动输出）
if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
  npm run dev &  # 通常端口 5173
elif [ -f "vue.config.js" ]; then
  npm run serve &  # 通常端口 8080
elif [ -f "package.json" ] && grep -q "react-scripts" package.json; then
  npm start &  # 通常端口 3000
fi
```

记录实际端口到 `output/{version}/design/generated-ui-log.md`。

### 6. CDP 验证

1. 运行 `node skills/web-access/scripts/check-deps.mjs` 确认 CDP 可用（项目根目录执行）
2. 启动 CDP Proxy（如未运行）
3. 打开 `http://localhost:{port}` 在新 tab
4. 截图验证核心元素可见（文本、按钮、表单）
5. 记录验证结果：
   - 成功 → `cdp_preview_passed: true`
   - 失败 → 记录失败原因到 generated-ui-log.md，`cdp_preview_passed: false`

### 7. 写入记忆

更新 `output/{version}/memory/P03-memory.yaml`：

```yaml
stage: P03
completed_at: {timestamp}
screens_count: {count}
user_flows: [流程列表]
design_review_passed: true/false
revision_count: {count}
# ui-generator 新增字段
ui_generated: true/false
generated_framework: Vue3/React/Vue2/none
generated_components: [组件名称列表]
cdp_preview_passed: true/false
cdp_preview_url: http://localhost:{port}
```

## 框架适配表

| 框架 | 组件格式 | 类型系统 | 状态管理 | 铁律 |
|------|---------|---------|---------|------|
| Vue3 | `<script setup lang="ts">` | TypeScript | Pinia | IL-VUE001~004 |
| Vue2 | Options API | PropTypes/JSDoc | Vuex | IL-VUE001~003 |
| React | Functional + TS | TypeScript | Context/Redux | IL-REACT001~003 |
| 无框架 | 静态 HTML + CSS | 无 | 无 | IL001, IL003 |

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 无项目扫描结果 | 触发 IL002，停止生成，提示先运行 project-scanner |
| 未检测到前端框架 | 回退到生成静态 HTML 原型（index.html + CSS） |
| 铁律检查失败 | 记录到 generated-ui-log.md，修正代码后重新验证 |
| CDP 不可用 | 跳过预览验证，记录警告，标记 `cdp_preview_passed: false` |
| dev server 启动失败 | 检查端口冲突，尝试替代端口，最多重试 2 次后回退 |

## 经验积累

生成的 UI 模式积累到项目根目录下的 `references/ui-patterns/{framework}-{pattern}.md`。
如目录不存在则自动创建。格式：

```markdown
---
framework: vue3
pattern_type: form-layout
updated: 2026-04-14
---
## 平台特征
## 有效模式
## 已知陷阱
```

## 快捷命令

| 你说 | 动作 |
|------|------|
| "生成界面" | 从 PRD 推导页面清单并生成 |
| "生成 {页面名}" | 生成指定页面组件 |
| "预览生成的界面" | 启动 dev server + CDP 验证 |
| "查看生成日志" | 读取 generated-ui-log.md |

## References 索引

| 文件 | 何时加载 |
|------|---------|
| `output/{version}/docs/PRD.md` | 读取用户故事和 MVP 范围时 |
| `.chaos-harness/scan-result.json` | 检测前端框架时 |
| `skills/product-lifecycle/SKILL.md` | 了解 P03 阶段上下文时 |
| `skills/web-access/SKILL.md` | 执行 CDP 预览验证时 |
| `references/ui-patterns/` | 复用已验证的 UI 模式时 |
