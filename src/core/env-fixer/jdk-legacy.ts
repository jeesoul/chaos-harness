// src/core/env-fixer/jdk-legacy.ts
import { JdkLegacyInfo } from './types.js';

const JDK8_KNOWN_ISSUES = [
  'lombok版本需≤1.18.20',
  'spring-cloud版本需匹配Spring Boot版本',
  '不支持var关键字',
  '不支持Stream.toList()（需用.collect(Collectors.toList())）',
  '不支持Optional.ifPresentOrElse',
  '不支持私有接口方法',
  '不支持文本块（Text Blocks）'
];

const JDK8_COMPATIBLE_VERSIONS = {
  lombok: '≤1.18.20',
  springCloud: '匹配Spring Boot版本（如2.17.x对应2021.0.x）',
  junit: 'JUnit 4 或 JUnit 5 Vintage Engine'
};

/**
 * 分析JDK版本是否为旧版本
 * @param javaVersion Java版本号
 * @param springBootVersion Spring Boot版本号（可选）
 * @returns JDK Legacy信息
 */
export function analyzeJdkLegacy(
  javaVersion: string,
  springBootVersion?: string
): JdkLegacyInfo {
  const isJdk8 = javaVersion === '1.8' ||
                  javaVersion === '8' ||
                  javaVersion.startsWith('1.8.');

  const isSpringBoot2 = springBootVersion !== undefined && springBootVersion.startsWith('2.');

  const isLegacy = isJdk8 || isSpringBoot2;

  return {
    isLegacy,
    javaVersion,
    springBootVersion: springBootVersion || null,
    knownIssues: isLegacy ? getKnownIssues(javaVersion) : [],
    compatibleVersions: isLegacy ? getCompatibleVersions(javaVersion, springBootVersion) : {
      lombok: '最新稳定版',
      springCloud: '最新稳定版',
      junit: 'JUnit 5'
    }
  };
}

/**
 * 获取已知问题列表
 * @param javaVersion Java版本号
 * @returns 已知问题列表
 */
export function getKnownIssues(javaVersion: string): string[] {
  const isJdk8 = javaVersion === '1.8' || javaVersion === '8' || javaVersion.startsWith('1.8.');

  if (isJdk8) {
    return [...JDK8_KNOWN_ISSUES];
  }

  return [];
}

/**
 * 获取兼容版本信息
 * @param javaVersion Java版本号
 * @param springBootVersion Spring Boot版本号（可选）
 * @returns 兼容版本信息
 */
export function getCompatibleVersions(
  javaVersion: string,
  springBootVersion?: string
): { lombok: string; springCloud: string; junit: string } {
  const isJdk8 = javaVersion === '1.8' || javaVersion === '8' || javaVersion.startsWith('1.8.');

  if (isJdk8) {
    return { ...JDK8_COMPATIBLE_VERSIONS };
  }

  return {
    lombok: '最新稳定版',
    springCloud: '最新稳定版',
    junit: 'JUnit 5'
  };
}