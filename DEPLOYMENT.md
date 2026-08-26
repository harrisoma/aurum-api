# AURUM API — Railway Deployment Guide

## Production Deployment for AURUM Premium Wealth OS

This guide deploys AURUM API to Railway using proven patterns from Turtle Bot.

---

## Prerequisites

- Railway account (railway.app)
- GitHub repo connected (aurum-api)
- Supabase project set up (with all tables created)
- Environment variables ready

---

## Step-by-Step Deployment

### 1. Create Railway Project

```bash
1. Go to railway.app
2. Click "Create Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select: harrisoma/aurum-api repository
6. Railway auto-detects Dockerfile ✅
```

### 2. Configure Environment Variables

**In Railway Dashboard → Settings → Environment Variables:**

Add all from `.env.example`:

```env
# Supabase
SUPABASE_URL=https://zctunbobkokehcirkjuz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LLM (DeepSeek)
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-eadf40e17f4a4944ae03f05954864d67
DEEPSEEK_MODEL=deepseek-chat

# Plaid (Optional)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox

# Turtle Bot (Trading)
TURTLE_BOT_BROKER_URL=https://broker-production-8564.up.railway.app

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Node
NODE_ENV=production
```

### 3. Configure Service Settings

**In Railway Dashboard → Settings:**

```
Service Name: aurum-api
Dockerfile: Dockerfile (auto-detected)
Start Command: node dist/index.js
Health Check Path: /health
Port: 8080

Resources:
├── Memory: 512 MB
├── CPU: 500m
└── Replicas: 1
```

### 4. Add Public Domain

**In Railway Dashboard → Networking:**

```
✅ Enable Public Domain
   Railway assigns: aurum-api-production-xxx.railway.app

⚠️ Note: Use this domain for mobile app API calls
```

### 5. Deploy

**Option A: Automatic**
```
Push to main branch → Railway auto-deploys
```

**Option B: Manual**
```
1. In Railway dashboard
2. Click "Deploy" button
3. Wait for build to complete (2-3 min)
```

### 6. Verify Deployment

```bash
# Check API is live
curl https://aurum-api-production-xxx.railway.app/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}

# Check API info
curl https://aurum-api-production-xxx.railway.app/
# Should return: {"name":"AURUM API","version":"1.0.0","status":"running",...}
```

---

## Database Setup

All Supabase tables must be created BEFORE deployment:

```sql
-- Run these in Supabase SQL Editor
-- Files in sql/ directory:
- sql/plaid_tables.sql
- sql/crypto_tables.sql
- sql/vaultx_tables.sql
```

Or run setup script:
```bash
npm run init:db
```

---

## Monitoring & Logs

**In Railway Dashboard:**

```
Deployments → View Logs
├── Build logs (shows TypeScript compilation)
├── Runtime logs (shows API startup)
└── Errors (shows 500s, crashes)
```

**Health Check Endpoints:**

```
GET /health
└── Returns: {"status":"ok","timestamp":"..."}

GET /
└── Returns: Full API documentation
```

---

## Troubleshooting

### Build Fails

```bash
# Check build logs in Railway
Error: "Cannot find module 'xyz'"
Fix: npm install (locally), then push to GitHub
```

### API Won't Start

```bash
# Check environment variables in Railway
Error: "SUPABASE_URL not found"
Fix: Add all variables from Step 2
```

### Timeout on Deploy

```bash
# May take 3-5 min on first deploy
Railway shows: "Deploying..."
Wait: It's normal, check logs periodically
```

---

## Cost Estimate (10K users)

```
AURUM API on Railway:
├── Compute: 512MB RAM × 3-5 instances = $15-35/month
├── Bandwidth: Variable
└── Database: Supabase = $25-100/month
Total: ~$50-150/month
```

---

## Next Steps After Deploy

1. ✅ Test API endpoints
2. ✅ Create Supabase tables (if not done)
3. ✅ Build mobile app (pointing to Railway URL)
4. ✅ Add monitoring (Sentry, etc.)

---

## Deployment Checklist

- [ ] GitHub repo ready
- [ ] Dockerfile in place
- [ ] railway.toml configured
- [ ] All env vars set in Railway dashboard
- [ ] Supabase tables created
- [ ] Domain assigned
- [ ] Health check passing
- [ ] API responding
- [ ] Ready for mobile app

---

**Questions?** Check Railway docs: railway.app/docs
