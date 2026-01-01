# 🚀 Cron Job Setup Guide

## ⚠️ Vercel Hobby Plan Limitation:

- **1 cron job per day only**
- Cannot test with frequent runs
- Need alternative solution for testing

## ✅ Recommended Solution: GitHub Actions

### Why GitHub Actions?

- ✅ **Free & Unlimited**
- ✅ **Manual trigger** for testing
- ✅ **Reliable** (GitHub infrastructure)
- ✅ **Easy to monitor** (Actions tab)

---

## 📋 Setup Instructions:

### 1️⃣ Add GitHub Secret:

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add:
   ```
   Name: CRON_SECRET
   Value: [your-cron-secret-from-vercel]
   ```

### 2️⃣ Update Workflow File:

Edit `.github/workflows/daily-prediction.yml`:

Replace `your-vercel-app.vercel.app` with your actual Vercel URL:

```yaml
https://your-actual-app-name.vercel.app/api/cron/daily-prediction
```

### 3️⃣ Commit & Push:

```bash
git add .
git commit -m "feat: add GitHub Actions cron job"
git push
```

### 4️⃣ Test Manual Run:

1. Go to GitHub repository
2. **Actions** tab
3. Select **"Daily BTC Prediction"** workflow
4. Click **"Run workflow"** → **"Run workflow"**
5. Wait ~30 seconds
6. Check workflow logs
7. Check your website `/predict` page

---

## 🔍 Monitoring:

### GitHub Actions Logs:

1. Repository → **Actions** tab
2. Click on workflow run
3. View logs

### Vercel Logs:

1. Vercel Dashboard → Your Project
2. **Logs** tab
3. Filter: `/api/cron/daily-prediction`

### Database:

1. Supabase Dashboard
2. `predictions` table
3. Check `createdAt` timestamps

---

## 📊 Schedule:

### Production:

- **Time:** Daily at UTC 23:00 (Myanmar 6:30 AM)
- **Method:** GitHub Actions
- **Backup:** Vercel Cron (same time)

### Testing:

- **Method:** Manual trigger via GitHub Actions
- **Or:** Admin panel `/admin/predict`

---

## 🎯 Benefits:

| Feature         | Vercel Cron      | GitHub Actions |
| --------------- | ---------------- | -------------- |
| **Free**        | ✅               | ✅             |
| **Reliable**    | ✅               | ✅             |
| **Manual Test** | ❌ (1/day limit) | ✅ Unlimited   |
| **Logs**        | ✅               | ✅             |
| **Monitoring**  | ✅               | ✅             |

---

## ⚡ Quick Test:

```bash
# 1. Commit changes
git add .
git commit -m "feat: GitHub Actions cron"
git push

# 2. Go to GitHub → Actions
# 3. Run workflow manually
# 4. Check /predict page
# 5. ✅ Success!
```

---

## 🔄 Fallback Strategy:

**Primary:** GitHub Actions (daily auto)
**Backup:** Vercel Cron (daily auto)
**Manual:** Admin panel `/admin/predict`

All three methods use the same backend code! ✅
