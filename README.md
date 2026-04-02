# Chaos Harness

**Claude Code Agent Constraint Framework**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Test Coverage](https://img.shields.io/badge/Tests-623-brightgreen.svg)]()

---

## Abstract

Chaos Harness is a deterministic constraint framework for AI Agents that enforces non-negotiable behavioral rules through iron laws, bypass detection, and laziness pattern monitoring. Unlike advisory systems that provide suggestions, Harness uses prohibitive rules that eliminate the "lazy space" where Agents can circumvent quality requirements.

---

## Problem Statement

AI Agents in development workflows exhibit consistent behavioral patterns that undermine quality:

| Pattern | Manifestation |
|---------|---------------|
| **Completion Without Verification** | Claims task complete without test output, review confirmation |
| **Bypass Attempts** | "This is simple", "Skip tests", "Just this once" |
| **Root Cause Avoidance** | Direct fixes without investigation |
| **Configuration Drift** | Unauthorized changes to sensitive configs |

Traditional approaches use advisory guidelines ("should verify", "recommended to test") which Agents can rationalize away.

---

## Solution Architecture

### Iron Laws

Five core non-negotiable rules that trigger automatic enforcement:

```
IL001: NO DOCUMENTS WITHOUT VERSION LOCK
IL002: NO HARNESS WITHOUT SCAN RESULTS  
IL003: NO COMPLETION CLAIMS WITHOUT VERIFICATION
IL004: NO VERSION CHANGES WITHOUT USER CONSENT
IL005: NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL
```

**Enforcement Model:**

```
Agent: "Task completed"
        │
        ▼
    ┌───────────────────────────────────────┐
    │  Iron Law IL003 Triggered             │
    │  Evidence Required:                   │
    │  - Test execution output              │
    │  - Verification command results       │
    │  - Code review confirmation           │
    └───────────────────────────────────────┘
        │
        ▼
    No Evidence = Enforcement Block
```

### Bypass Detection Engine

Pattern-based detection with rebuttal generation:

| Detection Rule | Pattern Match | Rebuttal Strategy |
|----------------|---------------|-------------------|
| `simple-fix` | "simple", "trivial", "easy" | IL003: Verification required regardless of complexity |
| `skip-test` | "skip testing", "no test needed" | IL003: Testing is baseline verification |
| `just-once` | "just this once", "one-time" | IL001: Each exception becomes precedent |
| `legacy-project` | "old project", "legacy code" | IL003: Legacy requires stricter constraints |
| `time-pressure` | "urgent", "deadline", "quick" | IL003: Urgency increases risk, not decreases |

### Laziness Pattern Monitoring

Real-time behavioral pattern detection with severity classification:

| Pattern ID | Description | Severity | Action |
|------------|-------------|----------|--------|
| LP001 | Completion claim without verification evidence | Critical | Block |
| LP002 | Root cause investigation skipped | Critical | Block |
| LP003 | Extended period without output | Warning | Alert |
| LP004 | Test execution skipped | Critical | Block |
| LP005 | Version number unauthorized modification | Critical | Block |
| LP006 | High-risk config auto-processing | Critical | Block |

### Adaptive Workflow Engine

12-stage workflow with scale-based mandatory requirements:

| Project Scale | Definition | Mandatory Stages | Skippable |
|---------------|------------|------------------|-----------|
| Small | ≤5 files, ≤100 lines | 5 stages | W02, W04, W07 |
| Medium | 5-20 files, 100-500 lines | 8 stages | W06 |
| Large | ≥20 files, ≥500 lines | All 12 stages | None (IL001 enforced) |

**Scale Detection Metrics:**
- File count analysis
- Code line count analysis  
- Complexity indicator aggregation
- Automatic scale upgrade triggers

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chaos Harness                             │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Scanner     │  │   Version     │  │   Harness     │        │
│  │   Module      │  │   Manager     │  │   Generator   │        │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘        │
│          │                  │                  │                 │
│          └──────────────────┼──────────────────┘                 │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Iron Law Enforcer                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │    │
│  │  │Law Check │  │Bypass    │  │Laziness  │  │Pressure │  │    │
│  │  │Engine    │  │Detection │  │Monitor   │  │Engine   │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Workflow Supervisor                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │    │
│  │  │Scale     │  │Stage     │  │Skip      │  │Progress │  │    │
│  │  │Detection │  │Manager   │  │Approval  │  │Tracker  │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Plugin Manager                          │    │
│  │  Constraint Injection │ Source Management │ Stage Mapping │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Plugin System

### Constraint Injection Mechanism

All external plugins must accept iron law constraints during loading:

```yaml
constraints:
  enforce_iron_laws: true      # IL001-IL005 mandatory
  enforce_version_lock: true   # Output in version directory
  enforce_verification: true   # Completion requires evidence
  enforce_supervisor: true     # Accept laziness monitoring
```

**Constraint Rejection = Plugin Load Denied**

### Plugin Source Support

| Source Type | Format | Example |
|-------------|--------|---------|
| GitHub | `github:owner/repo` | `github:obra/superpowers` |
| npm | `npm:package-name` | `npm:chaos-plugin` |
| Local | `local:/path` | `local:~/.claude/plugins/custom` |
| URL | `url:https://...` | `url:https://host/plugin.tar.gz` |

### Stage-Plugin Mapping

```yaml
W08_development:
  required:
    - harness:iron-law-enforcer    # Always mandatory
  optional:
    - external:skill-name          # User configurable

W09_code_review:
  required:
    - harness:iron-law-enforcer
  optional:
    - external:review-skill
```

---

## Custom Iron Laws

User-defined iron laws extend the constraint system:

```yaml
# ~/.claude/harness/iron-laws.yaml
custom_iron_laws:
  - id: IL-C001
    rule: "NO DATABASE CHANGES WITHOUT BACKUP"
    description: "Database schema modifications require backup creation"
    severity: critical
    triggers:
      - pattern: "ALTER TABLE|DROP TABLE|TRUNCATE"
        action: block
        message: "Database schema change detected. Backup required."
```

**Severity Actions:**
- `critical` → Block operation
- `warning` → Alert with continuation allowed
- `info` → Informational notice
- `require` → Additional action required

---

## Template System

Five preset templates for common technology stacks:

| Template | Stack | Detection Criteria |
|----------|-------|-------------------|
| `java-spring` | Java 17/21 + Spring Boot 3.x | pom.xml, Spring annotations |
| `java-spring-legacy` | JDK 8 + Spring Boot 2.x | Legacy compatibility flags |
| `node-express` | Node.js Express | package.json, Express imports |
| `python-django` | Python Django | requirements.txt, Django imports |
| `generic` | Universal fallback | Default behavior |

---

## Installation

```bash
git clone https://github.com/jeesoul/chaos-harness.git
cd chaos-harness

# macOS/Linux
chmod +x install.sh && ./install.sh

# Windows
install.bat

# Restart Claude Code
```

**Zero Configuration Required** — Skills auto-activate on conversation start.

---

## Skill Modules

| Module | Activation Trigger | Function |
|--------|-------------------|----------|
| `project-scanner` | "scan project", "analyze structure" | Type detection, environment validation |
| `version-locker` | "create version", "lock version" | Version management, session lock |
| `harness-generator` | "generate harness", "create constraints" | Rule generation, bypass prevention |
| `workflow-supervisor` | "workflow", "stage management" | 12-stage workflow, skip approval |
| `iron-law-enforcer` | Always active | Iron law execution, custom law support |
| `plugin-manager` | "plugin", "manage plugins" | External plugin configuration |

---

## Usage Examples

### Project Scan

```
User: Scan current project

Harness: [project-scanner activated]
         
         Project Type: java-spring (confidence: 98%)
         Language: Java 17
         Framework: Spring Boot 3.2.0
         Environment: JDK 17 ✓ Maven 3.9 ✓
```

### Iron Law Enforcement

```
User: Task completed

Harness: [iron-law-enforcer triggered]
         
         IL003 Violation Detected
         Completion claim requires verification evidence.
         
         Required: Test output | Verification results | Review confirmation
```

### Bypass Detection

```
User: This is a simple fix, skip tests?

Harness: [bypass-detection triggered]
         
         Rule Match: simple-fix
         Iron Law Reference: IL003
         
         Simple modifications can introduce regressions.
         Test execution required for all changes.
```

### Plugin Management

```
User: View plugin list

Harness: Plugin Status Dashboard
         
         Plugin          Version    Status     Stages
         harness-core    1.0.0      Core       All
         external-pkg    2.0.0      Active     W01,W08
         custom-plugin   1.0.0      Disabled   W03
```

### Custom Iron Law Addition

```
User: Add iron law: No deployment on Friday

Harness: Iron Law Configuration
         
         ID: IL-C002 (auto-assigned)
         Rule: NO DEPLOYMENT ON FRIDAY
         Severity: warning
         
         Trigger: day_of_week == Friday
         Action: Alert with risk notification
         
         Confirm addition? (yes/cancel)
```

---

## Project Structure

```
chaos-harness/
├── skills/                    # Skill module definitions
│   ├── SKILL.md               # Main entry, iron law definitions
│   ├── iron-law-enforcer/     # Iron law execution module
│   ├── project-scanner/       # Project scanning module
│   ├── version-locker/        # Version management module
│   ├── harness-generator/     # Constraint generation module
│   ├── workflow-supervisor/   # Workflow supervision module
│   └── plugin-manager/        # Plugin management module
├── src/core/                  # Core implementation
│   ├── scanner/               # Scanner implementation
│   ├── version-manager/       # Version manager implementation
│   ├── harness-generator/     # Harness generator implementation
│   ├── workflow-engine/       # Workflow engine implementation
│   └── mcp-server/            # MCP Server (optional interface)
├── templates/                 # Configuration templates
│   ├── plugins.yaml           # Plugin configuration template
│   ├── iron-laws.yaml         # Custom iron law template
│   └── [stack-templates]/     # Stack-specific templates
├── tests/                     # Test suite (623 tests)
├── .claude-plugin/            # Plugin metadata
├── CLAUDE.md                  # Project memory
└── README.md                  # Documentation
```

---

## Development

```bash
npm install
npm run build
npm test              # 623 test cases
npm run coverage      # Coverage report
```

---

## License

MIT License — See [LICENSE](LICENSE) for details.

---

<p align="center">
<b>Chaos demands order. Harness provides it.</b>
</p>