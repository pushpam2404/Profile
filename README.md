# Profile

My portfolio site: https://pushpam2404-profile.vercel.app

One static `index.html`. Tailwind comes from its CDN build, icons from Lucide, fonts from Google Fonts, and everything else (CSS, JS, project data) is inline. There is no build step. Vercel deploys it from `main`.

![Desktop view](docs/screenshots/desktop-hero.png)

| Projects section | Mobile |
|---|---|
| ![Projects at 1440px](docs/screenshots/desktop-projects.png) | ![Mobile hero at 390px](docs/screenshots/mobile-hero.png) |

## Sections

About, skills, experience (one internship), projects, education and certification, two hackathon entries, and contact. The projects section has four cards with a details panel each, plus a short list of other repositories. Every link points to a repository or deployment that exists under github.com/pushpam2404.

## Running it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works.

## Things on the page that do something

- The hero diagram is a generic ETL illustration. Clicking a node shows what that stage does. It is labelled as illustrative because it is not live data.
- The terminal accepts `help`, `cat about.md`, `get --skills`, `curl /experience`, `ls projects` and `clear`. Input is escaped before it is rendered.
- The project details panel reads from the JSON block with id `project-data`.
- The copy button in the contact section copies my email address.
- Motion respects `prefers-reduced-motion`.

## Accessibility and SEO

Skip link, a labelled mobile menu button with `aria-expanded`, visible focus outlines, keyboard-reachable project buttons, a details dialog that moves focus in and returns it on close, and Open Graph, Twitter and JSON-LD metadata. Body text contrast is above 4.5:1 on the dark background.

## Editing

- Project cards: the Projects section in `index.html`.
- Details panels: the `project-data` JSON block.
- Terminal output: the `terminalCommands` object.
- Diagram text: the `nodeDetails` object.
- Colors and fonts: `tailwind.config` in the `<head>`.

## Known limits

- Tailwind runs in the browser from `cdn.tailwindcss.com`, which Tailwind says is not meant for production. Moving to the Tailwind CLI would need a build step.
- There is no social preview image.
- Some figures in the experience, about and hackathon sections (bugs found, endpoints, course count, hackathon results) come from me and cannot be checked from a public repository.
