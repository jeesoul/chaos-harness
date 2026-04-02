/**
 * Template MCP Resources
 *
 * M6: 模板资源实现
 */

import {
  McpResourceDefinition,
  McpResourceHandler
} from '../types.js';
import { textResourceContent } from '../server.js';
import { loadTemplate } from '../../harness-generator/template-loader.js';
import type { HarnessConfig } from '../../harness-generator/types.js';

/**
 * 模板资源URI前缀
 */
const TEMPLATE_URI_PREFIX = 'chaos://templates/';

/**
 * 模板资源处理器
 */
export const templateResourceHandler: McpResourceHandler = async (uri: string) => {
  if (!uri.startsWith(TEMPLATE_URI_PREFIX)) {
    throw new Error(`Invalid template URI: ${uri}`);
  }

  const templateName = uri.slice(TEMPLATE_URI_PREFIX.length);
  const template = await loadTemplate(templateName);

  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  // 将模板转换为YAML格式
  const yaml = templateToYaml(template);

  return textResourceContent(uri, 'application/yaml', yaml);
};

/**
 * 模板转换为YAML
 */
function templateToYaml(template: HarnessConfig): string {
  const lines: string[] = [
    `# ${template.identity?.name || 'Unknown'} Template`,
    `# ${template.identity?.suitableFor?.join(', ') || 'General projects'}`,
    '',
    'name:', ` ${template.identity?.name || 'unknown'}`,
    'version:', ` ${template.identity?.version || '0.1.0'}`,
    '',
    'ironLaws:'
  ];

  const ironLaws = template.ironLaws;
  if (ironLaws && ironLaws.length > 0) {
    for (const law of ironLaws) {
      lines.push(`  - id: ${law.id}`);
      lines.push(`    rule: "${law.rule}"`);
      lines.push(`    enforcement: ${law.enforcement}`);
    }
  }

  lines.push('');
  lines.push('antiBypass:');

  const antiBypass = template.antiBypass;
  if (antiBypass && antiBypass.length > 0) {
    for (const rule of antiBypass) {
      lines.push(`  - id: ${rule.id}`);
      lines.push(`    excuse: "${rule.excuse}"`);
      lines.push(`    rebuttal: "${rule.rebuttal}"`);
    }
  }

  lines.push('');
  lines.push('redFlags:');

  const redFlags = template.selfCheck?.redFlags;
  if (redFlags && redFlags.length > 0) {
    for (const flag of redFlags) {
      lines.push(`  - thought: "${flag.thought}"`);
      lines.push(`    reality: "${flag.reality}"`);
    }
  }

  return lines.join('\n');
}

/**
 * 预定义的模板资源
 */
export const TEMPLATE_RESOURCES = [
  {
    definition: {
      uri: 'chaos://templates/java-spring',
      name: 'Java Spring',
      description: 'Java 17/21 + Spring Boot 3.x 模板',
      mimeType: 'application/yaml'
    },
    handler: templateResourceHandler
  },
  {
    definition: {
      uri: 'chaos://templates/java-spring-legacy',
      name: 'Java Spring Legacy',
      description: 'JDK 8 + Spring Boot 2.x 模板（重点兼容）',
      mimeType: 'application/yaml'
    },
    handler: templateResourceHandler
  },
  {
    definition: {
      uri: 'chaos://templates/node-express',
      name: 'Node Express',
      description: 'Node.js Express 模板',
      mimeType: 'application/yaml'
    },
    handler: templateResourceHandler
  },
  {
    definition: {
      uri: 'chaos://templates/python-django',
      name: 'Python Django',
      description: 'Python Django 模板',
      mimeType: 'application/yaml'
    },
    handler: templateResourceHandler
  },
  {
    definition: {
      uri: 'chaos://templates/generic',
      name: 'Generic',
      description: '通用兜底模板',
      mimeType: 'application/yaml'
    },
    handler: templateResourceHandler
  }
];

/**
 * 获取模板资源
 */
export async function getTemplateResources(): Promise<Array<{
  definition: McpResourceDefinition;
  handler: McpResourceHandler;
}>> {
  return TEMPLATE_RESOURCES;
}