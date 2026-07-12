# Nexus Web — Development Guide

## Prerequisites

- Node.js 20+ on the host
- Laradock nginx running (serves `dist/`)
- Host entry: `127.0.0.1 nexus.test`
- API available at `http://api.nexus.test`

## Install & Build

```bash
cd nexus-web
npm install
npm run typecheck   # vue-tsc
npm run prod        # typecheck + production build → dist/prod
```

Open [http://nexus.test](http://nexus.test).

## Watch Mode (recommended)

Per the Nexus infrastructure strategy, Vite runs on the **host machine** — not inside Docker:

```bash
npm run build -- --watch
```

Each save rebuilds `dist/`. Refresh the browser to pick up changes.

## Dev Server with HMR (alternative)

For rapid UI iteration with hot module replacement:

```bash
npm run dev
```

Vite dev server runs on `http://localhost:5173` by default. This bypasses nginx. Configure a proxy to the API if needed:

```js
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://api.nexus.test',
    },
  },
})
```

## Nginx Routing

Configured in `laradock/nginx/sites/nexus.test.conf`:

- Document root: `/var/www/nexus-web/dist`
- SPA fallback: all routes serve `index.html`

After nginx config changes:

```bash
cd laradock
docker compose restart nginx
```

## Adding Dependencies

Foundation packages are already installed (`vue-router`, `pinia`, `@pinia/colada`, `axios`). See [ARCHITECTURE.md](ARCHITECTURE.md) for the layering rules.

PrimeVue components are auto-imported via `unplugin-vue-components` — no global registration needed beyond the config in `main.ts`.

## Adding a New Feature Area

Before scaffolding: confirm the matching API milestone is underway (see [VISION.md](VISION.md) / [ROADMAP.md](ROADMAP.md)). Then:

1. Add types under `src/types/<feature>/`
2. Add `src/services/<feature>.service.ts` for API calls
3. Add `src/stores/<feature>/<feature>.store.ts` (+ Colada mutations as needed)
4. Add screen(s) under `src/routes/<feature>/`
5. Register the route in `src/router/index.ts` with correct `meta`
6. Add a sidebar nav item in `AppSidebar`
7. Build and verify at `nexus.test/{path}`

## PrimeVue Theming

Aura theme is set in `src/main.ts`. To customize:

```js
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
})
```

PrimeIcons are available after importing:

```js
import 'primeicons/primeicons.css'
```

## Environment Variables

Create `.env` in `nexus-web/` when API integration begins:

```dotenv
VITE_API_BASE_URL=http://api.nexus.test
```

Access in code via `import.meta.env.VITE_API_BASE_URL`.

## Git

This repo is independent from `nexus-api`:

```bash
git remote -v
# origin  git@github.com:Edrich0902/nexus-web.git
```

Commit and push from `nexus-web/` only.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page at nexus.test | Run `npm run build` — nginx serves `dist/`, not `src/` |
| Stale assets after edit | Ensure `--watch` is running; hard-refresh browser |
| API CORS errors | Configure CORS in Laravel (`config/cors.php`) when calling API from Vite dev server |
| 404 on client routes | Nginx SPA fallback must be configured (already in place) |
