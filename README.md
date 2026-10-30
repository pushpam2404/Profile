# Profile

My portfolio: https://pushpam2404-profile.vercel.app

Built with [Astro](https://astro.build) and Tailwind CSS 4. It ships no framework JavaScript: the only script is about 60 lines for the theme switch, scroll reveal and active nav link. Fonts are self-hosted through `@fontsource`.

![Home page at 1440px](docs/screenshots/home-desktop.png)

| Projects | Mobile |
|---|---|
| ![Projects at 1440px](docs/screenshots/projects-desktop.png) | ![Home page at 375px](docs/screenshots/home-mobile.png) |

## Structure

The page follows one flow: who I am, what I build, proof, contact.

| Section | What is in it |
|---|---|
| Hero | The headline, an index of the sections, and four numbers that can each be checked |
| 01 Who I am | About, leadership and community, education, and an illustrative ETL figure |
| 02 Work | The Motherson internship and the toolbox |
| 03 Projects | Five projects with their own pages under `/projects/<name>/`, plus a list of other repositories |
| 04 Proof | Every claim with its evidence and a status: verified, measured or reported. Also the IBM course certificates and hackathons |
| 05 Contact | Email, LinkedIn, GitHub, phone |

## Running it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # runs `astro check` first, then builds to dist/
npm run preview    # serve the production build
```

Node 22.23.4 or newer.

## Editing content

Nothing is hard-coded in the components.

- Projects: one YAML file each in `src/content/projects/`. The schema is `src/content.config.ts`, so a missing field fails the build. A project without a public link has `repo: null`.
- Everything else (hero numbers, experience, education, skills, leadership, proof table, other repositories): `src/data/site.ts`.
- Screenshots: `src/assets/projects/<project-name>.png`, with the alt text in the YAML as `imageAlt`.
- Colors, type scale and motion tokens: `src/styles/global.css`. The tokens come from the design system.
- `TODO` comments mark gaps that need information only I have.

## Proof statuses

- **Verified**: anyone can check it in a public repository or live site.
- **Measured**: my own benchmark, with the method and caveats written down.
- **Reported**: my account of private or institutional work, with no public evidence yet.

## Deploying

Vercel builds with `vercel.json` (`framework: astro`, `npm run build`, output `dist`).

## What changed from the old site

- The fake terminal and the project details drawer are gone. The terminal repeated content that is now in the sections, and each project has a real page instead of a drawer.
- Added the fake-account detection engine (my headline project), the SIH 2026 result, and the leadership roles, which the old site did not have.
- The hero numbers are ones I can point to. The old site's "29 integration checks" is now 23, which is what the repository contains today.

## Social preview

`docs/social-preview.html` is the source for `public/og.png`. Open it at 1200x630, screenshot it, and copy the PNG to `public/og.png` and `docs/social-preview.png`.
