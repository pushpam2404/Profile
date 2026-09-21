# Portfolio Rebuild — Design Spec

**Date:** 2026-09-22
**Owner:** Pushpam Raj Satyarthi
**Repository:** `Desktop/Profile` (rebuilt in place, git history preserved)
**Supersedes:** the single-file `index.html` portfolio

---

## 1. Purpose

Replace a 93 KB single-file HTML portfolio with a real project: typed content, a build
step, tests, and CI. The rebuild is not a reskin. It changes what the site *asserts*
and how a reader can check it.

**Audience, in priority order:**

1. Recruiters and hiring engineers screening for Data Engineering / Backend internships
   and new-grad roles.
2. Engineers who will actually read a case study before an interview.
3. The author, as a durable record of work that stays accurate.

**Primary job:** convince a technical reader that the claims are true, in under ninety
seconds, without asking them to take anything on faith.

## 2. Thesis

Every claim on the site carries a verification status, including the claims that do not
flatter the author.

This is not a slogan applied to a portfolio. It is transcribed from how the author
already writes. Source material, verbatim from his own repositories:

> "We would rather hand a reviewer numbers that are smaller and true than numbers that
> are larger and unverifiable." — `sih_053/README.md`

> "Deep learning — built, deliberately not trained. We did not ship one, and we do not
> claim one."

> "What we claim and don't" — a section heading, with a ❌ **Not done** column, on a
> hackathon submission.

The current site does the opposite: it renders `90.04% accuracy` in a glass card with no
method, no dataset size, and no way to check it. The rebuild makes the verification
status a first-class field that content cannot omit, because the schema rejects it.

**The site holds itself to the same standard.** `CGPA 9.17` renders as `self_reported`,
because there is no public transcript to link. That single row is the proof that the
rest of the ledger means something.

## 3. Verification model

Four statuses. This enum is the spine of the data model, the color legend, and the
argument. Nothing else in the design uses these hues.

| Status | Meaning | Requirement to use it |
|---|---|---|
| `verified` | A third party confirms it, at a URL the reader can open right now. | `source_url` must be a public, non-authenticated link. |
| `measured` | The author measured it. | `method` must state hardware, dataset, and procedure. `caveat` must state what the number does *not* prove. |
| `self_reported` | The author's word. No external check available. | `evidence` may note a document held but not published. |
| `untested` | Built, but never proven. | `caveat` must state what would be required to prove it. |

A claim with `verification: measured` and no `method` fails schema validation and breaks
the build. This is the enforcement mechanism; it is not a convention.

### Worked examples from real material

```
IBM course certificates        11 of 16   verified       coursera.org/verify/…  (×11)
Internal SIH 2026 credential   —          verified       creds.gitam.edu/c/fb5c93db…
Motherson internship           May–Jun 26 verified       public LinkedIn role + 2 recs
X-platform classifier accuracy 90.04 %    measured       101k labelled accounts, 13 feat.
Meta/Instagram accuracy        96.87 %    measured       101k labelled accounts, 7 feat.
Autocomplete lookup            O(k)       measured       Valgrind-clean, k = query length
CGPA                           9.17       self_reported  no public transcript
NIST 800-88 Purge              NULL       untested       commands generated, never run
Physical-drive erase           NULL       untested       no recorded test on any OS
bulk_extractor integration     NULL       untested       not installed on dev machine or CI
```

### A correction this surfaces

The resume lists **"IBM Data Engineering Professional Certificate"** as a completed
certification. The author holds **11 of the 16** course certificates (Aug 2025 – Sep
2026); the professional certificate is not yet complete. The site will render this as
`11 of 16 courses · in progress`, with all 11 individually verifiable.

This is a net gain, not a downgrade: eleven checkable links beat one unverifiable
assertion, and it removes a claim that would not survive an interview question.

## 4. Design system

### 4.1 Concept: greenbar

The ground is **greenbar** — the pale-green banded continuous-feed stock that mainframes
printed reports on. Chosen because it is the native habitat of tabular data, it is
period-correct for an IBM-certified data engineer, and its alternating bands *are*
result-grid zebra striping. The data tables are striped because the paper is striped.

This is a deliberate move away from the dark-terminal-with-accent genre, which is both
the most templated developer-portfolio look and what the current site already is.

### 4.2 Color

Color encodes verification status. It is a legend, not decoration. No hue outside this
table appears in the interface.

```css
--paper:     #EDEFEA;  /* unprinted stock — page ground          */
--bar:       #E2E8DD;  /* the green band — alternating table row */
--rule:      #C9D0C6;  /* hairlines, table borders               */
--ink:       #16231D;  /* dark green-black; a real color, not a tinted fake black */
--ink-soft:  #4A5A52;  /* secondary prose, captions              */

--verified:  #0F6E63;  /* teal   — externally checkable          */
--measured:  #2E4A63;  /* slate  — own benchmark, method shown   */
--reported:  #9A6B1F;  /* ochre  — author's word only            */
--untested:  #8C3A2B;  /* oxide  — built, not proven             */

--focus:     var(--ink);  /* keyboard focus — deliberately not a status hue */
```

