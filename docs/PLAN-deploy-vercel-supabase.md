# PLAN-deploy-vercel-supabase

> Deployment strategy for **NEO-EDU** using Vercel (Frontend + API) and Supabase (PostgreSQL).

---

## 🚀 Goal

Deploy the full-stack Next.js application to **Vercel** with a Production **PostgreSQL** database on **Supabase**.

---

## 📋 Prerequisites

| Service | Requirement | Status |
|---------|-------------|--------|
| **Vercel** | Account created & GitHub connected | ⬜ |
| **Supabase** | Account created & Project ready | ⬜ |
| **GitHub** | Code pushed to remote repository | ⬜ |

---

## 1. Supabase Setup (Database)

1.  **Create Project**:
    -   Go to [Supabase Dashboard](https://supabase.com/dashboard) -> New Project.
    -   Name: `neo-edu-prod` (example).
    -   Region: Singapore (or closest to Vietnam: `ap-southeast-1`).
    -   Set a **Strong Password**.

2.  **Get Connection Strings** (Settings -> Database):
    -   **Transaction Mode (Recommended)**: Use port `6543`.
        -   `DATABASE_URL="postgres://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"`
    -   **Direct Connection**: Use port `5432`.
        -   `DIRECT_URL="postgres://postgres.[ref]:[password]@aws-0-ap-southeast-1.supabase.co:5432/postgres"`

3.  **Update Prisma Schema** (Recommended for Serverless):
    -   Add `directUrl` to datasource in `prisma/schema.prisma` if not present.
    ```prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }
    ```
    *(Note: Your current schema only has `url`. We should add `directUrl` for better stability on Vercel).*

---

## 2. Environment Variables Audit

Prepare these values for Vercel Project Settings:

| Variable | Description | Value Source |
|----------|-------------|--------------|
| `DATABASE_URL` | Pooled Connection String | Supabase |
| `DIRECT_URL` | Direct Connection String | Supabase |
| `NEXTAUTH_SECRET` | Auth Encryption Key | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://neo-edu.vercel.app` (after deploy) |
| `GOOGLE_CLIENT_ID` | OAuth ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret | Google Cloud Console |
| `OPENAI_API_KEY` | AI Features | OpenAI Dashboard |

---

## 3. Vercel Deployment

1.  **Import Project**:
    -   Go to [Vercel Dashboard](https://vercel.com/new).
    -   Import `neo-next` repository.
    -   Framework Preset: **Next.js**.

2.  **Configure Project**:
    -   **Build Command**: `next build` (default).
    -   **Install Command**: `npm install` (default).
    -   **Root Directory**: `./` (default).

3.  **Add Environment Variables**:
    -   Copy/Paste the variables from Step 2.

4.  **Deploy**:
    -   Click **Deploy**.
    -   Wait for build to complete (~2-3 mins).

---

## 4. Post-Deployment Verification

### Database Migration
Vercel build does *not* automatically migrate the DB by default unless configured.
**Option A: Manual Migration (Best for first time)**
Run locally against production DB:
```bash
# In your local terminal
export DATABASE_URL="<Production_Supabase_String>"
npx prisma db push
```

**Option B: Build Command Override**
Change Vercel Build Command to:
```bash
npx prisma generate && npx prisma db push && next build
```

### Checklist
- [ ] **Home Page**: Loads without error.
- [ ] **Auth**: Login with Google works.
- [ ] **Database**: Data fetches correctly (e.g., Quick Exams).
- [ ] **AI**: Chat feature responds.

---

## ⚠️ Known Issues / Watchlist

1.  **Linting Errors**: `npm run lint` failed locally. Vercel *will fail the build* if lint errors exist.
    -   **Fix**: Set `eslint.ignoreDuringBuilds: true` in `next.config.ts` OR fix the lint errors.
    -   *Recommendation*: We found ~75 lint errors. We should temporarily ignore them to unblock deployment if you are in a rush.

2.  **Security**: `npm audit` found issues.
