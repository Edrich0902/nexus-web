# Nexus Web — Vision

Nexus Hub is a personal life hub. This Vue app is the desktop command station: it presents integrations, collections, media, and sports context served by `nexus-api`.

Business logic and persistence live in the API. The web client focuses on layout, module UIs, and client state (Pinia). A future mobile app will share the same API — especially for photo-driven cellar and library intake.

## What the Web App Is

A modular dashboard where each Nexus pillar is a feature module under `src/modules/`, routed and navigable from a shared shell.

## Pillars (milestones, not specs)

Same directional milestones as the API. UI work tracks API availability; when a milestone starts, research UX needs, draft a short UI note, then build.

| Milestone | Intent on the web |
|-----------|-------------------|
| **Foundation & Auth** | Shell, router, API client, login, Pinia auth session |
| **Spotify** | Connect flow, listening widgets, stats |
| **GitHub** | Developer activity / repo surfaces |
| **Cellar** | Wine inventory UI (photo intake is mobile-first later) |
| **Library** | Book catalog and reading status |
| **Kitchen** | Recipe browsing and editing |
| **Media vaults** | Browse / manage personal media vaults |
| **Social (e.g. Instagram)** | Optional, if prioritized |
| **Sports & F1** | Schedules, standings, weekend ticker |
| **Mobile app** | Separate client — web may preview or deep-link, not implement camera flows |

## Design Principles

- **Thin client** — no direct third-party API calls from the browser.
- **Module UI** — one folder per pillar; shared shell and design language.
- **Pinia for shared state** — auth, preferences, and cross-view module state.
- **Desktop-first** — optimized for wide screens; tablet later; mobile app separate.
- **Milestone docs stay high-level** — detailed UI specs when work begins.

## Related

- [ROADMAP.md](ROADMAP.md) — ordered UI milestones
- [ARCHITECTURE.md](ARCHITECTURE.md) — shell, modules, API consumption
- API vision: [`../../nexus-api/docs/VISION.md`](../../nexus-api/docs/VISION.md)
