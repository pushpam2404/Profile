# Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-file `index.html` portfolio with a static Astro site where every claim carries a build-enforced verification status, and where the rendered pages and an in-browser DuckDB warehouse are compiled from one typed source.

**Architecture:** Typed Zod-validated content collections are the single source of truth. Astro renders static pages from them at build time; a postbuild script feeds the same files through DuckDB and emits Parquet, which DuckDB-WASM queries in the reader's browser. Because both artifacts derive from one input, the page and the warehouse cannot disagree. Schema refinements make an unverifiable claim a build failure rather than a convention.

**Tech Stack:** Astro 7, TypeScript 7 (strict), Tailwind v4 (CSS-first `@theme`), `@duckdb/node-api` (build) + `@duckdb/duckdb-wasm` (browser), Vitest, Playwright, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-22-portfolio-rebuild-design.md` — read it before Task 1. Section references below (§3, §4.2, …) point into it.

## Global Constraints

Every task's requirements implicitly include this section.

- **Branch:** all work on `rebuild/warehouse`. `index.html` stays untouched and live until Task 17.
- **DRDO exclusion:** the `sih_053` / DRDO LiDAR project must not appear in any content, schema, fixture, example query, comment, commit message, or metadata. Non-negotiable (spec §5.3, §10).
- **No `astro check`.** It is inert without `@astrojs/check`, and that package peers on TypeScript ^5||^6 against our pinned TS 7. `typecheck` is therefore `tsc --noEmit` alone. Content-schema violations are caught by `astro build` (Astro validates collections during the build) and again by Task 5's suite, which reads the real content through `getCollection`. Never reintroduce `astro check` into a script or a CI step.
- **Versions (pinned exactly):** `astro@7.3.3`, `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `typescript@7.0.2`, `vitest@5.0.1`, `@playwright/test@1.63.0`, `@duckdb/duckdb-wasm@1.32.0` (the `latest` dist-tag is a `-dev` build — do not use it), `@duckdb/node-api@1.5.5-r.5`, `tsx@4.23.15`, `@astrojs/sitemap@3.7.4`, `@fontsource-variable/newsreader@5.3.0`, `@fontsource/ibm-plex-mono@5.3.0`, `satori@0.33.4`, `@resvg/resvg-js@2.6.2`.
- **No UI framework.** No React, Preact, Vue, or Svelte. The console is vanilla TypeScript in an Astro `<script>`, lazily initialised by `IntersectionObserver`. This keeps the static pages at zero JS.
- **Typography rule (spec §4.3):** prose is Newsreader, data is IBM Plex Mono, there is no third family and no sans-serif. Never break this for convenience.
- **Color rule (spec §4.2):** the only hues in the interface are `--paper`, `--bar`, `--rule`, `--ink`, `--ink-soft` and the four status colors. Status is never signalled by color alone — always a text label too.
- **Forbidden visual defaults (spec §4.3):** tracked-out ALL-CAPS eyebrow labels; accenting one word of a headline; meta strings joined with middle dots; `→` appended to link text; identical rounded cards with soft grey shadows; drop shadows anywhere.
- **Copy rule:** result-set footers use the authentic engine form `N rows in set (0.00X s)`, never `N items · 0.00Xs · duckdb`.
- **Content truthfulness:** every value comes from the author's resume (`~/Documents/College/Internship/My Resume 2.pdf`), LinkedIn export (`~/Downloads/Basic_LinkedInDataExport_09-21-2026/`), his GitHub repos, or local certificate PDFs. Invent nothing. If a number cannot be sourced, it does not ship.
- **One `<h1>` per page.** Task 16 asserts exactly one on every route. Applies to Tasks 9–12 and 14.
- **The console Run control is a `<button>`** whose accessible name is "Run". Task 16 locates it by role.
- **Commit style:** imperative subject, body explains why. Commit at the end of every task.

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.nvmrc`
- Create: `src/pages/index.astro` (temporary placeholder, replaced in Task 9)
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run dev`, `npm run build`, `npm run test`, `npm run typecheck` scripts that every later task relies on. Path alias `~/*` → `src/*`.

- [ ] **Step 1: Create the branch**

