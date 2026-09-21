import { DuckDBInstance } from '@duckdb/node-api';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildWarehouse, TABLE_NAMES, type Row } from '../src/lib/warehouse.ts';

const OUT = 'dist/warehouse';

/** Stable checksum over the rows, so parity is provable and not just counted. */
const checksum = (rows: Row[]) =>
  createHash('sha256').update(JSON.stringify(rows)).digest('hex').slice(0, 16);

async function main() {
  const wh = await buildWarehouse();

  // Scope deletion to dist/warehouse/ only — dist/ itself is astro build
  // output and must survive when postbuild runs after it.
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();

  const tables: { name: string; rows: number; checksum: string }[] = [];

  for (const name of TABLE_NAMES) {
    const rows = wh[name];
    // Round-trip through JSON so DuckDB infers the column types itself,
    // keeping build-time and browser-side schemas identical.
    const staging = `${OUT}/${name}.json`;
    await writeFile(staging, JSON.stringify(rows));
    await conn.run(
      `COPY (SELECT * FROM read_json_auto('${staging}')) TO '${OUT}/${name}.parquet' (FORMAT parquet)`,
    );
    await rm(staging);
    tables.push({ name, rows: rows.length, checksum: checksum(rows) });
  }

  await writeFile(
    `${OUT}/manifest.json`,
    JSON.stringify({ generated_at: new Date().toISOString(), tables }, null, 2),
  );

  conn.closeSync();
  console.log(`warehouse: ${tables.length} tables, ${tables.reduce((n, t) => n + t.rows, 0)} rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
