import { describe, it, expect } from 'vitest';
import { formatFooter, formatValue } from '~/lib/format';

describe('formatFooter', () => {
  it('uses the authentic engine footer form', () => {
    expect(formatFooter(6, 0.004)).toBe('6 rows in set (0.004 s)');
  });

  it('says row, not rows, for one', () => {
    expect(formatFooter(1, 0.002)).toBe('1 row in set (0.002 s)');
  });

  it('never uses middle-dot meta strings', () => {
    expect(formatFooter(12, 0.01)).not.toContain('·');
  });
});

describe('formatValue', () => {
  it('joins value and unit with a thin space', () => {
    expect(formatValue('90.04', '%')).toBe('90.04 %');
  });

  it('joins with a thin space, not an ordinary one', () => {
    expect(formatValue('90.04', '%')).not.toBe('90.04 %'); // plain U+0020
    expect(formatValue('90.04', '%').charCodeAt(5)).toBe(0x2009);
  });

  it('renders a missing value as NULL', () => {
    expect(formatValue(null, null)).toBe('NULL');
  });

  it('renders a value with no unit unchanged', () => {
    expect(formatValue('9.17', null)).toBe('9.17');
  });
});
