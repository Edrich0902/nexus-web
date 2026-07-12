# Nexus Web — Roadmap

UI milestones for Nexus Hub, aligned with [`nexus-api/docs/ROADMAP.md`](../../nexus-api/docs/ROADMAP.md). These are **directional markers**, not pixel-level or component-level specs.

When a milestone becomes active: confirm which API endpoints exist (or are landing), sketch the views/widgets needed, then implement. Vision context: [VISION.md](VISION.md).

---

## Milestone 0 — Foundation (current)

Application skeleton and dashboard shell.

**Done**

- [x] Vue 3 + Vite + TypeScript project scaffold
- [x] PrimeVue 4 + Aura theme configured
- [x] Production build served via nginx at `nexus.test`

**Still open — do early, before feature modules**

- [x] Vue Router — flat routes + `meta` auth guards (`authed` / `guest` / `showMenu`)
- [x] Pinia + Pinia Colada (auth session, layout at minimum)
- [x] Axios API client + `*.service.ts` layer
- [x] Auth / login view against Sanctum bearer tokens
- [x] Dashboard layout shell (sidebar + `RouterView`)
- [x] Home view with placeholder content

---

## Milestone 1 — Spotify

**Intent:** Connect Spotify via the API OAuth flow and visualize listening data.

At kickoff: match whatever the API exposes (status, recent, tops, stats) and design widgets around that — not a fixed widget list written years ahead.

Rough expectations:

- Connect / disconnect / sync status
- Recent plays and top artists/tracks (or equivalent)
- Simple listening stats where the API provides them

---

## Milestone 2 — Collections (Cellar, Library, Kitchen)

**Intent:** Rich CRUD and browse UIs for owned collections.

- **Cellar** — inventory, detail, stock adjustments, drinking-window cues
- **Library** — catalog, reading status, ratings/notes
- **Kitchen** — recipes and related content

Photo / camera intake belongs to the **mobile app**; web may show images and support manual add/edit.

---

## Milestone 3 — Developer & social integrations

- **GitHub** — dashboard surfaces for personal developer context once API data exists
- **Instagram (optional)** — only if prioritized and API-backed

---

## Milestone 4 — Media vaults

Browse and manage personal media vaults once storage and API shape are defined.

---

## Milestone 5 — Sports & F1

Race/season views, standings, and a compact weekend / live ticker on the home shell when feeds exist.

---

## Suggested sequencing

```
Shell + Auth
    → Spotify
    → Cellar / Library / Kitchen
    → GitHub (and other integrations as needed)
    → Media vaults
    → Sports / F1
```

Auth and the layout shell should land before private module UIs. Module order can shift with API priority.

---

## Cross-cutting (anytime)

| Item | Notes |
|------|--------|
| Loading / empty / error states | Every module |
| Sync / connection indicators | Integrations |
| Consistent nav & theming | Shell |
| Responsive polish | Desktop-first; tablet before dedicated mobile app |

---

## Out of web scope

- Camera / barcode capture for cellar & library
- Mobile push notifications
- Native on-the-go logging

Those belong to the future mobile client consuming the same API.

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-11 | `build --watch` over Vite-through-nginx HMR | Nginx serves `dist/`; simple host workflow |
| 2026-07-11 | PrimeVue Aura | Capable component set for a dense dashboard |
| 2026-07-11 | Module folder structure | Mirrors API domains |
| 2026-07-12 | Pinia as planned state layer | Auth + shared hub state across modules |
| 2026-07-12 | Roadmaps stay milestone-level | Spec UI when the milestone starts |
| 2026-07-12 | Expanded vision pillars | GitHub, media vaults, optional Instagram, mobile photo intake |