The four status hues carry meaning, so no non-status element may borrow one. That
includes the focus ring: focus is signalled by the outline's weight and offset against
`--ink`, which clears 13:1 on `--paper`. A focus ring tinted `--measured` would make every
focused control read as a claim with a disclosed method.

Status is never communicated by color alone: every status renders as a text label
(`verified`, `measured`, …) alongside its hue, satisfying WCAG 1.4.1.

Contrast floor: all four status hues on `--paper` exceed 4.5:1. `--ink` on `--paper`
exceeds 13:1.

**Dark mode is out of scope for v1.** Tokens are authored as CSS custom properties so a
dark variant is a later token swap, not a rewrite. Committing to the paper ground is the
point of the design; a dark toggle in v1 would dilute it.

### 4.3 Typography

Two families. Each has exactly one job. There is no third family, and no sans-serif
anywhere.

| Family | Role | Rationale |
|---|---|---|
| **Newsreader** (variable serif) | All prose: headings, body, case-study narrative. | The human argument. Real character — high contrast, distinctive italics — and not a default pick. |
| **IBM Plex Mono** | All data: identifiers, SQL, numerics, table cells, status labels. | The machine record. Commissioned by IBM and drawn for "the intersection of man and machine"; the author's entire credential spine is IBM. |

The serif/mono boundary is the same boundary the site is about: argument versus record.
That rule is load-bearing and must not be broken for convenience.

**Scale** (Elements of Typographic Style proportions, 1.25 ratio, rem-based):

```
display   3.052rem / 1.1   Newsreader 400, optical size 48
h1        2.441rem / 1.15  Newsreader 400
h2        1.953rem / 1.2   Newsreader 500
h3        1.563rem / 1.3   Newsreader 500
body      1.125rem / 1.65  Newsreader 400   — serif gets generous leading
small     0.875rem / 1.5   Newsreader 400
data      0.9375rem/ 1.55  Plex Mono 400    — tabular-nums on
label     0.8125rem/ 1.4   Plex Mono 500
```

Prose line length caps at **68 characters** (serif tolerates slightly longer measures).
Numerals use `font-variant-numeric: tabular-nums` in every table so columns align.

**Forbidden treatments** (these are the tells this design is explicitly avoiding):
tracked-out ALL-CAPS eyebrow labels; accenting a single word in a headline with color or
italic; meta strings joined with middle dots; `→` appended to link text; identical
rounded cards with a soft grey drop shadow.

### 4.4 Layout

**The layout primitive is the result row, not the card.** Projects, credentials, skills,
and claims all render as aligned result sets: left-aligned text, right-aligned numerics,
type annotations, zebra bands, and an authentic engine footer.

```
6 rows in set (0.004 s)
```

Not `6 projects · 0.004s · duckdb`. The authentic footer form, because the authentic
form is both more specific and avoids the middle-dot tell.

**Grid:** a two-column ledger. A narrow left rail (max 14rem) carries provenance —
schema name, source, verification status, dates. The wide right column carries content.
This mirrors how a data dictionary reads, and it collapses to a single column below
768px with the rail becoming an inline metadata row above each entry.

**Radius and shadow:** 2px radius on interactive controls only. Zero radius on tables and
containers. No drop shadows anywhere — this is paper, and paper does not float. Depth,
where needed, is expressed by the hairline rule and the band.

### 4.5 Motion

One orchestrated moment: the hero query executes on load, rows arriving in a single
staggered pass (~400ms total), then the page is still. Nothing else animates without
user action.

Interaction motion is permitted only where it shows what changed: console result
transitions, expanding a claim's method, opening the schema browser. All of it is
150–200ms, ease-out.

`prefers-reduced-motion: reduce` disables the hero stagger (rows render immediately) and
reduces all transitions to opacity-only at 0ms.

## 5. Data model

### 5.1 Single source of truth

```
src/content/*.ts   typed, Zod-validated content collections
        │
        ├──►  Astro renders static pages from it
        │
        └──►  scripts/build-warehouse.ts emits public/warehouse/*.parquet
                      │
                      └──►  DuckDB-WASM queries it in the browser
```

The rendered page and the queryable warehouse are compiled from the same typed content
at build time. **They cannot drift.** This is the property that makes the SQL console an
honest demonstration rather than a toy: the reader queries the same rows the page
renders, because there is only one set of rows.

### 5.2 Star schema

Dimensions:

