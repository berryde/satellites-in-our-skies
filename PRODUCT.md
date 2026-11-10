# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The curious general public: non-specialists who arrive from a link, usually with no knowledge of orbits, and want to see what is in orbit and poke at a few satellites. They visit on desktop and on phones (the interface supports both hover and tap).

## Product Purpose

The Satellites in Our Skies shows every payload humanity has put into Earth orbit since 1957 on a 3D globe that can be scrubbed through time, from Sputnik 1 to the present moment.

It is a technical showcase. It succeeds when a visitor with no background can use it without explanation and comes away impressed by what it does: tens of thousands of satellites moving at once, smoothly, with real data behind every point.

## Positioning

The complete historical catalogue, not just what is up there today: every catalogued payload since 4 October 1957, each with its launch date, re-entry date, and real orbit shape, playable as a single continuous timeline. Every satellite's position is computed on the GPU from its orbital elements, which is what keeps the whole catalogue moving at once.

## Operating Context

- Served as a project page at berryde.com/projects/satellites, inside the author's personal site.
- V2 is a rewrite of a 2022 university data-visualisation project (history on the `main` branch).
- A visitor drags the globe, scrubs or plays the timeline, changes playback speed, returns to the live moment, toggles orbit classes, and hovers or taps a satellite to read its details.
- Deep links: `?t=1965-06-01` opens the globe paused at that moment; `?sat=25544` opens a satellite's details by NORAD catalogue number.

## Capabilities and Constraints

Capabilities today:

- 3D globe with every catalogued payload drawn as a point, coloured by orbit class.
- Timeline from 4 October 1957 to now, with play/pause, a set of playback speeds, and "Go live".
- Running count of satellites in orbit at the displayed moment, in total and per orbit class; each class can be shown or hidden.
- Satellite details: name, orbit class, owner, country, altitude range, inclination, period, launch date, and either status (operating or inactive) or re-entry date, plus NORAD ID (or GCAT ID for objects outside the US catalogue).

Constraints:

- Fully static. A Python (uv) + DuckDB pipeline builds `public/data/` locally or in CI; the site is hosted as a static-assets-only Cloudflare Worker with no Worker script. There is no backend and no per-request compute.
- Vite + React + TypeScript, globe.gl, and a custom `THREE.Points` layer. All per-satellite motion must stay on the GPU so the full catalogue remains cheap to animate.
- Times are shown in UTC.
- "Operating" status is GCAT's judgement and is sometimes a guess.

Data accuracy:

- Today each satellite's orbit shape is real, but its orientation and its position along the orbit are illustrative. The interface says so.
- Live accuracy is the goal. Wiring in CelesTrak orbital elements for real live positions is in progress, and the project is not considered finished until that gap is closed.
- Until then, nothing may imply real-time tracking of actual positions.

## Brand Commitments

- Name: "The Satellites in Our Skies".
- Subtitle in use: "Every payload in Earth orbit since 1957".
- It lives under berryde.com as one of the author's projects.

## Evidence on Hand

- GCAT by Jonathan C. McDowell (CC-BY): every catalogued payload, with launch and decay dates and orbit shape. Attribution is required and is shown in the interface.
- CelesTrak current orbital elements, for live positions (integration in progress).
- Earth night texture at `public/textures/earth-night.jpg`.
- Generated data in `public/data/` (not committed; produced by `npm run data`).
- There are no testimonials, press, usage figures, or awards. Future work must not invent any.

## Product Principles

1. The data is the spectacle. What impresses is the real catalogue in motion, so the satellites and the timeline stay the centre of attention.
2. No expertise required. A visitor who has never heard of an orbital element should be able to use everything and understand what they are looking at.
3. Say what is real. Be exact about what is measured, what is derived, and what is illustrative, and credit the sources.
4. Performance is part of the product. Smooth motion across the whole catalogue, on ordinary hardware, is the showcase; a feature that costs it is not worth having.
5. Stay static. Everything ships as pre-built files with no server behind it.
