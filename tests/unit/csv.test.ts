import { describe, it, expect } from 'vitest';
import { toCsv } from '~/lib/format';

describe('toCsv', () => {
  it('writes a header row from the keys of the first row', () => {
    expect(toCsv([{ a: '1', b: '2' }]).split('\n')[0]).toBe('a,b');
  });

  it('quotes fields containing commas, quotes or newlines', () => {
    expect(toCsv([{ a: 'x,y' }])).toContain('"x,y"');
    expect(toCsv([{ a: 'he said "no"' }])).toContain('"he said ""no"""');
  });

  it('writes null as an empty field', () => {
    expect(toCsv([{ a: null, b: '1' }]).split('\n')[1]).toBe(',1');
  });

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});
