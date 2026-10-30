# DESIGN_SYSTEM.md — Pushpam's project family

Status: **DRAFT v2 for approval. Nothing is applied to any repo yet.**
Lives at `~/Desktop/DESIGN_SYSTEM.md` (outside all repos). On "green light" a copy goes into each repo that adopts it.

## 0. Where this comes from

I browsed the six sites in Chrome and looked at **what they showcase**, not at their own chrome: the footer gallery (footer.design), the animation shots and patterns (60fps.design), the interactive-section catalog (motionin.design), the curated design, website and launch-video feeds (recent.design), the landing-page gallery (landdding.com) and the template reel (modulify.ai).

- I took **patterns** (layout, structure, motion ideas, palette tendencies). I did not take images, logos, copy or brand names, and none of those go into any repo.
- Specific values (hex codes, sizes, durations) are **my choices**, informed by what the galleries have in common. They are not measured from any showcased work.
- Astra's references were pulled at the start of Task 1 from 60fps.design's Loading (211 examples) and Bottom Sheet (35) categories: a short present-progressive headline with one line of subtext, and skeleton values while content loads. Astra uses both.

## 1. What the galleries agree on

1. **Footers are an event.** Most footers in the gallery are a huge wordmark cropped by the bottom edge, with small-type link columns above it, an inline newsletter/contact pill, and a mono legal row.
2. **Warm paper plus ink, and the inverse.** Cream grounds with near-black type, and near-black grounds with *cream* (not white, not neon) type and cream CTA pills. Color arrives as one bold hue per piece (a tomato red, a cobalt blue, an orange blob), never as a rainbow.
3. **Type does the layout.** Big grotesque or serif display, tight tracking, small mono labels, a few pixel/ASCII accents. Cards are quiet; type is loud.
4. **Portfolios are staged, not scrolled.** The motionin.design portfolio and hero entries run on one idea each: a single-frame hero held on a masthead, a depth carousel or vortex as the work index, a gallery that assembles itself on load, a scroll-driven reel, a globe you explore point by point.
5. **Dense, numbered, counted UI.** Superscript counts in the nav, numbered cards, a source badge, a caption under the media, an inline subscribe strip between grid rows. (60fps.design)
6. **Dashboards use a left rail.** Grouped nav on the left (Browse / Resources), a pill-filter row on top, a mixed-aspect masonry grid, a small side widget. (recent.design)
7. **Hero stats row plus trending tags.** (landdding.com)

## 2. Principles

1. **Type first, staged hero, quiet cards.** (from 1.3, 1.4)
2. **One neutral base, one bold accent per project.** Shared skeleton, different identity.
3. **Counted and numbered.** Sections get `01`, lists get counts. Real numbers only.
4. **Motion is transform + opacity only.** This is how we hold 60fps on the M4 and on a mid phone.
5. **Every page ends with a footer that has an idea.**

## 3. Color tokens

Neutrals are shared. Ratios were computed with the WCAG formula (script run). AA needs ≥ 4.5 for body text and ≥ 3 for large text and UI.

```css
:root {                      /* light: warm paper */
  --bg:        #FAFAF7;
  --paper:     #F2EDE2;      /* optional warm section ground (portfolio, footer) */
  --surface:   #FFFFFF;
  --surface-2: #F2F2EE;
  --border:    rgba(17,17,20,.10);
  --text:      #111114;      /* 18.0:1 */
  --text-2:    #52525B;      /* 7.4:1 */
  --text-3:    #6B6B75;      /* 5.0:1 on --bg, 4.7:1 on --surface-2: lowest allowed for text */
  --accent:    var(--accent-light);
  --on-accent: var(--on-accent-light);
}
[data-theme="dark"] {        /* near-black + cream */
  --bg:        #0B0B0E;
  --surface:   #131318;
  --surface-2: #1A1A21;
  --border:    rgba(255,255,255,.09);
  --text:      #F4F4F6;      /* 17.9:1 */
  --text-2:    #A1A1AA;      /* 7.7:1 */
  --text-3:    #8A8A94;      /* 5.7:1; #71717A measures 4.07:1 and fails AA, don't use it */
  --cream:     #EFE7D6;      /* primary button and big type in dark mode; ink text on it */
  --accent:    var(--accent-dark);
  --on-accent: var(--on-accent-dark);
}
```

