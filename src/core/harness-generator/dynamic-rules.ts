import { DynamicRules } from './types.js';

export function extractPrivateRepos(scanResult: any): DynamicRules['privateRepositories'] {
  const repos: DynamicRules['privateRepositories'] = [];

  if (scanResult.dependencySources) {
    for (const source of scanResult.dependencySources) {
      if (source.type === 'private') {
        repos.push({
          id: extractRepoId(source.url),
          url: source.url,
          authRequired: source.authRequired ?? false
        });
      }
    }
  }

  return repos;
}

function extractRepoId(url: string): string {
  const match = url.match(/:\/\/([^/.]+)/);
  return match ? match[1].replace(/\./g, '-') : 'private-repo';
}

export function inferBuildCommands(scanResult: any): DynamicRules['buildCommands'] {
  const toolName = scanResult.buildTool?.name?.toLowerCase();

  const commandMap: Record<string, DynamicRules['buildCommands']> = {
    maven: {
      standard: 'mvn clean install -DskipTests',
      withTests: 'mvn clean install'
    },
    gradle: {
      standard: './gradlew build -x test',
      withTests: './gradlew build'
    },
    npm: {
      standard: 'npm install',
      withTests: 'npm test'
    },
    pip: {
      standard: 'pip install -r requirements.txt',
      withTests: 'pytest'
    }
  };

  return commandMap[toolName] || {
    standard: 'make build',
    withTests: 'make test'
  };
}

export function detectTestFramework(scanResult: any): DynamicRules['testFramework'] {
  const detected = scanResult.testCoverage?.framework;

  if (detected) {
    return {
      primary: detected,
      mock: detectMockFramework(scanResult)
    };
  }

  // 根据项目类型推断
  const projectType = scanResult.projectType?.type || scanResult.projectType;

  const frameworkMap: Record<string, DynamicRules['testFramework']> = {
    'java-spring': { primary: 'JUnit', mock: 'Mockito' },
    'java-spring-legacy': { primary: 'JUnit 4', mock: 'Mockito' },
    'node-express': { primary: 'Jest' },
    'python-django': { primary: 'pytest' }
  };

  return frameworkMap[projectType] || { primary: 'Unknown' };
}

function detectMockFramework(scanResult: any): string | undefined {
  const deps = scanResult.dependencies || [];
  if (deps.some((d: any) => d.artifactId?.includes('mockito'))) return 'Mockito';
  if (deps.some((d: any) => d.name?.includes('sinon'))) return 'Sinon';
  return undefined;
}

export function inferCodeStyle(scanResult: any): DynamicRules['inferredCodeStyle'] {
  const rules = scanResult.codeStyle?.inferredRules || [];

  const namingConvention: Record<string, string> = {};

  for (const rule of rules) {
    const match = rule.match(/(\w+):\s*(\w+)/);
    if (match) {
      namingConvention[match[1]] = match[2];
    }
  }

  return {
    namingConvention,
    importStyle: detectImportStyle(scanResult)
  };
}

function detectImportStyle(scanResult: any): string {
  const projectType = scanResult.projectType?.type || scanResult.projectType;

  if (projectType?.includes('java')) {
    return 'full-qualified';
  }
  if (projectType?.includes('python')) {
    return 'module-import';
  }
  return 'default';
}

export function buildDynamicRules(scanResult: any): DynamicRules {
  return {
    privateRepositories: extractPrivateRepos(scanResult),
    buildCommands: inferBuildCommands(scanResult),
    testFramework: detectTestFramework(scanResult),
    inferredCodeStyle: inferCodeStyle(scanResult)
  };
}