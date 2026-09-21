import { describe, it, expect } from 'vitest';
import { claimSchema } from '~/content.config';

const base = {
  metric: 'X-platform classifier accuracy',
  value: '90.04',
  unit: '%',
  method: '101,000+ labelled accounts, 13 engineered features, held-out split',
  caveat: 'Measured on a held-out split of a public dataset, not on live traffic.',
  source_url: null,
  evidence: null,
};

describe('claim schema', () => {
  it('accepts a measured claim that discloses method and caveat', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'measured' });
    expect(r.success).toBe(true);
  });

  it('rejects a measured claim with no method', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'measured', method: null });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r)).toContain('method');
  });

  it('rejects a measured claim with no caveat', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'measured', caveat: null });
    expect(r.success).toBe(false);
  });

  it('rejects a verified claim with no public source_url', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'verified', source_url: null });
    expect(r.success).toBe(false);
  });

  it('rejects an untested claim with no caveat', () => {
    const r = claimSchema.safeParse({
      ...base, verification: 'untested', value: null, caveat: null,
    });
    expect(r.success).toBe(false);
  });

  it('accepts a self_reported claim with no external evidence', () => {
    const r = claimSchema.safeParse({
      ...base, metric: 'CGPA', value: '9.17', unit: null,
      verification: 'self_reported', method: null, caveat: null,
      evidence: 'No public transcript to link.',
    });
    expect(r.success).toBe(true);
  });

  it('refuses an unknown verification status', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'probably_true' });
    expect(r.success).toBe(false);
  });
});
