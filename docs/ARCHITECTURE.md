# Nexus Web — Architecture

## Overview

Nexus Web is a desktop-first Vue 3 SPA — the visual command station for **Nexus Hub**. It is a thin client: persistence and integrations live in `nexus-api`; this app handles presentation, interaction, and client-side state (Pinia).

```
┌──────────────────────────────────────────────────────┐
│ nexus.test                       ambient colour wash │
│  ┌────────────────────────────────────────────────┐  │
│  │ NxTopBar   section · ⌘K search · avatar        │  │
│  ├────────────────────────────────────────────────┤  │
│  │ Active route view (template + kit components)  │  │
│  │   stage → fields (bento) → toolbar → content   │  │
│  ├────────────────────────────────────────────────┤  │
│  │ NxDock     floating dock + Spotify mini player │  │
│  └────────────────────────────────────────────────┘  │
│  NxCommandPalette (⌘K) — navigation + global search  │
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
- **Desktop-first, phone-ready** — wide screens first, every view also works at 390px; the native mobile app reuses the same tokens and patterns.

## Folder structure

```
src/
├── design/                  # Design system: tokens, theme.css, ambient engine,
│   ├── components/          #   Nx* kit (stage, fields, panels, rows, shell)
│   ├── templates/           #   Index / Detail / Stats / Workbench page templates
│   └── command/             #   ⌘K command palette sources
├── routes/<area>/           # Route screens (*View.vue) + area-only components/helpers
├── components/nexus-*/      # Shared feature components (image, Spotify player, …)
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

Design-system components are prefixed **`Nx`** and live in `src/design/`. Shared feature components (media, Spotify player, diff viewer) keep the **`Nexus`** prefix in `src/components/`. Components used by a single area live next to its views in `src/routes/<area>/` (e.g. `routes/f1/F1Weekend.vue`, `routes/github/PullRow.vue`).

## Layout shell

| Region | Component | Purpose |
|--------|-----------|---------|
| Top bar | `NxTopBar` | Section name, ⌘K search trigger, account avatar menu |
| Page | `RouterView` | Active route, built from a page template |
| Dock | `NxDock` | Floating destination dock (grouped), Spotify mini player split; phone tab bar + "More" sheet on small screens |
| Command palette | `NxCommandPalette` | ⌘K / Ctrl+K — navigation, actions (e.g. pause music) and global search via `/v1/search` |

`App.vue` renders the shell when `route.meta.shell` is true (all authed routes); the login screen opts out. Destinations, dock groups and phone tabs are data in `src/design/navigation.ts`, so the dock, palette and a future mobile tab bar share one list.

## Account area

| Path | Purpose |
|------|---------|
| `/profile` | Edit display name (email read-only for now) |
| `/profile/sessions` | List / revoke active Sanctum device sessions |

Entry: top bar avatar menu or ⌘K → Profile. Details and Sessions are pill-nav tabs inside the profile area.

## Planned dashboard areas

| Area | Role |
|------|------|
| **Home** | Cross-module summary / entry points |
| **Spotify** | OAuth connect, Connect remote player, listening aggregates, Home resume widget |
| **GitHub** | OAuth connect, repo overview, PR inbox/detail/diffs, create & merge |
| **Food & Drink** | Hub dashboard, pairings, suggestions |
| **Cellar** | Wine drinking journal |
| **Kitchen** | Recipe discover + saved recipes |
| **Beer** | Beer log + brewery links |
| **Library** | Book shelf at `/library` |
| **Media vaults** | Cloudinary-backed vault at `/media`; `NexusImageUploader` + media-aware `NexusImage` |
| **Social** | Optional (e.g. Instagram) |
| **F1 / Sports** | Sports schedules + F1 historical calendar, standings, session analysis, post-session track replay |

Exact widgets are defined when each milestone is specified.

## State management

**Pinia** holds session and UI state. **Pinia Colada** wraps interactive API mutations/queries whose functions call `*.service.ts`.

| State | Location |
|-------|----------|
| Auth token / session | `auth.store` → `localStorage` (`nexus-auth`) |
| Feature lists/details | Feature stores + Colada |
| UI preferences | `layout.store` / `localStorage` |

## Design system

The UI follows `design/mockups/nexus-combined.html`: an ambient colour wash per section, an editorial serif "stage", colour-field bento summaries, hairline lists, command-first navigation and a floating dock.

### Tokens and theme

