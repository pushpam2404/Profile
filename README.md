# Pushpam Raj Satyarthi — Developer Portfolio

Single-page personal portfolio site with a dark, terminal/IDE-inspired aesthetic. Built as one self-contained `index.html` — no build step, no bundler, no `npm install`.

**Live:** [pushpam2404-profile.vercel.app](https://pushpam2404-profile.vercel.app/)

## Stack

- Plain HTML5 + vanilla JS (no framework)
- [Tailwind CSS](https://tailwindcss.com/) via CDN (`cdn.tailwindcss.com`), custom theme extension for colors/fonts
- [Lucide Icons](https://lucide.dev/) via CDN
- Google Fonts: Inter (body), JetBrains Mono (code/terminal UI)
- Everything (CSS, JS, data) lives inline in `index.html`

## Running it

No install needed. Either:

```bash
open index.html          # macOS, opens directly in browser
```

or serve it locally (recommended, since some browsers restrict `fetch`/clipboard APIs on `file://`):

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Sections

| Section | `id` | Content |
|---|---|---|
| Hero | `#hero` | Intro, status badge, animated ETL pipeline SVG diagram |
| About | `#about` | Bio |
| Skills | `#skills` | Languages, data eng stack, databases, frameworks, tools, CS fundamentals |
| Experience | `#experience` | Motherson Technology Services internship (AIML team) |
| Projects | `#projects` | 4 project cards, each opens a detail drawer |
| Education | `#education` | GITAM University + certifications |
| Achievements | `#achievements` | Awards/recognition |
| Contact | `#contact` | Contact links |

## Notable interactive bits

- **ETL pipeline animation** (hero, `#pipeline-svg`) — animated packets flow from source nodes → transform → warehouse; click a node to see its details in the panel (`selectPipelineNode()`).
- **Project drawer** — clicking a project card calls `openProjectDrawer(id)`, which pulls structured data out of the inline `<script type="application/json" id="project-data">` block and renders it into a slide-out panel.
- **Fake terminal** (`#terminal-input`) — supports commands like `help`, `cat about.md`, `get --skills`, `curl /experience`, `ls projects`, `ping gitam`, `clear`. Unknown input returns a `command not found` message. Input is escaped via `escapeHTML()` before rendering.
- **Copy-to-clipboard SSH string** — `copySSH()`, uses `navigator.clipboard`.
- Scroll-triggered section reveals and active-nav-link highlighting via `IntersectionObserver`.
- Respects `prefers-reduced-motion`: disables the pipeline animation loop and reveal transitions.

## Editing content

There's no CMS or data file — content lives directly in the markup:

- **Project details**: edit the JSON in the `#project-data` `<script>` block (~line 1081).
- **Terminal commands/output**: edit the `terminalCommands` object in the JS (~line 1332).
- **Pipeline node descriptions**: edit the `nodeDetails` object (~line 1282).
- **Colors/fonts**: edit `tailwind.config` in the `<head>` (~line 20).

## Known gaps

- Tailwind is loaded from the CDN (`cdn.tailwindcss.com`), which is explicitly [not recommended for production](https://tailwindcss.com/docs/installation/play-cdn) by the Tailwind docs — fine for a portfolio, but worth a proper build step (PostCSS/CLI) if this ever needs to scale or drop the CDN dependency.
- No meta tags beyond title/description — no Open Graph/Twitter card, no favicon, no `robots.txt`/sitemap.
- No analytics or form backend wired to the Contact section (check `#contact` for whether it's mailto-only or expects a form submission target).
