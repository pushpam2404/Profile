import { describe, it, expect } from 'vitest';
import pkg from '../../package.json' with { type: 'json' };

describe('project scaffold', () => {
  it('pins astro 7 and does not use the duckdb-wasm dev tag', () => {
    expect(pkg.dependencies.astro).toBe('7.3.3');
    expect(pkg.dependencies['@duckdb/duckdb-wasm']).toBe('1.32.0');
    expect(pkg.dependencies['@duckdb/duckdb-wasm']).not.toContain('dev');
  });

  it('declares no UI framework', () => {
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of ['react', 'preact', 'vue', 'svelte']) {
      expect(Object.keys(all).some((d) => d.includes(banned))).toBe(false);
    }
  });
});
