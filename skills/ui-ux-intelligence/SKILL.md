---
name: ui-ux-intelligence
description: "UI/UX 设计智能引擎 — 161 色板、50 风格、57 字体配对、60 组件规格、40 动画规则、30 响应式断点、50 产品类型、50 UX 指南、25 图表类型。触发词：设计、UI、UX、配色、字体、排版、组件、动画、无障碍、响应式、暗色模式、风格、产品页面"
license: MIT
version: "1.3.2"
---

# UI/UX Intelligence Engine

Chaos Harness 的完整设计智能系统，超越纯知识库插件，整合 Gate 验证确保设计质量。

## 知识域

| 域 | 数据量 | CSV 文件 |
|---|--------|---------|
| 色板 | 161 套 | `ui-color-palettes.csv` |
| 风格 | 50 种 | `ui-styles.csv` |
| 字体配对 | 57 组 | `ui-typography.csv` |
| 组件规格 | 60 条 | `ui-components.csv` |
| 动画规则 | 40 条 | `ui-animations.csv` |
| 响应式断点 | 30 条 | `ui-responsive.csv` |
| 产品类型 | 50 种 | `ui-product-types.csv` |
| UX 指南 | 50 条 | `ui-ux-guidelines.csv` |
| 图表类型 | 25 种 | `ui-charts.csv` |

**合计：523 条设计知识**

## 使用场景

### 1. 设计决策支持

当用户要求设计 UI 页面/组件时：
1. 识别产品类型 → 查 `ui-product-types.csv` 获取推荐风格/配色/布局
2. 选择色板 → 从 `ui-color-palettes.csv` 按 mood/stack 匹配
3. 选择字体配对 → 从 `ui-typography.csv` 按 use_case 匹配
4. 选择风格 → 从 `ui-styles.csv` 按 category 匹配

### 2. 组件生成

生成组件时必须遵守 `ui-components.csv` 规格：
- 按钮：height 40-48px, padding 0 16px, corner-radius 8px
- 输入框：height 44px, padding 0 12px, focus-ring 2px solid #3b82f6
- 卡片：padding 24px, elevation 0 1px 3px rgba(0,0,0,0.12)
- 表格：row-height, cell-padding 按 spec

### 3. 动画选择

根据交互类型从 `ui-animations.csv` 选择：
- 进入动画：duration 150-300ms, ease-out
- 退出动画：duration 150-250ms, ease-in
- 交互反馈：duration 100-200ms
- 加载动画：duration 800-1600ms
- 必须尊重 `prefers-reduced-motion`

### 4. 无障碍检查

每个 UI 生成必须通过以下检查（来自 `ui-ux-guidelines.csv`）：
- [ ] 对比度 ≥ 4.5:1（正文）/ ≥ 3:1（大文字）
- [ ] 触摸目标 ≥ 44×44px
- [ ] 所有图标按钮有 aria-label
- [ ] 焦点环可见
- [ ] 表单字段有关联 label
- [ ] 错误消息在字段下方显示
- [ ] 不只用颜色传达信息

### 5. 响应式设计

根据 `ui-responsive.csv`：
- Mobile XS (320px): single-column, 16px gutter
- Tablet (768px): two-column, 16px gutter
- Desktop (1280px): 12-column, 24px gutter
- 所有间距使用 8px 基准网格

### 6. 图表选择

根据数据类型从 `ui-charts.csv` 选择：
- 比较数据 → Bar Chart
- 趋势数据 → Line Chart / Area Chart
- 组成数据 → Pie Chart / Treemap
- 关系数据 → Scatter Plot / Network Graph
- 分布数据 → Heat Map / Box Plot

## Gate 集成

UI 生成后必须通过 `gate-quality-ui` 验证：
- 对比度检查（硬 Gate，WCAG 4.5:1）
- 触摸目标检查（硬 Gate，44px min）
- 语义 HTML 检查（硬 Gate）
- 焦点环检查（硬 Gate）
- 表单标签检查（硬 Gate）

验证器: `scripts/ui-quality-validator.mjs`

## References

| 文件 | 何时加载 |
|------|---------|
| `data/ui-color-palettes.csv` | 需要色板推荐时 |
| `data/ui-styles.csv` | 需要风格推荐时 |
| `data/ui-typography.csv` | 需要字体配对时 |
| `data/ui-components.csv` | 需要组件规格时 |
| `data/ui-animations.csv` | 需要动画参数时 |
| `data/ui-responsive.csv` | 需要响应式方案时 |
| `data/ui-product-types.csv` | 需要产品类型推荐时 |
| `data/ui-ux-guidelines.csv` | 需要 UX 检查时 |
| `data/ui-charts.csv` | 需要图表推荐时 |
