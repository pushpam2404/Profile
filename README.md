# Pushpam Raj Satyarthi — Developer Portfolio

A personal portfolio built around one idea: every factual claim on the site carries a
verification status, and the site states what has not been proven as prominently as what
has. The claims ledger is a real dataset, rendered into the pages at build time and also
queryable live, in the browser, with actual SQL.

**This branch (`rebuild/warehouse`) is a from-scratch rebuild** of what was previously a
single-file `index.html`. That file still exists at the repo root and is still the live
site until this branch is finished and merged — see [Status](#status) below.

## Running it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # writes dist/, then emits dist/warehouse/*.parquet
npm run preview   # serve the production build locally
```

```bash
npm test          # vitest — schema, warehouse, formatting, parity
npm run typecheck # tsc --noEmit
npm run test:e2e  # playwright — accessibility and behaviour, once Task 16 lands
```

## Architecture

Content lives as typed, Zod-validated collections in `src/content/` — not as strings in
markup. A claim's `verification` status determines what fields it must carry:

| Status | Requires |
|---|---|
| `verified` | a public `source_url` a reader can open right now |
| `measured` | a `method` (hardware, dataset, procedure) and a `caveat` (what it doesn't prove) |
| `self_reported` | nothing — it's the author's word, and it's labelled as such |
| `untested` | a `caveat` saying what proving it would require, and `value: null` |

These rules are enforced by `src/content.config.ts` at build time — a claim missing its
required evidence fails the build. This is the mechanism that keeps the site honest; it
isn't a convention anyone has to remember to follow.

`src/lib/warehouse.ts` reads those same content files and projects them into a small star
schema (`dim_project`, `dim_credential`, `fact_claim`, …). Astro pages call it directly to
render; a `postbuild` script (`scripts/build-warehouse.ts`) also writes it out as Parquet.
Both paths read the same files, so the rendered pages and the queryable database cannot
disagree.

On `/` and `/console`, that Parquet is loaded into **DuckDB-WASM** running in your
browser — a real SQL engine, not a canned demo. The home page's hero query and the
`/console` page both execute against it live. Every page is fully readable with
JavaScript off; the WASM engine is a progressive enhancement over a statically rendered
result.

## Adding or editing a claim

Edit `src/content/claims.json`. Pick a `verification` status and supply what it requires
(above) — the build will refuse to compile otherwise, naming the offending claim. There is
no other content file to keep in sync: the ledger page, the CSV export, the home page's
hero, and the live SQL console all read from this one file.

## Status

Rebuild in progress, task-by-task, each with its own commit. Not yet merged to `main`, and
`index.html` is untouched and still live at the deployed URL until this branch replaces it.
