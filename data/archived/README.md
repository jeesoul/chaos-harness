# 归档的 CSV 文件

本目录包含已归档的 UI 设计相关 CSV 文件（v1.3.3 优化时移除）。

## 归档原因

1. **维护成本高** — 9 个 UI CSV 需要持续更新，但使用频率低
2. **价值有限** — Dev-Intelligence 的 BM25 搜索对这些 CSV 的利用率不高
3. **聚焦核心** — chaos-harness 的核心是 Gate 状态机，UI 设计建议是辅助功能

## 归档文件列表

- `ui-animations.csv` (3.2K) — UI 动画效果
- `ui-charts.csv` (2.8K) — 图表组件
- `ui-color-palettes.csv` (16K) — 配色方案
- `ui-components.csv` (5.1K) — UI 组件库
- `ui-product-types.csv` (4.5K) — 产品类型
- `ui-responsive.csv` (2.3K) — 响应式设计
- `ui-styles.csv` (6.4K) — 样式规范
- `ui-typography.csv` (4.6K) — 字体排版
- `ui-ux-guidelines.csv` (6.7K) — UX 指南

**总计:** 9 个文件，约 51KB

## 保留的核心 CSV

- `anti-patterns.csv` — 反模式检测
- `gate-patterns.csv` — Gate 模式
- `iron-law-rules.csv` — 铁律规则
- `prd-quality-rules.csv` — PRD 质量检查
- `test-patterns.csv` — 测试模式
- `ui-patterns.csv` — 通用 UI 模式（保留）

## 如何恢复

如果需要恢复某个 CSV：

```bash
mv data/archived/<filename>.csv data/
```

## 替代方案

如果需要 UI 设计建议，推荐：
- 使用 AI 直接生成（Claude/GPT 对 UI 设计有足够知识）
- 参考在线设计系统（Material Design、Ant Design、Tailwind UI）
- 使用专业设计工具（Figma、Sketch）

---

归档时间: 2026-05-05
版本: v1.3.3
