# Nexus Web — Architecture

## Overview

Nexus Web is a desktop-first Vue 3 SPA — the visual command station for **Nexus Hub**. It is a thin client: persistence and integrations live in `nexus-api`; this app handles presentation, interaction, and client-side state (Pinia).

```
┌──────────────────────────────────────────────────────┐
│                    nexus.test                         │
│  ┌────────────────────────────────────────────────┐  │
│  │              App Shell (layout)                 │  │
│  │  ┌──────────┐  ┌─────────────────────────────┐ │  │
│  │  │ Sidebar  │  │     Active Route View       │ │  │
│  │  │ / Nav    │  │  (Home, Spotify, Cellar, …) │ │  │
│  │  └──────────┘  └─────────────────────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────┘
                           │ axios (JSON + Bearer token)
                           ▼
                  api.nexus.test/api/*
```

Vision and sequencing: [VISION.md](VISION.md), [ROADMAP.md](ROADMAP.md).

## Design Principles

- **Layered client** — `routes → stores → (Pinia Colada) → services → axios → API`.
- **API-driven** — no direct third-party calls from the browser.
- **Pinia for shared state** — auth session, preferences, cross-view data.
- **Desktop-first** — wide screens first; tablet later; mobile is a separate app.

## Folder structure

```
src/
├── routes/                  # Route-level screens (*View.vue)
├── components/<group>/      # Reusable UI (sidebar, page-wrapper, …)
├── stores/<domain>/         # Pinia stores (+ Colada mutations)
├── services/                # <model>.service.ts — axios API calls
├── types/                   # TypeScript types only
├── lib/http.ts              # Shared axios client
└── router/index.ts          # Vue Router + auth guards
```

Data flow (strict):

```
routes/*View.vue → stores → Pinia Colada → services → lib/http.ts → API
```

Screens consume stores only. Stores call services (via Colada for interactive mutations). Never import services from routes/components.

## Layout shell

| Region | Purpose |
|--------|---------|
| Sidebar | Module navigation (`meta.showMenu`) |
| Main content | Active route (`RouterView`) |
| Page toolbar | Title + sidebar toggle (`PageWrapper`) |

`App.vue` shows the sidebar when `route.meta.showMenu` is true, then renders `RouterView`.

## Planned dashboard areas

| Area | Role |
|------|------|
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

**Pinia** holds session and UI state. **Pinia Colada** wraps interactive API mutations/queries whose functions call `*.service.ts`.

| State | Location |
|-------|----------|
| Auth token / session | `auth.store` → `localStorage` (`nexus-auth`) |
| Feature lists/details | Feature stores + Colada |
| UI preferences | `layout.store` / `localStorage` |

## PrimeVue

PrimeVue 4 + Aura is configured in `src/main.ts` with `NexusPreset`. Prefer auto-imported PrimeVue components. Use the design system already in the repo; don’t invent a parallel UI kit per feature.

## Build & delivery

Vite compiles to `dist/`. Nginx serves `nexus-web/dist/`.

```bash
npm run watch   # development → dist/dev
npm run stage   # staging → dist/stage
npm run prod    # production → dist/prod
```

Use `npm run dev` when HMR is more useful during heavy UI work.

## Authentication flow

1. Login → API issues Sanctum personal access token  
2. Token stored client-side (Pinia + `localStorage`)  
3. Axios client sends `Authorization: Bearer {token}`  
4. Router guards: `meta.authed` requires session; `meta.guest` redirects authed users away from login  
5. 401 → clear session and show login  

Boot order: Pinia → PiniaColada → `await auth.initialise()` → router → mount.
