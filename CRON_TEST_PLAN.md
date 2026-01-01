# 🧪 CRON JOB AUTO UPDATE TEST

## 📋 Test Setup:

**Date:** Jan 1, 2026
**Current Time:** 14:46 Myanmar Time (UTC 08:16)
**Test Schedule:** Every 15 minutes

## ⚙️ Changes Made:

### `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-prediction",
      "schedule": "*/15 * * * *" // ⚠️ TEST ONLY!
    }
  ]
}
```

**Original Schedule:** `"5 0 * * *"` (Daily at UTC 00:05 = Myanmar 6:35 AM)
**Test Schedule:** `"*/15 * * * *"` (Every 15 minutes)

## 🚀 Testing Steps:

### 1️⃣ Deploy to Vercel:

```bash
git add .
git commit -m "test: temporary cron schedule for testing"
git push
```

### 2️⃣ Wait for Next Cron Run:

- Cron will run at: **:00, :15, :30, :45** of every hour
- Next run: **15:00 Myanmar Time** (in ~14 minutes)

### 3️⃣ Check Results:

#### A. Vercel Logs:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click "Logs" tab
4. Filter: `/api/cron/daily-prediction`
5. Look for logs at **15:00, 15:15, 15:30**

#### B. Database:

1. Go to Supabase Dashboard
2. Open `predictions` table
3. Check for new rows with `createdAt` around **15:00, 15:15, 15:30**

#### C. Website:

1. Go to `/predict` page
2. Check if prediction updates every 15 minutes
3. Check `/history` page for multiple predictions

### 4️⃣ Verify Auto Update:

- ✅ New prediction appears automatically
- ✅ No manual button click needed
- ✅ All users see the same prediction
- ✅ History shows multiple predictions

## ⚠️ IMPORTANT: Restore Original Schedule!

After testing (within 1 hour), **RESTORE** the original schedule:

### `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-prediction",
      "schedule": "5 0 * * *" // Daily at Myanmar 6:35 AM
    }
  ]
}
```

Then deploy:

```bash
git add vercel.json
git commit -m "restore: daily cron schedule"
git push
```

## 📊 Expected Results:

### Success Indicators:

- ✅ Vercel logs show cron execution every 15 minutes
- ✅ Database has new predictions every 15 minutes
- ✅ Website auto-updates without manual intervention
- ✅ All users see the same prediction

### If It Fails:

- ❌ Check Vercel logs for errors
- ❌ Check `CRON_SECRET` environment variable
- ❌ Check `/api/cron/daily-prediction` endpoint manually
- ❌ Check database connection

## 🎯 Conclusion:

After 1 hour of testing:

- If successful → Cron job works! ✅
- Restore original schedule
- Production will auto-update daily at 6:35 AM Myanmar time

---

**Test Start:** Jan 1, 2026 - 14:46 Myanmar Time
**Test Duration:** 1 hour (4 cron runs)
**Test End:** Jan 1, 2026 - 15:46 Myanmar Time
