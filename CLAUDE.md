# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page personal developer portfolio for Pushpam Raj Satyarthi. The entire site — HTML, CSS, and JS — lives in one self-contained `index.html` (~1500+ lines). There is no build step, no bundler, no package.json, and no dependencies to install. Tailwind CSS, Lucide Icons, and Google Fonts are all loaded via CDN `<script>`/`<link>` tags in the `<head>`.

Live site: https://pushpam2404-profile.vercel.app/ (deployed as a static site, presumably via Vercel from this repo).

## Running / previewing

```bash
open index.html          # opens directly in the default browser
```

or, since some browsers restrict `fetch`/clipboard APIs on `file://`:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

There is no lint, test, or build command — verify changes by opening the page in a browser and exercising the interactive bits manually.

## Architecture

Everything is inline in `index.html`, organized top to bottom as:

1. `<head>` — CDN includes, `tailwind.config` theme extension (custom `brand.*` colors, fonts), and a `<style>` block with custom CSS (glassmorphism cards, scrollbar styling, reveal/blink animations, `prefers-reduced-motion` overrides).
2. Markup — sections in page order, each with a stable `id` used both for anchor nav and `IntersectionObserver` scroll-tracking: `#hero`, `#about`, `#skills`, `#experience`, `#projects`, `#education`, `#achievements`, `#contact`.
3. `<script id="project-data" type="application/json">` (~line 1092) — structured data for the 4 project cards, read at runtime rather than hardcoded in the DOM.
4. A single `<script>` block at the bottom (~line 1160+) containing all page behavior, described below.

### Key interactive systems (all vanilla JS, no framework)

- **ETL pipeline animation** (hero section, `#pipeline-svg`): `runPipelineCycle()` / `animatePacket()` / `triggerTransformationGlow()` drive an animated SVG diagram of packets flowing source → transform → warehouse. Clicking a node calls `selectPipelineNode(nodeId)`, which looks up `nodeDetails` (~line 1293) and renders details into a side panel. Disabled when `prefers-reduced-motion` matches (~line 1288).
- **Project drawer**: clicking a project card calls `openProjectDrawer(projectId)` (~line 1413), which parses the `#project-data` JSON block and renders the matching entry into a slide-out drawer; `closeProjectDrawer()` reverses it.
- **Fake terminal** (`#terminal-input`): `runTerminalCommand(commandString)` (~line 1393) dispatches against the `terminalCommands` object (~line 1343), supporting commands like `help`, `cat about.md`, `get --skills`, `curl /experience`, `ls projects`, `ping gitam`, `clear`. All rendered output is escaped via `escapeHTML()` (~line 1400) before insertion — preserve this when adding new commands to avoid introducing XSS via reflected input.
- **Scroll behavior**: two `IntersectionObserver`s — one triggers `.reveal` → `.reveal.active` fade-in transitions as sections enter the viewport (~line 1166), the other highlights the active nav link (~line 1186).
- **Copy-to-clipboard**: `copySSH()` (~line 1455) uses `navigator.clipboard` to copy a contact "SSH string".

## Editing content

There's no CMS or external data file — everything is edited directly in `index.html`:

- **Project details**: the JSON in the `#project-data` `<script>` block (~line 1081).
- **Terminal commands/output**: the `terminalCommands` object (~line 1332).
- **Pipeline node descriptions**: the `nodeDetails` object (~line 1282).
- **Colors/fonts**: `tailwind.config` in the `<head>` (~line 20).

## Known constraints

- Tailwind is loaded via the CDN Play build (`cdn.tailwindcss.com`), which Tailwind's own docs say is not recommended for production. Acceptable for this portfolio; would need a real build step (PostCSS/CLI) to change.
- No favicon, no Open Graph/Twitter meta tags, no `robots.txt`/sitemap.
- The Contact section has no wired analytics or form backend — check whether it's mailto-only before assuming form submission works.