```sql
dim_project      (project_id, name, codename, year, context, org_id,
                  repo_url, live_url, status, summary)
dim_credential   (credential_id, name, issuer, issued_on, verify_url, track)
dim_org          (org_id, name, kind, location)
dim_skill        (skill_id, name, category, first_used_on)
dim_person       (person_id, name, title, org_id, profile_url)
```

Facts:

```sql
fact_claim        (claim_id, project_id, metric, value, unit,
                   verification, method, caveat, source_url, evidence)
fact_contribution (project_id, skill_id, role, is_primary)
fact_role         (role_id, org_id, title, started_on, ended_on, summary)
fact_testimonial  (testimonial_id, person_id, org_id, body, given_on, source_url)
```

`fact_claim.verification` is the enum from §3. Zod refinements enforce the requirements
in that table at build time.

### 5.3 Content inventory

All content below is sourced from the author's resume (`My Resume 2.pdf`, 2026-09-11),
LinkedIn data export (2026-09-21), GitHub repositories, and local certificate PDFs.
Nothing is invented.

**Projects (6).** The DRDO LiDAR project (`sih_053`) is **excluded from the site
entirely**, at the author's instruction. It must not appear in content, schema, examples,
or metadata.

1. **Integrated Secure Data Erasure & Advanced File Recovery** — SIH 26149 (NTRO).
   Python, pytsk3, PhotoRec, bulk_extractor, Magika. Hash-chained tamper-evident audit
   log, Ed25519-signed certificates structured after BSA 2023 §63, cross-platform
   (Windows/Linux/macOS). Carries the full honesty spectrum: a tested column, a
   caveated column, and a not-done column, straight from its README.
2. **Dual-Platform Fake Account & Threat Detection Engine** — SIH-1775 (ITBP / Ministry
   of Home Affairs). XGBoost on 101,000+ labelled accounts; 90.04% X, 96.87%
   Meta/Instagram; SHAP explainability; PyTorch SentenceTransformer (`all-MiniLM-L6-v2`)
   semantic threat analysis; Playwright live scraping with zero credential storage;
   NetworkX coordinated-behaviour graph; forensic PDF export. Includes the diagnosis of
   a mislabelled 50,000-row dataset that had silently capped accuracy at 67%.
3. **Global Banking Data: ETL Pipeline** — Python, Pandas, NumPy, BeautifulSoup4,
   SQLite. Fault-tolerant multi-source ingestion, schema normalisation, incremental
   delta loads, structured pre-load failure interception.
4. **KAPS MedTech** — PostgreSQL (Neon serverless), Node.js, raw SQL, JWT, BCrypt.
   3NF schema, expired-medication quarantine, PHI handling, one-command seeding.
   Live: kaps-medtech.vercel.app
5. **High-Performance Autocomplete Engine** — C, Make, Valgrind, GDB. Trie with O(k)
   lookup, Min-Heap Top-N in O(log N), zero leaks under Valgrind, binary serialisation
   for sub-second cold start.
6. **TripSync** — React 19, TypeScript, Vite, Node/Express, MongoDB, Mappls SDK, Gemini
   2.5 Flash. SIH 2025. Live: trip-sync-rho.vercel.app. Its own README flags it as
   buggy and in active development — the site will say so too.

**Roles (4):** Motherson Technology Services (AI/ML Intern, LegalLens, May–Jun 2026);
GitHub Community GITAM (Open Source Lead, Aug 2026 – present); AeroGITAM (Aircraft
Domain Lead, Feb–Nov 2025); AeroGITAM (Member, Aug 2024 – Feb 2025).

**Credentials (12 verified):** 11 IBM/Coursera course certificates with verify codes and
dates spanning Aug 2025 – Sep 2026, plus the Internal SIH 2026 credential at
`creds.gitam.edu`. Presented as `11 of 16 · in progress` per §3.

**Testimonials (2):** Sachin Singhal (Head, AI/ML Product Management) and Ambuj Upadhyay
(Senior AI Engineer), both Motherson, both public on LinkedIn.

**Education:** GITAM University, B.Tech CSE, 2024–2028, CGPA 9.17 (`self_reported`).

## 6. Pages

| Route | Contents |
|---|---|
| `/` | Hero with live query (§7), thesis statement, project result set, selected claims, one testimonial pull, contact. |
| `/projects/[slug]` | Six case studies. Problem, approach, architecture, the claims table with methods and caveats, stack, links to repo and live site. |
| `/claims` | The complete ledger. Every claim on the site, filterable by status, exportable as CSV. The page that makes the thesis auditable. |
| `/credentials` | All 12 verified credentials with live verify links, plus the `11 of 16` framing. |
| `/about` | Narrative in serif. Roles, education, the AeroGITAM → data engineering arc, what he's working on now. |
| `/console` | Full-screen SQL console with schema browser and saved example queries. |

No drawer/modal project views. Case studies are real pages with real URLs that can be
linked in an application.

## 7. The console

