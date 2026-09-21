---
name: TripSync
codename: null
year: 2025
context: Smart India Hackathon 2025 internal round. A road-trip planning and navigation companion for Indian road travellers, built from nothing inside a 24-hour constraint and continued afterwards.
repo_url: https://github.com/pushpam2404/Trip-Sync
live_url: https://trip-sync-rho.vercel.app
status: active-development
summary: A travel companion pairing turn-by-turn routing, dynamic waypoints and a conversational co-pilot on Gemini 2.5 Flash. Its own README opens with a warning that the application is buggy and under active development, and that warning stands here unchanged.
stack:
  - React 19
  - TypeScript
  - Vite
  - Tailwind CSS
  - Node.js
  - Express
  - MongoDB
  - Mongoose
  - Mappls SDK
  - Gemini 2.5 Flash
skills:
  - typescript
  - javascript
  - react
  - nodejs
  - expressjs
  - mongodb
  - mongoose
order: 6
---

## A warning first

The repository README carries this, above everything else:

> Deployment Status: Active Development. This application is currently under
> development and is buggy, but the core features are functional.

That is the author's own assessment of his own project, published before this site
existed. Nothing below revises it. The live deployment is real and can be opened,
and it will behave like software that says it is buggy.

## The problem

Planning an Indian road trip means holding several tools at once: one for the
route, one for places to stop, one for accommodation, and a notes app for
everything the other three cannot represent. The vehicle matters too, because a
route optimised for a car is not the route a two-wheeler should take.

## The approach

TripSync puts planning and driving in one dashboard. Routes are calculated per
transit profile, so a two-wheeler and a four-wheeler get different turn-by-turn
directions. Waypoints for restaurants, fuel, ATMs and EV chargers can be added to
a route that is already running rather than only at planning time. Historical
trips are logged against passenger counts and vehicle registration numbers.

The conversational layer, Sakha, runs on the Google Gen AI SDK with Gemini 2.5
Flash. Its job is narrower than a general assistant: it converts a spoken or typed
request such as a city-to-city trip into a structured intent, and returns an
interactive route card that can be tapped straight into the map, rather than
returning prose the user then has to act on.

## Architecture

The client is a React single-page application on Vite, compiling Tailwind locally
so the shipped CSS is tree-shaken. State is exposed through domain-specific
contexts rather than one global provider, which is what stops an unrelated update
from re-rendering the map.

The server is Node and Express over MongoDB through Mongoose, with Helmet, CORS
filtering, rate limiting and authentication checks in front of protected routes. A
separate map adapter handles geocoding, routing overlays and estimated arrival
times.

The map layer is the Mappls SDK from MapmyIndia in the current codebase. Earlier
revisions used Google Maps, which is why the author's resume describes this
project with a different mapping stack; the migration is visible in the commit
history rather than hidden.

## What it does not do

The project is not finished and is not presented as finished. Known bugs exist and
are acknowledged in the repository rather than triaged into a list, so this page
cannot enumerate them.

The claim on the author's resume that the backend supports multiple concurrent
users efficiently has no measurement behind it. No load test was run and no
request rate was recorded, so on this site that claim is filed as untested rather
than repeated.

Offline caching, collaborative trip boards and weather-aware rerouting are on the
README's roadmap, which is to say none of them exist.
