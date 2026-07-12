# Nexus Web

Desktop dashboard for **Nexus Hub** — a Vue 3 SPA that consumes the Nexus API and presents a personal life hub (integrations, collections, media, sports).

**Local URL:** [http://nexus.test](http://nexus.test)

## Stack

- Vue 3 (Composition API, `<script setup>`)
- Vite 8
- Pinia (planned / primary client state)
- Vue Router (planned)
- PrimeVue 4 with Aura theme
- PrimeIcons

## Vision (short)

Nexus Hub consolidates personal domains — Spotify, GitHub, cellar, library, kitchen, media vaults, optional social integrations, and sports/F1 — behind one API. This app is the desktop UI; a future mobile app will handle photo-first collection intake. See [docs/VISION.md](docs/VISION.md) and [docs/ROADMAP.md](docs/ROADMAP.md).

**Immediate next focus when building features:** shell + auth against Sanctum, then the next module UI (likely Spotify) once the API milestone is specified.

## Quick Start

Frontend assets compile **natively on the host** for fast rebuilds. Nginx serves the output from `dist/`.

```bash
cd nexus-web
npm install

# One-off production build
npm run build

# Watch mode (recommended during development)
npm run build -- --watch

# Dev server with HMR (alternative — not proxied through nexus.test by default)
npm run dev
```

After building, open [http://nexus.test](http://nexus.test).

## API Integration

The web client talks to the Laravel API at `http://api.nexus.test`:

- All data fetching goes through `/api/*` endpoints
- Authentication via Sanctum bearer tokens (stored client-side once auth is implemented)
- No server-side rendering — pure SPA

Configure the API base URL in an environment file when added:

```dotenv
VITE_API_BASE_URL=http://api.nexus.test
```

## Project Structure (planned)

```
src/
├── main.ts              # App bootstrap, PrimeVue config
├── App.vue              # Root layout shell
├── assets/              # Static images, icons
├── components/          # Shared UI components
├── stores/              # Pinia stores
├── modules/             # Feature modules (spotify, cellar, github, …)
│   ├── spotify/
│   │   ├── views/
│   │   ├── components/
│   │   └── composables/
│   └── ...
├── composables/         # Shared composables (useApi, …)
├── router/              # Vue Router
└── services/            # API client layer
```

## Documentation

| Document | Description |
|----------|-------------|
| [docs/VISION.md](docs/VISION.md) | Product vision and pillars |
| [docs/ROADMAP.md](docs/ROADMAP.md) | UI milestones aligned with API |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Shell, modules, API consumption |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Build workflow, PrimeVue, local dev |

## Related

- Backend API: [`../nexus-api/`](../nexus-api/) → [http://api.nexus.test](http://api.nexus.test)
- Monorepo overview: [`../README.md`](../README.md)
