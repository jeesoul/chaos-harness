// src/core/env-fixer/private-repo.ts

import { PrivateRepoCheckResult, CheckOptions } from './types.js';

/**
 * Check if a private repository URL is reachable
 */
export async function checkPrivateRepo(
  url: string,
  options?: CheckOptions
): Promise<PrivateRepoCheckResult> {
  const timeout = options?.timeout || 10000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return {
      url,
      reachable: response.status === 200 || response.status === 401,
      authRequired: response.status === 401,
      responseCode: response.status,
      error: null
    };
  } catch (error: unknown) {
    return {
      url,
      reachable: false,
      authRequired: false,
      responseCode: null,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Check multiple private repository URLs in parallel
 */
export async function checkMultiplePrivateRepos(
  urls: string[],
  options?: CheckOptions
): Promise<PrivateRepoCheckResult[]> {
  return Promise.all(urls.map(url => checkPrivateRepo(url, options)));
}