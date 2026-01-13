# Crypto Predictor 🚀

An **AI-Powered Bitcoin Price Prediction Platform** that leverages Google Gemini AI with real-time market data to generate daily cryptocurrency price predictions with automated accuracy tracking.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma)

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [How It Works](#-how-it-works)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

BTC Nexus Predictor is a full-stack web application that combines **machine learning concepts** with **real-time cryptocurrency data** to forecast Bitcoin prices. The system uses Google's Gemini AI to analyze historical price data, market trends, and technical indicators to generate daily predictions with confidence scores.

### What Makes This Project Unique?

- **Automated Daily Predictions**: GitHub Actions workflow generates predictions at 6:30 AM Myanmar time (UTC 00:00), aligned with daily candle closes
- **Real Accuracy Tracking**: Predictions are automatically compared against actual prices to measure accuracy over time
- **Advanced AI Analysis**: Utilizes Gemini AI for sophisticated market analysis, technical indicators, and sentiment analysis
- **Role-Based Access Control**: Secure admin dashboard for managing predictions and viewing analytics
- **Modern UI/UX**: Premium dark theme with glassmorphism effects and responsive design

## ✨ Key Features

### 🤖 AI-Powered Predictions

- Daily automated predictions using Google Gemini AI
- Analyzes historical price data from Binance API
- Generates confidence scores and market trend analysis
- Provides entry zones, targets, and stop-loss recommendations

### 📊 Prediction History Dashboard

- Track all predictions vs actual prices
- Filter by time period (7 days, 1 month, all time)
- Visual accuracy metrics with percentage calculations
- Interactive charts with gradient area fills

### 📈 Real-Time Accuracy Tracking

- Automatic daily updates when actual prices are available
- Percentage error calculations for each prediction
- Overall accuracy statistics and performance metrics

### ⏱️ Automated Workflow (GitHub Actions)

- Cron job runs daily at UTC 00:00
- Updates yesterday's predictions with actual closing prices
- Prevents duplicate predictions with smart validation
- Manual trigger option for testing

### 🔐 Secure Authentication

- JWT-based authentication with `jose` library
- Password hashing with `bcryptjs`
- Role-based access control (Admin/User)
- Protected API routes

### 🎨 Premium UI/UX

- Modern dark mode with purple/pink gradient accents
- Glassmorphism effects with backdrop blur
- Responsive design for all devices
- Smooth animations and transitions
- Interactive Recharts visualizations

## 🛠️ Tech Stack

| Category        | Technologies                            |
| --------------- | --------------------------------------- |
| **Frontend**    | Next.js 16, React 19, TypeScript 5      |
| **Styling**     | Tailwind CSS 4, shadcn/ui, Lucide Icons |
| **Charts**      | Recharts with custom gradient fills     |
| **Backend**     | Next.js API Routes, RESTful APIs        |
| **Database**    | PostgreSQL (Supabase), Prisma ORM       |
| **AI/ML**       | Google Gemini AI (@google/genai)        |
| **Auth**        | JWT (jose), bcryptjs                    |
| **Data Source** | Binance API (real-time crypto prices)   |
| **Automation**  | GitHub Actions (daily cron jobs)        |
| **Deployment**  | Vercel (Edge Runtime compatible)        |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Home Page  │  │  History    │  │   Admin Dashboard       │ │
│  │  (Predictor) │  │  Dashboard  │  │  (Protected)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js Routes)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ /api/predict│  │ /api/auth   │  │ /api/predictions        │ │
│  │   (Gemini)  │  │  (JWT)      │  │   (CRUD)                │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Gemini AI     │ │  Binance API    │ │   PostgreSQL    │
│   (Predictions) │ │  (Price Data)   │ │   (Supabase)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions (Automation)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Daily Cron Job (UTC 00:00) → Generate Prediction       │   │
│  │  → Update Previous Day's Actual Price → Save to DB      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database (Supabase recommended)
- Google Gemini API key

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/Kcubez/crypto-predictor.git
cd crypto-predictor

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Initialize the database
npx prisma generate
npx prisma db push

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key"

# Authentication
JWT_SECRET="your_jwt_secret_key"

# Optional: Binance Proxy (for rate limiting)
BINANCE_PROXY_KEY="your_proxy_key"
```

### Getting API Keys

1. **Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Supabase Database**: Create a project at [Supabase](https://supabase.com)

## 🎯 How It Works

### 1. Daily Prediction Generation

```mermaid
graph LR
    A[GitHub Actions] --> B[Fetch BTC Price from Binance]
    B --> C[Send to Gemini AI]
    C --> D[Generate Prediction]
    D --> E[Save to PostgreSQL]
    E --> F[Update Previous Prediction with Actual Price]
```

### 2. AI Analysis Process

The Gemini AI analyzes:

- **Historical Price Data**: Last 30 days of OHLCV data
- **Technical Indicators**: Moving averages, RSI, MACD patterns
- **Market Sentiment**: Trend direction and momentum
- **Volatility Analysis**: Price volatility patterns

### 3. Price Simulation Engine

Uses **Geometric Brownian Motion** with mean reversion:

- 15 minutes: 0.3% volatility
- 1 hour: 0.8% volatility
- 24 hours: 2% volatility

## 📡 API Endpoints

| Endpoint                   | Method | Description             |
| -------------------------- | ------ | ----------------------- |
| `/api/predict`             | POST   | Generate new prediction |
| `/api/predictions/latest`  | GET    | Get latest prediction   |
| `/api/predictions/history` | GET    | Get prediction history  |
| `/api/predictions/save`    | POST   | Save prediction to DB   |
| `/api/auth/login`          | POST   | User login              |
| `/api/auth/register`       | POST   | User registration       |
| `/api/admin/login`         | POST   | Admin login             |

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
npm run build
vercel deploy --prod
```

### GitHub Actions Setup

Add these secrets to your GitHub repository:

- `DATABASE_URL`
- `DIRECT_URL`
- `GEMINI_API_KEY`
- `VERCEL_URL`

## 📁 Project Structure

```
crypto-predictor/
├── .github/
│   ├── scripts/
│   │   └── generate-prediction.js    # Automated prediction script
│   └── workflows/
│       └── daily-prediction.yml      # GitHub Actions cron job
├── prisma/
│   └── schema.prisma                 # Database schema
├── src/
│   ├── app/
│   │   ├── api/                      # API routes
│   │   ├── admin/                    # Admin dashboard
│   │   ├── history/                  # Prediction history
│   │   └── page.tsx                  # Home page
│   ├── components/
│   │   ├── btc-predictor.tsx         # Main predictor component
│   │   ├── price-chart.tsx           # Chart component
│   │   ├── ai-recommendation.tsx     # AI signals
│   │   └── ui/                       # shadcn/ui components
│   └── lib/
│       ├── gemini-ai.ts              # Gemini AI integration
│       ├── price-simulator.ts        # Simulation engine
│       ├── auth.ts                   # Authentication utilities
│       └── prisma.ts                 # Database client
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Kaung Khant Kyaw**

- GitHub: [@Kcubez](https://github.com/Kcubez)
- LinkedIn: [Kaung Khant Kyaw](https://www.linkedin.com/in/kaungkhantkyaw-kcubez/)

---

## ⚠️ Disclaimer

This tool is for **educational and demonstration purposes only**. Cryptocurrency trading involves significant risk. The predictions generated by this application should not be considered financial advice. Always conduct your own research and consult with financial advisors before making investment decisions.

---

**Built with ❤️ using Next.js, Gemini AI, and Prisma**
