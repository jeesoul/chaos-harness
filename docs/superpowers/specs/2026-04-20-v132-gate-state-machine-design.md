# v1.3.2 Gate 状态机 + 硬拦截设计文档

**版本**: v1.3.2
**日期**: 2026-04-20
**状态**: 待实现
**作者**: Claude Code + Chaos Harness

---

## 1. 概述

v1.3.2 的核心差异化能力是 **Gate 状态机 + 硬拦截**。不再堆 Skill，聚焦 Gate 作为拳头产品，做深做透。

### 设计目标

1. **阶段 Gates** — 工作流阶段推进前必须通过 Gate 验证
2. **质量 Gates** — 代码质量检查（测试/铁律/安全），与阶段无关
3. **分级策略** — 关键 Gate 硬阻断（exit 1），非关键 Gate 软警告
4. **真验证** — 检查实际文件内容/测试结果/AST，不做关键词匹配
5. **跨平台** — 统一解决 Windows/Mac/Linux 路径问题
6. **自学习** — 阈值动态调整，缓存智能失效

---

## 2. 整体架构

```
用户操作 (Write/Edit/Bash/Commit)
    │
    ▼
┌─────────────────┐
│   hooks.json     │  ← 触发点：PreToolUse / PostToolUse / Stop
│   (现有增强)     │
└────────┬────────┘
         │ exit 1 阻断
         ▼
┌─────────────────┐
│ gate-machine.mjs │  ← 核心状态机：加载注册表、检查缓存、调度验证
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────────┐ ┌───────────────┐
│gate-     │ │gate-          │
│validator │ │enforcer       │
│.mjs      │ │.mjs           │
└────┬─────┘ └───────┬───────┘
     │               │
     ▼               ▼
  真验证逻辑     硬阻断/软警告
  (AST/测试/      + 错误输出
   文件检查)

┌─────────────────┐
│.chaos-harness/  │
│  gates/         │  ← 持久化层：JSON 状态文件 + 缓存指纹
└─────────────────┘

┌─────────────────┐
│skills/gate-     │  ← 用户交互层：查询/管理/恢复
│manager/SKILL.md │
└─────────────────┘
```

---

## 3. 跨平台路径方案

### 问题根因

