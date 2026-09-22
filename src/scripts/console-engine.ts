import * as duckdb from '@duckdb/duckdb-wasm';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { assertReadOnly } from '~/lib/sql-guard';

export const MAX_ROWS = 500;
export const TIMEOUT_MS = 5000;

export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  seconds: number;
  truncated: boolean;
}

export interface Engine {
  query(sql: string): Promise<QueryResult>;
  close(): Promise<void>;
}

interface Manifest {
  generated_at: string;
  tables: { name: string; rows: number; checksum: string }[];
}

export async function initEngine(): Promise<Engine> {
  const bundle = await duckdb.selectBundle({
    mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
    eh: { mainModule: ehWasm, mainWorker: ehWorker },
  });

  const worker = new Worker(bundle.mainWorker!);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker ?? null);

  const conn = await db.connect();
  await conn.query('CREATE SCHEMA IF NOT EXISTS career');

  // The build emits the manifest, so the table list has one definition. This
  // module cannot import lib/warehouse.ts — that reads the filesystem, which
  // does not exist in the browser.
  const manifest: Manifest = await fetch('/warehouse/manifest.json').then((r) => {
    if (!r.ok) throw new Error('Warehouse manifest is unavailable.');
    return r.json();
  });

  for (const { name } of manifest.tables) {
    if (!/^[a-z_]+$/.test(name)) throw new Error(`Refusing suspicious table name: ${name}`);
    const url = new URL(`/warehouse/${name}.parquet`, location.origin).href;
    await conn.query(`CREATE VIEW career.${name} AS SELECT * FROM read_parquet('${url}')`);
    // Unqualified names resolve too, so a reader need not type the schema.
    await conn.query(`CREATE VIEW ${name} AS SELECT * FROM career.${name}`);
  }

  return {
    async query(sql: string): Promise<QueryResult> {
      assertReadOnly(sql);
      const started = performance.now();
      const table = await Promise.race([
        conn.query(sql),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Query exceeded 5 s and was cancelled.')),
            TIMEOUT_MS,
          ),
        ),
      ]);
      const seconds = (performance.now() - started) / 1000;
      const columns = table.schema.fields.map((f: { name: string }) => f.name);
      const all = table
        .toArray()
        .map((r: Record<string, unknown>) => columns.map((c) => r[c]));
      return {
        columns,
        rows: all.slice(0, MAX_ROWS),
        seconds,
        truncated: all.length > MAX_ROWS,
      };
    },
    async close() {
      await conn.close();
      await db.terminate();
      worker.terminate();
    },
  };
}
