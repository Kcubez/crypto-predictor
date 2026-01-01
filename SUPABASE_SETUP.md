# Supabase + Prisma Setup Instructions

## ✅ What's Been Done

1. **Installed Prisma** and `@prisma/client`
2. **Created Prisma schema** with `User` and `Prediction` models
3. **Created Supabase storage service** to replace JSON file storage
4. **Updated all API routes** to use Supabase instead of JSON files
5. **Created Prisma client singleton** for efficient database connections

## 🔧 What You Need to Do

### Step 1: Update `.env.local` with Your Supabase Password

Open `.env.local` and replace `[YOUR-PASSWORD]` with your actual Supabase database password:

```env
# Replace [YOUR-PASSWORD] with your actual password
DATABASE_URL="postgresql://postgres.summgtdpsyhffxxolfa:YOUR_ACTUAL_PASSWORD_HERE@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.summgtdpsyhffxxolfa:YOUR_ACTUAL_PASSWORD_HERE@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

### Step 2: Push Database Schema to Supabase

After updating the password, run:

```bash
npx prisma db push
```

This will create the `users` and `predictions` tables in your Supabase database.

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and try making a prediction. It should now save to Supabase!

### Step 5: Deploy to Vercel

1. Add environment variables to Vercel:

   ```bash
   vercel env add DATABASE_URL
   vercel env add DIRECT_URL
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

## 📊 Database Schema

### Users Table

- `id` - Unique identifier
- `email` - User email (unique)
- `password` - Hashed password
- `name` - Optional display name
- `role` - "user" or "admin"
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Predictions Table

- `id` - Unique identifier
- `date` - Prediction creation date
- `targetDate` - Date being predicted
- `predictedPrice` - Predicted BTC price
- `actualPrice` - Actual price (filled later)
- `difference` - Price difference
- `percentageError` - Error percentage
- `confidence` - Confidence level (0-100)
- `trend` - "bullish", "bearish", or "neutral"
- `reasoning` - AI reasoning
- `status` - "pending" or "completed"
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## 🔐 Next Steps (Login Page)

After the database is set up, I'll create:

1. Login/signup page
2. Authentication middleware
3. Protected routes
4. User session management

## 📝 Notes

- **Connection Pooling**: Using `DATABASE_URL` for connection pooling (required for serverless)
- **Direct Connection**: Using `DIRECT_URL` for migrations
- **No File System**: All data now persists in Supabase (works on Vercel!)
- **Shared Database**: Local and production both use the same Supabase database