**Primary button:** in dark mode a cream pill with ink text. In light mode an ink pill with paper text. The project accent is for highlights, badges, links, focus rings and the CTA band, not for every button.

| Project | Accent dark | Accent light | On-accent | Rationale |
|---|---|---|---|---|
| Portfolio ⚠ see §10 | `#FF5B2E` signal orange (6.35:1 on dark bg) | `#C2410C` (5.2:1 on white) | `#0B0B0E` (6.35:1) / `#FFFFFF` | Current cyan-on-black is the genre the earlier spec called templated. One bold hue on paper or ink, as in the galleries. |
| Astra | `#F4E9C8` starlight (**keep**) | n/a, dark only | `#05060E` | Already cream-on-night, which is exactly where the galleries converge. Keep `--night`, `--starlight`, `--spotify`. |
| Trip-Sync | **keep** `--accent #f4c20d` | `#f4c20d` with `--accent-ink #6B5000` for text (7.2:1) | existing `--on-accent #17140A` (11.0:1) | Already has light and dark tokens and a considered palette. Fonts already match this system. |
| KAPS-Medtech | **keep** `--brand #0B5C7A` | `#0B5C7A` | existing `--on-brand #FFFFFF` | Sound for a medical product. We change layout, type and motion, not hue. |

Semantic: `--success #16A34A/#4ADE80`, `--warning #CA8A04/#FACC15`, `--danger #DC2626/#FF6B7A`. Never carry meaning by color alone.

## 4. Type

Self-hosted via `@fontsource-variable` (no Google Fonts request; better Lighthouse and privacy).

- **Display:** Bricolage Grotesque Variable (already in Trip-Sync).
- **Body/UI:** Instrument Sans Variable (already in Trip-Sync).
- **Mono (labels, indices, counts, legal):** JetBrains Mono (already in the portfolio).
- Astra keeps its current typefaces unless its audit finds them generic.
- **Max two display faces per page, one preferred.** The galleries load many faces for their demos. We don't. Each extra font costs Lighthouse points.

| Token | Size | Line | Tracking | Use |
|---|---|---|---|---|
| `mega` | clamp(96px, 18vw, 320px) | 0.8 | -0.05em | Footer wordmark only (cropped) |
| `display` | 56 → 120px | 0.95 | -0.035em | Hero statement |
| `h1` | 40 → 72px | 1.0 | -0.03em | Page titles |
| `h2` | 28 → 44px | 1.1 | -0.02em | Sections |
| `h3` | 20 → 24px | 1.25 | -0.01em | Card titles |
| `body` | 16 → 18px | 1.6 | 0 | Paragraphs, max 68ch |
| `small` | 14px | 1.5 | 0 | Meta |
| `label` | 12–13px mono, uppercase | 1.3 | +0.06em | Indices, chips, counts |

Body never below 16px on mobile. `text-wrap: balance` on headings, `pretty` on paragraphs. The `mega` wordmark is decorative: `aria-hidden="true"`, with the real name in text nearby.

## 5. Spacing and grid

