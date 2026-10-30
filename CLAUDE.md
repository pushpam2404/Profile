# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

The personal portfolio of Pushpam Raj Satyarthi, built with Astro 7 and Tailwind CSS 4 (CSS-first, `@theme inline`). Live: https://pushpam2404-profile.vercel.app/ (Vercel, configured by `vercel.json`).

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check, then astro build. Must show 0 errors.
npm run preview
```

## Architecture

- `src/pages/index.astro`: the single page, in five sections: who I am, work, projects, proof, contact. Projects is a numbered index of tiles plus an "Also built" list; Proof is a one-open-at-a-time list (native `<details name>`) with a large figure that mirrors the open claim.
- `src/pages/projects/[slug].astro`: one page per project, generated from the content collection.
- `src/content/projects/*.yaml`: project content, validated by the Zod schema in `src/content.config.ts`.
- `src/data/site.ts`: all other content, typed.
- `src/components/`: Nav, Hero, Masthead (the three initials P, R, S: a compact fixed bar under the nav on every page that spells the name out on hover or tap; reused large and cropped in the footer), SectionHeader, PipelineFigure, ProjectCard (an index tile), Footer.
- `src/styles/global.css`: tokens, type scale and components. Custom classes sit in `@layer components` so Tailwind utilities can override them. Do not add unlayered rules for classes that utilities may need to override.
- `src/scripts/site.ts`: theme switch, display modes with hotkeys (T text mode, D dark, M monochrome; flags `data-text` and `data-mono` on `<html>`; monochrome drops the accent and does not touch pictures, restored before first paint in BaseLayout), proof list, scroll reveal, active nav link, mobile menu. No framework.
- `src/scripts/membrane.ts`: the hero mesh (canvas 2D, spring physics from the Membrane section on motionin.design). Loaded dynamically after `load`; paused off-screen, in hidden tabs, in text mode and under reduced motion (one still frame). Keep it out of the critical path and keep the headline the LCP element.

## Rules for content

- **Invent nothing.** Every claim must come from the resume, LinkedIn, or a repository. If a fact is missing, leave a `TODO` comment and a `null` link. Never make up a URL, number or date.
- Prefer the repository's wording over the resume's. An earlier audit removed claims the repositories do not support (the -30% redundancy figure, delta loads, 3NF, auto-quarantine, PHI pipelines, Mapbox and Google Maps for TripSync, "zero memory leaks").
- New claims go in the proof table in `src/data/site.ts` with an honest status: `verified` (checkable in public), `measured` (own benchmark with the method written down) or `reported` (private or institutional).

## Design rules

- Tokens come from `DESIGN_SYSTEM.md` (copy in `docs/DESIGN_SYSTEM.md`). Accent: orange `#C2410C` in light, `#FF5B2E` in dark. Primary buttons are ink in light mode and cream in dark mode.
- The visual mix comes from three sources: the Membrane mesh (motionin.design), the masthead, ruled spec rows and project index of harryjatkins.com (via recent.design), and the Benchmark figure-plus-claims layout (motionin.design). Do not add photo-wall effects: the portfolio has no photography.
- Project pictures are real screenshots only, in `src/assets/projects/<id>/` and listed in order under `shots:` in the project's YAML (the first is the card cover). Projects with at least one screenshot get a card on the home page; projects without any (`shots: []`) are listed as text under "More work" and still get a project page. A project with no interface uses `snippet:` (an exact excerpt of its source) or a flat text tile. No mock images. The project page stitches the shots into one sheet (`src/lib/shots.ts` packs them into equal-height rows); the card picture morphs into the sheet cover through a shared view-transition name.
- Colour: six hues (`--c-red|teal|amber|violet|green|blue`, each with a `-ink` shade that is safe for text at 4.5:1 or better on both themes and on tinted tiles). Each project owns one hue (`color:` in its YAML); each section number and hero stat has one; proof statuses use green (verified), blue (measured) and violet (reported). Colour never carries meaning alone: statuses also have words. Monochrome is `filter: grayscale(1)` on `<html>`, so every hue goes grey and the on/off difference is obvious. A mode that is on shows a chip bottom-left so it can never be invisible.
- Animate only `transform` and `opacity`. Respect `prefers-reduced-motion` (the scroll reveal and the pipeline packets both do).
- Body text and labels must stay at or above 4.5:1 contrast in both themes. `--text-3` is the lowest allowed text tier.
- The cropped footer wordmark must stay inside `.mega-clip` and `aria-hidden`.

## Checks before finishing

`npm run build` has 0 errors, the console is clean, there is no horizontal scroll at 375, 768 and 1440, every control has a visible focus ring, and Lighthouse scores at least 90 for performance and accessibility on a production build.
