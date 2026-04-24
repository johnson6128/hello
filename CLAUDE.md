# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TODO management web app with two backend implementations and a shared React frontend:

- **Local / Docker**: Express (`server.js`) + better-sqlite3
- **Production (Cloudflare)**: Hono worker (`worker/src/index.ts`) + Cloudflare D1, fronted by a Pages Functions proxy (`functions/api/[[route]].ts`)

## Commands

### Local development

```bash
# Start Express backend (localhost:3000)
npm install && npm start

# Start frontend dev server in a separate terminal (localhost:5173, proxies /api → localhost:3000)
cd client && npm install && npm run dev
```

### Build & type check

```bash
# Type check (run from client/)
cd client && npx tsc --noEmit

# Build frontend (outputs to root public/)
npm run build   # from root, or:
cd client && npm run build
```

### E2E tests (Playwright)

```bash
# Run all tests (uses localStorage mode, no backend needed)
cd client && npm run e2e

# Run a single test by name
cd client && npx playwright test -g "タスクを追加できる"

# Interactive UI mode
cd client && npm run e2e:ui
```

### Cloudflare Worker (production backend)

```bash
cd worker
npm install
npm run dev          # wrangler dev
npm run deploy       # wrangler deploy
npm run db:migrate   # apply schema to local D1
npm run db:migrate:prod  # apply schema to remote D1
```

## Architecture

```
Browser
  ├── / (static assets)  →  Cloudflare Pages  (public/)
  └── /api/*             →  Pages Functions proxy (functions/api/[[route]].ts)
                               └── Cloudflare Workers / Hono (worker/src/index.ts)
                                     └── Cloudflare D1 (SQLite)
```

During local development, Vite dev server proxies `/api/*` to `localhost:3000` (Express), so the same frontend code works against both backends without modification.

### Storage abstraction (`client/src/storage.ts`)

The frontend never calls the API directly from components. All data operations go through `storage.ts`, which switches implementation based on `VITE_STORAGE`:

- `VITE_STORAGE=local` → localStorage (used by e2e tests — no backend needed)
- unset → REST API at `/api/*`

### Data model note

Both backends store `done` as `INTEGER` (0/1) in SQLite/D1 and convert it to a JS boolean in every API response. Keep this conversion consistent when modifying either backend.

### Vite build output

`client/vite.config.ts` sets `build.outDir: '../public'`, so `npm run build` from `client/` writes to the repo-root `public/` directory. This is the directory Wrangler deploys to Cloudflare Pages.

## CI/CD

Pipeline (`.github/workflows/ci.yml`): **build → e2e → deploy**. Deploys only on pushes to `main`. CI also runs on `claude/**` branches.

- `build`: installs deps, type-checks (`tsc --noEmit`), builds frontend, uploads `public/` artifact
- `e2e`: downloads artifact, runs Playwright with `VITE_STORAGE=local` (Chromium only)
- `deploy`: deploys `public/` to Cloudflare Pages (includes `functions/` auto-detection)
- `deploy-worker`: runs `wrangler deploy` from `worker/`

Required GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