- **`src/design/tokens.ts`** is the source of truth (colours, sections, type scale, spacing, radii, motion, breakpoints). It is plain data so the mobile app can import or mirror it.
- **`src/design/theme.css`** exposes tokens as CSS custom properties:
  - Ambient: `--amb`, `--amb-2`, `--acc`, `--ink`, derived `--ink-2/3/4`, `--line`, `--line-strong`, `--tint`, `--tint-2`, `--surface`, `--surface-2`.
  - Status: `--ok`, `--bad`, `--warn`. Radii: `--r-xs … --r-xxl`. Fonts: `--font-sans`, `--font-serif`, `--font-display`, `--font-mono`.
  - `--ink-3` (secondary text) is tuned to stay ≥ 4.5:1 on every section ambient; `--ink-4` is for decoration only (icons, empty stars, rails), never for text.
- Use the custom properties in components. Do not hard-code palette hex values except for genuine brand/data colours (team colours, tyre compounds, language dots).
- **PrimeVue 4** runs on `NexusPreset` (`src/theme/nexus-preset.ts`, built on Aura) which maps PrimeVue's semantic tokens onto the ambient variables, so Buttons, Dialogs, Selects and DataTables follow the section colour automatically.
- Icons are **Lucide** via `NxIcon` and the named registry in `src/design/icons.ts` (names usable from data, e.g. route meta and palette entries). PrimeIcons is not installed.

### Ambient colour

- Each route belongs to a **section** (`sections` in `tokens.ts`); `sectionForPath` picks it and `applyAmbient` cross-fades the CSS variables (900 ms, disabled under `prefers-reduced-motion`).
- `useAmbient(source)` lets a view override the section ambient (e.g. F1 team colours).
- `usePaletteAmbient(urlGetter, fallback?)` tints the page from an image's palette (wine label, book cover, album art). Palettes are extracted by the API **in a queued job**, so a queue worker must be running (`php artisan queue:work`) or views fall back to the section ambient.
- `inkFor` / `contrastRatio` in `src/design/color.ts` choose readable ink on arbitrary colour fields.

### Page templates (`src/design/templates/`)

| Template | Use for | Slots |
|----------|---------|-------|
| `IndexTemplate` | Area home / lists | `stage`, `fields`, `toolbar`, default, `empty`, `error`, `loading` |
| `DetailTemplate` | One item (wine, book, PR) | `stage`, default (main), `aside` (420px column), `error`, `loading`; `backTo` link |
| `StatsTemplate` | Analysis pages | `stage`, `range`, `summary`, `fields`, default (two-column panel grid; `.wide` spans) |
| `WorkbenchTemplate` | Two-pane tools | `header`, `rail`, default |

Every template takes a `state: 'loading' | 'ready' | 'empty' | 'error'` and renders matching skeletons (`NxSkeletonStage`, `NxSkeletonFields`, `NxSkeletonRows`, `NxSkeletonStream`) and empty/error states.

### Kit (`src/design/components/`)

- **Stage:** `NxStage` — eyebrow (optional live dot), serif title with italic accent, lede, actions, artwork (`art="square" | "portrait"`, `size="hero" | "compact"`).
- **Fields:** `NxBento` + `NxField` (solid / tint / outline colour fields with value, sub, progress rail, pips); `CollectionFields` (`routes/collections`) maps simple field data to a section's colours.
- **Content:**
  - `NxPanel` (surface or flush) and `NxSectionHeader`.
  - `NxFacts`, `NxMeters`, `NxHourBars`, `NxRankList`, `NxChips`.
  - `NxStream` / `NxStreamGroup` / `NxStreamItem` (timeline).
  - `NxCoverGrid` / `NxCoverCard`, `NxRating`.
- **Controls:**
  - `NxPillNav` (route tabs) and `NxPillGroup` (local segmented filter).
  - `NxSearchField` (debounced), `NxIconButton` (icon + required accessible label), `NxEmptyState`.

`/design` (authed) is a live gallery of tokens, fields and kit components.

### Conventions

- One headline per page in the stage; numbers go in fields; lists are hairline rows, not cards.
- Phone layout (≤ 640px) is verified for every view: no horizontal page overflow; wide data (tables, diffs, calendars) scrolls inside its own container.
- Icon-only buttons need an accessible label (`NxIconButton` enforces it). Status is never conveyed by colour alone — pair dots with text.
- Charts: prefer kit primitives (`NxHourBars`, `NxMeters`, stacked bars) over Chart.js; `NexusChart` (lazy-loaded Chart.js, themed by `chartChrome`) remains for doughnuts and multi-series.

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
