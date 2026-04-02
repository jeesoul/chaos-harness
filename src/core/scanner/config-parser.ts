// src/core/scanner/config-parser.ts

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import xml2js from 'xml2js';

/**
 * POM XML 解析结果
 */
export interface PomXmlResult {
  javaVersion: string | null;
  springBootVersion: string | null;
  isSpringBoot: boolean;
  isLegacy: boolean;
  dependencies: Array<{ groupId: string; artifactId: string }>;
  repositories: Array<{ id: string; url: string }>;
}

/**
 * Package.json 解析结果
 */
export interface PackageJsonResult {
  name: string;
  version: string;
  dependencies: string[];
  devDependencies: string[];
  engines: Record<string, string> | null;
  scripts: Record<string, string>;
}

/**
 * Requirements.txt 解析结果
 */
export interface RequirementsTxtResult {
  dependencies: Array<{ name: string; version: string | null }>;
}

/**
 * 解析 pom.xml 文件
 * @param filePath pom.xml 文件路径
 * @returns 解析结果
 */
export async function parsePomXml(filePath: string): Promise<PomXmlResult> {
  const defaultResult: PomXmlResult = {
    javaVersion: null,
    springBootVersion: null,
    isSpringBoot: false,
    isLegacy: false,
    dependencies: [],
    repositories: []
  };

  if (!existsSync(filePath)) {
    return defaultResult;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(content);

    const project = result.project;
    if (!project) {
      return defaultResult;
    }

    // Extract Java version from properties
    let javaVersion: string | null = null;
    if (project.properties && project.properties[0]) {
      const props = project.properties[0];
      if (props['java.version']) {
        javaVersion = props['java.version'][0];
      } else if (props['maven.compiler.source']) {
        javaVersion = props['maven.compiler.source'][0];
      }
    }

    // Extract Spring Boot version from parent
    let springBootVersion: string | null = null;
    let isSpringBoot = false;
    if (project.parent && project.parent[0]) {
      const parent = project.parent[0];
      if (parent.groupId && parent.groupId[0] === 'org.springframework.boot') {
        isSpringBoot = true;
        if (parent.version) {
          springBootVersion = parent.version[0];
        }
      }
    }

    // Check for Spring Boot in dependencies if not found in parent
    if (!isSpringBoot && project.dependencies && project.dependencies[0]) {
      const deps = project.dependencies[0].dependency || [];
      for (const dep of deps) {
        if (dep.groupId && dep.groupId[0] === 'org.springframework.boot') {
          isSpringBoot = true;
          break;
        }
      }
    }

    // Determine isLegacy: Java 1.8 or Spring Boot 2.x
    let isLegacy = false;
    if (javaVersion === '1.8' || javaVersion === '8') {
      isLegacy = true;
    }
    if (springBootVersion && springBootVersion.startsWith('2.')) {
      isLegacy = true;
    }

    // Extract dependencies
    const dependencies: Array<{ groupId: string; artifactId: string }> = [];
    if (project.dependencies && project.dependencies[0]) {
      const deps = project.dependencies[0].dependency || [];
      for (const dep of deps) {
        if (dep.groupId && dep.artifactId) {
          dependencies.push({
            groupId: dep.groupId[0],
            artifactId: dep.artifactId[0]
          });
        }
      }
    }

    // Extract repositories
    const repositories: Array<{ id: string; url: string }> = [];
    if (project.repositories && project.repositories[0]) {
      const repos = project.repositories[0].repository || [];
      for (const repo of repos) {
        if (repo.id && repo.url) {
          repositories.push({
            id: repo.id[0],
            url: repo.url[0]
          });
        }
      }
    }

    return {
      javaVersion,
      springBootVersion,
      isSpringBoot,
      isLegacy,
      dependencies,
      repositories
    };
  } catch {
    return defaultResult;
  }
}

/**
 * 解析 package.json 文件
 * @param filePath package.json 文件路径
 * @returns 解析结果
 */
export async function parsePackageJson(filePath: string): Promise<PackageJsonResult> {
  const defaultResult: PackageJsonResult = {
    name: '',
    version: '',
    dependencies: [],
    devDependencies: [],
    engines: null,
    scripts: {}
  };

  if (!existsSync(filePath)) {
    return defaultResult;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    return {
      name: pkg.name || '',
      version: pkg.version || '',
      dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
      devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
      engines: pkg.engines || null,
      scripts: pkg.scripts || {}
    };
  } catch {
    return defaultResult;
  }
}

/**
 * 解析 requirements.txt 文件
 * @param filePath requirements.txt 文件路径
 * @returns 解析结果
 */
export async function parseRequirementsTxt(filePath: string): Promise<RequirementsTxtResult> {
  const defaultResult: RequirementsTxtResult = {
    dependencies: []
  };

  if (!existsSync(filePath)) {
    return defaultResult;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const dependencies: Array<{ name: string; version: string | null }> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse package name and version constraint
      // Common formats: package==1.0, package>=1.0, package<=1.0, package~=1.0, package!=1.0, package>1.0, package<1.0
      // Also handle: package[extra]>=1.0
      const match = trimmedLine.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)(\s*[<>=!~]+\s*[^\s,;]+)?/);

      if (match) {
        const name = match[1].toLowerCase();
        let version: string | null = null;

        if (match[2]) {
          // Clean up the version constraint
          version = match[2].trim();
        }

        dependencies.push({ name, version });
      }
    }

    return { dependencies };
  } catch {
    return defaultResult;
  }
}