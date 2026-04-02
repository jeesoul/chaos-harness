// src/core/scanner/project-detector.ts

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ProjectType } from './types.js';

/**
 * 项目检测结果
 */
export interface ProjectDetectionResult {
  type: ProjectType;
  confidence: number;
  features: string[];
}

/**
 * 检测项目类型
 * @param projectRoot 项目根目录路径
 * @returns 项目检测结果
 */
export async function detectProjectType(projectRoot: string): Promise<ProjectDetectionResult> {
  const features: string[] = [];

  // Check if directory exists
  if (!existsSync(projectRoot)) {
    return {
      type: ProjectType.UNKNOWN,
      confidence: 0,
      features: []
    };
  }

  // Check for various project files
  const hasPomXml = checkFileExists(projectRoot, 'pom.xml');
  const hasPackageJson = checkFileExists(projectRoot, 'package.json');
  const hasRequirementsTxt = checkFileExists(projectRoot, 'requirements.txt');
  const hasBuildGradle = checkFileExists(projectRoot, 'build.gradle');
  const hasGoMod = checkFileExists(projectRoot, 'go.mod');

  // Parse and detect Java/Maven projects
  if (hasPomXml) {
    const pomContent = readFileContent(join(projectRoot, 'pom.xml'));
    if (pomContent) {
      features.push('maven');

      // Detect Spring Boot
      if (pomContent.includes('spring-boot')) {
        features.push('spring-boot');
      }

      // Detect Java version
      const javaVersionMatch = pomContent.match(/<java\.version>([^<]+)<\/java\.version>/);
      if (javaVersionMatch) {
        features.push(`java-${javaVersionMatch[1]}`);
      }

      // Detect Spring Boot version for legacy marking
      const springBootVersionMatch = pomContent.match(/spring-boot[^<]*<version>([^<]+)<\/version>/);
      if (springBootVersionMatch) {
        features.push(`spring-boot-version-${springBootVersionMatch[1]}`);
      }
    }
  }

  // Parse and detect Gradle projects
  if (hasBuildGradle) {
    const gradleContent = readFileContent(join(projectRoot, 'build.gradle'));
    if (gradleContent) {
      features.push('gradle');
    }
  }

  // Parse and detect Node.js projects
  if (hasPackageJson) {
    const packageContent = readFileContent(join(projectRoot, 'package.json'));
    if (packageContent) {
      try {
        const pkg = JSON.parse(packageContent);
        features.push('npm');

        // Detect dependencies
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (allDeps['react'] || allDeps['react-dom']) {
          features.push('react');
        }

        if (allDeps['vue']) {
          features.push('vue');
        }

        if (allDeps['vite']) {
          features.push('vite');
        }

        if (allDeps['express']) {
          features.push('express');
        }
      } catch {
        // Invalid JSON, skip parsing
      }
    }
  }

  // Parse and detect Python projects
  if (hasRequirementsTxt) {
    const requirementsContent = readFileContent(join(projectRoot, 'requirements.txt'));
    if (requirementsContent) {
      features.push('pip');

      if (requirementsContent.toLowerCase().includes('django')) {
        features.push('django');
      }

      if (requirementsContent.toLowerCase().includes('flask')) {
        features.push('flask');
      }
    }
  }

  // Detect Go projects
  if (hasGoMod) {
    features.push('go-modules');
  }

  // Determine project type based on features
  const projectType = determineProjectType(features);

  // Calculate confidence based on feature matches
  const confidence = calculateConfidence(features);

  return {
    type: projectType,
    confidence,
    features
  };
}

/**
 * Check if a file exists in the given directory
 */
function checkFileExists(dir: string, filename: string): boolean {
  return existsSync(join(dir, filename));
}

/**
 * Read file content safely
 */
function readFileContent(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Determine project type based on detected features
 */
function determineProjectType(features: string[]): ProjectType {
  // Check for Java Spring Boot Legacy (JDK 8 + Spring Boot 2.x)
  if (features.includes('maven') && features.includes('spring-boot')) {
    const javaVersionFeature = features.find(f => f.startsWith('java-'));
    const javaVersion = javaVersionFeature ? javaVersionFeature.replace('java-', '') : null;

    // Check for Spring Boot 2.x
    const springBootVersionFeature = features.find(f => f.startsWith('spring-boot-version-'));
    const springBootVersion = springBootVersionFeature
      ? springBootVersionFeature.replace('spring-boot-version-', '')
      : null;

    // Legacy: Java 1.8 or Spring Boot 2.x
    const isJava8 = javaVersion === '1.8';
    const isSpringBoot2 = springBootVersion && springBootVersion.startsWith('2.');

    if (isJava8 || isSpringBoot2) {
      return ProjectType.JAVA_SPRING_LEGACY;
    }

    return ProjectType.JAVA_SPRING;
  }

  // Check for React + Vite
  if (features.includes('react') && features.includes('vite')) {
    return ProjectType.REACT_VITE;
  }

  // Check for Vue + Vite
  if (features.includes('vue') && features.includes('vite')) {
    return ProjectType.VUE_VITE;
  }

  // Check for Node Express
  if (features.includes('express')) {
    return ProjectType.NODE_EXPRESS;
  }

  // Check for Python Django
  if (features.includes('django')) {
    return ProjectType.PYTHON_DJANGO;
  }

  // Check for Python Flask
  if (features.includes('flask')) {
    return ProjectType.PYTHON_FLASK;
  }

  // Check for Java Maven (without Spring Boot)
  if (features.includes('maven')) {
    return ProjectType.JAVA_MAVEN;
  }

  // Check for Java Gradle
  if (features.includes('gradle')) {
    return ProjectType.JAVA_GRADLE;
  }

  // Default to UNKNOWN if no specific type detected
  if (features.length === 0) {
    return ProjectType.UNKNOWN;
  }

  return ProjectType.GENERIC;
}

/**
 * Calculate confidence score based on feature matches
 * 3+ features = 0.8+ confidence
 */
function calculateConfidence(features: string[]): number {
  if (features.length === 0) {
    return 0;
  }

  if (features.length >= 5) {
    return 0.95;
  }

  if (features.length >= 4) {
    return 0.9;
  }

  if (features.length >= 3) {
    return 0.8;
  }

  if (features.length >= 2) {
    return 0.7;
  }

  if (features.length >= 1) {
    return 0.5;
  }

  return 0;
}