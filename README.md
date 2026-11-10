# The Satellites in Our Skies

Every satellite humanity has put into Earth orbit since 1957, on a 3D globe you can scrub through time. Served at [berryde.com/projects/satellites](https://berryde.com/projects/satellites).

V2 is a rewrite of a 2022 university data-visualisation project (see the `main` branch history).

## How it works

- **`pipeline/`**: Python (uv) + DuckDB. Downloads the raw catalogues into `pipeline/.cache` and builds the static files in `public/data/`. It runs locally or in CI, never on Cloudflare.
- **`src/`**: Vite + React + TypeScript. [globe.gl](https://github.com/vasturiano/globe.gl) draws the Earth, and a custom `THREE.Points` layer (`src/globe/satelliteLayer.ts`) computes every satellite's position on the GPU from its orbital elements, so tens of thousands of moving points stay cheap.
- **Hosting**: a static-assets-only Cloudflare Worker (`wrangler.jsonc`). There is no Worker script, so serving it is free and unmetered.

## Commands

```sh
npm install
npm run data      # generate public/data (needs uv); required once after cloning, as it isn't committed
npm run dev       # http://localhost:5173/projects/satellites/
npm run build     # type-check and build into dist/projects/satellites/
npm run deploy    # build and deploy with wrangler
```

Open `?t=1965-06-01` to view the globe paused at a given moment.

## Data

- [GCAT](https://planet4589.org/space/gcat) by Jonathan C. McDowell (CC-BY): every catalogued payload, with launch and decay dates and orbit shape.
- [CelesTrak](https://celestrak.org) current orbital elements, for live positions (in progress).

Until CelesTrak elements are wired in, each satellite's orbit shape is real but its orientation and position along the orbit are illustrative.
