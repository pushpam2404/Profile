import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pushpam2404-profile.vercel.app',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // DuckDB-WASM ships its own workers; keep them out of Vite's optimizer.
    optimizeDeps: { exclude: ['@duckdb/duckdb-wasm'] },
  },
});
