import { describe, it, expect } from 'vitest';
import { assertReadOnly } from '~/lib/sql-guard';

const ok = (sql: string) => expect(() => assertReadOnly(sql)).not.toThrow();
const rejects = (sql: string, msg: RegExp) =>
  expect(() => assertReadOnly(sql)).toThrow(msg);

describe('assertReadOnly', () => {
  it('allows a plain SELECT', () => {
    ok('SELECT metric FROM fact_claim');
  });

  it('allows a leading CTE', () => {
    ok('WITH x AS (SELECT 1) SELECT * FROM x');
  });

  it('allows a single trailing semicolon and surrounding whitespace', () => {
    ok('  SELECT 1;  ');
  });

  it('is case-insensitive', () => {
    ok('select 1');
  });

  it('refuses a statement that is not a query', () => {
    rejects('DROP TABLE fact_claim', /only select/i);
    rejects('DELETE FROM fact_claim', /only select/i);
    rejects('UPDATE fact_claim SET metric = 1', /only select/i);
    rejects('ATTACH \'x.db\'', /only select/i);
  });

  it('refuses a second statement smuggled after a SELECT', () => {
    rejects('SELECT 1; DROP TABLE fact_claim', /one statement at a time/i);
  });

  it('refuses an empty input with a useful message', () => {
    rejects('   ', /nothing to run/i);
  });
});