**Engine:** DuckDB-WASM, loaded as an Astro island, hydrated `client:visible` on `/` and
`client:load` on `/console`. The WASM bundle (~3 MB gzipped) must never block first
paint; the hero renders its result set from static pre-rendered HTML and swaps to live
query output once the engine is ready.

**Hero behaviour:** a fixed opening query runs on load. Its results are also
server-rendered at build time, so the hero is fully populated and readable with
JavaScript disabled or still loading. The live engine replaces identical content — the
reader never sees a layout shift.

**Console behaviour:** a real editor against the real schema. Arbitrary `SELECT` is
permitted. Saved example queries seed the reader who does not write SQL:

```sql
-- What has been independently verified?
SELECT metric, value, source_url FROM fact_claim WHERE verification = 'verified';

-- What was built but never proven?
SELECT p.name, c.metric, c.caveat FROM fact_claim c
  JOIN dim_project p USING (project_id) WHERE c.verification = 'untested';

-- Which skills have shipped in more than one project?
SELECT s.name, count(*) AS projects FROM fact_contribution f
  JOIN dim_skill s USING (skill_id) GROUP BY 1 HAVING count(*) > 1 ORDER BY 2 DESC;
```

**Safety:** the dataset is public, read-only, static Parquet served from the origin.
There is no server, no credentials, and nothing to inject into. Query results are
rendered as text into DOM nodes via `textContent` — never `innerHTML` — so hostile input
in a query string cannot execute. Result sets are capped at 500 rows and queries at a
5-second timeout to prevent a pathological query from hanging the tab.

**Non-JS fallback:** every page is fully readable without JavaScript. The console route
degrades to the static ledger table with a note explaining what is unavailable.

## 8. Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Astro 7 | Ships zero JS for the static 90%; islands for the console only. |
| Language | TypeScript 7, `strict` | The author's own TripSync migration precedent. |
| Styling | Tailwind v4 (CSS-first `@theme`) | Tokens live in CSS custom properties, matching §4.2. |
| Content | Astro content collections + Zod | Schema enforcement is the integrity mechanism (§3). |
| Query engine | `@duckdb/duckdb-wasm` | Real engine, real SQL, no emulation. |
| Warehouse build | `@duckdb/node-api` in a prebuild script | Reads the typed collections, emits Parquet via `COPY … TO`. Same engine at build time as in the browser, so schema and type behaviour are identical on both sides. |
| Tests | Vitest (schema + warehouse build), Playwright (smoke, a11y) | The author already uses both. |
| Host | Vercel | Already in use for TripSync and KAPS MedTech. |
| CI | GitHub Actions: typecheck, lint, test, build | Gate on green before deploy. |

## 9. Quality floor

Non-negotiable, verified before the work is called done:

- **Responsive** to 360px with no horizontal scroll. Tables scroll inside their own
  `overflow-x` container; the page body never does.
- **Keyboard**: every interactive control reachable and operable; visible focus ring in
  `--focus` at 2px offset. The console editor traps no focus: `Escape` moves focus to
  the Run control, and `Tab` from there leaves the island.
- **Screen reader**: result tables use real `<table>` semantics with `<caption>` and
  scoped headers. Status is text, not color alone.
- **Reduced motion** respected per §4.5.
- **Performance budget**: LCP < 1.5s on 4G, CLS < 0.05, zero JS on `/about` and
  `/credentials`. The DuckDB island is excluded from the initial bundle budget but must
  never regress LCP.
- **Metadata**: favicon, Open Graph and Twitter cards with a generated OG image per
  case study, `sitemap.xml`, `robots.txt`. All absent from the current site.

## 10. Non-goals

- Dark mode in v1 (§4.2).
- A CMS or admin UI. Content is typed files in the repo, edited in an editor.
- Blog or writing section. Not enough material yet; adding an empty one is the tell.
- Analytics or a contact-form backend. Contact is a direct mail link and social profiles.
- Any appearance of the DRDO LiDAR project (§5.3).
- Server-side anything. The site is static; the database runs in the reader's browser.

## 11. Migration

Rebuild in place in this repository on branch `rebuild/warehouse`, preserving git
history. The existing `index.html` stays live and untouched until the new site passes
the §9 floor; it is removed in the final commit of the branch. `CLAUDE.md` is rewritten
in the same commit to describe the new architecture.

## 12. Success criteria

1. A technical reader can check any claim on the site without contacting the author.
2. The site states at least four things the author has *not* proven, in the same
   typeface and prominence as the things he has.
3. The rendered content and the queryable warehouse are provably the same data — a test
   asserts row-count and checksum parity between the collections and the emitted Parquet.
4. The build fails if any claim is missing the fields its verification status requires.
5. Nothing on the site is a visual default: no dark-terminal-plus-accent, no Inter, no
   card grid, no ALL-CAPS eyebrows.