```bash
cd ~/Desktop/Profile
git checkout -b rebuild/warehouse
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "pushpam-portfolio",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "postbuild": "tsx scripts/build-warehouse.ts",
    "preview": "astro preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "astro": "7.3.3",
    "@astrojs/sitemap": "3.7.4",
    "@fontsource-variable/newsreader": "5.3.0",
    "@fontsource/ibm-plex-mono": "5.3.0",
    "@duckdb/duckdb-wasm": "1.32.0",
    "js-yaml": "4.3.2"
  },
  "devDependencies": {
    "@duckdb/node-api": "1.5.5-r.5",
    "@playwright/test": "1.63.0",
    "@resvg/resvg-js": "2.6.2",
    "@tailwindcss/vite": "4.3.3",
    "satori": "0.33.4",
    "tailwindcss": "4.3.3",
    "@types/js-yaml": "4.0.9",
    "tsx": "4.23.15",
    "typescript": "7.0.2",
    "vitest": "5.0.1"
  }
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
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
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": { "~/*": ["src/*"] }
  },
  "include": [".astro/types.d.ts", "src/**/*", "scripts/**/*", "tests/**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Write `vitest.config.ts`**

Use `getViteConfig` from `astro/config`, not a bare `defineConfig`. Later tasks test code
that imports `astro:content`, which is a virtual module only Astro's own Vite pipeline can
resolve. Stubbing it would defeat Task 5, whose whole purpose is to read the real content.

```ts
import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default getViteConfig({
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 6: Write `.gitignore` and `.nvmrc`**

`.gitignore`:
```
node_modules/
dist/
.astro/
.DS_Store
.vercel/
test-results/
playwright-report/
```

`.nvmrc`:
```
22
```

- [ ] **Step 7: Write the failing smoke test**

`tests/unit/smoke.test.ts`:
```ts
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
```

- [ ] **Step 8: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `vitest` is not installed yet.

- [ ] **Step 9: Install and create the placeholder page**

```bash
npm install
mkdir -p src/pages
```

`src/pages/index.astro`:
```astro
---
// Replaced in Task 9.
---
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Pushpam Raj Satyarthi</title></head>
  <body><p>Scaffold.</p></body>
</html>
```

- [ ] **Step 10: Run the tests and the build to verify they pass**

Run: `npm test && npm run build`
Expected: 2 tests PASS. `npm run build` runs `astro build`; its `postbuild` step fails on the missing `scripts/build-warehouse.ts` until Task 6 adds it, which is expected. Use `npx astro build` to confirm the Astro build itself succeeds.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .gitignore .nvmrc src/pages/index.astro tests/unit/smoke.test.ts
git commit -m "Scaffold Astro project with pinned versions

Pins duckdb-wasm to 1.32.0 because the registry's latest dist-tag
points at a -dev build. A test enforces both the pin and the
no-UI-framework constraint so neither can regress silently."
```

---

### Task 2: Design tokens, fonts, and global styles

**Files:**
- Create: `src/styles/theme.css`, `src/styles/global.css`
- Test: `tests/unit/tokens.test.ts`

**Interfaces:**
- Consumes: Task 1 scaffold.
- Produces: CSS custom properties `--color-paper|bar|rule|ink|ink-soft|verified|measured|reported|untested`, font families `--font-prose` (Newsreader) and `--font-data` (IBM Plex Mono), and the type scale utilities every component uses.

- [ ] **Step 1: Write the failing token test**

`tests/unit/tokens.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/theme.css', 'utf8');

describe('design tokens', () => {
  it('defines the greenbar ground and the four status hues', () => {
    const required: Record<string, string> = {
      '--color-paper': '#EDEFEA',
      '--color-bar': '#E2E8DD',
      '--color-rule': '#C9D0C6',
      '--color-ink': '#16231D',
      '--color-ink-soft': '#4A5A52',
      '--color-verified': '#0F6E63',
      '--color-measured': '#2E4A63',
      '--color-reported': '#9A6B1F',
      '--color-untested': '#8C3A2B',
    };
    for (const [token, hex] of Object.entries(required)) {
      expect(css).toContain(`${token}: ${hex}`);
    }
  });

  it('binds exactly two font families and no sans-serif', () => {
    expect(css).toContain('--font-prose');
    expect(css).toContain('--font-data');
    expect(css).toContain('Newsreader');
    expect(css).toContain('IBM Plex Mono');
    expect(css).not.toMatch(/--font-sans|Inter|Helvetica Neue/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: FAIL — `ENOENT: src/styles/theme.css`.

- [ ] **Step 3: Write `src/styles/theme.css`**

```css
@import "tailwindcss";

@theme {
  /* Ground — greenbar continuous-feed stock (spec §4.1) */
  --color-paper: #EDEFEA;
  --color-bar: #E2E8DD;
  --color-rule: #C9D0C6;
  --color-ink: #16231D;
  --color-ink-soft: #4A5A52;

  /* Verification legend — the only other hues in the interface (spec §4.2) */
  --color-verified: #0F6E63;
  --color-measured: #2E4A63;
  --color-reported: #9A6B1F;
  --color-untested: #8C3A2B;

  /* Focus is not a status. Borrowing a legend hue here would make every
     focused control read as a claim with a disclosed method (spec §4.2). */
  --color-focus: var(--color-ink);

  /* Prose is serif, data is mono, there is no third family (spec §4.3) */
  --font-prose: "Newsreader Variable", Georgia, serif;
  --font-data: "IBM Plex Mono", ui-monospace, monospace;

  /* Type scale, 1.25 ratio */
  --text-display: 3.052rem;
  --text-display--line-height: 1.1;
  --text-h1: 2.441rem;
  --text-h1--line-height: 1.15;
  --text-h2: 1.953rem;
  --text-h2--line-height: 1.2;
  --text-h3: 1.563rem;
  --text-h3--line-height: 1.3;
  --text-body: 1.125rem;
  --text-body--line-height: 1.65;
  --text-small: 0.875rem;
  --text-small--line-height: 1.5;
  --text-data: 0.9375rem;
  --text-data--line-height: 1.55;
  --text-label: 0.8125rem;
  --text-label--line-height: 1.4;

  --radius-control: 2px;
}
```

- [ ] **Step 4: Write `src/styles/global.css`**

```css
@import "./theme.css";
@import "@fontsource-variable/newsreader";
@import "@fontsource/ibm-plex-mono/400.css";
@import "@fontsource/ibm-plex-mono/500.css";

:root { color-scheme: light; }

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-prose);
  font-size: var(--text-body);
  line-height: 1.65;
  margin: 0;
}

/* Prose measure caps at 68 characters (spec §4.3) */
.prose-measure { max-width: 68ch; }

/* Data is mono with aligned numerals, everywhere, without exception */
.data, table, code, pre {
  font-family: var(--font-data);
  font-size: var(--text-data);
  font-variant-numeric: tabular-nums;
}

/* Paper does not float: hairline rules and bands carry structure, never shadow */
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 0.45rem 0.75rem; border-bottom: 1px solid var(--color-rule); }
td.numeric, th.numeric { text-align: right; }
tbody tr:nth-child(even) { background-color: var(--color-bar); }

a { color: inherit; text-underline-offset: 0.18em; }

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/styles tests/unit/tokens.test.ts
git commit -m "Add greenbar design tokens and global styles

Color is the verification legend rather than decoration, so the token
set is deliberately small and a test pins every hex value. The
serif-prose/mono-data split is enforced by asserting no sans-serif
family is ever declared."
```

---

### Task 3: Content schemas with build-enforced verification

**Files:**
- Create: `src/content.config.ts`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: Task 1 scaffold.
- Produces: collections `orgs`, `people`, `skills`, `credentials`, `roles`, `testimonials`, `claims`, `projects`. Exported type `Verification = 'verified' | 'measured' | 'self_reported' | 'untested'`. Exported `claimSchema` for direct unit testing.

This task is the integrity mechanism of the whole site (spec §3). The refinements below are what make an unverifiable claim a build failure.

- [ ] **Step 1: Write the failing schema test**

`tests/unit/schema.test.ts`:
```ts
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

  it('rejects an untested claim that still carries a value', () => {
    const r = claimSchema.safeParse({
      ...base, verification: 'untested', value: '5',
      caveat: 'Needs a recorded run on real hardware.',
    });
    expect(r.success).toBe(false);
  });

  it('refuses whitespace as a substitute for a disclosed method', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'measured', method: '   ' });
    expect(r.success).toBe(false);
  });

  it('refuses whitespace as a substitute for a caveat', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'measured', caveat: '  ' });
    expect(r.success).toBe(false);
  });

  it('refuses an empty string where absence is meant', () => {
    const r = claimSchema.safeParse({ ...base, verification: 'measured', method: '' });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL — cannot resolve `~/content.config`.

- [ ] **Step 3: Write `src/content.config.ts`**

```ts
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

export const VERIFICATION = ['verified', 'measured', 'self_reported', 'untested'] as const;
export type Verification = (typeof VERIFICATION)[number];

/**
 * A claim may not be stated without the evidence its status demands.
 * These refinements are the site's thesis expressed as a build gate (spec §3).
 */
/**
 * Every string that can carry evidence is trimmed and required to be non-empty.
 * Absence is expressed as null, never as "" or "   " — otherwise a claim could
 * satisfy a disclosure gate with whitespace, which is the whole failure this
 * schema exists to prevent.
 */
const evidenceText = z.string().trim().min(1).nullable();

export const claimSchema = z
  .object({
    metric: z.string().trim().min(1),
    value: evidenceText,
    unit: evidenceText,
    verification: z.enum(VERIFICATION),
    method: evidenceText,
    caveat: evidenceText,
    source_url: z.string().url().nullable(),
    evidence: evidenceText,
  })
  .superRefine((c, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });

    if (c.verification === 'verified' && !c.source_url) {
      fail('source_url', 'A verified claim needs a public URL the reader can open.');
    }
    if (c.verification === 'measured') {
      if (!c.method) fail('method', 'A measured claim must state hardware, dataset and procedure.');
      if (!c.caveat) fail('caveat', 'A measured claim must state what the number does not prove.');
    }
    if (c.verification === 'untested' && !c.caveat) {
      fail('caveat', 'An untested claim must state what proving it would require.');
    }
    if (c.verification === 'untested' && c.value !== null) {
      fail('value', 'An untested claim has no value. Use null.');
    }
  });

const orgs = defineCollection({
  loader: file('src/content/orgs.json'),
  schema: z.object({
    name: z.string(),
    kind: z.enum(['employer', 'university', 'club', 'agency', 'issuer']),
    location: z.string().nullable(),
  }),
});

const people = defineCollection({
  loader: file('src/content/people.json'),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    org: reference('orgs'),
    profile_url: z.string().url().nullable(),
  }),
});

const skills = defineCollection({
  loader: file('src/content/skills.json'),
  schema: z.object({
    name: z.string(),
    category: z.enum([
      'language', 'data-engineering', 'database', 'machine-learning',
      'framework', 'cloud', 'tool', 'concept',
    ]),
    first_used_on: z.string().regex(/^\d{4}-\d{2}$/),
  }),
});

const credentials = defineCollection({
  loader: file('src/content/credentials.json'),
  schema: z.object({
    name: z.string(),
    issuer: reference('orgs'),
    issued_on: z.string().regex(/^\d{4}-\d{2}$/),
    verify_url: z.string().url(),
    track: z.string().nullable(),
  }),
});

const roles = defineCollection({
  loader: file('src/content/roles.json'),
  schema: z.object({
    org: reference('orgs'),
    title: z.string(),
    started_on: z.string().regex(/^\d{4}-\d{2}$/),
    ended_on: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
    summary: z.string(),
  }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
  schema: z.object({
    person: reference('people'),
    body: z.string().min(1),
    given_on: z.string().regex(/^\d{4}-\d{2}$/),
    source_url: z.string().url(),
  }),
});

const claims = defineCollection({
  loader: file('src/content/claims.json'),
  schema: claimSchema.and(z.object({ project: reference('projects').optional() })),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    codename: z.string().nullable(),
    year: z.number().int(),
    context: z.string(),
    org: reference('orgs').optional(),
    repo_url: z.string().url().nullable(),
    live_url: z.string().url().nullable(),
    status: z.enum(['shipped', 'prototype', 'active-development', 'archived']),
    summary: z.string().min(1),
    stack: z.array(z.string()).min(1),
    skills: z.array(reference('skills')).min(1),
    order: z.number().int(),
  }),
});

export const collections = {
  orgs, people, skills, credentials, roles, testimonials, claims, projects,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: 11 tests PASS.

`astro:content` resolves because Task 1's `vitest.config.ts` uses `getViteConfig`. Do not
stub the module.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts tests/unit/schema.test.ts
git commit -m "Add content schemas that reject unverifiable claims

The verification status is not a label applied after the fact: a
measured claim without a method, or a verified claim without a public
URL, fails validation and breaks the build. Seven tests pin each rule."
```

---

### Task 4: Author the content

**Files:**
- Create: `src/content/orgs.json`, `people.json`, `skills.json`, `credentials.json`, `roles.json`, `testimonials.json`, `claims.json`
- Create: `src/content/projects/{secure-erasure,threat-detection,banking-etl,kaps-medtech,autocomplete-engine,tripsync}.md`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Consumes: Task 3 schemas.
- Produces: the real dataset every page and the warehouse render from. Entry ids are the JSON `id` fields and the project filenames.

Source of every value: spec §5.3. Read it before writing. Re-read the source files named in Global Constraints rather than recalling numbers from memory.

- [ ] **Step 1: Write the failing content test**

`tests/unit/content.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

const read = (f: string) => JSON.parse(readFileSync(`src/content/${f}`, 'utf8'));

describe('content', () => {
  it('excludes the DRDO project from every file', () => {
    const blob = readdirSync('src/content', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.json') || f.endsWith('.md'))
      .map((f) => readFileSync(`src/content/${f}`, 'utf8'))
      .join('\n')
      .toLowerCase();
    for (const banned of ['drdo', 'lidar', 'sih_053', 'jetson', 'ouster', 'foveated']) {
      expect(blob).not.toContain(banned);
    }
  });

  it('ships all 12 verifiable credentials', () => {
    const creds = read('credentials.json');
    expect(creds).toHaveLength(12);
    for (const c of creds) expect(c.verify_url).toMatch(/^https:\/\//);
  });

  it('states at least four things that were built but not proven', () => {
    const untested = read('claims.json').filter((c: any) => c.verification === 'untested');
    expect(untested.length).toBeGreaterThanOrEqual(4);
  });

  it('holds itself to its own standard: CGPA is self_reported', () => {
    const cgpa = read('claims.json').find((c: any) => c.metric.toLowerCase().includes('cgpa'));
    expect(cgpa).toBeDefined();
    expect(cgpa.verification).toBe('self_reported');
  });

  it('ships six projects', () => {
    expect(readdirSync('src/content/projects').filter((f) => f.endsWith('.md'))).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/content.test.ts`
Expected: FAIL — `src/content` does not exist.

- [ ] **Step 3: Write `src/content/orgs.json`**

```json
[
  { "id": "gitam", "name": "GITAM University", "kind": "university", "location": "Visakhapatnam, India" },
  { "id": "motherson", "name": "Motherson Technology Services", "kind": "employer", "location": "Hyderabad, India" },
  { "id": "github-community-gitam", "name": "GitHub Community GITAM", "kind": "club", "location": "Visakhapatnam, India" },
  { "id": "aerogitam", "name": "AeroGITAM", "kind": "club", "location": "Visakhapatnam, India" },
  { "id": "ibm", "name": "IBM", "kind": "issuer", "location": null },
  { "id": "sih", "name": "Smart India Hackathon", "kind": "issuer", "location": null },
  { "id": "ntro", "name": "National Technical Research Organisation", "kind": "agency", "location": "India" },
  { "id": "itbp", "name": "Indo-Tibetan Border Police / Ministry of Home Affairs", "kind": "agency", "location": "India" }
]
```

- [ ] **Step 4: Write `src/content/people.json` and `testimonials.json`**

`people.json`:
```json
[
  { "id": "sachin-singhal", "name": "Sachin Singhal", "title": "Head, AI/ML Product Management", "org": "motherson", "profile_url": null },
  { "id": "ambuj-upadhyay", "name": "Ambuj Upadhyay", "title": "Senior AI Engineer", "org": "motherson", "profile_url": null }
]
```

`testimonials.json` — copy both recommendation bodies verbatim from
`~/Downloads/Basic_LinkedInDataExport_09-21-2026/Recommendations_Received.csv`. Do not
paraphrase or trim. Shape:
```json
[
  {
    "id": "ambuj-2026-06",
    "person": "ambuj-upadhyay",
    "body": "<verbatim text from Recommendations_Received.csv>",
    "given_on": "2026-06",
    "source_url": "https://www.linkedin.com/in/pushpamrajsatyarthi/"
  },
  {
    "id": "sachin-2026-07",
    "person": "sachin-singhal",
    "body": "<verbatim text from Recommendations_Received.csv>",
    "given_on": "2026-07",
    "source_url": "https://www.linkedin.com/in/pushpamrajsatyarthi/"
  }
]
```

- [ ] **Step 5: Write `src/content/credentials.json`**

All 12 rows, ids kebab-cased from the name, `issuer` `ibm` for the eleven Coursera
courses and `sih` for the last. `track` is `"IBM Data Engineering Professional Certificate"`
for the eleven and `null` for the SIH credential. Verify URLs and dates, copied from
`Certifications.csv`:

```
introduction-to-data-engineering          2025-08  PPXM2EIVYUGV
python-for-data-science-ai-development    2025-09  E43M6MRBAPH6
databases-and-sql-for-data-science        2025-09  TBZI4GRB0QZD
python-project-for-data-engineering       2025-10  A0PS6Y2XWMLN
introduction-to-relational-databases      2025-11  HZEFOAE0FXBR
linux-commands-and-shell-scripting        2026-01  NVGIXXVUL7GQ
relational-database-administration        2026-01  LD888BFZGA6V
etl-and-data-pipelines                    2026-03  1SQO6M7Y6E1S
data-warehouse-fundamentals               2026-03  OAW14U4FU5CW
bi-dashboards-cognos-looker               2026-07  OIXEVWGB9X4K
introduction-to-nosql-databases           2026-09  O86Z5NMJW6BV
```

Coursera URL form: `https://www.coursera.org/account/accomplishments/records/<CODE>`

Twelfth row:
```json
{
  "id": "internal-sih-2026",
  "name": "Internal Smart India Hackathon 2026",
  "issuer": "sih",
  "issued_on": "2026-09",
  "verify_url": "https://creds.gitam.edu/c/fb5c93db61ce42a5b8e20a8076709e05",
  "track": null
}
```

- [ ] **Step 6: Write `src/content/roles.json`**

Four rows from `Positions.csv`, summaries rewritten as prose (not bullet dumps):
`motherson` AI/ML Intern 2026-05→2026-06; `github-community-gitam` Open Source Lead
2026-08→null; `aerogitam` Aircraft Domain Lead 2025-02→2025-11; `aerogitam` Aircraft
Domain Member 2024-08→2025-02.

- [ ] **Step 7: Write `src/content/skills.json`**

One row per skill named in the resume's Technical Skills block, categorised by the
`category` enum from Task 3. `first_used_on` is the month of the earliest project or
role that used it — derivable from the project years; where genuinely unknown, use the
month of the earliest credential covering it.

- [ ] **Step 8: Write the six project files**

Frontmatter matches the `projects` schema exactly; the markdown body is the case-study
narrative (problem, approach, architecture, what it does not do). Filenames and `order`:

| File | name | year | status | order |
|---|---|---|---|---|
| `secure-erasure.md` | Integrated Secure Data Erasure & Advanced File Recovery | 2026 | prototype | 1 |
| `threat-detection.md` | Dual-Platform Fake Account & Threat Detection Engine | 2026 | prototype | 2 |
| `banking-etl.md` | Global Banking Data: ETL Pipeline | 2026 | shipped | 3 |
| `kaps-medtech.md` | KAPS MedTech | 2026 | shipped | 4 |
| `autocomplete-engine.md` | High-Performance Autocomplete Engine | 2026 | shipped | 5 |
| `tripsync.md` | TripSync | 2025 | active-development | 6 |

`repo_url` values are `https://github.com/pushpam2404/{sih_149,fake_acc,global-finance-etl,KAPS-Medtech,<autocomplete repo or null>,Trip-Sync}`.
`live_url`: `https://kaps-medtech.vercel.app` and `https://trip-sync-rho.vercel.app`; null for the rest.

TripSync's body must carry its own README's warning that it is buggy and in active
development. The site does not soften what the author already published.

- [ ] **Step 9: Write `src/content/claims.json`**

Every row from spec §3's worked-example table, plus each project's own metrics. Minimum
bar enforced by the tests: 12 `verified`, ≥ 4 `untested`, and CGPA as `self_reported`.
The four `untested` rows come from the NTRO project's own "What we claim and don't"
table: NIST 800-88 Purge, physical-drive erase, `bulk_extractor` integration, and
recovery-rate measurement on a real forensic corpus.

Each `measured` row must carry a real `method` and a real `caveat` or Task 3's schema
rejects it. Example row:
```json
{
  "id": "threat-detection-x-accuracy",
  "project": "threat-detection",
  "metric": "X-platform classifier accuracy",
  "value": "90.04",
  "unit": "%",
  "verification": "measured",
  "method": "Dual platform-specific XGBoost classifiers trained on 101,000+ labelled accounts; 13 engineered features for X, held-out evaluation split.",
  "caveat": "Measured on a held-out split of the labelled dataset, not against live platform traffic. Reached only after removing a mislabelled 50,000-row subset that had capped accuracy at 67%.",
  "source_url": null,
  "evidence": null
}
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/content.test.ts && npx astro build`
Expected: 5 tests PASS, and the build validates every entry against Task 3's schemas —
a bad `reference()` id or a claim missing its required evidence fails the build here.

Prove the gate is live before moving on: temporarily change one claim's `verification` to
`measured` and delete its `method`, confirm `npx astro build` fails naming that entry, then
restore it. A gate nobody has seen fail is not known to be a gate.

- [ ] **Step 11: Commit**

```bash
git add src/content tests/unit/content.test.ts
git commit -m "Add the real content as typed collections

Every value is sourced from the resume, the LinkedIn export, the
repositories or the certificate PDFs. Tests pin the things that are
easy to erode: twelve checkable credentials, at least four admissions
of what was never proven, CGPA marked self-reported, and a guard that
keeps the excluded project out of every file."
```

---

### Task 5: Warehouse builder

**Files:**
- Create: `src/lib/warehouse.ts`
- Test: `tests/unit/warehouse.test.ts`

**Interfaces:**
- Consumes: Task 3 collections, Task 4 content.
- Produces:
  - `type Row = Record<string, string | number | boolean | null>`
  - `interface Warehouse { dim_project, dim_credential, dim_org, dim_skill, dim_person, fact_claim, fact_contribution, fact_role, fact_testimonial: Row[] }`
  - `async function buildWarehouse(): Promise<Warehouse>`
  - `const TABLE_NAMES: readonly (keyof Warehouse)[]`

- [ ] **Step 1: Write the failing warehouse test**

`tests/unit/warehouse.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildWarehouse, TABLE_NAMES } from '~/lib/warehouse';

const wh = await buildWarehouse();

describe('warehouse', () => {
  it('emits every declared table, none empty', () => {
    for (const t of TABLE_NAMES) expect(wh[t].length).toBeGreaterThan(0);
  });

  it('keeps referential integrity on fact_claim.project_id', () => {
    const ids = new Set(wh.dim_project.map((p) => p.project_id));
    for (const c of wh.fact_claim) {
      if (c.project_id !== null) expect(ids.has(c.project_id)).toBe(true);
    }
  });

  it('keeps referential integrity on fact_contribution', () => {
    const projects = new Set(wh.dim_project.map((p) => p.project_id));
    const skills = new Set(wh.dim_skill.map((s) => s.skill_id));
    for (const f of wh.fact_contribution) {
      expect(projects.has(f.project_id)).toBe(true);
      expect(skills.has(f.skill_id)).toBe(true);
    }
  });

  // Astro logs a broken reference() id as an error but still exits 0, so the
  // build is NOT the referential-integrity gate. This test is.
  it('resolves every foreign key in the warehouse', () => {
    const keyed = (rows: typeof wh.dim_org, k: string) => new Set(rows.map((r) => r[k]));
    const orgs = keyed(wh.dim_org, 'org_id');
    const people = keyed(wh.dim_person, 'person_id');
    const projects = keyed(wh.dim_project, 'project_id');

    const edges: [string, unknown[], Set<unknown>][] = [
      ['dim_person.org_id', wh.dim_person.map((r) => r.org_id), orgs],
      ['dim_project.org_id', wh.dim_project.map((r) => r.org_id), orgs],
      ['dim_credential.issuer_id', wh.dim_credential.map((r) => r.issuer_id), orgs],
      ['fact_role.org_id', wh.fact_role.map((r) => r.org_id), orgs],
      ['fact_testimonial.person_id', wh.fact_testimonial.map((r) => r.person_id), people],
      ['fact_claim.project_id', wh.fact_claim.map((r) => r.project_id), projects],
    ];

    for (const [label, values, valid] of edges) {
      for (const v of values) {
        if (v === null) continue;
        expect(valid.has(v), `${label} points at missing id: ${String(v)}`).toBe(true);
      }
    }
  });

  it('carries method and caveat on every measured claim', () => {
    for (const c of wh.fact_claim.filter((r) => r.verification === 'measured')) {
      expect(c.method).toBeTruthy();
      expect(c.caveat).toBeTruthy();
    }
  });

  it('never mentions the excluded project', () => {
    const blob = JSON.stringify(wh).toLowerCase();
    for (const banned of ['drdo', 'lidar', 'jetson']) expect(blob).not.toContain(banned);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/warehouse.test.ts`
Expected: FAIL — cannot resolve `~/lib/warehouse`.

- [ ] **Step 3: Write `src/lib/warehouse.ts`**

This module must run under plain Node, not only inside Astro. It is imported by pages
during the build, by the Vitest suite, and by Task 6's Parquet script — and `astro:content`
is a virtual module that exists in none of the latter two. So the warehouse reads the
content files directly. Astro still validates the same files through `content.config.ts`
on every build; that path is unchanged and remains the schema gate.

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load as parseYaml } from 'js-yaml';

const CONTENT = 'src/content';

const readJson = <T>(file: string): T[] =>
  JSON.parse(readFileSync(join(CONTENT, file), 'utf8')) as T[];

/** Project frontmatter, read without Astro so this works under plain Node. */
function readProjects(): Record<string, unknown>[] {
  const dir = join(CONTENT, 'projects');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
      if (!m) throw new Error(`${f} has no frontmatter block`);
      return { id: f.replace(/\.md$/, ''), ...(parseYaml(m[1]!) as object) };
    });
}

export type Row = Record<string, string | number | boolean | null>;

export interface Warehouse {
  dim_org: Row[];
  dim_person: Row[];
  dim_skill: Row[];
  dim_project: Row[];
  dim_credential: Row[];
  fact_claim: Row[];
  fact_contribution: Row[];
  fact_role: Row[];
  fact_testimonial: Row[];
}

export const TABLE_NAMES = [
  'dim_org', 'dim_person', 'dim_skill', 'dim_project', 'dim_credential',
  'fact_claim', 'fact_contribution', 'fact_role', 'fact_testimonial',
] as const satisfies readonly (keyof Warehouse)[];

/**
 * In the JSON and frontmatter, a reference is written as a bare id string.
 * Astro wraps it as `{ id, collection }` on its own read path; this one does not,
 * so accept either shape rather than assuming.
 */
const ref = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return typeof v === 'object' && 'id' in v ? String((v as { id: string }).id) : null;
};

export async function buildWarehouse(): Promise<Warehouse> {
  const orgs = readJson<Row>('orgs.json');
  const people = readJson<Row>('people.json');
  const skills = readJson<Row>('skills.json');
  const credentials = readJson<Row>('credentials.json');
  const claims = readJson<Row>('claims.json');
  const roles = readJson<Row>('roles.json');
  const testimonials = readJson<Row>('testimonials.json');
  const projects = readProjects() as Record<string, any>[];

  const dim_project: Row[] = projects
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((p) => ({
      project_id: String(p.id),
      name: p.name,
      codename: p.codename ?? null,
      year: p.year,
      context: p.context,
      org_id: ref(p.org),
      repo_url: p.repo_url ?? null,
      live_url: p.live_url ?? null,
      status: p.status,
      summary: p.summary,
    }));

  const fact_contribution: Row[] = projects.flatMap((p) =>
    (p.skills as unknown[]).map((s) => ({
      project_id: String(p.id),
      skill_id: ref(s),
      is_primary: (p.stack as string[]).some(
        (t) => t.toLowerCase() === ref(s)?.toLowerCase(),
      ),
    })),
  );

  return {
    dim_org: orgs.map((o: any) => ({
      org_id: o.id, name: o.name, kind: o.kind, location: o.location ?? null,
    })),
    dim_person: people.map((p: any) => ({
      person_id: p.id, name: p.name, title: p.title,
      org_id: ref(p.org), profile_url: p.profile_url ?? null,
    })),
    dim_skill: skills.map((s: any) => ({
      skill_id: s.id, name: s.name, category: s.category,
      first_used_on: s.first_used_on,
    })),
    dim_project,
    dim_credential: credentials.map((c: any) => ({
      credential_id: c.id, name: c.name, issuer_id: ref(c.issuer),
      issued_on: c.issued_on, verify_url: c.verify_url, track: c.track ?? null,
    })),
    fact_claim: claims.map((c: any) => ({
      claim_id: c.id,
      project_id: ref(c.project),
      metric: c.metric,
      value: c.value ?? null,
      unit: c.unit ?? null,
      verification: c.verification,
      method: c.method ?? null,
      caveat: c.caveat ?? null,
      source_url: c.source_url ?? null,
      evidence: c.evidence ?? null,
    })),
    fact_contribution,
    fact_role: roles.map((r: any) => ({
      role_id: r.id, org_id: ref(r.org), title: r.title,
      started_on: r.started_on, ended_on: r.ended_on ?? null, summary: r.summary,
    })),
    fact_testimonial: testimonials.map((t: any) => ({
      testimonial_id: t.id, person_id: ref(t.person), body: t.body,
      given_on: t.given_on, source_url: t.source_url,
    })),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/warehouse.test.ts`
Expected: 6 tests PASS.

`getCollection` runs because Task 1's `vitest.config.ts` uses `getViteConfig`. Never stub
it — the point of this suite is that it reads the real content.

- [ ] **Step 5: Commit**

```bash
git add src/lib/warehouse.ts tests/unit/warehouse.test.ts
git commit -m "Project typed collections into a star schema

Referential integrity is asserted rather than assumed: every claim's
project and every contribution's skill must resolve to a dimension row."
```

---

### Task 6: Emit Parquet and prove parity

**Files:**
- Create: `scripts/build-warehouse.ts`
- Test: `tests/unit/parity.test.ts`
- Modify: `package.json` (the `postbuild` script already added in Task 1 now has a target)

**Interfaces:**
- Consumes: Task 5 `buildWarehouse()`, `TABLE_NAMES`.
- Produces: `dist/warehouse/<table>.parquet` for all nine tables, plus `dist/warehouse/manifest.json` of shape `{ generated_at: string, tables: { name: string, rows: number, checksum: string }[] }`.

This task delivers spec §12 criterion 3: the page and the warehouse are provably the same data.

- [ ] **Step 1: Write the failing parity test**

`tests/unit/parity.test.ts`:
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
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
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/parity.test.ts`
Expected: FAIL — `scripts/build-warehouse.ts` does not exist.

- [ ] **Step 3: Write `scripts/build-warehouse.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/parity.test.ts`
Expected: 2 tests PASS, and `dist/warehouse/` contains nine `.parquet` files plus `manifest.json`.

- [ ] **Step 5: Verify the full build wiring**

Run: `npm run build`
Expected: `astro build` succeeds, then `postbuild` emits the warehouse into `dist/warehouse/`.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-warehouse.ts tests/unit/parity.test.ts
git commit -m "Emit the warehouse as Parquet after the build

Both artifacts now derive from one typed input, and a manifest of row
counts and checksums makes that provable rather than asserted. Uses the
same DuckDB engine at build time as the browser does at read time, so
type inference cannot differ between them."
```

---

### Task 7: ResultTable and StatusTag primitives

**Files:**
- Create: `src/components/StatusTag.astro`, `src/components/ResultTable.astro`
- Create: `src/lib/format.ts`
- Test: `tests/unit/format.test.ts`

**Interfaces:**
- Consumes: Task 2 tokens, Task 5 types.
- Produces:
  - `formatFooter(rows: number, seconds: number): string` → `"6 rows in set (0.004 s)"`
  - `formatValue(value: string | null, unit: string | null): string` → `"90.04 %"` / `"NULL"`
  - `<StatusTag status={Verification} />`
  - `<ResultTable columns={Column[]} rows={Row[]} footerSeconds={number} caption={string} />` where
    `Column = { key: string; label: string; numeric?: boolean; type?: 'text' | 'status' | 'link'; hrefKey?: string }`

Cells render by `type`, not by slot. Astro's named slots are filled once by the parent, so
a slot per row would collide on every name after the first — do not attempt it. A page
needing a cell shape outside these three writes its own table, as `HeroQuery` does.

This is the layout primitive for the whole site (spec §4.4). Projects, credentials,
skills and claims all render through it. There are no cards.

- [ ] **Step 1: Write the failing format test**

`tests/unit/format.test.ts`:
```ts
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

  it('renders a missing value as NULL', () => {
    expect(formatValue(null, null)).toBe('NULL');
  });

  it('renders a value with no unit unchanged', () => {
    expect(formatValue('9.17', null)).toBe('9.17');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/format.test.ts`
Expected: FAIL — cannot resolve `~/lib/format`.

- [ ] **Step 3: Write `src/lib/format.ts`**

```ts
export function formatFooter(rows: number, seconds: number): string {
  const noun = rows === 1 ? 'row' : 'rows';
  return `${rows} ${noun} in set (${seconds.toFixed(3)} s)`;
}

export function formatValue(value: string | null, unit: string | null): string {
  if (value === null) return 'NULL';
  return unit ? `${value} ${unit}` : value;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/format.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Write `src/components/StatusTag.astro`**

```astro
---
import type { Verification } from '~/content.config';

interface Props { status: Verification }
const { status } = Astro.props;

const label: Record<Verification, string> = {
  verified: 'verified',
  measured: 'measured',
  self_reported: 'self-reported',
  untested: 'untested',
};
---
<span class={`status status--${status}`} data-status={status}>{label[status]}</span>

<style>
  /* Status is text first; colour is reinforcement, never the only signal. */
  .status {
    font-family: var(--font-data);
    font-size: var(--text-label);
    border-bottom: 2px solid currentColor;
    padding-bottom: 1px;
    white-space: nowrap;
  }
  .status--verified { color: var(--color-verified); }
  .status--measured { color: var(--color-measured); }
  .status--self_reported { color: var(--color-reported); }
  .status--untested { color: var(--color-untested); }
</style>
```

- [ ] **Step 6: Write `src/components/ResultTable.astro`**

```astro
---
import { formatFooter } from '~/lib/format';
import StatusTag from '~/components/StatusTag.astro';
import type { Row } from '~/lib/warehouse';
import type { Verification } from '~/content.config';

export interface Column {
  key: string;
  label: string;
  numeric?: boolean;
  type?: 'text' | 'status' | 'link';
  /** For type 'link': the row key holding the href. */
  hrefKey?: string;
}

interface Props {
  columns: Column[];
  rows: Row[];
  caption: string;
  footerSeconds?: number;
}

const { columns, rows, caption, footerSeconds = 0.004 } = Astro.props;
---
<figure class="result">
  <table>
    <caption class="sr-only">{caption}</caption>
    <thead>
      <tr>
        {columns.map((c) => (
          <th scope="col" class={c.numeric ? 'numeric' : undefined}>{c.label}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr>
          {columns.map((c) => {
            const raw = row[c.key];
            const href = c.hrefKey ? row[c.hrefKey] : null;
            return (
              <td class={c.numeric ? 'numeric' : undefined}>
                {c.type === 'status' && raw !== null ? (
                  <StatusTag status={raw as Verification} />
                ) : c.type === 'link' && href ? (
                  <a href={String(href)} rel="noopener">{raw ?? String(href)}</a>
                ) : (
                  raw ?? 'NULL'
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
  <figcaption class="footer">{formatFooter(rows.length, footerSeconds)}</figcaption>
</figure>

<style>
  .result { margin: 0; overflow-x: auto; }
  .footer {
    font-family: var(--font-data);
    font-size: var(--text-label);
    color: var(--color-ink-soft);
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--color-rule);
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
</style>
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/format.ts src/components tests/unit/format.test.ts
git commit -m "Add the result-row layout primitive

The site's unit of layout is a result row, not a card, so projects,
credentials and claims all render through one table component with real
table semantics. Tests pin the authentic engine footer and rule out the
middle-dot meta string."
```

---

### Task 8: Base layout, navigation, and site metadata

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`
- Create: `public/robots.txt`, `public/favicon.svg`

**Interfaces:**
- Consumes: Task 2 styles.
- Produces: `<BaseLayout title description ogImage?>` wrapping every page; sitemap emitted by the Astro integration configured in Task 1.

- [ ] **Step 1: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '~/styles/global.css';
import SiteHeader from '~/components/SiteHeader.astro';
import SiteFooter from '~/components/SiteFooter.astro';

interface Props { title: string; description: string; ogImage?: string }
const { title, description, ogImage = '/og/default.png' } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={new URL(ogImage, Astro.site)} />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
    <SiteHeader />
    <main id="main"><slot /></main>
    <SiteFooter />
    <style>
      main { max-width: 68rem; margin: 0 auto; padding: 2rem 1.25rem 5rem; }
      .skip {
        position: absolute; left: -9999px;
        background: var(--color-ink); color: var(--color-paper); padding: 0.6rem 1rem;
      }
      .skip:focus { left: 1rem; top: 1rem; z-index: 10; }
    </style>
  </body>
</html>
```

- [ ] **Step 2: Write `src/components/SiteHeader.astro`**

Navigation links, set in `--font-data`, to `/`, `/projects`, `/claims`, `/credentials`,
`/console`, `/about`. The author's name is set in `--font-prose`. No ALL-CAPS labels, no
`→` glyphs. Mark the current page with `aria-current="page"` and a `--color-ink` underline —
never a status hue, which would read as a claim about the page (spec §4.2).

- [ ] **Step 3: Write `src/components/SiteFooter.astro`**

Contact block: `mailto:prsatyarthi2404@gmail.com`, `https://github.com/pushpam2404`,
`https://www.linkedin.com/in/pushpamrajsatyarthi/`. Plus a one-line statement of the
site's own method with a link to `/claims`.

- [ ] **Step 4: Write `public/robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://pushpam2404-profile.vercel.app/sitemap-index.xml
```

- [ ] **Step 5: Write `public/favicon.svg`**

A 32×32 SVG: `--color-paper` ground, three `--color-bar` horizontal bands, one
`--color-verified` rule. The greenbar mark, not a letterform.

- [ ] **Step 6: Verify the build**

Run: `npm run build && npx astro preview`
Expected: build succeeds; `dist/sitemap-index.xml` exists; the placeholder page renders on greenbar with correct fonts.

- [ ] **Step 7: Commit**

```bash
git add src/layouts src/components/SiteHeader.astro src/components/SiteFooter.astro public/robots.txt public/favicon.svg
git commit -m "Add base layout, navigation and site metadata

Adds the canonical, Open Graph and sitemap metadata the previous site
had none of, plus a skip link and per-page canonical URLs."
```

---

### Task 9: Home page with statically rendered hero

**Files:**
- Create: `src/pages/index.astro` (replaces the Task 1 placeholder)
- Create: `src/components/HeroQuery.astro`

**Interfaces:**
- Consumes: Tasks 5, 7, 8.
- Produces: DOM contract the Task 13 island binds to — `#hero-query` (the SQL text), `#hero-result` (the table body), `#hero-footer` (the engine footer), and `data-hero-state="static|live"` on the wrapper.

The hero result set is rendered at build time so it is complete and readable with
JavaScript off. Task 13 swaps in identical live output with no layout shift (spec §7).

- [ ] **Step 1: Write `src/components/HeroQuery.astro`**

```astro
---
import { buildWarehouse } from '~/lib/warehouse';
import StatusTag from '~/components/StatusTag.astro';
import { formatFooter, formatValue } from '~/lib/format';
import type { Verification } from '~/content.config';

// A plain ORDER BY + LIMIT would fill the fold with whichever status happens to
// sort first — here `measured`, of which there are 17. The opening view would then
// show only flattering rows, which is the one thing this site must not do. Two rows
// per status guarantees the reader meets `untested` above the fold.
const HERO_SQL = `SELECT metric, value, verification
  FROM (SELECT *, row_number() OVER (
          PARTITION BY verification ORDER BY claim_id) AS rn
        FROM career.fact_claim)
 WHERE rn <= 2
 ORDER BY verification`;

const PER_STATUS = 2;

const wh = await buildWarehouse();

const seen = new Map<string, number>();
const rows = [...wh.fact_claim]
  .sort((a, b) => String(a.claim_id).localeCompare(String(b.claim_id)))
  .filter((c) => {
    const v = String(c.verification);
    const n = (seen.get(v) ?? 0) + 1;
    seen.set(v, n);
    return n <= PER_STATUS;
  })
  .sort((a, b) => String(a.verification).localeCompare(String(b.verification)));

const total = rows.length;
---
<section class="hero" data-hero-state="static">
  <pre id="hero-query" class="query">{HERO_SQL}</pre>
  <table>
    <caption class="sr-only">Claims with an external check or a disclosed method</caption>
    <thead>
      <tr><th scope="col">metric</th><th scope="col" class="numeric">value</th><th scope="col">verification</th></tr>
    </thead>
    <tbody id="hero-result">
      {rows.map((r) => (
        <tr>
          <td>{r.metric}</td>
          <td class="numeric">{formatValue(r.value as string | null, r.unit as string | null)}</td>
          <td>
            <StatusTag status={r.verification as Verification} />
            {r.source_url && (
              <a href={r.source_url as string} rel="noopener">check</a>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  <p id="hero-footer" class="footer">{formatFooter(total, 0.006)}</p>
  <p class="unlock"><a href="/console">Edit this query</a></p>
</section>

<style>
  .hero { border-top: 2px solid var(--color-ink); margin: 2.5rem 0; }
  .query {
    font-family: var(--font-data); font-size: var(--text-data);
    background: var(--color-bar); margin: 0; padding: 0.9rem 0.75rem;
    border-bottom: 1px solid var(--color-rule); white-space: pre-wrap;
  }
  .footer, .unlock {
    font-family: var(--font-data); font-size: var(--text-label);
    color: var(--color-ink-soft); padding: 0.5rem 0.75rem; margin: 0;
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
</style>
```

- [ ] **Step 2: Write `src/pages/index.astro`**

Compose: the author's name as `display` in Newsreader; the two-sentence thesis from spec
§2 as prose at `.prose-measure`; `<HeroQuery />`; a `<ResultTable>` of the six projects
(name, year, context, status) with each name linking to its case study; a selected-claims
block; one testimonial pull quote (Ambuj Upadhyay's, the more specific of the two); and
the contact block.

The page must not contain an ALL-CAPS eyebrow, a coloured single word in the headline,
or a card grid.

- [ ] **Step 3: Verify**

Run: `npm run build && npx astro preview`
Expected: home page renders the full hero result set with JavaScript disabled in devtools.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/components/HeroQuery.astro
git commit -m "Add the home page and statically rendered hero query

The hero is the site's argument in one view: a query, its rows, and a
verification column. Rendering it at build time means it is complete
before any JavaScript loads, and the live engine later replaces
identical markup rather than filling an empty shell."
```

---

### Task 10: Case study pages

**Files:**
- Create: `src/layouts/CaseStudyLayout.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`

**Interfaces:**
- Consumes: Tasks 4, 5, 7, 8.
- Produces: one static route per project at `/projects/<slug>`, linked from the home page and the ledger.

- [ ] **Step 1: Write `src/pages/projects/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import CaseStudyLayout from '~/layouts/CaseStudyLayout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---
<CaseStudyLayout project={project}>
  <Content />
</CaseStudyLayout>
```

- [ ] **Step 2: Write `src/layouts/CaseStudyLayout.astro`**

Two-column ledger grid (spec §4.4): a left rail (max 14rem) carrying year, context,
status, stack, repo and live links; the right column carrying the narrative in
`.prose-measure` followed by a `<ResultTable>` of that project's claims with columns
metric / value / verification / method. Below 768px the rail collapses to an inline
metadata row above the narrative.

Each `measured` and `untested` row exposes its `caveat` in a `<details>` labelled
"What this does not prove". This is the section that carries the site's thesis at the
project level.

- [ ] **Step 3: Write `src/pages/projects/index.astro`**

A single `<ResultTable>` of all six projects, ordered by `order`.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: six routes under `dist/projects/`; every claim's caveat reachable without JavaScript (`<details>` is native).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/CaseStudyLayout.astro src/pages/projects
git commit -m "Add case study pages with per-project claim tables

Replaces the old site's modal drawers with real linkable URLs, and puts
each project's caveats on the page rather than leaving the numbers
unqualified."
```

---

### Task 11: Claims ledger and CSV export

**Files:**
- Create: `src/pages/claims.astro`, `src/pages/claims.csv.ts`
- Test: `tests/unit/csv.test.ts`

**Interfaces:**
- Consumes: Task 5 `buildWarehouse()`.
- Produces: `/claims` (the full ledger, filterable by status) and `/claims.csv` (the same rows as `text/csv`). Exports `toCsv(rows: Row[]): string` from `src/lib/format.ts`.

This is the page that makes the thesis auditable (spec §6).

- [ ] **Step 1: Write the failing CSV test**

`tests/unit/csv.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/csv.test.ts`
Expected: FAIL — `toCsv` is not exported.

- [ ] **Step 3: Add `toCsv` to `src/lib/format.ts`**

```ts
import type { Row } from '~/lib/warehouse';

const escape = (v: Row[string]): string => {
  if (v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export function toCsv(rows: Row[]): string {
  const first = rows[0];
  if (!first) return '';
  const keys = Object.keys(first);
  const head = keys.join(',');
  const body = rows.map((r) => keys.map((k) => escape(r[k] ?? null)).join(','));
  return [head, ...body].join('\n');
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/csv.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Write `src/pages/claims.csv.ts`**

```ts
import type { APIRoute } from 'astro';
import { buildWarehouse } from '~/lib/warehouse';
import { toCsv } from '~/lib/format';

export const GET: APIRoute = async () => {
  const wh = await buildWarehouse();
  return new Response(toCsv(wh.fact_claim), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="claims.csv"',
    },
  });
};
```

- [ ] **Step 6: Write `src/pages/claims.astro`**

The complete `fact_claim` table through `<ResultTable>`, grouped by verification status
with `verified` first and `untested` last — the unflattering rows are not buried. A
legend explains what each status requires, taken from spec §3's table. A link to
`/claims.csv`. Filtering is progressive enhancement: native `<details>` per group works
with no JavaScript.

Include a short prose paragraph stating that the site's own claims appear in this table
on the same terms, and pointing at the `self_reported` CGPA row as the example.

- [ ] **Step 7: Verify**

Run: `npm run build && npx astro preview`
Expected: `/claims` lists every claim; `/claims.csv` downloads and opens in a spreadsheet.

- [ ] **Step 8: Commit**

```bash
git add src/pages/claims.astro src/pages/claims.csv.ts src/lib/format.ts tests/unit/csv.test.ts
git commit -m "Add the claims ledger and its CSV export

Puts every claim on one auditable page, ordered so the untested rows
are not buried, and lets a reader take the whole ledger away as data."
```

---

### Task 12: Credentials and About pages

**Files:**
- Create: `src/pages/credentials.astro`, `src/pages/about.astro`

**Interfaces:**
- Consumes: Tasks 4, 5, 7, 8. Ships zero JavaScript (spec §9).

- [ ] **Step 1: Write `src/pages/credentials.astro`**

A `<ResultTable>` of all 12 credentials: name, issuer, issued date, and a verify link
whose text is the credential code (not "click here", not an arrow glyph).

Above it, the honest framing required by spec §3: the IBM Data Engineering Professional
Certificate is **11 of 16 courses, in progress**. State the count as a fact, list what
the completed courses cover, and do not imply the track is finished.

- [ ] **Step 2: Write `src/pages/about.astro`**

Narrative prose in Newsreader at `.prose-measure`. Content: the data-engineering focus
and why (from the GitHub profile README's own words — "I prefer building robust,
scalable pipelines and data infrastructure over abstract, math-heavy ML theory"); a
`<ResultTable>` of the four roles from `fact_role`; education with the `self_reported`
CGPA; both testimonials in full with attribution and LinkedIn links; and current work.

Do not invent biography. Every statement traces to the resume, the LinkedIn export, or
the GitHub profile README.

- [ ] **Step 3: Verify zero JavaScript**

Run: `npm run build` then inspect `dist/about/index.html` and `dist/credentials/index.html`
Expected: no `<script>` tags in either file.

- [ ] **Step 4: Commit**

```bash
git add src/pages/credentials.astro src/pages/about.astro
git commit -m "Add credentials and about pages

Credentials state 11 of 16 courses in progress rather than implying a
completed professional certificate, and every row links to its public
verification record."
```

---

### Task 13: DuckDB island and live hero

**Files:**
- Create: `src/scripts/console-engine.ts`, `src/scripts/render-result.ts`, `src/components/ConsoleIsland.astro`
- Modify: `src/pages/index.astro` (mount the island)

**Interfaces:**
- Consumes: Task 6 Parquet output, Task 9 DOM contract.
- Produces:
  - `async function initEngine(): Promise<Engine>` where `Engine = { query(sql: string): Promise<QueryResult>; close(): Promise<void> }`
  - `type QueryResult = { columns: string[]; rows: unknown[][]; seconds: number; truncated: boolean }`
  - `const MAX_ROWS = 500`, `const TIMEOUT_MS = 5000`
  - `renderInto(tbody: HTMLElement, result: QueryResult): void` and `renderHead(thead: HTMLElement, columns: string[]): void` from `src/scripts/render-result.ts`, both reused by Task 14

- [ ] **Step 1: Write `src/scripts/console-engine.ts`**

```ts
import * as duckdb from '@duckdb/duckdb-wasm';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

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

/**
 * The data is public, static and read-only, so this guard is not a security
 * boundary — it exists to give a clear error instead of a confusing one.
 */
function assertReadOnly(sql: string): void {
  const trimmed = sql.trim().replace(/;$/, '');
  if (trimmed.includes(';')) throw new Error('One statement at a time.');
  if (!/^(select|with)\b/i.test(trimmed)) throw new Error('Only SELECT is available here.');
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
  await conn.query(`CREATE SCHEMA IF NOT EXISTS career`);

  // The build emits the manifest, so the table list has one definition.
  // This module cannot import lib/warehouse.ts — that pulls in astro:content,
  // which does not exist in the browser.
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
          setTimeout(() => reject(new Error('Query exceeded 5 s and was cancelled.')), TIMEOUT_MS),
        ),
      ]);
      const seconds = (performance.now() - started) / 1000;
      const columns = table.schema.fields.map((f: { name: string }) => f.name);
      const all = table.toArray().map((r: Record<string, unknown>) => columns.map((c) => r[c]));
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
```

- [ ] **Step 2: Write `src/scripts/render-result.ts`**

Both the hero island here and the console in Task 14 render result sets, so this lives in
one module from the start rather than being duplicated and later extracted.

```ts
import type { QueryResult } from './console-engine';

/** Builds rows with textContent only — never innerHTML (spec §7). */
export function renderInto(tbody: HTMLElement, result: QueryResult): void {
  tbody.replaceChildren();
  for (const row of result.rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.textContent = cell === null || cell === undefined ? 'NULL' : String(cell);
      if (typeof cell === 'number' || typeof cell === 'bigint') td.className = 'numeric';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

export function renderHead(thead: HTMLElement, columns: string[]): void {
  thead.replaceChildren();
  const tr = document.createElement('tr');
  for (const name of columns) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = name;
    tr.appendChild(th);
  }
  thead.appendChild(tr);
}
```

- [ ] **Step 3: Write `src/components/ConsoleIsland.astro`**

An Astro `<script>` (bundled, module) that:
1. Registers an `IntersectionObserver` on `[data-hero-state]`.
2. On first intersection, dynamically `import('~/scripts/console-engine')` so the WASM is never in the initial bundle.
3. Runs the same query the static hero rendered, then replaces `#hero-result` rows and `#hero-footer` text with live output and sets `data-hero-state="live"`.
4. Renders every cell with `textContent`, never `innerHTML` (spec §7).
5. Does nothing at all if the engine fails to load — the static table stays, which is the correct fallback.

```ts
// Reduced motion suppresses the staggered reveal, not the engine: spec §4.5 asks
// for rows rendered immediately, not for the live query to be skipped.
const mount = document.querySelector<HTMLElement>('[data-hero-state]');
if (mount) {
  const io = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    try {
      const { initEngine } = await import('~/scripts/console-engine');
      const engine = await initEngine();
      const sql = document.getElementById('hero-query')!.textContent!;
      const result = await engine.query(sql);
      renderInto(document.getElementById('hero-result')!, result);
      document.getElementById('hero-footer')!.textContent =
        `${result.rows.length} ${result.rows.length === 1 ? 'row' : 'rows'} in set (${result.seconds.toFixed(3)} s)`;
      mount.dataset.heroState = 'live';
    } catch {
      /* Static table stands. */
    }
  }, { rootMargin: '200px' });
  io.observe(mount);
}
```

`renderInto` is imported from `~/scripts/render-result` (Step 2) inside the same dynamic
import, so it stays out of the initial bundle alongside the engine.

- [ ] **Step 4: Verify**

Run: `npm run build && npx astro preview`
Expected: hero shows static rows immediately, then `data-hero-state` flips to `live` with no visible layout shift. With JavaScript disabled, the static table remains and nothing is broken.

- [ ] **Step 5: Commit**

```bash
git add src/scripts src/components/ConsoleIsland.astro src/pages/index.astro
git commit -m "Run the hero query against a real engine in the browser

DuckDB-WASM loads only when the hero scrolls into view and replaces
markup that was already complete, so the page never depends on it.
Cells are written with textContent so a query string cannot execute."
```

---

### Task 14: The console

**Files:**
- Create: `src/pages/console.astro`, `src/scripts/console-ui.ts`
- Create: `src/lib/example-queries.ts`

**Interfaces:**
- Consumes: Task 13 `initEngine`, `MAX_ROWS`, `TIMEOUT_MS`, `renderInto`, `renderHead`; Task 7 `formatFooter`.
- Produces: the `/console` route with editor, schema browser, saved queries and error surface.

- [ ] **Step 1: Write `src/lib/example-queries.ts`**

```ts
export interface ExampleQuery { title: string; sql: string }

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  {
    title: 'What has been independently verified?',
    sql: `SELECT metric, value, source_url\n  FROM fact_claim\n WHERE verification = 'verified';`,
  },
  {
    title: 'What was built but never proven?',
    sql: `SELECT p.name, c.metric, c.caveat\n  FROM fact_claim c\n  JOIN dim_project p USING (project_id)\n WHERE c.verification = 'untested';`,
  },
  {
    title: 'Which skills have shipped in more than one project?',
    sql: `SELECT s.name, count(*) AS projects\n  FROM fact_contribution f\n  JOIN dim_skill s USING (skill_id)\n GROUP BY 1 HAVING count(*) > 1\n ORDER BY 2 DESC;`,
  },
  {
    title: 'Every claim, by how well it is backed',
    sql: `SELECT verification, count(*) AS claims\n  FROM fact_claim\n GROUP BY 1 ORDER BY 2 DESC;`,
  },
];
```

- [ ] **Step 2: Write `src/pages/console.astro`**

Layout: left rail is the schema browser (all nine tables and their columns, rendered at
build time from `TABLE_NAMES` and the first row's keys — no JavaScript needed to read
it); right column is a `<textarea>` in `--font-data`, a Run control, the result area,
and the saved queries from `EXAMPLE_QUERIES` as buttons that fill the editor.

Static fallback: the page renders the full `fact_claim` table through `<ResultTable>`
plus a note naming what needs JavaScript. A reader with no JavaScript still gets the data.

Keyboard contract from spec §9: `Escape` in the editor moves focus to the Run control;
`Tab` from there leaves the island. `Cmd/Ctrl+Enter` runs the query.

- [ ] **Step 3: Write `src/scripts/console-ui.ts`**

Wires the editor: lazy `initEngine()` on first Run, `renderHead`/`renderInto` for
results, the `formatFooter` form for the footer, and an error surface that prints the
engine's own message in `--color-untested`. Per spec §4, an error explains what happened
and how to fix it, and does not apologise. When `result.truncated`, the footer reads
`500 rows in set (0.0XX s), truncated`.

- [ ] **Step 4: Verify**

Run: `npm run build && npx astro preview`, open `/console`
Expected: all four saved queries return rows; `DROP TABLE fact_claim` returns "Only SELECT is available here."; a cross-join designed to be slow is cancelled at 5 s with a readable message; `Escape` and `Cmd+Enter` behave as specified.

- [ ] **Step 5: Commit**

```bash
git add src/pages/console.astro src/scripts/console-ui.ts src/lib/example-queries.ts
git commit -m "Add the SQL console

A real editor over the real schema, with saved queries for readers who
do not write SQL and a static table for readers without JavaScript.
Row and time caps keep a pathological query from hanging the tab."
```

---

### Task 15: Generated Open Graph images

**Files:**
- Create: `src/pages/og/[...route].png.ts`, `src/lib/og.ts`

**Interfaces:**
- Consumes: Tasks 4, 5.
- Produces: `/og/default.png` and `/og/projects/<slug>.png`, wired into `BaseLayout`'s `ogImage` prop.

- [ ] **Step 1: Write `src/lib/og.ts`**

Export `async function renderOg(title: string, subtitle: string, status?: string): Promise<Buffer>`
using `satori` to produce SVG and `@resvg/resvg-js` to rasterise at 1200×630. The card
uses the greenbar ground, Newsreader for the title, Plex Mono for the subtitle, and a
status rule in the matching hue when `status` is given. Load the two font files from
`node_modules/@fontsource*` with `readFileSync` and pass them to satori.

- [ ] **Step 2: Write `src/pages/og/[...route].png.ts`**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOg } from '~/lib/og';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return [
    { params: { route: 'default' }, props: { title: 'Pushpam Raj Satyarthi', subtitle: 'Data engineering and backend systems' } },
    ...projects.map((p) => ({
      params: { route: `projects/${p.id}` },
      props: { title: p.data.name, subtitle: p.data.context },
    })),
  ];
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props.title as string, props.subtitle as string);
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
```

- [ ] **Step 3: Pass `ogImage` from the case study layout**

In `CaseStudyLayout.astro`, pass `ogImage={`/og/projects/${project.id}.png`}` to `BaseLayout`.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: seven PNGs under `dist/og/`; open two and confirm the type renders and nothing is clipped.

- [ ] **Step 5: Commit**

```bash
git add src/lib/og.ts src/pages/og src/layouts/CaseStudyLayout.astro
git commit -m "Generate Open Graph cards per page

A shared link now previews with the project's own title and context
instead of a bare URL."
```

---

### Task 16: Accessibility, responsive and performance pass

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/smoke.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: any page failing the checks below

**Interfaces:**
- Consumes: every prior task.
- Produces: the enforced quality floor from spec §9.

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run build && npx astro preview --port 4321', port: 4321, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

- [ ] **Step 2: Write `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/projects', '/claims', '/credentials', '/console', '/about'];

for (const route of ROUTES) {
  test(`${route} renders and never scrolls the body sideways`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}

test('the hero is complete before the engine loads', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  expect(await page.locator('#hero-result tr').count()).toBeGreaterThan(0);
  await ctx.close();
});

test('the console rejects a non-SELECT statement', async ({ page }) => {
  await page.goto('/console');
  await page.locator('textarea').fill('DROP TABLE fact_claim');
  await page.getByRole('button', { name: /run/i }).click();
  await expect(page.getByText(/only select/i)).toBeVisible();
});
```

- [ ] **Step 3: Write `tests/e2e/a11y.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/projects', '/claims', '/credentials', '/about'];

for (const route of ROUTES) {
  test(`${route} has one h1, a skip link and labelled tables`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('a.skip')).toHaveCount(1);
    for (const table of await page.locator('table').all()) {
      expect(await table.locator('caption').count()).toBeGreaterThan(0);
    }
  });

  test(`${route} never signals status by colour alone`, async ({ page }) => {
    await page.goto(route);
    for (const tag of await page.locator('[data-status]').all()) {
      expect((await tag.textContent())?.trim()).toBeTruthy();
    }
  });
}

test('every interactive control on the console is keyboard reachable', async ({ page }) => {
  await page.goto('/console');
  await page.locator('textarea').focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /run/i })).toBeFocused();
});
```

- [ ] **Step 4: Run the suite and fix what fails**

Run: `npx playwright install --with-deps chromium && npm run test:e2e`
Expected: all tests PASS. Fix pages rather than relaxing assertions.

- [ ] **Step 5: Check the performance budget manually**

Run a Lighthouse pass against `npx astro preview` on `/`. Confirm LCP < 1.5 s and CLS < 0.05 (spec §9). Confirm `dist/about/index.html` and `dist/credentials/index.html` contain no `<script>`.

- [ ] **Step 6: Write `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  push: { branches: [main, rebuild/warehouse] }
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e .github/workflows/ci.yml
git commit -m "Enforce the accessibility and performance floor in CI

Tests assert the things most likely to rot: no sideways scroll at phone
width, a complete hero with JavaScript disabled, captions on every
table, and status never signalled by colour alone."
```

---

### Task 17: Migration and handover

**Files:**
- Delete: `index.html`
- Rewrite: `CLAUDE.md`, `README.md`
- Create: `vercel.json`

**Interfaces:**
- Consumes: every prior task. This is the only task that touches the live site.

- [ ] **Step 1: Confirm the floor is met before retiring anything**

Run: `npm run typecheck && npm test && npm run build && npm run test:e2e`
Expected: all green. If anything fails, stop — `index.html` stays until it passes.

- [ ] **Step 2: Write `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/warehouse/(.*)",
      "headers": [{ "key": "cache-control", "value": "public, max-age=3600, must-revalidate" }]
    }
  ]
}
```

- [ ] **Step 3: Remove the old site**

```bash
git rm index.html
```

- [ ] **Step 4: Rewrite `CLAUDE.md`**

Replace the single-file description entirely. Cover: the content-collections-as-source-of-truth
architecture; that `src/content.config.ts` refinements are a build gate, not a
convention, so adding a claim means supplying its evidence; the `postbuild` warehouse
step and why page and warehouse cannot drift; the serif-prose/mono-data typography rule;
the four status hues being the only colors; that no UI framework is installed and the
console is vanilla TS; and the DRDO exclusion. Include the real commands: `npm run dev`,
`build`, `test`, `test:e2e`, `typecheck`.

- [ ] **Step 5: Rewrite `README.md`**

Short. What the site is, the one-paragraph thesis from spec §2, how to run it, and how
to add a claim (including that the build will reject it without its evidence). Link the
spec and this plan.

- [ ] **Step 6: Commit and open the pull request**

```bash
git add -A
git commit -m "Retire the single-file site and document the rebuild

