import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { DuckDBInstance } from '@duckdb/node-api';
import { buildWarehouse, TABLE_NAMES } from '~/lib/warehouse';

beforeAll(() => {
  execFileSync('npx', ['tsx', 'scripts/build-warehouse.ts'], { stdio: 'inherit' });
}, 120_000);

describe('warehouse parity', () => {
  it('writes a parquet file for every table', () => {
    for (const t of TABLE_NAMES) {
      expect(existsSync(`dist/warehouse/${t}.parquet`)).toBe(true);
    }
  });

  it('records the same row count the collections produced', async () => {
    const wh = await buildWarehouse();
    const manifest = JSON.parse(readFileSync('dist/warehouse/manifest.json', 'utf8'));
    for (const t of TABLE_NAMES) {
      const entry = manifest.tables.find((x: { name: string }) => x.name === t);
      expect(entry, `missing manifest entry for ${t}`).toBeDefined();
      expect(entry.rows).toBe(wh[t].length);
    }
  });

  // The row-count check above only proves the manifest agrees with itself.
  // This reads the Parquet bytes back through DuckDB and diffs them, row for
  // row, against buildWarehouse()'s in-memory output — the actual parity claim.
  it('round-trips every row of every table byte-for-byte through Parquet', async () => {
    const wh = await buildWarehouse();
    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();

    const sortKey = (row: Record<string, unknown>) => Object.keys(row)[0]!;

    // read_json_auto infers whole-number columns (e.g. dim_project.year) as
    // BIGINT, which node-api surfaces as JS `bigint` rather than `number` —
    // the same representation DuckDB-WASM returns in the browser. That's a
    // JS-type detail of the round trip, not a data mismatch, so normalize it
    // before comparing values.
    const normalize = (v: unknown): unknown => (typeof v === 'bigint' ? Number(v) : v);
    const normalizeRow = (row: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k, normalize(v)]));

    try {
      for (const t of TABLE_NAMES) {
        const reader = await conn.runAndReadAll(
          `SELECT * FROM read_parquet('dist/warehouse/${t}.parquet')`,
        );
        const readBack = (reader.getRowObjectsJS() as Record<string, unknown>[]).map(
          normalizeRow,
        );
        expect(readBack.length, `${t} row count`).toBe(wh[t].length);

        const key = sortKey(wh[t][0]!);
        const expected = [...wh[t]].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
        const actual = [...readBack].sort((a, b) =>
          String(a[key]).localeCompare(String(b[key])),
        );

        for (let i = 0; i < expected.length; i++) {
          expect(actual[i], `${t} row ${i} (${key}=${expected[i]![key]})`).toEqual(expected[i]);
        }
      }
    } finally {
      conn.closeSync();
    }
  });

  it('preserves nulls as null, not empty strings, across the round trip', async () => {
    const instance = await DuckDBInstance.create(':memory:');
    const conn = await instance.connect();
    try {
      // dim_org: 'ibm' and 'sih' have a null location in src/content/orgs.json.
      const orgReader = await conn.runAndReadAll(
        `SELECT * FROM read_parquet('dist/warehouse/dim_org.parquet') WHERE org_id = 'ibm'`,
      );
      const [ibm] = orgReader.getRowObjectsJS();
      expect(ibm).toBeDefined();
      expect(ibm!.location).toBeNull();
      expect(ibm!.location).not.toBe('');

      // fact_claim: the internal SIH qualification claim has a null value/unit/evidence.
      const claimReader = await conn.runAndReadAll(
        `SELECT * FROM read_parquet('dist/warehouse/fact_claim.parquet') WHERE claim_id = 'internal-sih-2026-qualification'`,
      );
      const [claim] = claimReader.getRowObjectsJS();
      expect(claim).toBeDefined();
      expect(claim!.value).toBeNull();
      expect(claim!.unit).toBeNull();
      expect(claim!.evidence).toBeNull();
      expect(claim!.caveat).not.toBeNull();
    } finally {
      conn.closeSync();
    }
  });
});
