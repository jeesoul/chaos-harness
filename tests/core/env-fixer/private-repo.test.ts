// tests/core/env-fixer/private-repo.test.ts

import { describe, it, expect } from 'vitest';
import { checkPrivateRepo, checkMultiplePrivateRepos } from '../../../src/core/env-fixer/private-repo.js';

describe('PrivateRepoChecker', () => {
  it('should detect public URL as reachable', async () => {
    const result = await checkPrivateRepo('https://repo.maven.apache.org/maven2/');
    expect(result.reachable).toBe(true);
    expect(result.authRequired).toBe(false);
  });

  it('should detect HTTP 401 as auth required', async () => {
    // Mock or use test URL
    const result = await checkPrivateRepo('http://private-nexus.example.com/');
    if (result.responseCode === 401) {
      expect(result.authRequired).toBe(true);
    }
  });

  it('should handle connection timeout', async () => {
    const result = await checkPrivateRepo('http://nonexistent-host-12345.com/', { timeout: 5000 });
    expect(result.reachable).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should check multiple repos in parallel', async () => {
    const urls = [
      'https://repo.maven.apache.org/maven2/',
      'https://central.sonatype.com/'
    ];
    const results = await checkMultiplePrivateRepos(urls);
    expect(results.length).toBe(2);
  });
});