The new site passes the typecheck, unit, build and end-to-end gates, so
index.html is no longer the live artifact. CLAUDE.md and README now
describe the content-as-source-of-truth architecture and the build gate
that keeps unverifiable claims off the site."
git push -u origin rebuild/warehouse
```

Then open a PR against `main` summarising the change. **Do not merge or deploy without the author's explicit approval** — this replaces a live site.

---

## Self-Review

**Spec coverage.** §2 thesis → Tasks 4, 9, 11. §3 verification model → Task 3 (enforcement), Task 4 (data), Task 11 (ledger), Task 12 (the 11-of-16 correction). §4.1–4.2 greenbar and color → Task 2. §4.3 typography → Task 2, enforced by the token test. §4.4 result-row layout → Task 7. §4.5 motion → Task 2 (reduced-motion), Task 13 (the single orchestrated moment). §5.1 single source of truth → Tasks 5–6. §5.2 star schema → Task 5. §5.3 content inventory → Task 4. §6 pages → Tasks 9–12, 14. §7 console → Tasks 13–14. §8 stack → Task 1. §9 quality floor → Tasks 8, 15, 16. §10 non-goals → honoured; no dark mode, blog, analytics or server code appears in any task. §11 migration → Task 17. §12 success criteria → criterion 1 (Tasks 11–12), 2 (Task 4 test, ≥ 4 untested), 3 (Task 6 parity), 4 (Task 3 refinements), 5 (Task 2 token test plus the Global Constraints ban list). No gaps found.

**Placeholder scan.** No TBDs, no "add error handling", no "similar to Task N". Tasks 4, 8, 10, 12 and 14 specify content and composition in prose rather than reproducing every row or every line of markup — the exact values live in spec §5.3 and in the named source files, and each step states precisely which file supplies them. Every code step carries runnable code.

**Type consistency.** `Row` and `Warehouse` are defined in Task 5 and imported unchanged by Tasks 6, 7, 11. `TABLE_NAMES` is defined once in Task 5 and reused in Tasks 6, 13, 14. `Verification` is exported from `src/content.config.ts` in Task 3 and consumed in Tasks 7 and 9. `QueryResult`, `initEngine`, `MAX_ROWS`, `TIMEOUT_MS` are defined in Task 13 and consumed in Task 14. `formatFooter`/`formatValue` arrive in Task 7 and `toCsv` is added to the same module in Task 11.

One ordering defect was found and fixed during this review: `renderInto`/`renderHead` were used by Task 13's island but created by Task 14, so Task 13 depended on a later task's file. `src/scripts/render-result.ts` now ships in Task 13 (Step 2) and Task 14 imports it. Every module is now created strictly before the task that consumes it.
