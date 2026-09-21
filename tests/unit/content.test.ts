import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const read = (f: string) => JSON.parse(readFileSync(`src/content/${f}`, 'utf8'));

describe('content', () => {
  it('excludes the DRDO project from every file', () => {
    const blob = readdirSync('src/content', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.json') || f.endsWith('.md'))
      .map((f) => readFileSync(`src/content/${f}`, 'utf8'))
      .join('\n')
      .toLowerCase();
    for (const banned of ['drdo', 'lidar', 'sih_053', 'jetson', 'ouster', 'foveated']) {
      expect(blob).not.toContain(banned);
    }
  });

  it('ships all 12 verifiable credentials', () => {
    const creds = read('credentials.json');
    expect(creds).toHaveLength(12);
    for (const c of creds) expect(c.verify_url).toMatch(/^https:\/\//);
  });

  it('states at least four things that were built but not proven', () => {
    const untested = read('claims.json').filter((c: any) => c.verification === 'untested');
    expect(untested.length).toBeGreaterThanOrEqual(4);
  });

  it('holds itself to its own standard: CGPA is self_reported', () => {
    const cgpa = read('claims.json').find((c: any) => c.metric.toLowerCase().includes('cgpa'));
    expect(cgpa).toBeDefined();
    expect(cgpa.verification).toBe('self_reported');
  });

  it('ships six projects', () => {
    expect(readdirSync('src/content/projects').filter((f) => f.endsWith('.md'))).toHaveLength(6);
  });
});