- 4px base: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192. Section padding-block `clamp(64px, 10vw, 160px)`.
- 12-col grid, content max 1200px, wide 1440px. Gutter 16 / 24 / 32. Side margin ≥ 16px.
- Breakpoints 375 / 768 / 1024 / 1440. **No horizontal scroll at 375, 768, 1440 is a hard gate.** The cropped `mega` wordmark must be clipped with `overflow: hidden` on its own container, not on the page.
- Radii: 8 inputs, 20 cards, 999 pills/buttons. Borders 1px `--border`. Shadows rare.

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-micro` | 120ms | Press, toggle |
| `--dur-hover` | 200ms | Hover, focus |
| `--dur-ui` | 320ms | Menus, drawers, chips |
| `--dur-reveal` | 600ms | Section reveal |
| `--dur-hero` | 900ms | Hero load-in, once |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | Enter, reveal (default) |
| `--ease-std` | `cubic-bezier(.2,0,0,1)` | Hover, state change |
| `--ease-inout` | `cubic-bezier(.65,0,.35,1)` | Layout/page transitions |
| spring | `{ type:"spring", stiffness:260, damping:30 }` | Drawers, drag |

- Reveal: `opacity 0→1` + `translateY 16→0`, 60ms stagger, once at 20% in view.
- Only `transform` and `opacity` animate. `will-change` only during the animation.
- **Reduced motion:** transforms and parallax off, reveals become a ≤150ms fade, marquees and loops stop, no autoplay. Astra: camera auto-rotate pauses with a visible control to restore it.
- React projects use `motion` (`motion/react`), not `framer-motion`; same library, current name. Use `LazyMotion` + `m` + `domAnimation` to cut bundle size. Astra already depends on `motion`. Vanilla pages (KAPS, current portfolio) use the CSS variables above or `motion`'s vanilla `animate()`.

## 7. Pattern library (what we borrow, where it came from)

| ID | Pattern | Seen in | Spec |
|---|---|---|---|
| **P1** | Cropped mega-wordmark footer | footer.design gallery (most entries), the 60fps masthead | `mega` type clipped at the bottom of its own container; small link columns, inline contact/newsletter pill, mono legal row above |
| **P2** | Cream-on-ink inversion | footer.design gallery, motionin.design, landdding.com | dark mode primary buttons and large type use `--cream` |
| **P3** | Counted nav | 60fps.design | mono superscript count beside a link (`Work⁴`); numbers must be real |
| **P4** | Shelf of icon chips | 60fps.design | horizontal scroll row of small labeled tiles used as a filter; chips wrap on desktop |
| **P5** | Numbered media card | 60fps.design | mono index top-left, source/stack badge top-right, media (16:10), caption **below** the media |
| **P6** | Inline strip between grid rows | 60fps.design | a single-row CTA (contact, book, create) inserted after row 2 of the grid; real actions only |
| **P7** | Left-rail dashboard shell | recent.design | sticky grouped nav on the left (≥1024px), pill-filter row on top, masonry or grid body, side widget; bottom tab bar below 768px |
| **P8** | Hero with index list | motionin.design | eyebrow micro-badge, statement left, right-aligned list of sections or categories as anchor links |
| **P9** | Hero stats row | landdding.com | 3–4 mono numbers in a bordered strip beneath the hero; only real numbers, otherwise `TODO` |
| **P10** | Three-state theme switch | motionin.design | segmented light / dark / system control in the nav, persists to `localStorage` in try/catch |
| **P11** | Single-frame staged hero | motionin.design (portfolio, hero) | the first viewport holds one composed frame (masthead + one visual); scroll reveals the rest |
| **P12** | Depth carousel work index | motionin.design (portfolio) | project index as a stacked, depth-ordered carousel, drag and arrow-key navigable; falls back to the P5 grid on touch or reduced motion |
| **P13** | Self-assembling load | motionin.design (gallery that assembles itself) | content staggers in from scattered to ordered while data loads, instead of a spinner. **Astra: scoped down to the UI layer** (skeleton rows, honest copy). Planets must stay opaque (`transparent:false`, invariant 3.3), so no fade-in of 3D bodies. |
| **P14** | Case-study header | footer.design item view | large title and 2–3 line description left, preview right, one ghost pill ("View live") |
| **P15** | Spotlight prompt input | modulify.ai | a single large input with a soft colored glow behind it; **layout only**, no AI gimmick |
| **P16** | Two-row opposing marquee | modulify.ai | stack/tool tiles scrolling in opposite directions; pause on hover and focus, stop on reduced motion |
| **P17** | Point-by-point globe/graph exploration | motionin.design (interactive globe) | hover/tap a point to get a label with a leader line and a small detail card |

Also seen, and **not** borrowed: sponsor slots, jobs widgets, cookie toasts, like counters, user submissions. They serve their directories, not our products.

## 8. Components

| Component | Spec | Patterns |
|---|---|---|
| **Nav** | Slim sticky bar, 56px. Wordmark left; links with mono counts; theme switch plus one primary pill right. Mobile: full-screen sheet with large type links, focus-trapped. | P3, P10 |
| **Hero** | `display` statement, one-line subhead, optional index list (right) and stats row beneath. | P8, P9, P11 |
| **Cards** | 20px radius, `--surface`, 16:10 media, mono index and badge, caption below. Hover (mouse only): lift 4px, border brightens. | P5 |
| **Filter chips** | 36px pills, active = filled. Optional icon tile. | P4 |
| **Buttons** | Pill, 44px min height. Primary = cream (dark) / ink (light). Secondary 1px border. Press scale .98. Focus: 2px `--accent` ring, 2px offset, never removed. | P2 |
| **CTA band** | Rounded full-width block, static accent gradient, `h2`, one action. | P6 |
| **Footer** | P1 spec. | P1 |
| **Section header** | Mono index `01`, `h2`, optional count, 1px rule. | P3 |
| **HUD / overlay** (Astra) | Near-opaque panel `rgba(12,15,30,.92)`, 1px border, no `backdrop-filter` over the live canvas. | P13, P17 |

## 9. Map: which pattern goes where

| | Astra | Portfolio | Trip-Sync | KAPS-Medtech |
|---|---|---|---|---|
| Shell | Compact HUD bar (icon + label) | Sticky nav, P3 + P10 | P7: left rail on desktop, bottom tab bar on mobile (audit first) | P7: role-aware left rail on both dashboards |
| Hero | Load screen only, P13: the universe assembles while data loads | P8 + P9 + P11 | Prompt-style "Where to?" input (P15 layout) | Statement + one primary action + P9 trust row (**real numbers or TODO**) |
| Index / list | Track and cluster cards, P17 labels | P12 depth carousel (desktop, fine pointer) with P5 grid fallback | Trip cards, P5 | Doctor and appointment cards, P5 |
| Chips | Genre / time-range | Project filter if > 4 projects | Trip status, P4 | Specialty, P4 |
| CTA | none | Contact band, P6 | Create trip, P6 | Book appointment, P6 |
| Footer | Credits strip only; scene stays unobstructed | P1 full | Compact | P1 restrained (smaller `mega`, disclaimers) |
| Marquee | none | P16 for stack | none | none |
| Theme | Dark only | Light + dark, P10 | Light + dark, P10 | Light-first, dark optional |

## 10. ⚠ Portfolio: conflict with your own earlier spec (needs your decision)

`Profile/docs/superpowers/specs/2026-09-22-portfolio-rebuild-design.md` (plus an 82 KB plan) was never executed. It is a complete, different design:

| | Sept 22 spec | Your current brief |
|---|---|---|
| Stack | **Astro 7**, Tailwind v4, content collections + Zod, DuckDB-WASM island | Vite + React + TS + Tailwind + Framer Motion (pitch Astro) |
| Look | Light "greenbar" paper, serif (Newsreader) + IBM Plex Mono | Dark mode required; patterns from the 6 galleries |
| Dark mode | Explicitly **out of scope** for v1 | Required |
| Thesis | Every claim has a verification status; result rows, not cards | Who I am → what I build → proof → contact |
| Forbidden | Dark-terminal-plus-accent, Inter, identical rounded cards, tracked ALL-CAPS eyebrows | Cards and mono labels appear in this system |

Three options:

1. **Astro + this design system (recommended).** Meets the new brief (dark mode, Lighthouse, gallery patterns) and keeps the spec's strongest ideas: Astro, typed content, the claim-status legend, "invent nothing". React stays available as islands for P12, the drawer and the terminal. Departs from "Vite + React", so it needs your approval.
2. **Vite + React + this design system** exactly as briefed. More JS shipped, so Lighthouse Performance ≥ 90 needs care.
3. **Execute the Sept 22 spec as written.** Contradicts the brief on dark mode and look. Not recommended unless you've changed your mind.

Two spec rules clash with patterns here: it forbids tracked ALL-CAPS eyebrows and identical rounded cards, while P3, P5 and the `label` token use mono uppercase labels and cards. If you pick option 1, I'll keep mono labels but make cards less uniform (P12 and P11 carry the portfolio instead).

The live `index.html` is the pre-rebuild site (cyan on dark, terminal, Inter), the genre the spec itself calls templated. I agree with that critique.

## 11. Astro 3-bullet pitch (for Task 2)

- Ships zero JS by default. The portfolio is ~90% static, so Lighthouse Performance ≥ 90 is the default outcome, not a tuning exercise.
- React islands (`client:visible`) cover the only interactive parts: P12 carousel, project drawer, terminal, theme switch. Same components, same `motion`, a fraction of the bundle.
- Content collections with Zod enforce "invent nothing, mark gaps `TODO`" at build time. Vercel's Astro preset needs only the build command and output directory changed.

## 12. Bad ideas I'm flagging up front

1. **`backdrop-filter: blur()` over Astra's WebGL canvas** forces a re-blur every frame. Astra panels use near-opaque backgrounds.
2. **P12 depth carousel and any cursor/tilt effect:** fine-pointer only (`@media (hover:hover) and (pointer:fine)`), with a static fallback. They cost frames and are touch-hostile.
3. **P15 spotlight input in KAPS.** A medical product with an AI-style prompt box is a trust problem. Trip-Sync only, as layout.
4. **P9 stats rows** are a fabrication risk. Real numbers or `TODO`, never filler.
5. **KAPS `vercel.json` routes everything to `backend/server.js`**, so Express serves the frontend. Any change must keep that. I'll leave `vercel.json` alone.
6. **Cropped `mega` wordmark** is the usual cause of horizontal scroll and of an unreadable footer for screen readers. It's clipped inside its own container and `aria-hidden`.

## 13. Definition of done (every page)

Build passes with 0 errors · clean console · no horizontal scroll at 375/768/1440 · keyboard nav with visible focus · alt text · WCAG AA contrast · before/after screenshots.

## 12. v2 patterns (portfolio)

- **Masthead:** the initials P, R, S in a compact fixed bar under the nav on every page (`--f`: 60 px at most, 28 px on phones), in thirds from tablet width. Hovering or tapping writes Pushpam, Raj, Satyarthi at the same size. The footer wordmark reuses the initials large, cropped and in `--text-3`.
- **Hero strip:** ruled row of name and role, index links, display modes with hotkeys, live viewport readout (decorative).
- **Mesh:** canvas behind the hero only. Dark: ivory dots on near-black. Light: ink dots, accent on displaced vertices. A soft clearing is computed from the headline block's rectangle.
- **Project index:** ruled header (title, number), role line, then a tile with a square crop of a real screenshot. Without one, a flat tile with the tagline. Text mode shows flat tiles everywhere.
- **Spec sheet:** label/value rows separated by hairlines, used on project pages. Only rows backed by data (ID, role, status, facts, stack, links).
- **Proof:** large figure left, claims right, one open at a time. Scale and colour step with open/closed; no opacity tricks, so text stays at 4.5:1 or better.
- **Palette (v2.1):** six hues for identity and status (red, teal, amber, violet, green, blue), each with an `-ink` text shade. Monochrome is a full-page greyscale, so the palette is what makes the toggle visible. Text modes and monochrome show a chip while on.
