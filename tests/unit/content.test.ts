import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

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

  it('holds both testimonials byte-for-byte as given', () => {
    const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
    const bodies = Object.fromEntries(
      read('testimonials.json').map((t: any) => [t.id, sha(t.body)]),
    );
    // These are quotations from named people. If a hash changes, the quote was
    // altered — re-verify against Recommendations_Received.csv before updating.
    expect(bodies).toEqual({
      'ambuj-2026-06': '97bba6f6f8bd8335e1abd3465ab8766e612736f75974046acac1bddb466a3335',
      'sachin-2026-07': '81ab739aef1f2570af50e4b0dc177ad1e6ba938bf3a2dd0b1f8e42af64e2a9e0',
    });
  });

  it('ships six projects', () => {
    expect(readdirSync('src/content/projects').filter((f) => f.endsWith('.md'))).toHaveLength(6);
  });
});