1. Windows 使用 `\` 作为路径分隔符，macOS/Linux 使用 `/`
2. Windows CMD/Bash 环境变量语法差异（`%VAR%` vs `$VAR`）
3. 当前 `run-hook.cmd` 只覆盖 Windows，`.sh` 脚本在 Windows Git Bash 下有 CRLF/路径转换问题

### 解决方案：统一路径层

**path-utils.mjs 核心逻辑：**

- `resolvePluginRoot()` — 从 `import.meta.url` 推导插件根目录，不依赖环境变量
- `normalizePath()` — 统一转换为 POSIX 风格
- `formatPathForShell()` — 根据 `process.platform` 转换

**hooks.json 统一入口：**

所有 hooks 统一通过 `node` 调用 `.mjs` 文件，避免 shell 脚本的跨平台问题：

```json
"command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/gate-machine.mjs\" --gate session-start --root \"${CLAUDE_PLUGIN_ROOT}\""
```

---

## 4. Gate 定义

### Gate 注册表结构

`gate-registry.json` 定义所有 Gates，包含：

- `id` — 唯一标识
- `type` — `stage` 或 `quality`
- `level` — `hard`（硬阻断）或 `soft`（软警告）
- `validators` — 验证器列表
- `dependsOn` — 依赖的其他 Gates
- `trigger` — 触发时机（`pre-write`, `pre-commit`, `stage-transition`）
- `cachePolicy` — 缓存策略（`always`, `on-change`, `never`）

### Hook 事件映射表

Registry 中的 `trigger` 需要映射到 `hooks.json` 的实际事件：

| Registry trigger | hooks.json 映射 | 说明 |
|-----------------|-----------------|------|
| `pre-write` | `PreToolUse` matcher: `Write\|Edit` | 写入/编辑前触发 |
| `pre-commit` | `PreToolUse` matcher: `Bash`，命令含 `commit` | 提交前触发 |
| `stage-transition` | Skill: `gate-manager` 手动调用或 W08 完成后自动检测 | 阶段切换 |
| `session-start` | `SessionStart` matcher: `startup\|resume` | 会话启动 |

### 跨平台迁移计划

当前 `hooks.json` 中所有 `run-hook.cmd` 调用逐步迁移到 `.mjs`：

| 现有 hook | 迁移目标 | 优先级 |
|-----------|---------|--------|
| `run-hook.cmd iron-law-check` | `scripts/iron-law-check.mjs`（已有） | P0 |
| `run-hook.cmd learning-update` | `scripts/learning-update.mjs`（已有） | P1 |
| `run-hook.cmd session-start` | `scripts/gate-machine.mjs --gate session-start` | P0 |
| `run-hook.cmd stop` | `scripts/stop.mjs`（已有） | P1 |
| `run-hook.cmd laziness-detect` | `scripts/laziness-detect.mjs`（已有） | P1 |
| `run-hook.cmd workflow-track` | `scripts/workflow-track.mjs`（已有） | P2 |
| `run-hook.cmd pre-compact` | `scripts/pre-compact.mjs`（已有） | P2 |
| `run-hook.cmd project-pattern-writer` | `scripts/project-pattern-writer.mjs`（已有） | P2 |

所有现有 `.mjs` 脚本已通过 `node` 调用，无需额外迁移。迁移完成后删除 `run-hook.cmd`。

### Gate 列表

| ID | 类型 | Level | 说明 |
|----|------|-------|------|
| gate-w01-requirements | stage | hard | 需求阶段进入检查 |
| gate-w03-architecture | stage | hard | 架构阶段进入检查 |
| gate-w08-development | stage | hard | 开发阶段进入检查 |
| gate-w09-code-review | stage | hard | 代码审查阶段进入检查 |
| gate-w10-testing | stage | hard | 测试阶段进入检查 |
| gate-w12-release | stage | hard | 发布阶段进入检查 |
| gate-quality-iron-law | quality | hard | 铁律违规零容忍 |
| gate-quality-tests | quality | hard | 测试必须通过 |
| gate-quality-format | quality | soft | 代码格式建议 |

### Gate 状态文件结构

每个 Gate 有独立的 JSON 状态文件：

```json
{
  "id": "gate-w08-development",
  "status": "passed | failed | pending | skipped",
  "lastChecked": "2026-04-20T10:30:00Z",
  "fileHash": "sha256:abc123...",
  "cacheSkipCount": 5,
  "result": {
    "validators": [
      { "type": "file-exists", "path": "...", "status": "passed" }
    ]
  }
}
```

**fileHash 缓存策略：**

- **算法**: SHA-256
- **哈希内容**: 仅 Gate 相关的文件（如 `output/*/W03_architecture` 等验证器 path 指向的文件）
- **计算时机**: Gate 验证通过后计算并缓存；`PostToolUse` 时检查文件是否变更，变更则标记 `needsRecheck: true`
- **缓存失效**: 文件变更时自动失效，下次触发时重新验证
- **`cacheSkipCount`**: 连续跳过次数，用于自学习优化

---

## 5. 验证器

`gate-validator.mjs` 实现的验证器：

| 验证器类型 | 验证方式 | 说明 |
|-----------|---------|------|
| `file-exists` | `fs.access()` 检查文件存在 | 阶段前置文档是否存在 |
| `no-syntax-errors` | `node --check` / `tsc --noEmit` | 代码无语法错误 |
| `test-suite-pass` | 执行 `vitest run` | 测试套件全部通过 |
| `iron-law-check` | 调用现有 iron-law-check.mjs | 铁律零违规 |
| `lint-check` | 执行 `eslint` | 代码格式检查 |
| `git-has-commits` | `git log` 检查提交数 | 开发阶段有实际产出 |

---

## 6. 执行层

### Gate Enforcer 执行逻辑

```
Gate 验证结果
    │
    ├── level: "hard" + FAILED
    │   → exit 1（硬阻断）
    │   → 输出错误详情：哪个验证器失败、为什么失败、如何修复
    │
    ├── level: "soft" + FAILED
    │   → exit 0（允许继续）
    │   → 输出警告信息，记录到日志
    │
    └── ANY + PASSED
        → 更新状态文件为 "passed"
        → 更新 fileHash 缓存
        → 允许继续
```

### 触发时机

| Hook 事件 | 触发 Gate | 类型 |
|-----------|-----------|------|
| PreToolUse (Write/Edit) | `gate-quality-iron-law` | hard |
| PreToolUse (Bash - commit) | `gate-quality-tests`, `gate-quality-format` | hard + soft |
| PostToolUse (任何) | 更新 fileHash 缓存 | - |
| Skill: gate-manager | 用户手动触发 recheck | - |
| Stage transition | 对应 `gate-w*-<stage>` | hard |

### Stage 阶段切换机制

阶段切换不是自动的，而是 **用户确认 + Gate 验证** 的双保险模式：

1. 用户通过 `/gate-manager transition <stage-id>` 发起阶段切换请求
2. `gate-machine.mjs` 检查前置 Gate 是否全部 passed
3. 如果全部通过，更新 `state.json` 的 `current_stage`，记录 `stages_completed`
4. 如果有 Gate 失败，阻止切换并输出失败详情

**自动检测补充**: 当 W08 开发阶段的 Git 提交数达到阈值（如 5+ commits），`gate-machine.mjs` 在 `session-start` 时提示用户"开发阶段似乎已完成，是否进入 W09 代码审查？"

### 首次安装行为（gate-registry.json 不存在）

`gate-machine.mjs` 启动时检查 `gate-registry.json`：
- 不存在 → 生成默认注册表（基于 `state.json` 中的 stages 定义）
- 存在但格式错误 → 输出错误信息，exit 1
- 存在且格式正确 → 正常使用

---

## 7. 恢复机制

### Gate Recovery

**enforcer 与 recovery 的职责边界：**

- `gate-enforcer.mjs` — 决策层：根据验证结果决定 exit 1 还是 exit 0
- `gate-recovery.mjs` — 修复层：提供自动修复建议、模板生成、测试重跑

```
Gate 失败后
    │
    ├── gate-enforcer.mjs 决策
    │   ├── hard + FAILED → exit 1
    │   └── soft + FAILED → exit 0 + 警告
    │
    ├── gate-recovery.mjs 修复（失败后才触发）
    │   ├── 自动恢复（可配置）
    │   │   → 测试失败：自动 rerun 测试确认
    │   │   → 语法错误：提示具体文件和行号
    │   │   → 文件缺失：生成模板框架
    │   │
    │   ├── 手动恢复
    │   │   → 用户修复后，运行 /gate-manager recheck <gate-id>
    │   │   → 或自动在下次触发时重新验证
    │   │
    │   └── 强制绕过（仅 soft Gate）
    │       → /gate-manager override <gate-id> --reason "说明"
    │       → 记录绕过日志，不可用于 hard Gate
    │
    └── 绕过次数限制
        → 单 session 最多 3 次 soft override
        → 超过后需要用户显式确认才允许继续
```

### 绕过日志

`.chaos-harness/gates/override-log.json` — 记录所有 soft Gate 绕过操作：

```json
[
  {
    "gateId": "gate-quality-format",
    "overriddenAt": "2026-04-20T10:30:00Z",
    "reason": "紧急修复线上 bug，格式问题后续处理",
    "overriddenBy": "user"
  }
]
```

**hard Gate 不允许绕过**，这是设计底线。

---

## 8. 用户交互层 — gate-manager Skill

### 新增 Skill: `skills/gate-manager/SKILL.md`

**命令集：**

```
/gate-manager status          # 查看所有 Gates 状态（仪表盘）
/gate-manager status <id>     # 查看单个 Gate 详情
/gate-manager recheck <id>    # 手动重新验证某个 Gate
/gate-manager override <id> --reason "xxx"  # 绕过（仅 soft Gate）
/gate-manager history         # 查看 Gate 历史记录
/gate-manager list            # 列出所有 Gates 及定义
/gate-manager reset <id>      # 重置某个 Gate 状态为 pending
```

### 仪表盘示例

```
Gate Status Dashboard
=====================

Stage Gates:
  [PASS] gate-w01-requirements     passed  (2026-04-15)
  [PASS] gate-w03-architecture     passed  (2026-04-15)
  [PASS] gate-w08-development      passed  (2026-04-20)
  [    ] gate-w09-code-review      pending
  [    ] gate-w10-testing          pending
  [    ] gate-w12-release          pending

Quality Gates:
  [PASS] gate-quality-iron-law     passed  (0 violations)
  [WARN] gate-quality-format      soft-fail (3 style issues, override allowed)
  [PASS] gate-quality-tests        passed  (all tests green)

Summary: 5 passed, 3 pending, 1 soft-fail
```

---

## 9. 自学习闭环

### Gate 阈值动态调整

`.chaos-harness/gates/gate-learning.json` 记录学习数据：

| 场景 | 自动行为 |
|------|---------|
| soft Gate 连续 3 次 override | 阈值放宽（warning → info） |
| soft Gate 连续 5 次 override | 降级为 info-only（不再阻止流程） |
| hard Gate 频繁失败但非真实问题 | 提升为"需用户确认是否调整规则" |
| 某 Gate 一直 passed | 缓存跳过次数 +1（减少重复验证开销） |
| 新版本首次触发 Gate | 不自动学习，等待用户确认 |

**并发安全：**

多个 async hooks 同时读写 `gate-learning.json` 时，使用原子写入模式：
1. 写入临时文件 `gate-learning.json.tmp.<pid>`
2. `fs.rename()` 原子替换（同文件系统下 rename 是原子的）
3. 读取时加读锁，写入时加写锁

### 验证器动态检测

`test-suite-pass` 验证器不硬编码 `vitest run`，而是：
1. 检测项目中的测试框架（`vitest` / `jest` / `mocha` / 无）
2. 如果无测试框架，该验证器自动标记为 `skipped`（非 failed）
3. 验证器结果包含 `skipped: true` 标识，enforcer 对待 skipped 验证器视为 pass

### 与现有学习系统集成

- `learning-analyzer` 的输出作为 Gate 阈值调整的输入信号
- `instinct-system` 的直觉评分影响 Gate 的验证优先级
- 这两个 skill 的代码**合并到 gate-manager** 中，不再独立存在

### 性能预算

- **同步 hooks 预算**: < 500ms（如 `gate-quality-iron-law`）
- **iron-law-check 优化**: 仅检查被修改的文件，不扫描全项目
- **异步 hooks**: 不阻塞主流程（`learning-update`, `instinct-collector` 等）
- **debounce**: 同一 Gate 在 10 秒内不重复验证（通过时间戳缓存判断）

---

## 10. Skill 精简方案

### 现状：33 个 skills

### 目标：12 个（8 核心 + 4 可选）

#### 核心 Skills（8 个）

| Skill | 说明 |
|-------|------|
| `overview` | 项目总览入口 |
| `project-state` | Gate 状态依赖 |
| `hooks-manager` | Gate hooks 管理 |
| `iron-law-enforcer` | Gate 质量验证核心 |
| `overdrive` | 应急模式 |
| `harness-generator` | 脚手架生成 |
| `version-locker` | IL001 铁律 |
| `gate-manager` | **新增** — Gate 用户交互层 |

#### 可选 Skills（4 个）

| Skill | 说明 |
|-------|------|
| `java-checkstyle` | Java 代码检查 |
| `ui-generator` | UI 生成工具 |
| `web-access` | 浏览器访问 |
| `product-manager` | 产品系三合一 |

#### 合并项

- `learning-analyzer` + `instinct-system` + `adaptive-harness` + `strategic-compact` → 融入 `gate-manager`
- `product-manager` + `prd-validator` + `product-lifecycle` → 合并为 `product-manager`
- `eval-harness` + `test-assistant` + `visual-regression` → 融入 Gate 验证逻辑
- `workflow-supervisor` + `schema-workflow` + `iterative-retrieval` → 融入 gate-machine
- `defense-in-depth` → 融入 `iron-law-enforcer`

#### 移除项

`auto-context`, `auto-toolkit-installer`, `project-scanner`, `agent-team-orchestrator`, `collaboration-reviewer`, `plugin-manager`

---

## 11. 文件结构

```
chaos-harness/
├── scripts/
│   ├── gate-machine.mjs           # 核心状态机
│   ├── gate-validator.mjs         # 验证引擎
│   ├── gate-enforcer.mjs          # 执行层
│   ├── gate-recovery.mjs          # 恢复机制
│   ├── path-utils.mjs             # 跨平台路径
│   └── ...（现有脚本）
├── hooks/
│   ├── hooks.json                 # 增强 hooks
│   └── run-hook.cmd               # 保留但简化
├── skills/
│   ├── core/                      # 核心（8 个）
│   │   ├── overview/
│   │   ├── project-state/
│   │   ├── hooks-manager/
│   │   ├── iron-law-enforcer/
│   │   ├── overdrive/
│   │   ├── harness-generator/
│   │   ├── version-locker/
│   │   └── gate-manager/          # 新增
│   ├── optional/                  # 可选（4 个）
│   │   ├── java-checkstyle/
│   │   ├── ui-generator/
│   │   ├── web-access/
│   │   └── product-manager/
│   └── shared/                    # 共享工具
```

**Skills 目录结构变更说明：**

当前 skills 目录是扁平结构。改为 `core/` + `optional/` 子目录后，需确认：
1. `package.json` 或 `plugin.json` 中 skill 路径引用是否需要更新
2. Claude Code 插件加载器是否支持嵌套 skill 目录
3. 如果不支持，保持扁平目录但通过 SKILL.md 内的元数据标记 `core` vs `optional`
│   ├── gates/
│   │   ├── gate-registry.json     # Gate 注册表
│   │   ├── gate-*.json            # 各 Gate 状态
│   │   ├── gate-learning.json     # 自学习数据
│   │   └── override-log.json      # 绕过日志
│   └── state.json                 # 现有状态
└── docs/superpowers/specs/
    └── 2026-04-20-v132-gate-state-machine-design.md  # 本文档
```
