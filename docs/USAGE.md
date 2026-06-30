# Chaos Harness 使用指南

> v1.4.0 — Loop & Wiki
> **Loops persist · Wiki remembers · Chaos resumes**

---

## 目录

1. [安装与验证](#安装与验证)
2. [两种触发方式](#两种触发方式)
3. [5 个核心 Skills](#5-个核心-skills)
4. [典型工作流](#典型工作流)
5. [故障恢复](#故障恢复)
6. [常见问题](#常见问题)

---

## 安装与验证

```bash
# 1. 克隆仓库
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# 2. 注册到 Claude Code
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 3. 验证(在 Claude Code 中执行)
/chaos-harness:overview
```

**Windows 用户**:`scripts/git-detector.mjs` 会自动定位 Git(PATH/Program Files/Scoop/Chocolatey/WSL),无需手动配置 PATH。非 ASCII 安装路径会被 `path-sanity.mjs` 拒绝。

---

## 两种触发方式

### 1. 自动触发(Hooks)— 无感生效

写代码、运行命令、结束会话时,Hooks 自动拦截执行:

| Hook 阶段 | 触发时机 | 自动执行 |
|----------|---------|---------|
| **SessionStart** | 会话启动 | resume(中断检测) + gate-machine(状态恢复) |
| **PreToolUse(Write/Edit)** | 写文件前 | loop observe → gate-quality + iron-law-check → loop decide |
| **PreToolUse(Bash)** | 命令执行前 | loop observe |
| **PostToolUse** | 工具执行后 | post-write-dispatcher(loop act + 学习更新 + 模式抽取) |
| **Stop** | 会话结束 | loop reflect + snapshot + laziness-detect |
| **PreCompact** | 上下文压缩前 | snapshot(compacted) + pre-compact |

**特点:** 进程级 `exit 1` 硬拦截,AI 无法绕过。

### 2. 手动触发(Slash Commands)— 主动调用

```bash
/chaos-harness:overview            # 系统概览
/gate-manager status               # Gate 状态仪表盘
/chaos-harness:dev-intelligence    # Wiki 搜索 + 智能建议
/chaos-harness:iron-law-enforcer   # 铁律检查与历史
/resume                            # 断点恢复提示
```

也可用**自然语言触发**(Claude Code 自动识别):

| 你说 | 触发 |
|------|------|
| "继续"、"恢复"、"上次进度" | resume |
| "Gate 状态"、"钩子" | gate-manager |
| "搜索模式"、"质量检查" | dev-intelligence |
| "铁律"、"违规" | iron-law-enforcer |
| "chaos-harness 是什么" | overview |

---

## 5 个核心 Skills

### overview — 系统概览

**功能**:介绍框架架构、能力、使用方式
**触发**:用户询问 chaos-harness 是什么、有什么能力

### gate-manager — Gate 状态机管理

**功能**:Gate 状态查看、阶段切换、Hook 配置

**核心命令**:
```bash
/gate-manager status              # 查看所有 Gates
/gate-manager status gate-quality # 查看单个 Gate
/gate-manager recheck <id>        # 重新验证
/gate-manager transition <stage>  # 阶段切换(需用户确认)
/gate-manager override <id> --reason "xxx"  # 绕过 soft Gate
/gate-manager history             # 查看绕过记录
```

**5 个 Gates(v1.4.0)**:

| Gate | 类型 | 级别 | 验证器 |
|------|------|------|--------|
| gate-requirements | stage | hard | file-exists |
| gate-implementation | stage | hard | no-syntax-errors + git-has-commits |
| gate-release | stage | hard | test-suite-pass |
| gate-quality | quality | hard | iron-law-check |
| gate-intelligence | quality | soft | dev-intelligence(Wiki 推荐) |

### iron-law-enforcer — 铁律执行

**功能**:2 条核心铁律强制执行,自动拦截违规

**2 条铁律(v1.4.0 精简)**:

| ID | 铁律 | 拦截方式 |
|----|------|---------|
| **IL001** | NO DOCUMENTS WITHOUT VERSION LOCK | PreToolUse 检测文档路径,无版本目录 → exit 1 |
| **IL003** | NO COMPLETION CLAIMS WITHOUT VERIFICATION | Stop 时分析完成声明,无验证证据 → 触发 laziness-detect |

**为何只剩 2 条**:原 IL002/IL004/IL005 已合并或移除——**少而严胜过多而松**。

### dev-intelligence — Wiki 搜索与智能建议

**功能**:Wiki 知识库搜索(patterns/decisions/incidents/sessions),纯 Node 实现(无 Python/BM25 依赖)

**CLI 示例**:
```bash
# 搜索知识库
node scripts/dev-intelligence.mjs --query "Gate" --domain patterns

# 生成 Gate 配置(按阶段+技术栈)
node scripts/dev-intelligence.mjs generate-gate --stage W10 --stack vue

# 持久化决策(跨会话)
node scripts/dev-intelligence.mjs persist --type decision --subject "xxx"
```

**6 个知识域**:gate-patterns / iron-law-rules / test-patterns / anti-patterns / ui-patterns / prd-quality-rules

### resume — 会话断点恢复

**功能**:断电、中断、压缩后精准恢复上次进度

**机制**:
- **L1 Gate** — 各 Gate 通过/失败(`.chaos-harness/gates/*.json`)
- **L2 Loop cursor** — session_id/tick/last_frame(`.chaos-harness/loop/cursor.json`)
- **L3 Snapshot** — 可读 Markdown 摘要(`.chaos-harness/wiki/sessions/last.md`)

SessionStart 自动调用 `resume.mjs`,若 `last_frame !== reflect`,提示"上次会话被中断"+ 恢复建议。

**CLI**:
```bash
node scripts/resume.mjs              # 检测中断
node scripts/snapshot.mjs read       # 读取上次快照
node scripts/snapshot.mjs latest     # 列出最近 5 个快照
node scripts/loop-cursor.mjs read    # 调试:查看 cursor
node scripts/loop-journal.mjs stats  # 调试:查看 journal 统计
```

---

## 典型工作流

### 场景 1:开始新功能

```
你 → "我要给 X 模块加分页"
↓
Claude Code 写代码
↓ (PreToolUse 自动)
loop observe → gate-quality 检查 → iron-law-check
↓
✓ 通过 → loop decide → 写入文件
↓ (PostToolUse 自动)
loop act → 模式抽取 → wiki 更新
```

### 场景 2:会话被中断后恢复

```
重启 Claude Code
↓ (SessionStart 自动)
resume.mjs 检测:last_frame=act (未到 reflect)
↓
输出:"🔄 previous session was interrupted"
       last tick: 76 | snapshot: wiki/sessions/last.md
↓
你 → "/resume" 或 "继续上次进度"
↓
读取 wiki/sessions/last.md → 接续工作
```

### 场景 3:查找已有解决方案

```
你 → "怎么测试 Vue 项目?"
↓
/chaos-harness:dev-intelligence
↓
node scripts/dev-intelligence.mjs --query "Vue test" --domain patterns
↓
返回:test-vue-unit / test-vue-e2e 等 patterns(带评分)
```

### 场景 4:Gate 失败处理

```
PreToolUse: gate-quality 失败
↓ (exit 1 自动拦截)
输出失败原因 + 修复建议
↓
你修复 → /gate-manager recheck gate-quality
↓
通过 → 继续工作
```

---

## 故障恢复

### Gate 失败恢复

```bash
# 1. 查看失败原因
/gate-manager status gate-quality

# 2. 修复后重新验证
/gate-manager recheck gate-quality

# 3. 紧急情况:绕过 soft Gate(每个 session 最多 3 次)
/gate-manager override gate-intelligence --reason "紧急上线,稍后补"

# 4. 查看绕过历史
/gate-manager history
```

### 会话状态恢复

```bash
# Claude Code 重启时,SessionStart 会自动检测中断
# 若想手动触发:
/resume

# 查看历史快照
node scripts/snapshot.mjs latest

# 读取特定会话快照
node scripts/snapshot.mjs read --id ses-xxx
```

### Loop 调试

```bash
# 查看本会话 loop 位置
node scripts/loop-cursor.mjs read

# 查看 hook 行为流水(WAL)
node scripts/loop-journal.mjs tail --n 20

# Loop 统计
node scripts/loop-journal.mjs stats
```

---

## 常见问题

**Q1: 为什么 1.4.0 只有 5 个 skills,以前的 11 个去哪了?**

A: v1.4.0 设计哲学是"**精而最优,少即是多**"。6 个可选 skills(overdrive/harness-generator/product-manager/java-checkstyle/ui-generator/web-access)已归档到 `skills/.archive/`,保留代码但不再激活。聚焦 Loop+Wiki+Gate 核心能力。

**Q2: 自动触发的 Hooks 拖慢工作怎么办?**

A: v1.4.0 已大幅优化:
- PostToolUse 4 个 hook 合并为 `post-write-dispatcher`(5 秒 debounce)
- 移除 `.*` matcher 通配 hook,只对 Write/Edit/Bash 触发
- 异步任务(async: true)不阻塞主流程

**Q3: 怎么彻底关闭 Hooks?**

A: 不建议——Hooks 是 chaos-harness 的核心。如必须关闭,临时禁用单个 hook:编辑 `hooks/hooks.json` 注释对应条目,重启 Claude Code 生效。

**Q4: Wiki 搜索为什么很快?以前用 BM25 不需要 Python 吗?**

A: v1.4.0 已移除 Python+BM25 依赖,改为**纯 Node 实现**的 TF-IDF 评分。零外部依赖,跨平台一致。

**Q5: 我的工作流和你的不一样,可以自定义吗?**

A: 可以。三个扩展点:
1. **自定义铁律** — `~/.claude/harness/iron-laws.yaml` 添加项目专属规则
2. **自定义 Gate** — `.chaos-harness/gates/gate-registry.json` 新增 Gate 定义
3. **Wiki 知识库** — `.chaos-harness/wiki/decisions/` 添加项目决策

**Q6: 如何升级到最新版?**

```bash
cd <chaos-harness 安装目录>
git pull origin main
claude plugins uninstall chaos-harness
claude plugins install chaos-harness@chaos-harness
# 重启 Claude Code 让新 hooks 生效
```

---

## 参考

- **GitHub**: https://github.com/jeesoul/chaos-harness
- **README(英)**: [README.md](../README.md)
- **README(中)**: [README.zh-CN.md](../README.zh-CN.md)
- **设计规格**: [v1.4.0-loop-wiki-spec.md](v1.4.0-loop-wiki-spec.md)
