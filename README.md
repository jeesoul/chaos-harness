<div align="center">

# Chaos Harness

**A deterministic constraint framework for AI coding agents**

_用 Gate 状态机 + Loop 引擎 + Wiki 记忆，给 AI 开发流程立规矩_

[![version](https://img.shields.io/badge/version-1.4.0-blueviolet.svg)](https://github.com/jeesoul/chaos-harness)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![tests](https://img.shields.io/badge/tests-116%2F116%20passing-success.svg)](evals/v1.4.0-eval-report.md)
[![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#installation)
[![node](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](https://nodejs.org)

**Loops persist · Wiki remembers · Chaos resumes**

[Quickstart](#quickstart) · [Concepts](#core-concepts) · [Skills](#skills) · [Commands](#command-reference) · [中文完整版](README.zh-CN.md)

</div>

---

## Why Chaos Harness

AI coding agents are non-deterministic. They skip verification, rationalize around
constraints, and claim completion without evidence. Natural-language prompts are
*soft suggestions* — there is always semantic room to negotiate.

Chaos Harness encodes constraints as a **Gate state machine** enforced by Claude Code
hooks. Constraints become code, not advice. There is no gray zone to argue with.

| Principle | What it means |
|-----------|---------------|
| **Deterministic** | Gates run as hard-block (`exit 1`) or soft-warn (`exit 0`); every action is traceable |
| **Resumable** | A four-frame loop + write-ahead journal means a power cut never loses your place |
| **Memory-driven** | An addressable, linkable, evolvable Wiki replaces flat config files |
| **Minimal** | 2 iron laws, 5 gates, 5 skills — few rules, strictly enforced |

<!-- ARCH -->

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Claude Code  ·  natural language / slash commands / tools     │
└───────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────┐
│  Hooks (hooks.json) — automatic interception                     │
│  SessionStart → PreToolUse → PostToolUse → Stop → PreCompact     │
└───┬───────────────┬───────────────┬───────────────┬─────────────┘
    │               │               │               │
    ▼               ▼               ▼               ▼
┌────────┐    ┌──────────┐   ┌──────────┐   ┌──────────────┐
│  Gate  │    │   Loop   │   │   Wiki   │   │  Iron-Law    │
│ machine│    │  engine  │   │  indexer │   │  enforcer    │
│ 5 gates│    │ 4 frames │   │ +search  │   │  2 laws      │
└────┬───┘    └────┬─────┘   └────┬─────┘   └──────┬───────┘
     │             │              │                │
     └─────────────┴──── .chaos-harness/ ──────────┘
                          ├── gates/   gate states + registry
                          ├── loop/    cursor + journal (WAL)
                          └── wiki/    patterns · decisions · incidents · sessions
```

## Quickstart

```bash
# 1. Clone & checkout the release branch
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness
git checkout 1.4.0

# 2. Cross-platform install (auto-detects git, validates path)
node scripts/install.mjs

# 3. Register with Claude Code
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness

# 4. Verify
/chaos-harness:overview
```

> **Windows + Git:** `scripts/git-detector.mjs` locates git across PATH,
> `Program Files\Git`, Scoop, Chocolatey and WSL — no manual PATH setup.
> Non-ASCII install paths are rejected with a clear error by `path-sanity.mjs`.

## Core Concepts

### Gate state machine

Five gates, two enforcement levels. `hard` blocks (`exit 1`); `soft` warns (`exit 0`).

| Gate | Type | Level | Validator |
|------|------|-------|-----------|
| `gate-requirements` | stage | hard | requirements doc exists |
| `gate-implementation` | stage | hard | no syntax errors + git commits |
| `gate-release` | stage | hard | test suite passes |
| `gate-quality` | quality | hard | iron-law compliance |
| `gate-intelligence` | quality | soft | Wiki-based recommendations |

### Loop engine (Karpathy-style agentic loop)

Every tool call is recorded as a four-frame cycle with an atomic cursor and an
append-only journal — the foundation for resumability.

```
observe ─→ decide ─→ act ─→ reflect
(PreTool)  (PreTool)  (PostTool) (Stop)
```

### Project Wiki (addressable memory)

A scratchpad forgets. A wiki remembers. Each entry has an id, tags, bidirectional
links and a confidence score; knowledge is promoted through three tiers.

```
observations.jsonl  (raw)        ─ ≥3 similar →
wiki/patterns/<id>.md (promoted) ─ ≥5 reuses  →
wiki/decisions/<id>.md (canonical, iron-law candidate)
```

Search is pure Node (`wiki-search.mjs`) — **zero Python dependency**.

### Resume engine (power-cut recovery)

On `SessionStart`, if the last loop frame is not `reflect`, the previous session was
interrupted. Chaos Harness prints exactly where you stopped and what to do next,
restored from a three-layer snapshot (gate states + loop cursor + session markdown).

### Iron laws

Two non-negotiable laws, enforced by hooks — not prompts.

| ID | Law | Enforced at |
|----|-----|-------------|
| **IL001** | No documents without version lock | PreToolUse (Write/Edit) |
| **IL003** | No completion claims without verification | Stop (reflect frame) |

> v1.4.0 deliberately removed IL002/IL004/IL005. Two strictly-enforced laws beat
> five that get negotiated around. **Less is more.**

<!-- SKILLS -->

## Skills

5 core skills — focused and minimal. Invoke via slash command or natural-language triggers.

| Skill | Triggers | Purpose |
|-------|----------|---------|
| `overview` | chaos-harness | System overview & entry point |
| `gate-manager` | gate, stage, hooks | Gate state machine + hooks management |
| `iron-law-enforcer` | iron law, version, lock | Iron-law enforcement (IL001/IL003) |
| `dev-intelligence` | search, knowledge | Wiki search engine (pure Node) |
| `resume` | resume, continue | Session interruption recovery + snapshots |

## Command Reference

| Command | Action |
|---------|--------|
| `/chaos-harness:overview` | System overview |
| `/gate-manager status` | Gate dashboard |
| `/gate-manager recheck <id>` | Re-validate a gate |
| `/gate-manager transition <stage>` | Advance workflow stage |
| `/gate-manager override <id> --reason "..."` | Bypass a soft gate |
| `/resume` | Detect interruption & print recovery hints |
| `/chaos-harness:dev-intelligence` | Wiki search + recommendations |
| `/chaos-harness:iron-law-enforcer` | Iron-law check & history |

### CLI

```bash
node scripts/gate-machine.mjs --status        # gate dashboard
node scripts/loop-engine.mjs status           # loop cursor + recent frames
node scripts/wiki-search.mjs query "<terms>"  # search the wiki
node scripts/resume.mjs                        # check for interruption
node scripts/wiki-indexer.mjs build           # rebuild index + backlinks
```

## What's New in 1.4.0

v1.4.0 is a major release: it adds the Loop/Wiki/Resume engines **and** radically
simplifies the core.

| Dimension | v1.3.2 | v1.4.0 | Δ |
|-----------|--------|--------|---|
| Skills | 15 | 11 | −27% |
| Gates | 10 | 5 | −50% |
| Iron laws | 5 | 2 | −60% |
| Knowledge base | 6 CSV files | Wiki (90 entries) | unified, addressable |
| Search engine | Python BM25 + Node fallback | pure Node | zero Python dep |
| PostToolUse hooks | 4 separate | 1 dispatcher | −75% |

**New capabilities:** Loop Engine (four-frame cycle + WAL), Project Wiki
(addressable memory + bidirectional links), Resume Engine (power-cut recovery),
unified cross-platform installer with Windows git detection.

## Installation

```bash
# Remote
claude plugins marketplace add github:jeesoul/chaos-harness
claude plugins install chaos-harness@chaos-harness

# Local
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness && git checkout 1.4.0
node scripts/install.mjs
claude plugins marketplace add "$(pwd)"
claude plugins install chaos-harness@chaos-harness
```

No manual `settings.json` edits — skills and hooks load automatically.

### Uninstall

```bash
claude plugins uninstall chaos-harness@chaos-harness
claude plugins marketplace remove chaos-harness
```

## Testing

```bash
node scripts/sp-test-runner.mjs          # unit self-test
node scripts/eval-runner-v140.mjs        # capability evals
node scripts/eval-runner-regression.mjs  # regression evals
node tests/test-v140-integration.mjs     # integration
```

Current status: **116/116 passing** (self-test 78, capability 13, regression 12,
integration 13). See [evals/v1.4.0-eval-report.md](evals/v1.4.0-eval-report.md).

## Version History

| Version | Highlights |
|---------|-----------|
| **1.4.0 Loop & Wiki** | Loop Engine · Project Wiki · Resume Engine · cross-platform installer · **major simplification** (skills 15→5, gates 10→5, laws 5→2, CSV→Wiki, zero Python) |
| 1.3.2 Gate | Gate state machine · 10 gates · BM25 engine · 6 CSV knowledge bases |
| 1.3.1 | Continuous learning 2.0 · eval-driven · schema workflow |
| 1.3.0 | Overdrive mode · multi-agent review |
| 1.2.0 | Self-learning loop · agent-team laws · CDP browser |
| 1.0.0 | Core framework: skills + hooks |

## License

[MIT](LICENSE)

---

## 中文导览

**Chaos Harness 是给 AI 编码 agent 用的确定性约束框架。**

AI agent 是非确定性的——会跳过验证、绕过约束、无证据声称完成。自然语言提示词
只是软建议，总有博弈空间。Chaos Harness 把约束编码为 **Gate 状态机**，由 Claude
Code 钩子强制执行：约束是代码，不是建议。

### 四大支柱

- **Gate 状态机** — 5 个 Gate，hard 阻断 / soft 警告，行为可追溯
- **Loop 引擎** — observe→decide→act→reflect 四帧循环 + WAL 日志，支持断点续作
- **Project Wiki** — 可寻址、可链接、可演化的记忆，取代扁平配置；纯 Node 搜索
- **Resume 引擎** — 断电/重启后精确恢复到中断点

### 两条铁律

| ID | 铁律 |
|----|------|
| IL001 | 文档必须在版本目录下 |
| IL003 | 完成声明必须附验证证据 |

> v1.4.0 大版本简化：Skills 15→5、Gates 10→5、铁律 5→2、CSV→Wiki、去 Python 依赖。**少即是多。**

详细使用见 [USAGE.md](USAGE.md)。

<div align="center">

**Loops persist · Wiki remembers · Chaos resumes**

</div>




