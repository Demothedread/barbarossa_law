# Supabase Migration - Deployment Instructions

## Migration Status: COMPLETE

All data has been migrated from local SQLite to Supabase PostgreSQL.

| Table                 | Rows      | Status |
| --------------------- | --------- | ------ |
| questions             | 2,188     | ✅     |
| question_explanations | 955       | ✅     |
| essay_prompts         | 151       | ✅     |
| users                 | 2         | ✅     |
| user_preferences      | 2         | ✅     |
| quiz_history          | 11        | ✅     |
| **Total**             | **3,309** | **✅** |

**Supabase Project**: `barbarossa` (hrcepttoscyhbntaqema)  
**Region**: us-east-1  
**Database**: PostgreSQL 17

---

## Step 1: Get Your Connection String

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hrcepttoscyhbntaqema/settings/database)
2. Click **"Connect"** button (top right)
3. Select **"Session pooler"** (Port 5432) — required for Render (IPv4-only)
4. Copy the connection string. It looks like:
   ```
   postgresql://postgres.hrcepttoscyhbntaqema:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```
5. Replace `[PASSWORD]` with your database password: `Barpreppers1!`

> **Note**: If you see "Tenant or user not found" errors, the pooler may still be propagating for new projects. Wait 15-30 minutes and try again.

---

## Step 2: Configure Render (Backend)

1. Go to [Render Dashboard](https://dashboard.render.com) → **barbarossa-api** service
2. Navigate to **Environment** → **Environment Variables**
3. Add/update these variables:

| Variable          | Value                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_DB_URL` | `postgresql://postgres.hrcepttoscyhbntaqema:Barpreppers1!@aws-1-us-east-1.pooler.supabase.com:5432/postgres` |
| `SUPABASE_URL`    | `https://hrcepttoscyhbntaqema.supabase.co`                                                                   |
| `SUPABASE_KEY`    | `sb_publishable_mYuEPYf3kgDZDmx2X3ZkgQ_B5RXkhUP`                                                             |

4. **Remove** the old `DATABASE_URL` variable (or leave it as fallback)
5. Click **Save Changes** — Render will auto-redeploy

> The backend code has been updated to check `SUPABASE_DB_URL` first, then fall back to `DATABASE_URL`.

---

## Step 3: Configure Vercel (Frontend)

1. Go to [Vercel Dashboard](https://vercel.com) → **barbarossa-prep** project
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables (all environments: Production, Preview, Development):

| Variable       | Value                                            |
| -------------- | ------------------------------------------------ |
| `SUPABASE_URL` | `https://hrcepttoscyhbntaqema.supabase.co`       |
| `SUPABASE_KEY` | `sb_publishable_mYuEPYf3kgDZDmx2X3ZkgQ_B5RXkhUP` |

4. **Redeploy**: Go to **Deployments** tab → click **...** on latest → **Redeploy**

> The frontend doesn't connect to Supabase directly yet (it uses the API proxy to Render). These vars are for future direct Supabase client usage.

---

## Step 4: Remove Old Render Database

Once everything is verified working on Supabase:

1. Go to [Render Dashboard](https://dashboard.render.com) → **Databases**
2. Find `barbarossa-db` (the PostgreSQL database)
3. Go to **Settings** → **Delete Database**
4. Confirm deletion

> **Important**: Don't delete until you've verified the app works end-to-end with Supabase.

---

## Step 5: Verify

After redeployment, test these endpoints:

```bash
# Health check
curl https://barbarossa-api-a231.onrender.com/api/subjects

# Questions endpoint
curl "https://barbarossa-api-a231.onrender.com/api/questions?n=1&subject=EVIDENCE"

# Frontend
open https://barbarossa-prep.vercel.app
```

---

## What Changed (Code)

All changes are committed and ready to deploy:

### Backend Python files (check `SUPABASE_DB_URL` first):

- `backend/server.py` — Main Flask server
- `backend/db_adapter.py` — Database adapter
- `backend/auth.py` — Authentication
- `backend/init_postgres.py` — Schema initialization
- `backend/app/utils/database.py` — Blueprint utilities

### Deployment configs:

- `render.yaml` — Removed Render DB, added Supabase env vars
- `lunaire-spa/vercel.json` — Added Supabase env vars
- `lunaire-spa/nuxt.config.ts` — Added Supabase runtime config

### New files:

- `lunaire-spa/app/composables/useSupabase.ts` — Vue/Nuxt Supabase client composable
- `scripts/upload_to_supabase.py` — Direct psycopg2 upload script
- `scripts/upload_via_rest.py` — REST API upload script (used for this migration)

---

## Troubleshooting

### "Tenant or user not found"

This almost always means the **pooler shard prefix is stale**, not that the project is down. Supabase's Supavisor pooler assigns each project to a shard host like `aws-0-<region>.pooler.supabase.com`, `aws-1-<region>.pooler.supabase.com`, etc. Supabase can reassign a project to a different shard over time (e.g. during infra rebalancing), which silently breaks any previously-saved connection string.

To fix:
1. Go to [Supabase Dashboard → Project Settings → Database → Connect](https://supabase.com/dashboard/project/hrcepttoscyhbntaqema/settings/database) and copy the **current** Session pooler connection string — do not reuse an old one from docs/notes.
2. Compare the host against what's set in Render (`SUPABASE_DB_URL`). If the shard number (`aws-0` vs `aws-1` vs `aws-2`) differs, update Render's env var and redeploy.
3. As of **2026-07-14**, this project's correct pooler host is `aws-1-us-east-1.pooler.supabase.com` (previously `aws-0-us-east-1.pooler.supabase.com`, which now fails with this exact error).
4. If you don't have dashboard access, you can brute-force discover the correct shard from a machine with network access:
   ```bash
   for i in 0 1 2 3; do
     psql "postgresql://postgres.hrcepttoscyhbntaqema:PASSWORD@aws-$i-us-east-1.pooler.supabase.com:5432/postgres" -c "select 1" && echo "shard $i works"
   done
   ```
5. If NO shard works and the REST API (`https://hrcepttoscyhbntaqema.supabase.co/rest/v1/...` with the anon key) also fails, then the project truly is paused/deleted and needs to be restored from the dashboard first.

If it persists after confirming the shard is current, wait 15-30 minutes for pooler propagation on newly-created projects, and double check your project ref in the connection string.

### "No route to host"

The direct connection uses IPv6 which Render doesn't support. Always use the **session pooler** (port 5432) connection string.

### Connection works locally but not on Render

Make sure you're using the **Session mode** pooler (port 5432), not Transaction mode (port 6543). Session mode is required for Render's IPv4-only infrastructure.

### App can't find tables

Run `python backend/init_postgres.py` — it creates tables idempotently (IF NOT EXISTS).

---

## Architecture After Migration

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel (SPA)   │────▶│  Render (Flask)   │────▶│    Supabase      │
│  barbarossa-prep │     │  barbarossa-api   │     │   PostgreSQL 17  │
│   Nuxt 3 + Vue   │     │  Python + psycopg2│     │   (us-east-1)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
     /api/* proxy          SUPABASE_DB_URL          17 tables + RLS
```
