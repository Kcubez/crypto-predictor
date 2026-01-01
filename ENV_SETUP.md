# Environment Variables Setup

## Required Variables

Add these to your `.env.local` file:

```bash
# Gemini AI API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Cron Secret (Required for Production)
# Generate with: openssl rand -base64 32
CRON_SECRET=your_random_secret_here
```

## Setup Instructions

### 1. Gemini API Key

- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add it to `.env.local`

### 2. Cron Secret

- Generate a random secret string: `openssl rand -base64 32`
- Add it to your `.env.local` for local testing
- Add it to Vercel environment variables for production
- This protects your cron endpoint from unauthorized access

## Storage

This app uses **JSON file-based storage** (no external database needed!):

- Predictions are stored in `data/predictions.json`
- Automatically created when the app runs
- Works perfectly with Vercel deployments
- No setup required!

## Vercel Deployment

1. Push your code to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `CRON_SECRET`
4. The cron job will automatically run daily at 6:30 AM Myanmar time (00:00 UTC)

## Testing the Cron Job Locally

You can test the cron job manually:

```bash
# Make sure your dev server is running
npm run dev

# In another terminal, test the cron endpoint
curl -X GET http://localhost:3000/api/cron/daily-prediction \
  -H "Authorization: Bearer your_cron_secret"
```

## How It Works

1. **Daily at 6:30 AM Myanmar time (00:00 UTC)**: Vercel cron triggers the job
2. **Update Yesterday's Prediction**: Fetches actual BTC price and updates the record
3. **Generate New Prediction**: Creates prediction for tomorrow using Gemini AI
4. **Save to JSON File**: Stores in `data/predictions.json`
5. **View History**: Users can see all predictions with filters (7 days, 1 month, all)

## File Structure

```
crypto-predictor/
├── data/
│   └── predictions.json    # Auto-created, stores all predictions
├── src/
│   ├── lib/
│   │   └── json-storage.ts # Storage service
│   └── app/
│       ├── api/
│       │   ├── cron/
│       │   │   └── daily-prediction/
│       │   │       └── route.ts    # Cron job handler
│       │   └── predictions/
│       │       └── history/
│       │           └── route.ts    # History API
│       └── history/
│           └── page.tsx            # History dashboard
└── vercel.json                     # Cron configuration
```

## Notes

- **No external database required** - everything is stored in JSON files
- **Persistent on Vercel** - the data directory persists across deployments
- **Simple and reliable** - no database setup or configuration needed
- **Perfect for this use case** - daily predictions don't need complex database features
