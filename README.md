# Chaos Harness

> **Chaos demands order. Harness provides it.**

[![npm version](https://img.shields.io/npm/v/chaos-harness.svg)](https://www.npmjs.com/package/chaos-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/chaos-harness/chaos-harness/actions/workflows/ci.yml/badge.svg)](https://github.com/chaos-harness/chaos-harness/actions)

A Claude Code advanced skill and plugin system for intelligent project invasion, environment scanning, version constraints, Harness generation, and full workflow management.

## Features

- 🔍 **Project Scanner** - Detect project type (Java/Node/Python), environment, dependencies with confidence scoring
- 📦 **Version Manager** - Lock versions to prevent document chaos, session-based version locking
- 🔧 **Environment Fixer** - Detect issues (JDK compatibility, private repo connectivity), suggest fixes with risk classification
- 📋 **Harness Generator** - Generate iron laws, anti-bypass rules, red flags detection with 5 template presets
- 🔄 **Workflow Engine** - 12-stage workflow with adaptive flow based on project scale (small/medium/large)
- 🖥️ **MCP Server** - 17 tools for Claude Code integration via Model Context Protocol

## Iron Laws

The 5 non-negotiable rules that govern Chaos Harness:

| ID | Rule | Description |
|----|------|-------------|
| IL001 | NO DOCUMENTS WITHOUT VERSION LOCK | All outputs must be versioned |
| IL002 | NO HARNESS WITHOUT SCAN RESULTS | Harness requires project scan |
| IL003 | NO COMPLETION CLAIMS WITHOUT VERIFICATION | Claims need evidence |
| IL004 | NO VERSION CHANGES WITHOUT USER CONSENT | Version changes need approval |
| IL005 | NO HIGH-RISK CONFIG MODIFICATIONS WITHOUT APPROVAL | Sensitive changes need approval |

## Laziness Pattern Detection

Chaos Harness includes a supervisor mechanism that detects 6 laziness patterns:

| ID | Pattern | Severity |
|----|---------|----------|
| LP001 | Completion without verification | Critical |
| LP002 | Skipping root cause analysis | Critical |
| LP003 | Long time without output | Warning |
| LP004 | Skipping tests | Critical |
| LP005 | Unauthorized version change | Critical |
| LP006 | High-risk config modification | Critical |

## Installation

```bash
npm install chaos-harness
```

## Quick Start

```typescript
import {
  scan,
  VersionManager,
  generateHarness,
  createWorkflowExecutor,
  quickDetectLaziness
} from 'chaos-harness';

// Step 1: Scan project
const result = await scan({ projectRoot: './my-project' });
console.log(`Project type: ${result.projectType.type}`);
console.log(`Confidence: ${result.projectType.confidence}`);

// Step 2: Initialize version manager
const vm = new VersionManager('./output');
await vm.initialize({ autoCreate: true, defaultVersion: 'v0.1' });

// Step 3: Generate Harness
const harness = await generateHarness({
  scanResult: result,
  outputPath: './output/v0.1/Harness'
});
console.log(`Iron laws: ${harness.ironLaws.length}`);

// Step 4: Create workflow
const workflow = createWorkflowExecutor({
  projectRoot: './my-project',
  fileCount: 10,
  lineCount: 200,
  enableSupervisor: true
});

// Step 5: Detect laziness patterns
const patterns = quickDetectLaziness('agent-1', {
  claimedCompletion: true,
  ranVerification: false
});
if (patterns.includes('LP001')) {
  console.log('⚠️ Completion claimed without verification!');
}
```

## API Reference

### Scanner

```typescript
import { scan, generateScanReport, ProjectType } from 'chaos-harness';

// Scan project
const result = await scan({
  projectRoot: './project',
  configFilePriority: ['pom.xml', 'package.json', 'requirements.txt']
});

// Generate report
const report = generateScanReport(result, 'v0.1');
```

### Version Manager

```typescript
import { VersionManager, parseVersion, validateVersion } from 'chaos-harness';

// Create version manager
const vm = new VersionManager('./output');

// Initialize with options
await vm.initialize({
  autoCreate: true,       // Auto-create version directory
  defaultVersion: 'v0.1', // Default version if none detected
  specifiedVersion: 'v1.0' // Use specific version
});

// Check lock status
const isLocked = await vm.isLocked();

// Get current version
const version = await vm.getCurrentVersion();

// Parse and validate version strings
const parsed = parseVersion('v1.2');
const valid = validateVersion('v1.2');
```

### Harness Generator

```typescript
import {
  generateHarness,
  validateHarness,
  detectBypassAttempt,
  generateRebuttal
} from 'chaos-harness';

// Generate harness
const harness = await generateHarness({
  scanResult: result,
  outputPath: './output/v0.1/Harness',
  template: 'java-spring'
});

// Validate harness
const validation = validateHarness(harness);

// Detect bypass attempts
const bypass = detectBypassAttempt('This is a simple fix');
if (bypass.detected) {
  const rebuttal = generateRebuttal(bypass.matchedRule);
  console.log(rebuttal);
}
```

### Workflow Engine

```typescript
import {
  createWorkflowExecutor,
  determineProjectScale,
  quickDetectLaziness,
  DEFAULT_IRON_LAWS
} from 'chaos-harness';

// Determine project scale
const scale = determineProjectScale(10, 300);
// Returns: 'small' | 'medium' | 'large'

// Create workflow executor
const workflow = createWorkflowExecutor({
  projectRoot: './project',
  fileCount: 10,
  lineCount: 200,
  enableSupervisor: true
});

// Get current stage
const stage = workflow.getCurrentStage();

// Get progress
const progress = workflow.getProgress();

// Request skip (will be blocked for mandatory stages)
const result = workflow.requestSkip('W08_development', 'test reason');
console.log(result.allowed); // false for mandatory stages
```

### MCP Server

```typescript
import { createFullMcpServer } from 'chaos-harness';

// Create MCP server
const server = createFullMcpServer();

// Call tools
const result = await server.callTool('chaos_scan', {
  projectRoot: './project'
});

// List resources
const resources = server.getResourceList();
```

## Templates

Chaos Harness includes 5 preset templates:

| Template | Target | Features |
|----------|--------|----------|
| java-spring | Java 17/21 + Spring Boot 3.x | Modern Java stack |
| java-spring-legacy | JDK 8 + Spring Boot 2.x | Legacy compatibility |
| node-express | Node.js Express | REST API support |
| python-django | Python Django | Web framework |
| generic | Universal | Fallback template |

## Adaptive Flow

Workflow stages adapt to project scale:

| Scale | Definition | Mandatory Stages | Skippable |
|-------|------------|------------------|-----------|
| Small | ≤5 files, ≤100 lines | 5 | W02, W04, W07 |
| Medium | 5-20 files, 100-500 lines | 8 | W06 |
| Large | ≥20 files, ≥500 lines | All 12 | None |

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Coverage
npm run coverage
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Chaos demands order. Harness provides it.*