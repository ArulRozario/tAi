# Production Deployment Guide for tAI

This document outlines the step-by-step workflow to deploy **tAI** (Angular Frontend + NestJS/Prisma API Backend) to production using the configurations in `deployment/prod`.

---

## Architecture Overview

```mermaid
graph TD
    Client[User Browser] -->|HTTPS| CF[Cloudflare Pages\nAngular Frontend]
    CF -->|/api/* requests| proxy[_redirects Proxy]
    proxy -->|HTTPS| Render[Render Web Service\nNestJS/Prisma Docker API]
    Render -->|SQL / SSL| DB[PostgreSQL Database]
    Render -->|S3 Protocol| S3[Object Storage\nMinIO / AWS S3 / Cloudflare R2]
    Render -->|API Calls| Gemini[Google Gemini API]
```

The system is split into two primary components:
1. **API Backend**: Dockerized NestJS app running on **Render Web Services** backed by a PostgreSQL database.
2. **Frontend**: Static Angular SPA deployed to **Cloudflare Pages**, with `/api/*` requests proxied to the Render API using a Cloudflare Pages `_redirects` rule.

---

## Step 1: Provision the PostgreSQL Database

Before deploying the API, you must provision a production-grade PostgreSQL database. You can use:
- **Render PostgreSQL** (Managed)
- **Neon.tech** (Serverless PostgreSQL)
- **Supabase** (Managed PostgreSQL)
- **AWS RDS** / **GCP Cloud SQL**

> [!IMPORTANT]
> Ensure the connection string ends with `?sslmode=require` or correct SSL parameters, as production Prisma client requires secure connections.
>
> Save the `DATABASE_URL` (format: `postgresql://user:password@host:port/dbname?sslmode=require`).

---

## Step 2: Deploy the Backend API to Render

You can deploy the API using the provided `render.yaml` Blueprint or set it up manually.

### Option A: Deployment via Blueprint (Recommended)
1. Go to the **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New** -> **Blueprint**.
3. Select your repository.
4. Render will read `deployment/prod/render.yaml` and prompt you to create the services.
5. Provide the manually configured environment variables when prompted.

### Option B: Manual Service Setup
1. Click **New** -> **Web Service**.
2. Select your repository.
3. Configure the following settings:
   - **Name**: `tai-api`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `deployment/prod/Dockerfile.api`
   - **Branch**: `main`
   - **Plan**: `Free` or higher
4. Add the following **Environment Variables** under the **Environment** tab:

| Key | Example / Description | Sync (Blueprint) |
|---|---|---|
| `NODE_ENV` | `production` | Pre-set |
| `DATABASE_URL` | `postgresql://user:pass@host:port/db?sslmode=require` | Manual |
| `JWT_SECRET` | *Generates a secure 32+ char random string* | Manual |
| `CORS_ORIGIN` | `https://tai.pages.dev` *(Your Cloudflare Pages domain)* | Manual |
| `STORAGE_ENDPOINT` | `s3.us-east-1.amazonaws.com` or custom S3 endpoint | Manual |
| `STORAGE_REGION` | `us-east-1` | Manual |
| `STORAGE_ACCESS_KEY` | *Your S3 access key* | Manual |
| `STORAGE_SECRET_KEY` | *Your S3 secret key* | Manual |
| `STORAGE_BUCKET` | `tai-production-assets` | Manual |
| `STORAGE_PUBLIC_URL` | `https://tai-production-assets.s3.amazonaws.com` | Manual |
| `GEMINI_API_KEY` | *Your Google Gemini API Key* | Manual |
| `OLLAMA_ENDPOINT` | *(Optional)* Hosted Ollama endpoint (leave empty if unused) | Manual |

5. Under **Advanced**, configure the **Health Check Path**: `/api/v1/health`.
6. Click **Create Web Service**.

---

## Step 3: Configure GitHub Secrets

Once your Render API is deploying, copy its live URL (e.g. `https://tai-api.onrender.com`). You will now set up the CI/CD pipeline inside your GitHub Repository.

Go to **Repository Settings** -> **Secrets and variables** -> **Actions** and add the following **Repository Secrets**:

| Secret Name | Description / Source |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API Token created in Cloudflare Dashboard with `Pages:Edit` permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID (found on the homepage of your Cloudflare Dashboard). |
| `RENDER_API_URL` | The base URL of your Render API (e.g., `https://tai-api.onrender.com` without a trailing `/`). |
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook URL copied from the **Settings** tab of your Render Web Service. |
| `DATABASE_URL` | The same production PostgreSQL connection string (needed to run migrations/seeds from CI). |

---

## Step 4: Deploy the Frontend and Trigger Pipeline

1. **Commit and push** any changes (like the `.gitignore` or this deployment guide) to the `main` branch.
2. The GitHub Action **CI** workflow will run first to run checks, tests, and building.
3. Upon success, the **Deploy** workflow (`.github/workflows/deploy.yml`) will automatically trigger:
   - It will run a curl request to `RENDER_DEPLOY_HOOK_URL` to deploy the backend API.
   - It will compile the production Angular bundle (`pnpm nx build frontend --configuration=production`).
   - It will inject a Cloudflare proxy rule `_redirects` file forwarding `/api/*` to `RENDER_API_URL/api/:splat`.
   - It will deploy the static files to **Cloudflare Pages** via Wrangler under a project named `tai`.

---

## Step 5: Seed the Production Database (First-Time Setup)

The API container runs `npx prisma migrate deploy` automatically on startup to apply schema changes. However, you need to create the initial admin user to log in.

1. Go to the **Actions** tab of your GitHub repository.
2. Under **Workflows** in the sidebar, select **Seed Production DB**.
3. Click the **Run workflow** dropdown on the right.
4. Input a reason (e.g., `first deploy`) and click **Run workflow**.

> [!WARNING]
> This creates a default admin account with:
> - **Email**: `admin@tai.app`
> - **Password**: `ChangeMe123!`
> 
> You **MUST** log in immediately upon deployment and change the password from the profile page.

---

## Step 6: Post-Deployment Verification

1. Visit your Cloudflare Pages domain (e.g., `https://tai.pages.dev`).
2. Verify you can load the login screen.
3. Log in with the default admin account:
   - **Email**: `admin@tai.app`
   - **Password**: `ChangeMe123!`
4. Go to **Settings/Profile** and update your credentials immediately.
5. Create a test translation project and upload a document to verify that database, file storage, and Gemini API keys are working flawlessly.
