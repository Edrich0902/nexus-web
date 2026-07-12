# Nexus Web — Architecture

## Overview

Nexus Web is a desktop-first Vue 3 SPA — the visual command station for **Nexus Hub**. It is a thin client: persistence and integrations live in `nexus-api`; this app handles presentation, interaction, and client-side state (Pinia).

```
┌──────────────────────────────────────────────────────┐
│                    nexus.test                         │
│  ┌────────────────────────────────────────────────┐  │
│  │              App Shell (layout)                 │  │
│  │  ┌──────────┐  ┌─────────────────────────────┐ │  │
│  │  │ Sidebar  │  │     Active Module View      │ │  │
│  │  │ / Nav    │  │  (Spotify, Cellar, F1, …)   │ │  │
│  │  └──────────┘  └─────────────────────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────┘
                           │ fetch (JSON + Bearer token)
                           ▼
                  api.nexus.test/api/*
```

Vision and sequencing: [VISION.md](VISION.md), [ROADMAP.md](ROADMAP.md).

## Design Principles

- **Module-based UI** — each pillar is a feature module under `src/modules/`.
- **API-driven** — no direct third-party calls from the browser.
- **Pinia for shared state** — auth session, preferences, cross-view data.
- **Desktop-first** — wide screens first; tablet later; mobile is a separate app.

## Layout shell (planned)

| Region | Purpose |
|--------|---------|
| Top bar | Branding, global actions, user menu |
| Sidebar | Module navigation |
| Main content | Active module (router outlet) |
| Status area | Sync / connection indicators where useful |

## Module pattern

```
src/modules/{name}/
├── views/           # Route-level pages
├── components/      # Module widgets
├── composables/     # Module-local data helpers
└── routes.ts        # Merged into the central router
```

Shared infrastructure (planned):

```
src/
├── stores/                # Pinia (auth, preferences, …)
├── composables/useApi.ts  # HTTP wrapper with auth header
├── services/api.ts        # Base client config
└── router/index.ts
```

## Planned dashboard modules

| Module | Role |
|--------|------|
| **Home** | Cross-module summary / entry points |
| **Spotify** | Connection + listening surfaces |
| **GitHub** | Developer activity / context |
| **Cellar** | Wine inventory |
| **Library** | Books / reading |
| **Kitchen** | Recipes |
| **Media vaults** | Personal media libraries |
| **Social** | Optional (e.g. Instagram) |
| **F1 / Sports** | Schedules, standings, ticker |

Exact widgets are defined when each milestone is specified.

## State management

**Pinia** is the planned store layer for auth and other shared hub state. Module-local UI state can stay in components/composables until sharing is needed.

| State | Location |
|-------|----------|
| Auth token / session | Pinia auth store → `localStorage` (or equivalent) |
| Module lists/details | Module composables or Pinia module stores |
| UI preferences | Pinia or `localStorage` |

## PrimeVue

PrimeVue 4 + Aura is configured in `src/main.ts`. Prefer per-component imports. Use the design system already in the repo; don’t invent a parallel UI kit per module.

## Build & delivery

Vite compiles to `dist/`. Nginx serves `nexus-web/dist/`.

```bash
npm run build -- --watch
```

Use `npm run dev` when HMR is more useful during heavy UI work.

## Authentication flow (planned)

1. Login → API issues Sanctum token  
2. Token stored client-side (Pinia + persistence)  
3. API client sends `Authorization: Bearer {token}`  
4. 401 → clear session and show login  

Until login UI exists, a personal access token from Artisan is fine for local wiring.
