# Deployment Guide

This guide explains how to deploy Barbarossa Law Quiz with:

- **Frontend**: Vercel (static site)
- **Backend**: Render (Flask API)
- **Database**: Render PostgreSQL (free tier)

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────────┐
│   Vercel CDN    │      │    Render           │
│   (Frontend)    │─────▶│    (Flask API)      │
│   src/*.html    │      │    backend/         │
└─────────────────┘      └─────────┬───────────┘
                                   │
                         ┌─────────▼───────────┐
                         │  Render PostgreSQL  │
                         │  (Free 256MB)       │
                         └─────────────────────┘
```

## Quick Deploy

### Option 1: Render Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/blueprints)
2. Click "New Blueprint Instance"
3. Connect your GitHub repo: `Demothedread/barbarossa_law`
4. Render will auto-detect `render.yaml` and create:
   - Web service: `barbarossa-api`
   - PostgreSQL database: `barbarossa-db`
5. After deploy, set `OPENAI_API_KEY` in service environment

### Option 2: Manual Setup

#### Backend on Render

1. Create PostgreSQL database:

   - Name: `barbarossa-db`
   - Region: Oregon
   - Plan: Free

2. Create Web Service:

   - Name: `barbarossa-api`
   - Environment: Python 3.11
   - Build: `pip install -r backend/requirements.txt`
   - Start: `cd backend && python init_postgres.py && gunicorn server:app --bind 0.0.0.0:$PORT`

3. Set environment variables:
   ```
   DATABASE_URL=<from postgres instance>
   OPENAI_API_KEY=<your key>
   FRONTEND_URL=https://your-app.vercel.app
   ```

#### Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import GitHub repo: `Demothedread/barbarossa_law`
3. Configure:
   - Framework: Other
   - Output Directory: `src`
   - Build Command: (leave empty)
4. Deploy!

## Environment Variables

### Backend (Render)

| Variable         | Required | Description                                       |
| ---------------- | -------- | ------------------------------------------------- |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string (auto-set by Render) |
| `OPENAI_API_KEY` | No       | Enables AI explanations and question generation   |
| `FRONTEND_URL`   | No       | CORS allowed origin for your frontend             |
| `FLASK_ENV`      | No       | Set to `production`                               |

### Frontend (Vercel)

The frontend uses `vercel.json` to proxy API requests. No environment variables needed.

## Database Migration

When deploying for the first time, the `init_postgres.py` script automatically:

1. Creates all required tables
2. Imports questions from `qa.csv`

To manually initialize:

```bash
export DATABASE_URL="postgres://..."
python backend/init_postgres.py
```

## Local Development

```bash
# Start everything locally
npm start

# This runs:
# - Flask API on port 5001 (uses SQLite)
# - Static server on port 3000
```

## Free Tier Limits

### Render

- **Web Service**: 750 hours/month (sleeps after inactivity)
- **PostgreSQL**: 256MB, expires after 90 days
- Tip: Consider upgrading to Starter ($7/mo) for persistent database

### Vercel

- **Bandwidth**: 100GB/month
- **Deployments**: Unlimited
- **Functions**: 100GB-hours/month

## Troubleshooting

### API returns 403

- Check CORS configuration in `server.py`
- Ensure `FRONTEND_URL` is set correctly on Render

### Database connection fails

- Verify `DATABASE_URL` is set
- Check if database exists and hasn't expired (free tier: 90 days)

### AI features not working

- Set `OPENAI_API_KEY` in Render dashboard
- Check API key is valid and has credits

## Updating Deployment

### Backend

Push to `main` branch → Render auto-deploys

### Frontend

Push to `main` branch → Vercel auto-deploys

## Custom Domain

1. Add domain in Vercel project settings
2. Update DNS records as instructed
3. Update `FRONTEND_URL` on Render to match new domain
