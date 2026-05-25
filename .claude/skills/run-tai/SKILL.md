---
name: run-tai
description: Run, start, build, screenshot, test, launch, or drive the tAI Translation Platform — Angular frontend and NestJS API
---

# run-tai — tAI Translation Platform

tAI is an Angular 21 + NestJS Nx monorepo. The frontend (port 4200) and API (port 3000) are both dev-server processes; PostgreSQL, MinIO, and Ollama run via Docker Compose. For agent interaction, drive the live frontend with `chromium-cli` (`mcp__plugin_playwright_playwright__*` tools).

All paths below are relative to the repo root (`/home/arul-rozario/Projects/tAI`).

---

## Prerequisites

```bash
# Node + pnpm (already installed via nvm)
node --version   # v24.x
pnpm --version   # 10.x

# Docker for infrastructure services
docker --version
```

No additional `apt-get` installs were needed for local development.

---

## Setup — first time only

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (postgres, minio, ollama)
docker compose up -d

# 3. Generate Prisma client
pnpm nx run api:prisma-generate

# 4. Run migrations
pnpm nx run api:prisma-migrate

# 5. Seed the database with users and sample data
node -r @swc-node/register apps/api/prisma/seed.ts
```

After seeding, these accounts exist:

| Email | Password | Role |
|---|---|---|
| `admin@tai.local` | `admin123` | ADMIN |
| `master@tai.local` | `master123` | MASTER |
| `reviewer@tai.local` | `reviewer123` | REVIEWER |

The seed also creates a Tamil Bible project with pages and a style guide.

---

## Run (agent path)

### Step 1 — Start infrastructure

```bash
docker compose up -d
```

### Step 2 — Start the API (NestJS on port 3000)

```bash
pnpm nx serve api &
```

Wait until ready:
```bash
until curl -s http://localhost:3000/api/v1/health | grep '"db":"ok"' >/dev/null; do sleep 2; done
echo "API ready"
```

The health endpoint returns: `{"status":"ok","db":"ok","minio":"ok","ollama":"ok","anthropic":"not_configured"}`

### Step 3 — Start the frontend (Angular on port 4200)

```bash
pnpm nx serve frontend --configuration=development &
```

Wait until ready:
```bash
until curl -s http://localhost:4200/ | grep '<html' >/dev/null; do sleep 2; done
echo "Frontend ready"
```

### Step 4 — Drive with Playwright MCP tools

Navigate and log in:

```
mcp__plugin_playwright_playwright__browser_navigate  url=http://localhost:4200
mcp__plugin_playwright_playwright__browser_fill_form fields=[
  {target: "input[type=email]", name: "Email", type: "textbox", value: "admin@tai.local"},
  {target: "input[type=password]", name: "Password", type: "textbox", value: "admin123"}
]
mcp__plugin_playwright_playwright__browser_click  target="button[type=submit]"
```

After login you land on `/dashboard`. Key routes:

| Route | What it shows |
|---|---|
| `/dashboard` | Activity summary, recent projects |
| `/projects` | List of translation projects |
| `/projects/:id` | Project detail + pages list |
| `/workbench/:pageId` | Translation workbench (side-by-side source/target) |
| `/review/:pageId` | Reviewer workbench (same component, queue mode) |
| `/queue` | Reviewer queue |
| `/style-guides` | Style guide list |
| `/admin/users` | User management (ADMIN/MASTER only) |
| `/admin/settings` | System settings (ADMIN/MASTER only) |

Take a screenshot at any point:
```
mcp__plugin_playwright_playwright__browser_take_screenshot  type=png  filename=screenshot.png
```

---

## API smoke test (no browser needed)

```bash
# Health
curl -s http://localhost:3000/api/v1/health

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tai.local","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

# List projects
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/projects
```

---

## Run (human path)

```bash
docker compose up -d
pnpm nx serve api &
pnpm nx serve frontend --configuration=development
# Browser opens to http://localhost:4200
```

---

## Tests

```bash
# API unit tests
pnpm nx test api

# Frontend unit tests  
pnpm nx test frontend
```

---

## Gotchas

- **`mustChangePassword: true` on seeded admin** — The UI may prompt to change password on first login. This flag is set by the seed. It doesn't block login; the API still returns an access token.

- **API builds before serve** — `pnpm nx serve api` runs `tsc` every time (via `@nx/js:tsc` → `@nx/js:node`). First startup takes ~20–30 seconds.

- **Angular cold start is slow** — First `pnpm nx serve frontend` compile takes 30–60 seconds; subsequent hot-reloads are fast.

- **Ollama not required for basic UI** — The health endpoint reports `ollama` but the app runs fine without it for most flows. AI translation features will fail without a running model.

- **MinIO bucket must exist** — The `tai-docs` bucket is created automatically by the API on first startup (via the MinIO init code). If you wipe MinIO data, restart the API to re-create it.

- **Proxy config** — The Angular dev server proxies `/api/*` → `http://localhost:3000`. Do not call the API on port 3000 directly from the browser in dev; use `http://localhost:4200/api/...`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ECONNREFUSED 12000` on API startup | Run `docker compose up -d` first |
| `Cannot find module '@prisma/client'` | Run `pnpm nx run api:prisma-generate` |
| Login returns 401 with seeded credentials | Database wasn't seeded. Run `node -r @swc-node/register apps/api/prisma/seed.ts` |
| Frontend shows blank page / CORS error | Ensure API is on port 3000 and started before the frontend |
| `tai-frontend` Docker container restarting | That's a production container — ignore it; use `pnpm nx serve frontend` for dev |
