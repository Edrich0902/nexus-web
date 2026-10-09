# Nexus Web — Vision

Nexus Hub is a personal life hub. This Vue app is the desktop command station: it presents integrations, collections, media, and sports context served by `nexus-api`.

Business logic and persistence live in the API. The web client focuses on layout, module UIs, and client state (Pinia). A future mobile app will share the same API — especially for photo-driven cellar and library intake.

## What the Web App Is

A modular dashboard where each Nexus pillar is a route area under `src/routes/`, backed by `services` + Pinia stores, and reachable from a floating dock and the ⌘K command palette.

## How it should feel

- **Ambient** — every area has its own colour, and the page tints itself from what you are looking at (a wine label, a book cover, the album playing).
- **Editorial** — each page leads with one serif headline that says what matters now ("Norris wins", "3 pull requests open"), then colour-field summaries, then calm hairline lists.
- **Command-first** — ⌘K reaches any area, action or record; the dock is for the handful of places you visit daily.
- **One language, two clients** — tokens, sections, icon names and page patterns are plain data in `src/design/`, so the mobile app can reproduce the same look natively.

## Pillars (milestones, not specs)

Same directional milestones as the API. UI work tracks API availability; when a milestone starts, research UX needs, draft a short UI note, then build.

| Milestone | Intent on the web |
|-----------|-------------------|
| **Foundation & Auth** | Shell, router, API client, login, Pinia auth session |
| **Spotify** | Connect flow, listening widgets, stats |
| **GitHub** | Developer activity / repo surfaces |
| **Food & Drink** | Hub, pairings, home pulse |
| **Cellar** | Wine journal UI (photo intake mobile-later) |
| **Kitchen** | Recipe discover + saved library |
| **Beer** | Beer log + brewery linking |
| **Library** | Book shelf + Open Library match |
| **Media vaults** | Browse / manage personal media vaults |
| **Social (e.g. Instagram)** | Optional, if prioritized |
| **Sports & F1** | Schedules, standings, weekend ticker |
| **Mobile app** | Separate client — web may preview or deep-link, not implement camera flows |

## Design Principles

- **Thin client** — no direct third-party API calls from the browser.
- **Module UI** — one folder per pillar; shared shell and design language.
- **Pinia for shared state** — auth, preferences, and cross-view module state.
- **Desktop-first, phone-ready** — optimised for wide screens, verified at phone width; the native app reuses the design tokens.
- **Accessible by default** — readable contrast on every ambient, labelled controls, reduced motion respected.
- **Milestone docs stay high-level** — detailed UI specs when work begins.

## Related

- [ROADMAP.md](ROADMAP.md) — ordered UI milestones
- [ARCHITECTURE.md](ARCHITECTURE.md) — shell, modules, API consumption
- API vision: [`../../nexus-api/docs/VISION.md`](../../nexus-api/docs/VISION.md)
